/* ============================================
   NCRC HELP DESK - ASSETS MODULE
   Matches backend/api/assets/*.php exactly.
   ============================================ */

const DEMO_ASSETS = [
    { asset_id: 1, asset_tag: 'NCRC-AST-001', category: 'laptop', department: 'Research', assigned_to_name: 'Test Employee', model: 'Dell Latitude 5420', serial_number: 'SN-001', status: 'working' },
    { asset_id: 2, asset_tag: 'NCRC-AST-002', category: 'laptop', department: 'ICT', assigned_to_name: null, model: 'HP EliteBook 840', serial_number: 'SN-002', status: 'in_store' },
    { asset_id: 3, asset_tag: 'NCRC-AST-003', category: 'printer', department: 'Finance', assigned_to_name: null, model: 'HP LaserJet Pro M428', serial_number: 'SN-003', status: 'requires_servicing' },
];

const CATEGORY_LABEL = {
    desktop: 'Desktop', laptop: 'Laptop', ups: 'UPS', printer: 'Printer',
    network_device: 'Network Device', tv: 'TV', air_conditioner: 'Air Conditioner',
    software_license: 'Software License', ip_phone: 'IP Phone', tablet: 'Tablet',
    boardroom_accessory: 'Boardroom Accessory', cctv_camera: 'CCTV Camera', other: 'Other'
};
const STATUS_LABEL_ASSET = { working: 'Working', serviceable: 'Serviceable', requires_servicing: 'Requires Servicing', in_store: 'In Store', faulty: 'Faulty', faulty_not_serviceable: 'Faulty and Not Serviceable', not_serviceable: 'Not Serviceable', obsolete: 'Obsolete', obsolete_not_rechargeable: 'Obsolete and Not Rechargeable', decommissioned: 'Decommissioned' };
const ASSET_STATUS_OPTIONS = ['working', 'serviceable', 'requires_servicing', 'in_store', 'faulty', 'faulty_not_serviceable', 'not_serviceable', 'obsolete', 'obsolete_not_rechargeable', 'decommissioned'];

function populateAssetStatusSelect(selectId, placeholder) {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = (placeholder ? '<option value="">' + escapeHtml(placeholder) + '</option>' : '') + ASSET_STATUS_OPTIONS.map(function (status) {
        return '<option value="' + status + '">' + STATUS_LABEL_ASSET[status] + '</option>';
    }).join('');
}

function assetRowHtml(a, editable) {
    const editBtn = editable
        ? `<td><button class="btn btn-outline btn-sm" data-edit-asset="${a.asset_id}">Edit</button></td>`
        : '';
    return `
        <tr>
            <td class="ticket-id">${a.asset_tag}</td>
            <td>${CATEGORY_LABEL[a.category] || a.category}</td>
            <td>${escapeHtml(a.department || '—')}</td>
            <td>${escapeHtml(a.model || '—')}</td>
            <td><span class="badge badge-${a.status}">${STATUS_LABEL_ASSET[a.status]}</span></td>
            <td>${escapeHtml(a.assigned_to_name || '—')}</td>
            ${editBtn}
        </tr>`;
}

async function loadAssetInventory(tableBodyId, editable) {
    const tbody = document.getElementById(tableBodyId);
    if (!tbody) return;

    const statusFilter = document.getElementById('assetStatusFilter');
    const selectedStatus = statusFilter ? statusFilter.value : '';
    populateAssetStatusSelect('assetStatusFilter', 'All Statuses');
    if (statusFilter) statusFilter.value = selectedStatus;

    let assets;
    if (API.isMock()) {
        assets = DEMO_ASSETS;
    } else {
        const res = await API.get('/assets/list.php', assetInventoryQuery());
        assets = res.success ? res.data : [];
    }

    window.currentInventoryAssets = assets;
    renderAssetInventory(assets, tableBodyId, editable);
    if (!tbody.dataset.filtersBound) {
        ['assetSearchInput', 'assetCategoryFilter', 'assetStatusFilter'].forEach(function (id) {
            document.getElementById(id)?.addEventListener(id === 'assetSearchInput' ? 'input' : 'change', function () {
                if (API.isMock()) {
                    const filtered = filterInventoryAssets(window.currentInventoryAssets || []);
                    renderAssetInventory(filtered, tableBodyId, editable);
                } else {
                    loadAssetInventory(tableBodyId, editable);
                }
            });
        });
        document.getElementById('exportAssetsBtn')?.addEventListener('click', function () {
            exportInventoryCsv(filterInventoryAssets(window.currentInventoryAssets || []));
        });
        tbody.dataset.filtersBound = 'true';
    }
}

