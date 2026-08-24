/* Asset movement history: ICT/Admin read-only view. */

const DEMO_ASSET_MOVEMENTS = [
    { movement_id: 1, asset_tag: 'NCRC-AST-001', category: 'Laptop', model: 'Dell Latitude 5420', to_user_name: 'Test Employee', moved_by_name: 'Test ICT Officer', notes: 'Issued in working condition', moved_at: '2026-07-20 09:30:00' },
    { movement_id: 2, asset_tag: 'NCRC-AST-002', category: 'Laptop', model: 'HP EliteBook 840', to_user_name: 'Research Pool', moved_by_name: 'System Administrator', notes: '', moved_at: '2026-07-18 14:10:00' }
];

function movementCell(value) { return escapeHtml(value || '—'); }

function assetMovementRowHtml(movement) {
    return '<tr>' +
        '<td class="ticket-id">' + movementCell(movement.asset_tag) + '</td>' +
        '<td>' + movementCell(movement.category) + '</td>' +
        '<td>' + movementCell(movement.model) + '</td>' +
        '<td>' + movementCell(movement.to_user_name) + '</td>' +
        '<td>' + movementCell(movement.moved_by_name) + '</td>' +
        '<td>' + movementCell(movement.notes) + '</td>' +
        '<td>' + formatDateTime(movement.moved_at) + '</td>' +
        '</tr>';
}

async function loadAssetMovements() {
    const tbody = document.getElementById('assetMovementBody');
    if (!tbody) return;

    const search = document.getElementById('movementSearch').value.trim();
    const assetTag = document.getElementById('movementAssetTag').value.trim();
    let movements;

    if (API.isMock()) {
        movements = DEMO_ASSET_MOVEMENTS.filter(function (movement) {
            const text = [movement.asset_tag, movement.to_user_name, movement.moved_by_name, movement.notes].join(' ').toLowerCase();
            return (!search || text.includes(search.toLowerCase())) && (!assetTag || movement.asset_tag === assetTag);
        });
    } else {
        const res = await API.get('/assets/movement-list.php', { search: search, asset_tag: assetTag });
        movements = res.success ? res.data : [];
        if (!res.success) showToast(res.error || 'Could not load asset movement history', 'error');
    }

    document.getElementById('movementCount').textContent = movements.length + ' record' + (movements.length === 1 ? '' : 's');
    tbody.innerHTML = movements.length
        ? movements.map(assetMovementRowHtml).join('')
        : '<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">📦</div><div class="empty-title">No movement records found</div></div></td></tr>';
}

function exportAssetMovements() {
    const rows = Array.from(document.querySelectorAll('#assetMovementBody tr')).map(function (row) {
        return Array.from(row.querySelectorAll('td')).map(function (cell) { return cell.textContent.trim(); });
    }).filter(function (row) { return row.length === 7; });
    const headers = ['Asset Tag', 'Category', 'Model', 'Assigned To', 'Moved By', 'Notes', 'Moved At'];
    const csv = [headers].concat(rows).map(function (row) {
        return row.map(function (value) { return '"' + value.replace(/"/g, '""') + '"'; }).join(',');
    }).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'asset-movement-history.csv';
    link.click();
    URL.revokeObjectURL(url);
}

function initAssetMovementPage() {
    document.getElementById('movementSearch').addEventListener('input', loadAssetMovements);
    document.getElementById('movementAssetTag').addEventListener('input', loadAssetMovements);
    document.getElementById('exportMovementBtn').addEventListener('click', exportAssetMovements);
    loadAssetMovements();
}
