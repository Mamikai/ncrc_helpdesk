/* ============================================
   NCRC HELP DESK - TICKETS MODULE
   Matches backend/api/tickets/*.php exactly.
   Mock mode uses DEMO_TICKETS so every screen
   works with zero backend setup.
   ============================================ */

const DEMO_TICKETS = [
    { ticket_id: 1, ticket_number: 'NCRC-0001', title: 'Printer not connecting', department: 'Research', priority: 'medium', status: 'inprogress', reported_by: 'Test Employee', assigned_to_name: 'Test ICT Officer', created_at: '2026-07-20 09:30:00', sla_due_at: '2026-07-21 09:30:00' },
    { ticket_id: 2, ticket_number: 'NCRC-0002', title: 'VPN connection issue', department: 'Research', priority: 'high', status: 'open', reported_by: 'Test Employee', assigned_to_name: null, created_at: '2026-07-21 14:20:00', sla_due_at: '2026-07-21 18:20:00' },
    { ticket_id: 3, ticket_number: 'NCRC-0003', title: 'Request for software install', department: 'Finance', priority: 'low', status: 'resolved', reported_by: 'Jane Wanjiru', assigned_to_name: 'Test ICT Officer', created_at: '2026-07-18 11:00:00', sla_due_at: '2026-07-21 11:00:00' },
];

const STATUS_LABEL = { open: 'Open', inprogress: 'In Progress', resolved: 'Resolved', closed: 'Closed' };
const TICKET_REFRESH_STORAGE_KEY = 'ncrcTicketRefresh';

