/* ============================================
   NCRC HELP DESK - USER MANAGEMENT (Admin only)
   Matches backend/api/users/*.php exactly.
   ============================================ */

const DEMO_USERS = [
    { user_id: 1, full_name: 'System Administrator', email: 'admin@crimeresearch.go.ke', role: 'admin', department: 'ICT', is_active: 1, last_login: '2026-07-24 08:10:00' },
    { user_id: 2, full_name: 'Test ICT Officer', email: 'ict.demo@demo.local', role: 'ict', department: 'ICT', is_active: 1, last_login: '2026-07-23 16:40:00' },
    { user_id: 3, full_name: 'Test Employee', email: 'user.demo@demo.local', role: 'user', department: 'Research', is_active: 1, last_login: null },
];

const ROLE_LABEL = { admin: 'Administrator', ict: 'ICT Officer', user: 'Staff' };

function initAddUserForm() {
    const btn = document.getElementById('addUserBtn');
    const resultPanel = document.getElementById('resultPanel');
    if (!btn) return;

    btn.addEventListener('click', async function () {
        const name = document.getElementById('fullNameInput');
        const email = document.getElementById('emailInput');
        const role = document.getElementById('roleSelect').value;
        const department = document.getElementById('departmentInput');

        let hasError = false;
        if (!name.value.trim() || name.value.trim().length < 2) { showFieldError('nameError', true); hasError = true; } else { showFieldError('nameError', false); }
        if (!email.value.trim() || !isValidEmail(email.value.trim())) { showFieldError('emailError', true); hasError = true; } else { showFieldError('emailError', false); }
        if (!department.value.trim()) { showFieldError('departmentError', true); hasError = true; } else { showFieldError('departmentError', false); }
        if (hasError) return;

        btn.classList.add('loading');
        btn.textContent = 'Creating...';

        if (API.isMock()) {
            setTimeout(function () {
                btn.classList.remove('loading');
                btn.textContent = 'Create User';
                document.getElementById('tempPasswordDisplay').textContent = 'FightCrime01';
                resultPanel.style.display = 'block';
                showToast('User created (demo mode)', 'success');
                document.getElementById('addUserForm').reset();
            }, 700);
            return;
        }

        const res = await API.post('/users/create.php', {
            name: name.value.trim(), email: email.value.trim(), role, department: department.value.trim()
        });

        btn.classList.remove('loading');
        btn.textContent = 'Create User';

        if (!res.success) { showToast(res.error || 'Could not create user', 'error'); return; }

        document.getElementById('tempPasswordDisplay').textContent = res.data.default_password;
        resultPanel.style.display = 'block';
        showToast('User account created', 'success');
        document.getElementById('addUserForm').reset();
    });
}

function userRowHtml(u, isSelf) {
    const statusBadge = u.is_active ? '<span class="badge badge-working">Active</span>' : '<span class="badge badge-closed">Deactivated</span>';
    const lastLogin = u.last_login ? timeAgo(u.last_login) : 'Never logged in';
    const deactivateBtn = (u.is_active && !isSelf)
        ? `<button class="btn btn-danger btn-sm" data-deactivate="${u.user_id}">Deactivate</button>`
        : '';
    return `
        <tr>
            <td>${escapeHtml(u.full_name)}${isSelf ? ' <span class="badge badge-medium">You</span>' : ''}</td>
            <td>${escapeHtml(u.email)}</td>
            <td>${ROLE_LABEL[u.role] || u.role}</td>
            <td>
                <span class="dept-display" data-dept-display="${u.user_id}">${escapeHtml(u.department || '—')}</span>
                <button class="btn btn-outline btn-sm" data-edit-dept="${u.user_id}" data-current-dept="${escapeHtml(u.department || '')}">Edit</button>
            </td>
            <td>${statusBadge}</td>
            <td>${lastLogin}</td>
            <td>${deactivateBtn}</td>
        </tr>`;
}

async function loadUsersList(tableBodyId, currentUserId) {
    const tbody = document.getElementById(tableBodyId);
    if (!tbody) return;

    let users;
    if (API.isMock()) {
        users = DEMO_USERS;
    } else {
        const res = await API.get('/users/list.php');
        users = res.success ? res.data : [];
    }

    tbody.innerHTML = users.map(function (u) { return userRowHtml(u, String(u.user_id) === String(currentUserId)); }).join('');

    tbody.querySelectorAll('[data-deactivate]').forEach(function (btn) {
        btn.addEventListener('click', async function () {
            const userId = btn.getAttribute('data-deactivate');
            if (!confirm('Deactivate this account? They will no longer be able to log in.')) return;

            if (API.isMock()) { showToast('User deactivated (demo mode)', 'success'); return; }

            const res = await API.put('/users/deactivate.php', { user_id: userId });
            if (!res.success) { showToast(res.error || 'Could not deactivate user', 'error'); return; }
            showToast('User deactivated', 'success');
            loadUsersList(tableBodyId, currentUserId);
        });
    });

    tbody.querySelectorAll('[data-edit-dept]').forEach(function (btn) {
        btn.addEventListener('click', async function () {
            const userId = btn.getAttribute('data-edit-dept');
            const current = btn.getAttribute('data-current-dept');
            const updated = prompt('Edit department:', current);
            if (updated === null || updated.trim() === current) return;

            if (API.isMock()) {
                document.querySelector(`[data-dept-display="${userId}"]`).textContent = updated.trim();
                showToast('Department updated (demo mode)', 'success');
                return;
            }

            const res = await API.put('/users/update-department.php', { user_id: userId, department: updated.trim() });
            if (!res.success) { showToast(res.error || 'Could not update department', 'error'); return; }
            document.querySelector(`[data-dept-display="${userId}"]`).textContent = updated.trim();
            btn.setAttribute('data-current-dept', updated.trim());
            showToast('Department updated', 'success');
        });
    });
}
