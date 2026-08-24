/* ============================================
   NCRC HELP DESK - SIDEBAR NAVIGATION
   Renders into <div id="sidebarMount"></div>,
   role-aware (hides Admin-only links from
   staff/ICT), highlights the active page.
   One place to edit nav links — every page
   picks up changes automatically.
   ============================================ */

// Must match backend/config/constants.php's ASSET_VISIBLE_DEPARTMENTS —
// staff (role 'user') outside these departments never see this link.
// The frontend hiding is UX only; assets/list.php enforces this for real.
const ASSET_VISIBLE_DEPARTMENTS = ['Internal Audit and Risk Assurance', 'Supply Chain Management'];

function buildSidebarLinks(session) {
    const role = session.role;
    const canSeeInventory = role === 'ict' || role === 'admin' ||
        (role === 'user' && ASSET_VISIBLE_DEPARTMENTS.includes(session.department));

    const links = [
        { href: 'pages/dashboard/' + role + '.html', label: 'Dashboard', icon: '🏠', show: true, match: 'dashboard' },
        { href: 'pages/tickets/lists.html', label: 'Tickets', icon: '🎫', show: true, match: 'tickets/lists' },
        { href: 'pages/tickets/create.html', label: 'New Ticket', icon: '➕', show: role === 'user', match: 'tickets/create' },
        { href: 'pages/assets/inventory.html', label: 'Asset Inventory', icon: '🖥️', show: canSeeInventory, match: 'assets/inventory' },
        { href: 'pages/assets/assign.html', label: 'Assign Asset', icon: '📦', show: role === 'ict' || role === 'admin', match: 'assets/assign' },
        { href: 'pages/assets/movement.html', label: 'Asset Movement', icon: '↔️', show: role === 'ict' || role === 'admin', match: 'assets/movement' },
        { href: 'pages/knowledge-base/knowledge-base.html', label: 'Knowledge Base', icon: '📚', show: role === 'ict' || role === 'admin', match: 'knowledge-base' },
        { href: 'pages/admin/users.html', label: 'Manage Users', icon: '👥', show: role === 'admin', match: 'admin/users' },
        { href: 'pages/admin/add-user.html', label: 'Add User', icon: '➕', show: role === 'admin', match: 'admin/add-user' },
        { href: 'pages/reports/reports.html', label: 'Reports', icon: '📊', show: role === 'ict' || role === 'admin', match: 'reports' },
        { href: 'pages/admin/announcements.html', label: 'Announcements', icon: '📢', show: role === 'admin', match: 'admin/announcements' },
        { href: 'pages/settings/settings.html', label: 'Settings', icon: '⚙️', show: true, match: 'settings' }
    ];
    return links.filter(function (l) { return l.show; });
}

function renderSidebar(session) {
    const mount = document.getElementById('sidebarMount');
    if (!mount || !session) return;

    const currentPath = window.location.pathname;
    const links = buildSidebarLinks(session);

    const linksHtml = links.map(function (l) {
        const isActive = currentPath.includes(l.match);
        return '<a class="sidebar-link' + (isActive ? ' active' : '') + '" href="' + getRelativePath(l.href) + '">' +
            '<span>' + l.icon + '</span><span>' + l.label + '</span></a>';
    }).join('');

    mount.innerHTML =
        '<div class="sidebar">' +
        '  <div class="sidebar-brand">' +
        '    <img src="' + getRelativePath('assets/images/logo-dark.png') + '" alt="NCRC Help Desk logo">' +
        '    <div class="sidebar-brand-text">NCRC<br>Help Desk</div>' +
        '    <button class="sidebar-toggle" id="sidebarToggleBtn" aria-label="Toggle menu">☰</button>' +
        '  </div>' +
        '  <nav class="sidebar-nav" id="sidebarNav">' + linksHtml + '</nav>' +
        '  <div class="sidebar-footer">NCRC Help Desk<br>Fighting Crime Through Research</div>' +
        '</div>';

    const toggleBtn = document.getElementById('sidebarToggleBtn');
    const nav = document.getElementById('sidebarNav');
    if (toggleBtn && nav) {
        toggleBtn.addEventListener('click', function () { nav.classList.toggle('open'); });
    }
}