function notifyTicketDataChanged(reason) {
    const payload = { reason: reason || 'updated', timestamp: Date.now() };
    try {
        localStorage.setItem(TICKET_REFRESH_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
        // Ignore storage failures in private browsing or restricted environments.
    }
    window.dispatchEvent(new CustomEvent('ticket:updated', { detail: payload }));
}

function bindTicketRefresh(handler) {
    const refresh = function () {
        if (typeof handler === 'function') handler();
    };

    window.addEventListener('ticket:updated', refresh);
    window.addEventListener('storage', function (event) {
        if (event.key === TICKET_REFRESH_STORAGE_KEY) refresh();
    });
    document.addEventListener('visibilitychange', function () {
        if (!document.hidden) refresh();
    });
}

function ticketRowHtml(t, showReportedBy) {
    const reportedByCell = showReportedBy ? `<td>${escapeHtml(t.reported_by)}</td>` : '';
    return `
        <tr class="clickable" data-ticket-id="${t.ticket_id}">
            <td class="ticket-id">${t.ticket_number}</td>
            <td>${escapeHtml(t.title)}</td>
            ${reportedByCell}
            <td>${escapeHtml(t.assigned_to_name || '— Unclaimed —')}</td>
            <td><span class="badge badge-${t.priority}">${t.priority}</span></td>
            <td><span class="badge badge-${t.status}">${STATUS_LABEL[t.status] || t.status}</span></td>
            <td>${formatDateTime(t.created_at)}</td>
        </tr>`;
}

function wireTicketRowClicks(tableBodyId) {
    const tbody = document.getElementById(tableBodyId);
    if (!tbody) return;
    tbody.addEventListener('click', function (e) {
        const row = e.target.closest('tr[data-ticket-id]');
        if (!row) return;
        window.location.href = 'details.html?id=' + row.getAttribute('data-ticket-id');
    });
}

/**
 * Loads tickets into a table. `view` is only meaningful for ICT
 * (all | unclaimed | mine) — ignored server-side for user/admin.
 */
function getPriorityBreakdown(tickets) {
    const counts = { high: 0, medium: 0, low: 0 };
    tickets.forEach(function (ticket) {
        const priority = String(ticket.priority || '').toLowerCase();
        if (counts[priority] !== undefined) counts[priority] += 1;
    });

    const total = tickets.length || 0;
    const percentages = {};
    Object.keys(counts).forEach(function (key) {
        percentages[key] = total ? Math.round((counts[key] / total) * 100) : 0;
    });

    const dominantKey = Object.keys(counts).reduce(function (best, current) {
        return counts[current] > counts[best] ? current : best;
    }, 'high');

    return { counts, percentages, total, dominantKey };
}

function renderPriorityDistribution(tickets) {
    const breakdown = getPriorityBreakdown(tickets || []);
    const chart = document.getElementById('priorityChart');
    if (chart) {
        chart.style.setProperty('--chart-high', breakdown.percentages.high + '%');
        chart.style.setProperty('--chart-medium', breakdown.percentages.medium + '%');
        chart.style.setProperty('--chart-low', breakdown.percentages.low + '%');
    }

    const setText = function (id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    };

    setText('priHigh', breakdown.counts.high + ' (' + breakdown.percentages.high + '%)');
    setText('priMedium', breakdown.counts.medium + ' (' + breakdown.percentages.medium + '%)');
    setText('priLow', breakdown.counts.low + ' (' + breakdown.percentages.low + '%)');
    setText('priHighCount', breakdown.counts.high + ' ticket' + (breakdown.counts.high === 1 ? '' : 's'));
    setText('priMediumCount', breakdown.counts.medium + ' ticket' + (breakdown.counts.medium === 1 ? '' : 's'));
    setText('priLowCount', breakdown.counts.low + ' ticket' + (breakdown.counts.low === 1 ? '' : 's'));

    const chartValue = document.getElementById('priorityChartValue');
    const chartLabel = document.getElementById('priorityChartLabel');
    if (chartValue && chartLabel) {
        const labels = { high: 'High', medium: 'Medium', low: 'Low' };
        const dominantValue = breakdown.percentages[breakdown.dominantKey] || 0;
        chartValue.textContent = dominantValue + '%';
        chartLabel.textContent = labels[breakdown.dominantKey] + ' Priority';
    }
}

async function loadActiveUsersCount() {
    if (API.isMock()) {
        return 3;
    }

    const res = await API.get('/users/list.php');
    if (!res.success) return 0;
    return (res.data || []).filter(function (user) { return user.is_active; }).length;
}

function renderDashboardSummary(tickets, activeUsersCount) {
    const high = tickets.filter(function (ticket) { return String(ticket.priority || '').toLowerCase() === 'high'; }).length;
    const inProgress = tickets.filter(function (ticket) { return String(ticket.status || '').toLowerCase() === 'inprogress'; }).length;
    const resolved = tickets.filter(function (ticket) {
        const status = String(ticket.status || '').toLowerCase();
        return status === 'resolved' || status === 'closed';
    }).length;
    const total = tickets.length || 0;

    const setText = function (id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    };

    setText('statHigh', high);
    setText('statInProgress', inProgress);
    setText('statResolved', resolved);
    setText('statTotal', total);
    setText('statUsers', activeUsersCount || 0);
    setText('statSla', total ? Math.round((resolved / total) * 100) + '%' : '—');
}

async function loadTicketList(tableBodyId, showReportedBy, view) {
    const tbody = document.getElementById(tableBodyId);
    if (!tbody) return [];

    let tickets;
    if (API.isMock()) {
        const session = await getCurrentSession();
        tickets = DEMO_TICKETS;
        if (session && session.role === 'ict') {
            if (view === 'unclaimed') tickets = tickets.filter(function (t) { return !t.assigned_to_name; });
            if (view === 'mine') tickets = tickets.filter(function (t) { return t.assigned_to_name === session.name; });
        }
    } else {
        const res = await API.get('/tickets/list.php', view ? { view } : undefined);
        tickets = res.success ? res.data : [];
    }

    if (!tickets.length) {
        const colspan = showReportedBy ? 7 : 6;
        tbody.innerHTML = `<tr><td colspan="${colspan}"><div class="empty-state">
            <div class="empty-icon">🎫</div>
            <div class="empty-title">No tickets here</div>
            <div>Nothing matches this view right now.</div>
        </div></td></tr>`;
        return;
    }

    tbody.innerHTML = tickets.map(function (t) { return ticketRowHtml(t, showReportedBy); }).join('');
    wireTicketRowClicks(tableBodyId);
    return tickets;
}

/** Loads the tab counts (All / Unclaimed / Mine) for the ICT ticket queue */
async function loadTicketTabCounts(session) {
    let all, unclaimed, mine;
    if (API.isMock()) {
        all = DEMO_TICKETS.length;
        unclaimed = DEMO_TICKETS.filter(function (t) { return !t.assigned_to_name; }).length;
        mine = DEMO_TICKETS.filter(function (t) { return t.assigned_to_name === session.name; }).length;
    } else {
        const [allRes, unclaimedRes, mineRes] = await Promise.all([
            API.get('/tickets/list.php', { view: 'all' }),
            API.get('/tickets/list.php', { view: 'unclaimed' }),
            API.get('/tickets/list.php', { view: 'mine' })
        ]);
        all = (allRes.data || []).length;
        unclaimed = (unclaimedRes.data || []).length;
        mine = (mineRes.data || []).length;
    }
    const setCount = function (id, n) { const el = document.getElementById(id); if (el) el.textContent = n; };
    setCount('tabCountAll', all);
    setCount('tabCountUnclaimed', unclaimed);
    setCount('tabCountMine', mine);
}

function initTicketTabs(session) {
    const tabs = document.querySelectorAll('.tab-btn[data-view]');
    if (!tabs.length) return;

    loadTicketTabCounts(session);

    tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            tabs.forEach(function (t) { t.classList.remove('active'); });
            tab.classList.add('active');
            loadTicketList('ticketsTableBody', true, tab.getAttribute('data-view'));
        });
    });
}