function assetInventoryQuery() {
    return {
        search: document.getElementById('assetSearchInput')?.value.trim() || '',
        category: document.getElementById('assetCategoryFilter')?.value || '',
        status: document.getElementById('assetStatusFilter')?.value || ''
    };
}

function filterInventoryAssets(assets) {
    const search = (document.getElementById('assetSearchInput')?.value || '').toLowerCase().trim();
    const category = document.getElementById('assetCategoryFilter')?.value || '';
    const status = document.getElementById('assetStatusFilter')?.value || '';
    return assets.filter(function (asset) {
        const searchable = [asset.asset_tag, asset.assigned_to_name, asset.serial_number, asset.model].join(' ').toLowerCase();
        return (!search || searchable.includes(search)) && (!category || asset.category === category) && (!status || asset.status === status);
    });
}

function renderAssetInventory(assets, tableBodyId, editable) {
    const tbody = document.getElementById(tableBodyId);
    if (!tbody) return;
    const colspan = editable ? 7 : 6;
    const count = document.getElementById('assetCount');
    if (count) count.textContent = assets.length + ' asset' + (assets.length === 1 ? '' : 's');
    if (!assets.length) {
        tbody.innerHTML = `<tr><td colspan="${colspan}"><div class="empty-state">
            <div class="empty-icon">🖥️</div><div class="empty-title">No assets registered yet</div>
        </div></td></tr>`;
        return;
    }

    tbody.innerHTML = assets.map(function (a) { return assetRowHtml(a, editable); }).join('');

    if (editable) {
        tbody.querySelectorAll('[data-edit-asset]').forEach(function (btn) {
            btn.addEventListener('click', function () { openAssetEditModal(btn.getAttribute('data-edit-asset'), assets); });
        });
    }
}

