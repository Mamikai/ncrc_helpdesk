/* ============================================
   NCRC HELP DESK - NOTIFICATIONS BELL
   Matches backend/api/notifications/*.php.
   Rendered into the topbar on every page.
   ============================================ */

const DEMO_NOTIFICATIONS = [
    { notification_id: 1, title: 'Ticket claimed', message: 'NCRC-0001 (Printer not connecting) is now being handled by Test ICT Officer', link: 'tickets/details.html?id=1', is_read: 0, created_at: '2026-07-24 09:00:00' },
    { notification_id: 2, title: 'New ticket', message: 'NCRC-0002: VPN connection issue', link: 'tickets/details.html?id=2', is_read: 1, created_at: '2026-07-21 14:20:00' }
];

async function initNotificationBell() {
    const bell = document.getElementById('notificationBell');
    const dropdown = document.getElementById('notificationDropdown');
    if (!bell || !dropdown) return;

    async function loadAndRender() {
        let notifications;
        if (API.isMock()) {
            notifications = DEMO_NOTIFICATIONS;
        } else {
            const res = await API.get('/notifications/list.php');
            notifications = res.success ? res.data : [];
        }

        const unreadCount = notifications.filter(function (n) { return !n.is_read; }).length;
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'flex' : 'none';
        }

        if (!notifications.length) {
            dropdown.innerHTML = `<div class="notification-item">You're all caught up — no notifications yet.</div>`;
            return;
        }

        dropdown.innerHTML = notifications.map(function (n) {
            return `<div class="notification-item ${n.is_read ? '' : 'unread'}" data-notif-id="${n.notification_id}" data-link="${n.link || ''}">
                <div class="notif-title">${escapeHtml(n.title)}</div>
                <div>${escapeHtml(n.message)}</div>
                <div class="notif-time">${timeAgo(n.created_at)}</div>
            </div>`;
        }).join('');

        dropdown.querySelectorAll('[data-notif-id]').forEach(function (item) {
            item.addEventListener('click', async function () {
                const link = item.getAttribute('data-link');
                if (!API.isMock()) {
                    await API.put('/notifications/mark-read.php', { notification_id: item.getAttribute('data-notif-id') });
                }
                if (link) window.location.href = getRelativePath('pages/' + link);
            });
        });
    }

    bell.addEventListener('click', function (e) {
        e.stopPropagation();
        dropdown.classList.toggle('open');
        if (dropdown.classList.contains('open')) loadAndRender();
    });

    document.addEventListener('click', function (e) {
        if (!dropdown.contains(e.target) && e.target !== bell) dropdown.classList.remove('open');
    });

    loadAndRender();
}