async function loadTicketDetail(ticketId) {
    let ticket;
    if (API.isMock()) {
        ticket = DEMO_TICKETS.find(function (t) { return String(t.ticket_id) === String(ticketId); }) || DEMO_TICKETS[0];
        ticket = Object.assign({}, ticket, {
            description: '[DEMO] This is sample ticket detail text — in the real system this comes from the description column.',
        });
    } else {
        const res = await API.get('/tickets/detail.php', { id: ticketId });
        if (!res.success) { showToast(res.error || 'Could not load ticket', 'error'); return null; }
        ticket = res.data;
    }

    document.getElementById('detailTicketNumber').textContent = ticket.ticket_number;
    document.getElementById('detailTitle').textContent = ticket.title;
    document.getElementById('detailDescription').textContent = ticket.description;
    document.getElementById('detailReportedBy').textContent = ticket.reported_by || '—';
    document.getElementById('detailDepartment').textContent = ticket.department || '—';
    document.getElementById('detailCreated').textContent = formatDateTime(ticket.created_at);
    const resolvedElement = document.getElementById('detailResolved');
    const closedElement = document.getElementById('detailClosed');
    if (resolvedElement) resolvedElement.textContent = formatDateTime(ticket.resolved_at);
    if (closedElement) closedElement.textContent = formatDateTime(ticket.closed_at);
    document.getElementById('detailAssignedTo').textContent = ticket.assigned_to_name || '— Unclaimed —';
    document.getElementById('detailPriority').innerHTML = `<span class="badge badge-${ticket.priority}">${ticket.priority}</span>`;
    document.getElementById('detailStatus').innerHTML = `<span class="badge badge-${ticket.status}">${STATUS_LABEL[ticket.status] || ticket.status}</span>`;

    return ticket;
}

