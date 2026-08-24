/* ============================================
   NCRC HELP DESK - SESSION
   Every page calls getCurrentSession() to find out
   who's logged in and renders accordingly.

   Mock mode: reads a fake session that auth.js wrote
   to sessionStorage at "login" time, so you can preview
   all three roles without a real backend.
   Real mode: calls session-check.php.
   ============================================ */

const MOCK_SESSION_KEY = 'ncrcMockSession';

async function getCurrentSession() {
    if (API.isMock()) {
        const raw = sessionStorage.getItem(MOCK_SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
    }
    const res = await API.get('/auth/session-check.php');
    return res.success ? res.data : null;
}

function setMockSession(role, name, department, userId) {
    sessionStorage.setItem(MOCK_SESSION_KEY, JSON.stringify({ role, name, department, user_id: userId }));
}

function clearMockSession() {
    sessionStorage.removeItem(MOCK_SESSION_KEY);
}

/**
 * Redirects to login if nobody's signed in. Call at the top of every
 * protected page. Returns the session object so the caller can use it.
 */
async function requireSession() {
    const session = await getCurrentSession();
    if (!session) {
        window.location.href = getRelativePath('pages/auth/login.html');
        return null;
    }
    return session;
}

/** Fills in the topbar's user name/role/avatar from the session */
function renderUserMenu(session) {
    const nameEl = document.getElementById('userMenuName');
    const roleEl = document.getElementById('userMenuRole');
    const avatarEl = document.getElementById('userMenuAvatar');
    const roleLabels = { admin: 'Administrator', ict: 'ICT Officer', user: 'Staff' };

    if (nameEl) nameEl.textContent = session.name;
    if (roleEl) roleEl.textContent = (roleLabels[session.role] || session.role) + (session.department ? ' — ' + session.department : '');
    if (avatarEl) avatarEl.textContent = session.name.split(' ').map(function (p) { return p[0]; }).slice(0, 2).join('').toUpperCase();
}

function initLogout() {
    const btn = document.getElementById('logoutBtn');
    if (!btn) return;
    btn.addEventListener('click', async function () {
        if (!confirm('Are you sure you want to logout?')) return;
        if (API.isMock()) {
            clearMockSession();
        } else {
            await API.post('/auth/logout.php');
        }
        window.location.href = getRelativePath('pages/auth/login.html');
    });
}

/**
 * Call once at the top of every authenticated page's script:
 *   const session = await initAuthenticatedPage();
 *   if (!session) return;
 * Handles the session check + redirect, sidebar, topbar user menu,
 * notification bell, and logout button — so pages don't repeat it.
 */
async function initAuthenticatedPage() {
    const session = await requireSession();
    if (!session) return null;

    renderSidebar(session);
    renderUserMenu(session);
    initLogout();
    if (typeof initNotificationBell === 'function') initNotificationBell();

    document.body.setAttribute('data-role', session.role);
    return session;
}
