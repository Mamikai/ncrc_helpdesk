/* ============================================
   NCRC HELP DESK - SIDEBAR NAVIGATION
   Renders into <div id="sidebarMount"></div>,
   role-aware (hides Admin-only links from
   staff/ICT), highlights the active page.
   One place to edit nav links — every page
   picks up changes automatically.
   ============================================ */

function buildSidebarLinks(role, rootPath) {
    const links = [
        { href: 'pages/dashboard/' + role + '.html', label: 'Dashboard', icon: '🏠', roles: ['user', 'ict', 'admin'], match: 'dashboard' },
        { href: 'pages/tickets/lists.html', label: 'Tickets', icon: '🎫', roles: ['user', 'ict', 'admin'], match: 'tickets/lists' },
        { href: 'pages/tickets/create.html', label: 'New Ticket', icon: '➕', roles: ['user'], match: 'tickets/create' },
        { href: 'pages/assets/inventory.html', label: 'Asset Inventory', icon: '🖥️', roles: ['user', 'ict', 'admin'], match: 'assets/inventory' },
        { href: 'pages/assets/assign.html', label: 'Assign Asset', icon: '📦', roles: ['ict', 'admin'], match: 'assets/assign' },
        { href: 'pages/admin/users.html', label: 'Manage Users', icon: '👥', roles: ['admin'], match: 'admin/users' },
        { href: 'pages/admin/add-user.html', label: 'Add User', icon: '➕', roles: ['admin'], match: 'admin/add-user' },
        { href: 'pages/reports/reports.html', label: 'Reports', icon: '📊', roles: ['ict', 'admin'], match: 'reports' },
        { href: 'pages/admin/announcements.html', label: 'Announcements', icon: '📢', roles: ['admin'], match: 'admin/announcements' },
        { href: 'pages/settings/settings.html', label: 'Settings', icon: '⚙️', roles: ['user', 'ict', 'admin'], match: 'settings' }
    ];
    return links.filter(function (l) { return l.roles.includes(role); });
}

function renderSidebar(session) {
    const mount = document.getElementById('sidebarMount');
    if (!mount || !session) return;

    const currentPath = window.location.pathname;
    const links = buildSidebarLinks(session.role);

    const linksHtml = links.map(function (l) {
        const isActive = currentPath.includes(l.match);
        return '<a class="sidebar-link' + (isActive ? ' active' : '') + '" href="' + getRelativePath(l.href) + '">' +
            '<span>' + l.icon + '</span><span>' + l.label + '</span></a>';
    }).join('');

    mount.innerHTML =
        '<div class="sidebar">' +
        '  <div class="sidebar-brand">' +
        '    <img src="' + getRelativePath('assets/images/ncrc-logo.png') + '" alt="NCRC logo">' +
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