function initTicketCreateForm(session) {
    const submitBtn = document.getElementById('submitTicketBtn');
    const form = document.getElementById('ticketCreateForm');
    if (!submitBtn || !form) return;

    const department = document.getElementById('ticketDepartment');
    const title = document.getElementById('ticketTitle');
    const otherTitle = document.getElementById('otherTicketTitle');
    populateDepartmentSelect('ticketDepartment', 'Select Department').then(function () {
        if (session && session.role === 'user') {
            department.value = session.department_id || '';
            if (!department.value && session.department) {
                const matchingOption = Array.from(department.options).find(function (option) {
                    return option.textContent === session.department;
                });
                if (matchingOption) department.value = matchingOption.value;
            }
            department.disabled = true;
            department.setAttribute('aria-readonly', 'true');
        }
    });
    title?.addEventListener('change', function () {
        const isOther = title.value === 'other';
        if (otherTitle) {
            otherTitle.style.display = isOther ? 'block' : 'none';
            otherTitle.required = isOther;
            if (!isOther) otherTitle.value = '';
        }
    });

    submitBtn.addEventListener('click', async function (e) {
        e.preventDefault();

        const titleSelect = document.getElementById('ticketTitle');
        const customTitle = document.getElementById('otherTicketTitle');
        const selectedTitle = titleSelect.value === 'other' ? customTitle.value.trim() : titleSelect.value;
        const description = document.getElementById('ticketDescription');

        let hasError = false;
        if (!selectedTitle) { showFieldError('titleError', true); hasError = true; } else { showFieldError('titleError', false); }
        if (!department.value) { showFieldError('departmentError', true); hasError = true; } else { showFieldError('departmentError', false); }
        if (!description.value.trim()) { showFieldError('descriptionError', true); hasError = true; } else { showFieldError('descriptionError', false); }
        if (hasError) return;

        submitBtn.classList.add('loading');
        submitBtn.textContent = 'Submitting...';

        if (API.isMock()) {
            setTimeout(function () {
                submitBtn.classList.remove('loading');
                submitBtn.textContent = 'Submit Ticket';
                showToast('Ticket submitted (demo mode — not saved)', 'success');
                notifyTicketDataChanged('created');
                form.reset();
            }, 700);
            return;
        }

        const res = await API.post('/tickets/create.php', {
            title: selectedTitle,
            department_id: department.value,
            description: description.value.trim()
        });

        submitBtn.classList.remove('loading');
        submitBtn.textContent = 'Submit Ticket';

        if (!res.success) { showToast(res.error || 'Could not submit ticket', 'error'); return; }
        showToast('Ticket ' + res.data.ticket_number + ' submitted (' + res.data.priority + ' priority)', 'success');
        notifyTicketDataChanged('created');
        setTimeout(function () { window.location.href = 'lists.html'; }, 800);
    });

    document.getElementById('clearFormBtn')?.addEventListener('click', function () { form.reset(); });
}

/** Renders the claim button (ICT, unclaimed ticket only) or the status-update
 *  card (ICT/Admin, any ticket) — role-checked so a staff member never sees either. */
function initTicketActions(session, ticket, ticketId) {
    const claimSection = document.getElementById('claimSection');
    const statusSection = document.getElementById('statusSection');
    const assignSection = document.getElementById('assignSection');

    if (session.role === 'ict' && !ticket.assigned_to_name) {
        if (claimSection) {
            claimSection.style.display = 'block';
            document.getElementById('claimTicketBtn')?.addEventListener('click', async function () {
                if (API.isMock()) { showToast('Ticket claimed (demo mode)', 'success'); notifyTicketDataChanged('claimed'); return; }
                const res = await API.put('/tickets/claim.php', { ticket_id: ticketId });
                if (!res.success) { showToast(res.error || 'Could not claim ticket', 'error'); return; }
                showToast('Ticket claimed', 'success');
                notifyTicketDataChanged('claimed');
                setTimeout(function () { window.location.reload(); }, 600);
            });
        }
    }

    if (session.role === 'admin' && !ticket.assigned_to_name && assignSection) {
        assignSection.style.display = 'block';
        populateIctOfficerDropdown('assignToIctSelect');
        document.getElementById('assignTicketBtn')?.addEventListener('click', async function () {
            const select = document.getElementById('assignToIctSelect');
            if (!select.value) { showToast('Choose an ICT officer first', 'error'); return; }
            if (API.isMock()) { showToast('Ticket assigned (demo mode)', 'success'); notifyTicketDataChanged('assigned'); return; }
            const res = await API.put('/tickets/assign.php', { ticket_id: ticketId, assigned_to_user_id: select.value });
            if (!res.success) { showToast(res.error || 'Could not assign ticket', 'error'); return; }
            showToast('Ticket assigned', 'success');
            notifyTicketDataChanged('assigned');
            setTimeout(function () { window.location.reload(); }, 600);
        });
    }

    if ((session.role === 'ict' || session.role === 'admin') && statusSection) {
        statusSection.style.display = 'block';
        document.getElementById('statusSelect').value = ticket.status;

        const notesGroup = document.getElementById('resolutionNotesGroup');
        const notesInput = document.getElementById('resolutionNotesInput');
        if (notesInput) notesInput.value = ticket.resolution_notes || '';

        const toggleNotesVisibility = function () {
            const status = document.getElementById('statusSelect').value;
            const needsNote = status === 'resolved' || status === 'closed';
            if (notesGroup) notesGroup.style.display = needsNote ? 'block' : 'none';
        };
        toggleNotesVisibility();
        document.getElementById('statusSelect').addEventListener('change', toggleNotesVisibility);

        document.getElementById('updateStatusBtn')?.addEventListener('click', async function () {
            const status = document.getElementById('statusSelect').value;
            const needsNote = status === 'resolved' || status === 'closed';
            const resolutionNotes = notesInput ? notesInput.value.trim() : '';

            if (needsNote && !resolutionNotes) {
                showFieldError('resolutionNotesError', true);
                showToast('Describe how this was resolved before closing — it becomes the knowledge base entry', 'error');
                return;
            }
            showFieldError('resolutionNotesError', false);

            if (API.isMock()) { showToast('Status updated to ' + status + ' (demo mode)', 'success'); notifyTicketDataChanged('status'); return; }
            const res = await API.put('/tickets/update-status.php', { ticket_id: ticketId, status, resolution_notes: resolutionNotes });
            if (!res.success) { showToast(res.error || 'Could not update status', 'error'); return; }
            showToast('Status updated', 'success');
            notifyTicketDataChanged('status');
            setTimeout(function () { window.location.reload(); }, 600);
        });
    }
}

