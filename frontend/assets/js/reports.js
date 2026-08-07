/* ============================================
   NCRC HELP DESK - REPORTS MODULE
   Pulls data from the existing tickets API and SLA summary,
   then renders a report page using the shared app shell.
   ============================================ */

async function loadReportsTickets() {
    if (API.isMock()) {
        // ensure demo tickets have an hours_spent field for demo charting
        return DEMO_TICKETS.map(function (ticket) {
            return Object.assign({}, ticket, {
                department: ticket.department || 'Research',
                sla_status: getSlaStatus(ticket),
                hours_spent: ticket.hours_spent || 1,
                comments: ticket.comments || ''
            });
        });
    }

    const [ticketsRes, slaRes] = await Promise.all([
        API.get('/tickets/list.php'),
        API.get('/sla/summary.php')
    ]);

    const tickets = (ticketsRes.success ? ticketsRes.data : []).map(function (ticket) {
        return Object.assign({}, ticket, {
            sla_status: getSlaStatus(ticket),
            hours_spent: ticket.hours_spent || 1,
            comments: ticket.comments || ''
        });
    });

    if (slaRes.success && slaRes.data) {
        window.__reportsSla = slaRes.data;
    }

    return tickets;
}

function getSlaStatus(ticket) {
    const now = new Date();
    const due = ticket.sla_due_at ? new Date(ticket.sla_due_at.replace(' ', 'T')) : null;
    if (!due) return 'N/A';
    if (ticket.status === 'resolved' || ticket.status === 'closed') {
        return 'Met';
    }
    if (due < now) {
        return 'At Risk';
    }
    return 'On Track';
}

function renderReportsStats(tickets) {
    const total = tickets.length;
    const inProgress = tickets.filter(function (t) { return String(t.status || '').toLowerCase() === 'inprogress'; }).length;
    const resolved = tickets.filter(function (t) {
        const status = String(t.status || '').toLowerCase();
        return status === 'resolved' || status === 'closed';
    }).length;
    const high = tickets.filter(function (t) { return String(t.priority || '').toLowerCase() === 'high'; }).length;
    const unassigned = tickets.filter(function (t) { return !t.assigned_to_name; }).length;
    const overdue = tickets.filter(function (t) { return getSlaStatus(t) === 'At Risk'; }).length;
    const slaPercent = window.__reportsSla && window.__reportsSla.compliance_percent !== null
        ? window.__reportsSla.compliance_percent + '%'
        : (total ? Math.round((resolved / total) * 100) + '%' : '—');

    setText('reportTotal', total);
    setText('reportInProgress', inProgress);
    setText('reportResolved', resolved);
    setText('reportSla', slaPercent);
    setText('reportBreaches', overdue);
    setText('summaryOpen', Math.max(total - resolved, 0));
    setText('summaryHigh', high);
    setText('summaryUnassigned', unassigned);
    setText('summaryLatest', tickets[0] ? formatDate(tickets[0].created_at) : '—');
}

function renderReportsChart(tickets) {
    const container = document.getElementById('volumeChart');
    if (!container) return;
    // aggregate hours (use hours_spent if provided, otherwise count as 1)
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const buckets = labels.map(l => ({ label: l, value: 0 }));

    tickets.forEach(function (ticket) {
        const created = ticket.created_at ? new Date(ticket.created_at.replace(' ', 'T')) : null;
        if (!created || isNaN(created)) return;
        const day = created.getDay();
        // map Sunday(0)->6, Mon(1)->0 ... but we only keep Mon-Fri
        const idx = day >= 1 && day <= 5 ? day - 1 : -1;
        if (idx >= 0 && idx < buckets.length) {
            const hrs = Number(ticket.hours_spent) || 1;
            buckets[idx].value += hrs;
        }
    });

    const max = Math.max(...buckets.map(function (b) { return b.value; }), 1);
    container.innerHTML = buckets.map(function (bucket) {
        const height = Math.max(8, Math.round((bucket.value / max) * 100));
        return '<div class="report-chart-column"><div class="report-chart-bar" style="height:' + height + '%"></div><div class="report-chart-label">' + bucket.label + '</div><div class="report-chart-value">' + bucket.value + 'h</div></div>';
    }).join('');
}

function renderReportsTable(tickets) {
    const tbody = document.getElementById('reportsTableBody');
    if (!tbody) return;

    const statusFilter = (document.getElementById('reportsStatusFilter') || {}).value || 'all';
    const q = ((document.getElementById('reportsSearchInput') || {}).value || '').toLowerCase();
    const officer = (document.getElementById('filterOfficer') || {}).value || 'all';
    const user = (document.getElementById('filterUser') || {}).value || 'all';
    const priority = (document.getElementById('filterPriority') || {}).value || 'all';

    const filtered = tickets.filter(function (ticket) {
        const status = String(ticket.status || '').toLowerCase();
        if (statusFilter !== 'all' && status !== statusFilter) return false;
        if (officer !== 'all' && String(ticket.assigned_to_name || '') !== officer) return false;
        if (user !== 'all' && String(ticket.reported_by || '') !== user) return false;
        if (priority !== 'all' && String((ticket.priority || '').toLowerCase()) !== priority) return false;
        const haystack = [ticket.ticket_number, ticket.title, ticket.department, ticket.priority, ticket.assigned_to_name || ''].join(' ').toLowerCase();
        if (q && !haystack.includes(q)) return false;
        return true;
    });

    if (!filtered.length) {
        tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state"><div class="empty-title">No tickets match</div><div>Adjust the filters to see more results.</div></div></td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(function (ticket) {
        return '<tr>' +
            '<td><strong>' + escapeHtml(ticket.ticket_number || ticket.title) + '</strong><div class="table-subtext">' + escapeHtml(ticket.title) + '</div></td>' +
            '<td>' + escapeHtml(ticket.department || '—') + '</td>' +
            '<td><span class="badge badge-' + (ticket.priority || 'medium') + '">' + escapeHtml(ticket.priority || 'medium') + '</span></td>' +
            '<td><span class="badge badge-' + (ticket.status || 'open') + '">' + escapeHtml(ticket.status ? ticket.status.replace('inprogress', 'in progress') : 'Open') + '</span></td>' +
            '<td><span class="badge badge-' + (ticket.sla_status === 'At Risk' ? 'high' : ticket.sla_status === 'Met' ? 'low' : 'inprogress') + '">' + escapeHtml(ticket.sla_status || '—') + '</span></td>' +
            '</tr>';
    }).join('');
}

