/* ============================================
   NCRC HELP DESK - KNOWLEDGE BASE (ICT/Admin only)
   Matches backend/api/knowledge-base/list.php.
   Not a separate content system — every resolved
   ticket's mandatory resolution note IS the entry.
   ============================================ */

const DEMO_KB_ENTRIES = [
    {
        ticket_id: 3, ticket_number: 'NCRC-0003', title: 'Request for software install',
        department: 'Finance and Accounts', priority: 'low',
        resolution_notes: '[DEMO] Installed the requested software via the standard IT image. Confirmed the license key was already available in our software register before installing — check there first next time to avoid a duplicate purchase.',
        resolved_by: 'Test ICT Officer', resolved_at: '2026-07-19 10:15:00'
    }
];

function kbEntryHtml(entry) {
    return `
        <div class="card" style="margin-bottom: var(--spacing-md);">
            <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
                <h3 class="card-title">${escapeHtml(entry.title)}</h3>
                <span class="badge badge-${entry.priority}">${entry.priority}</span>
            </div>
            <p style="margin-bottom: var(--spacing-sm); color: var(--color-text);">${escapeHtml(entry.resolution_notes)}</p>
            <div class="form-hint">
                ${escapeHtml(entry.ticket_number)} · ${escapeHtml(entry.department || '—')} ·
                resolved by ${escapeHtml(entry.resolved_by || '—')} · ${timeAgo(entry.resolved_at)}
            </div>
        </div>`;
}

async function loadKnowledgeBase(containerId, query) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let entries;
    if (API.isMock()) {
        entries = DEMO_KB_ENTRIES;
        if (query) {
            const q = query.toLowerCase();
            entries = entries.filter(function (e) {
                return e.title.toLowerCase().includes(q) || e.resolution_notes.toLowerCase().includes(q);
            });
        }
    } else {
        const res = await API.get('/knowledge-base/list.php', query ? { q: query } : undefined);
        entries = res.success ? res.data : [];
    }

    if (!entries.length) {
        container.innerHTML = `<div class="card"><div class="empty-state">
            <div class="empty-icon">📚</div>
            <div class="empty-title">Nothing here yet</div>
            <div>Resolved tickets with a resolution note will show up here automatically.</div>
        </div></div>`;
        return;
    }

    container.innerHTML = entries.map(kbEntryHtml).join('');
}

function initKnowledgeBaseSearch(containerId) {
    const input = document.getElementById('kbSearchInput');
    if (!input) return;

    let debounceTimer;
    input.addEventListener('input', function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () {
            loadKnowledgeBase(containerId, input.value.trim());
        }, 300);
    });
}
