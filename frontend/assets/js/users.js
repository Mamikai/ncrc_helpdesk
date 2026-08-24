/* ============================================
   NCRC HELP DESK - USER MANAGEMENT (Admin only)
   Matches backend/api/users/*.php exactly.
   ============================================ */

const DEMO_USERS = [
    { user_id: 1, full_name: 'System Administrator', email: 'admin@crimeresearch.go.ke', role: 'admin', department: 'ICT', department_id: 15, can_prioritize: 1, is_active: 1, last_login: '2026-07-24 08:10:00' },
    { user_id: 2, full_name: 'Test ICT Officer', email: 'ict.demo@demo.local', role: 'ict', department: 'ICT', department_id: 15, can_prioritize: 0, is_active: 1, last_login: '2026-07-23 16:40:00' },
    { user_id: 3, full_name: 'Test Employee', email: 'user.demo@demo.local', role: 'user', department: 'Crime Research Directorate', department_id: 2, can_prioritize: 0, is_active: 1, last_login: null },
];

const ROLE_LABEL = { admin: 'Administrator', ict: 'ICT Officer', user: 'Staff' };

function initAddUserForm() {
    const btn = document.getElementById('addUserBtn');
    const resultPanel = document.getElementById('resultPanel');
    if (!btn) return;

    populateDepartmentSelect('departmentSelect', 'Select Department');

    btn.addEventListener('click', async function () {
        const name = document.getElementById('fullNameInput');
        const email = document.getElementById('emailInput');
        const role = document.getElementById('roleSelect').value;
        const department = document.getElementById('departmentSelect');
        const canPrioritize = document.getElementById('canPrioritizeCheckbox');

        let hasError = false;
        if (!name.value.trim() || name.value.trim().length < 2) { showFieldError('nameError', true); hasError = true; } else { showFieldError('nameError', false); }
        if (!email.value.trim() || !isValidEmail(email.value.trim())) { showFieldError('emailError', true); hasError = true; } else { showFieldError('emailError', false); }
        if (!department.value) { showFieldError('departmentError', true); hasError = true; } else { showFieldError('departmentError', false); }
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
            name: name.value.trim(),
            email: email.value.trim(),
            role: role,
            department_id: department.value,
            can_prioritize: !!(canPrioritize && canPrioritize.checked)
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
    const priorityBadge = u.can_prioritize ? ' <span class="badge badge-high" title="Tickets from this user are auto-High priority">Priority</span>' : '';
    const deactivateBtn = (u.is_active && !isSelf)
        ? `<button class="btn btn-danger btn-sm" data-deactivate="${u.user_id}">Deactivate</button>`
        : '';
    return `
        <tr>
            <td>${escapeHtml(u.full_name)}${isSelf ? ' <span class="badge badge-medium">You</span>' : ''}</td>
            <td>${escapeHtml(u.email)}</td>
            <td>${ROLE_LABEL[u.role] || u.role}${priorityBadge}</td>
            <td>
                <span class="dept-display" data-dept-display="${u.user_id}">${escapeHtml(u.department || '—')}</span>
                <button class="btn btn-outline btn-sm" data-edit-dept="${u.user_id}" data-current-dept-id="${u.department_id || ''}">Edit</button>
            </td>
            <td>${statusBadge}</td>
            <td>${lastLogin}</td>
            <td style="white-space: nowrap;">
                <button class="btn btn-secondary btn-sm" data-reset-password="${u.user_id}">Reset Password</button>
                ${deactivateBtn}
            </td>
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

    tbody.querySelectorAll('[data-reset-password]').forEach(function (btn) {
        btn.addEventListener('click', async function () {
            const userId = btn.getAttribute('data-reset-password');
            if (!confirm('Reset this user\'s password back to the default? They will be required to set a new one on next login.')) return;

            if (API.isMock()) { showToast('Password reset to FightCrime01 (demo mode)', 'success'); return; }

            const res = await API.put('/users/reset-password.php', { user_id: userId });
            if (!res.success) { showToast(res.error || 'Could not reset password', 'error'); return; }
            showToast('Password reset to ' + res.data.default_password + ' — they must change it on next login', 'success');
        });
    });

    // Department edit: swap the display span for a real dropdown (department
    // is a fixed lookup now, not free text — a text prompt no longer makes sense).
    tbody.querySelectorAll('[data-edit-dept]').forEach(function (btn) {
        btn.addEventListener('click', async function () {
            const userId = btn.getAttribute('data-edit-dept');
            const isSaving = btn.getAttribute('data-mode') === 'save';
            const selectId = 'deptEdit_' + userId;

            if (!isSaving) {
                const currentDeptId = btn.getAttribute('data-current-dept-id');
                const displaySpan = document.querySelector(`[data-dept-display="${userId}"]`);
                if (!displaySpan) return;

                displaySpan.outerHTML = `<select class="form-control" id="${selectId}" style="display:inline-block; width:auto; max-width:220px;"></select>`;
                await populateDepartmentSelect(selectId);
                const select = document.getElementById(selectId);
                if (select) select.value = currentDeptId;

                btn.textContent = 'Save';
                btn.setAttribute('data-mode', 'save');
                return;
            }

            // Second click: actually save
            const select = document.getElementById(selectId);
            const newDeptId = select ? select.value : null;

            if (API.isMock()) {
                showToast('Department updated (demo mode)', 'success');
                loadUsersList(tableBodyId, currentUserId);
                return;
            }
            const res = await API.put('/users/update-department.php', { user_id: userId, department_id: newDeptId });
            if (!res.success) { showToast(res.error || 'Could not update department', 'error'); return; }
            showToast('Department updated', 'success');
            loadUsersList(tableBodyId, currentUserId);
        });
    });
}