function exportInventoryCsv(assets) {
    const headers = ['Asset Tag', 'Category', 'Department', 'Model', 'Serial Number', 'Status', 'Assigned To'];
    const rows = assets.map(function (asset) {
        return [asset.asset_tag, CATEGORY_LABEL[asset.category] || asset.category, asset.department, asset.model,
            asset.serial_number, STATUS_LABEL_ASSET[asset.status] || asset.status, asset.assigned_to_name];
    });
    const csv = [headers].concat(rows).map(function (row) {
        return row.map(function (value) { return '"' + String(value || '').replace(/"/g, '""') + '"'; }).join(',');
    }).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = 'asset-inventory.csv';
    link.click();
    URL.revokeObjectURL(link.href);
}

function openAssetEditModal(assetId, assetsCache) {
    const asset = assetsCache.find(function (a) { return String(a.asset_id) === String(assetId); });
    if (!asset) return;
    document.getElementById('editAssetId').value = asset.asset_id;
    document.getElementById('editAssetTag').textContent = asset.asset_tag;
    document.getElementById('editAssetStatus').value = asset.status;
    const deptSelect = document.getElementById('editAssetDepartment');
    if (deptSelect) deptSelect.value = asset.department_id || '';
    document.getElementById('editAssetNotes').value = asset.notes || '';
    document.getElementById('editAssetModal').style.display = 'flex';
}

function initAssetEditModal() {
    document.getElementById('closeEditModalBtn')?.addEventListener('click', function () {
        document.getElementById('editAssetModal').style.display = 'none';
    });

    document.getElementById('saveAssetEditBtn')?.addEventListener('click', async function () {
        const assetId = document.getElementById('editAssetId').value;
        const status = document.getElementById('editAssetStatus').value;
        const departmentId = document.getElementById('editAssetDepartment').value;
        const notes = document.getElementById('editAssetNotes').value.trim();

        if (API.isMock()) {
            showToast('Asset updated (demo mode)', 'success');
            document.getElementById('editAssetModal').style.display = 'none';
            return;
        }

        const res = await API.put('/assets/update.php', { asset_id: assetId, status, department_id: departmentId, notes });
        if (!res.success) { showToast(res.error || 'Could not update asset', 'error'); return; }
        showToast('Asset updated', 'success');
        document.getElementById('editAssetModal').style.display = 'none';
        loadAssetInventory('assetInventoryBody', true);
    });
}

function initAddAssetForm() {
    const btn = document.getElementById('addAssetBtn');
    const form = document.getElementById('addAssetForm');
    if (!btn || !form) return;

    btn.addEventListener('click', async function () {
        const tag = document.getElementById('newAssetTag');
        const category = document.getElementById('newAssetCategory');
        const department = document.getElementById('newAssetDepartment');
        const model = document.getElementById('newAssetModel');
        const serial = document.getElementById('newAssetSerial');
        const status = document.getElementById('newAssetStatus');

        if (!tag.value.trim()) { showFieldError('assetTagError', true); return; }
        showFieldError('assetTagError', false);

        btn.classList.add('loading');

        if (API.isMock()) {
            setTimeout(function () {
                btn.classList.remove('loading');
                showToast('Asset registered (demo mode)', 'success');
                form.reset();
            }, 600);
            return;
        }

        const res = await API.post('/assets/create.php', {
            asset_tag: tag.value.trim(), category: category.value, department_id: department.value,
            model: model.value.trim(), serial_number: serial.value.trim(), status: status.value
        });

        btn.classList.remove('loading');
        if (!res.success) { showToast(res.error || 'Could not register asset', 'error'); return; }
        showToast('Asset ' + tag.value.trim() + ' registered', 'success');
        form.reset();
    });
}

async function populateAssetDropdown(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    let available;
    if (API.isMock()) {
        available = DEMO_ASSETS.filter(function (a) { return a.status === 'in_store'; });
    } else {
        const res = await API.get('/assets/list.php', { status: 'in_store' });
        available = res.success ? res.data : [];
    }

    select.innerHTML = '<option value="">Select an in-store asset...</option>' +
        available.map(function (a) { return `<option value="${a.asset_tag}">${a.asset_tag} — ${CATEGORY_LABEL[a.category]} (${escapeHtml(a.model || '')})</option>`; }).join('');
}

function initAssignForm() {
    const submitBtn = document.getElementById('assignSubmitBtn');
    const form = document.getElementById('assignForm');
    if (!submitBtn || !form) return;

    populateAssetDropdown('assetSelect');

    submitBtn.addEventListener('click', async function (e) {
        e.preventDefault();
        const assetSelect = document.getElementById('assetSelect');
        const staffInput = document.getElementById('assignToStaff');
        const notes = document.getElementById('assignNotes');

        let hasError = false;
        if (!assetSelect.value) { showFieldError('assetError', true); hasError = true; } else { showFieldError('assetError', false); }
        if (!staffInput.value.trim()) { showFieldError('staffError', true); hasError = true; } else { showFieldError('staffError', false); }
        if (hasError) return;

        submitBtn.classList.add('loading');

        if (API.isMock()) {
            setTimeout(function () {
                submitBtn.classList.remove('loading');
                showToast('Asset assigned (demo mode)', 'success');
                form.reset();
            }, 600);
            return;
        }

        const res = await API.post('/assets/checkout.php', {
            asset_tag: assetSelect.value, assigned_to_name: staffInput.value.trim(), notes: notes.value.trim()
        });

        submitBtn.classList.remove('loading');
        if (!res.success) { showToast(res.error || 'Could not assign asset', 'error'); return; }
        showToast('Asset ' + assetSelect.value + ' assigned', 'success');
        form.reset();
        populateAssetDropdown('assetSelect');
    });
}