async function populateIctOfficerDropdown(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    let officers = [];
    if (API.isMock()) {
        officers = [{ user_id: 1, full_name: 'Test ICT Officer' }];
    } else {
        const res = await API.get('/users/list.php');
        officers = res.success ? res.data.filter(function (u) { return u.role === 'ict' && u.is_active; }) : [];
    }
    select.innerHTML = '<option value="">Select ICT officer...</option>' +
        officers.map(function (o) { return `<option value="${o.user_id}">${escapeHtml(o.full_name)}</option>`; }).join('');
}

async function loadComments(ticketId, isIctOrAdmin) {
    const thread = document.getElementById('commentsThread');
    if (!thread) return;

    let comments = [];
    if (!API.isMock()) {
        const res = await API.get('/tickets/comments-list.php', { ticket_id: ticketId });
        comments = res.success ? res.data : [];
    }

    if (!comments.length) {
        thread.innerHTML = `<div class="empty-state"><div class="empty-icon">💬</div><div class="empty-title">No comments yet</div></div>`;
        return;
    }

    thread.innerHTML = comments.map(function (c) {
        const internalTag = c.is_internal ? ' <span class="badge badge-medium">Internal note</span>' : '';
        return `<div class="announcement-item">
            <div class="announcement-title">${escapeHtml(c.author_name)}${internalTag}</div>
            <div class="announcement-description">${escapeHtml(c.comment)}</div>
            <div class="announcement-date">${timeAgo(c.created_at)}</div>
        </div>`;
    }).join('');
}

function initAddComment(ticketId, canMarkInternal) {
    const btn = document.getElementById('addCommentBtn');
    if (!btn) return;

    const internalCheckbox = document.getElementById('internalCommentCheckbox');
    if (internalCheckbox) internalCheckbox.parentElement.style.display = canMarkInternal ? 'flex' : 'none';

    btn.addEventListener('click', async function () {
        const textarea = document.getElementById('newComment');
        if (!textarea.value.trim()) return;

        if (API.isMock()) {
            showToast('Comment added (demo mode)', 'success');
            textarea.value = '';
            return;
        }

        const res = await API.post('/tickets/comments-add.php', {
            ticket_id: ticketId,
            comment: textarea.value.trim(),
            is_internal: canMarkInternal && internalCheckbox && internalCheckbox.checked
        });
        if (!res.success) { showToast(res.error || 'Could not add comment', 'error'); return; }
        textarea.value = '';
        loadComments(ticketId, canMarkInternal);
    });
}
