/* ============================================
   NCRC HELP DESK - ANNOUNCEMENTS
   Matches backend/api/announcements/*.php.
   ============================================ */

const DEMO_ANNOUNCEMENTS = [
    { announcement_id: 1, title: 'Welcome to the NCRC Help Desk', body: 'This is a sample announcement. Admins can post real ones from the Announcements page.', posted_by_name: 'System Administrator', posted_at: '2026-07-20 09:00:00' }
];

async function loadAnnouncements(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let items;
    if (API.isMock()) {
        items = DEMO_ANNOUNCEMENTS;
    } else {
        const res = await API.get('/announcements/list.php');
        items = res.success ? res.data : [];
    }

    if (!items.length) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">📢</div><div class="empty-title">No announcements yet</div></div>`;
        return;
    }

    container.innerHTML = items.map(function (a) {
        return `<div class="announcement-item">
            <div class="announcement-title">${escapeHtml(a.title)}</div>
            <div class="announcement-description">${escapeHtml(a.body)}</div>
            <div class="announcement-date">${escapeHtml(a.posted_by_name)} · ${timeAgo(a.posted_at)}</div>
        </div>`;
    }).join('');
}

function initPostAnnouncementForm() {
    const btn = document.getElementById('postAnnouncementBtn');
    const form = document.getElementById('announcementForm');
    if (!btn || !form) return;

    btn.addEventListener('click', async function () {
        const title = document.getElementById('announcementTitle');
        const body = document.getElementById('announcementBody');

        let hasError = false;
        if (!title.value.trim()) { showFieldError('announcementTitleError', true); hasError = true; } else { showFieldError('announcementTitleError', false); }
        if (!body.value.trim()) { showFieldError('announcementBodyError', true); hasError = true; } else { showFieldError('announcementBodyError', false); }
        if (hasError) return;

        btn.classList.add('loading');

        if (API.isMock()) {
            setTimeout(function () {
                btn.classList.remove('loading');
                showToast('Announcement posted (demo mode)', 'success');
                form.reset();
                loadAnnouncements('existingAnnouncementsList');
            }, 600);
            return;
        }

        const res = await API.post('/announcements/create.php', { title: title.value.trim(), body: body.value.trim() });
        btn.classList.remove('loading');

        if (!res.success) { showToast(res.error || 'Could not post announcement', 'error'); return; }
        showToast('Announcement posted', 'success');
        form.reset();
        loadAnnouncements('existingAnnouncementsList');
    });
}