function bindReportsControls() {
    const searchInput = document.getElementById('reportsSearchInput');
    const statusFilter = document.getElementById('reportsStatusFilter');
    const officerFilter = document.getElementById('filterOfficer');
    const userFilter = document.getElementById('filterUser');
    const priorityFilter = document.getElementById('filterPriority');
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    const exportXlsBtn = document.getElementById('exportXlsBtn');

    const reRender = function () { renderReportsTable(window.__reportsTickets || []); };

    if (searchInput) searchInput.addEventListener('input', reRender);
    if (statusFilter) statusFilter.addEventListener('change', reRender);
    if (officerFilter) officerFilter.addEventListener('change', reRender);
    if (userFilter) userFilter.addEventListener('change', reRender);
    
    if (priorityFilter) priorityFilter.addEventListener('change', reRender);
    if (exportCsvBtn) exportCsvBtn.addEventListener('click', function () { exportReports('csv'); });
    if (exportXlsBtn) exportXlsBtn.addEventListener('click', function () { exportReports('xls'); });
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function populateReportsState(tickets) {
    window.__reportsTickets = tickets;
}

function populateFilterOptions(tickets) {
    const officerEl = document.getElementById('filterOfficer');
    const userEl = document.getElementById('filterUser');
    if (!officerEl || !userEl) return;

    const officers = Array.from(new Set(tickets.map(t => t.assigned_to_name).filter(Boolean))).sort();
    const users = Array.from(new Set(tickets.map(t => t.reported_by).filter(Boolean))).sort();

    officers.forEach(function (o) {
        const opt = document.createElement('option'); opt.value = o; opt.textContent = o; officerEl.appendChild(opt);
    });
    users.forEach(function (u) {
        const opt = document.createElement('option'); opt.value = u; opt.textContent = u; userEl.appendChild(opt);
    });
}

function exportReports(format) {
    const tickets = (window.__reportsTickets || []).slice();
    // apply same filtering as the table render
    renderReportsTable(tickets);
    const rows = [];
    const header = ['Ticket', 'Title', 'Department', 'Priority', 'Status', 'SLA', 'Assigned To', 'Reported By', 'Hours', 'Comments'];
    rows.push(header);
    const tbodyRows = document.querySelectorAll('#reportsTableBody tr');
    // use window.__reportsTickets filtered by current UI
    const filtered = tickets.filter(function (t) {
        const statusFilter = (document.getElementById('reportsStatusFilter') || {}).value || 'all';
        const q = ((document.getElementById('reportsSearchInput') || {}).value || '').toLowerCase();
        const officer = (document.getElementById('filterOfficer') || {}).value || 'all';
        const user = (document.getElementById('filterUser') || {}).value || 'all';
        const priority = (document.getElementById('filterPriority') || {}).value || 'all';
        const status = String(t.status || '').toLowerCase();
        if (statusFilter !== 'all' && status !== statusFilter) return false;
        if (officer !== 'all' && String(t.assigned_to_name || '') !== officer) return false;
        if (user !== 'all' && String(t.reported_by || '') !== user) return false;
        if (priority !== 'all' && String((t.priority || '').toLowerCase()) !== priority) return false;
        
        const haystack = [t.ticket_number, t.title, t.department, t.priority, t.assigned_to_name || ''].join(' ').toLowerCase();
        if (q && !haystack.includes(q)) return false;
        return true;
    });

    filtered.forEach(function (t) {
        rows.push([t.ticket_number || '', t.title || '', t.department || '', t.priority || '', t.status || '', t.sla_status || '', t.assigned_to_name || '', t.reported_by || '', t.hours_spent || '', t.comments || '']);
    });

    const csvContent = rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');

    if (format === 'csv') {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'reports.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
        return;
    }

    // simple Excel export by offering HTML table as xls
    if (format === 'xls') {
        let html = '<table>' + rows.map(r => '<tr>' + r.map(c => '<td>' + String(c) + '</td>').join('') + '</tr>').join('') + '</table>';
        const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'reports.xls'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
        return;
    }
}

async function initReportsPage(session) {
    const tickets = await loadReportsTickets();
    populateReportsState(tickets);
    populateFilterOptions(tickets);
    renderReportsStats(tickets);
    renderReportsChart(tickets);
    renderReportsTable(tickets);
    bindReportsControls();
    bindTicketRefresh(function () {
        initReportsPage(session);
    });
}

(async function () {
    const session = await initAuthenticatedPage();
    if (!session) return;
    await initReportsPage(session);
})();
