/* ============================================
   NCRC HELP DESK - SHARED UI UTILITIES
   Used on every page. Path resolution, toasts,
   password toggles, form validation helpers.
   ============================================ */

/**
 * Resolves a path relative to frontend/ root regardless of how deep
 * the current page is nested. This works both when the app is opened
 * directly from disk and when it is served from a web server.
 */
function getRelativePath(pathFromFrontendRoot) {
    const pathname = window.location.pathname.replace(/\\/g, '/');
    const normalizedPath = pathFromFrontendRoot.replace(/^\/+/, '');

    const frontendMarker = '/frontend/';
    const frontendIndex = pathname.indexOf(frontendMarker);

    if (frontendIndex >= 0) {
        const currentRelativePath = pathname.substring(frontendIndex + frontendMarker.length);
        const currentDir = currentRelativePath.includes('/')
            ? currentRelativePath.substring(0, currentRelativePath.lastIndexOf('/') + 1)
            : '';

        const fromSegments = currentDir ? currentDir.split('/').filter(Boolean) : [];
        const toSegments = normalizedPath.split('/').filter(Boolean);

        if (!toSegments.length) return '.';

        let commonLength = 0;
        while (commonLength < fromSegments.length && commonLength < toSegments.length && fromSegments[commonLength] === toSegments[commonLength]) {
            commonLength++;
        }

        const upLevels = Math.max(0, fromSegments.length - commonLength);
        const downSegments = toSegments.slice(commonLength);

        let relativePath = '';
        for (let i = 0; i < upLevels; i++) relativePath += '../';
        if (downSegments.length) relativePath += downSegments.join('/');

        return relativePath || './';
    }

    return '/' + normalizedPath;
}

function initPasswordToggles() {
    document.querySelectorAll('[data-toggle-password]').forEach(function (btn) {
        const input = document.getElementById(btn.getAttribute('data-toggle-password'));
        if (!input) return;
        btn.addEventListener('click', function () {
            const isPassword = input.getAttribute('type') === 'password';
            input.setAttribute('type', isPassword ? 'text' : 'password');
            btn.textContent = isPassword ? '🙈' : '👁️';
        });
    });
}

// Runs on every page automatically — the bug before this was that
// initPasswordToggles() was defined but nothing ever called it, so
// the eye icon on login and settings did nothing when clicked.
document.addEventListener('DOMContentLoaded', initPasswordToggles);

function showFieldError(elementId, show) {
    const el = document.getElementById(elementId);
    if (el) el.classList.toggle('visible', show);
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showToast(message, type, duration) {
    type = type || 'default';
    duration = duration || 3000;

    let toast = document.getElementById('globalToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'globalToast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.className = 'toast visible ' + type;

    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(function () { toast.classList.remove('visible'); }, duration);
}

function initEnterKeySubmit(inputIds, buttonId) {
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        const active = document.activeElement;
        if (active && inputIds.includes(active.id)) {
            e.preventDefault();
            const btn = document.getElementById(buttonId);
            if (btn) btn.click();
        }
    });
}

function formatDate(isoString) {
    if (!isoString) return '—';
    const d = new Date(isoString.replace(' ', 'T'));
    if (isNaN(d)) return isoString;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(isoString) {
    if (!isoString) return '—';
    const d = new Date(isoString.replace(' ', 'T'));
    if (isNaN(d)) return isoString;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function timeAgo(isoString) {
    if (!isoString) return '—';
    const d = new Date(isoString.replace(' ', 'T'));
    const seconds = Math.floor((new Date() - d) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    return Math.floor(seconds / 86400) + 'd ago';
}

/** Escapes text before dropping it into innerHTML, so a ticket title
 *  or comment can never break page layout or inject markup. */
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
}

// [DEMO] Used only when API.isMock() is true, so forms with a department
// dropdown still work without a real backend. Keep in sync with the real
// departments seeded in database/schema.sql.
const DEMO_DEPARTMENTS = [
    { department_id: 1, name: 'Director / CEO Office' },
    { department_id: 2, name: 'Crime Research Directorate' },
    { department_id: 3, name: 'Organised Crime Research' },
    { department_id: 4, name: 'Conventional and Emerging Crime Research' },
    { department_id: 5, name: 'Monitoring and Evaluation Research' },
    { department_id: 6, name: 'Information Management' },
    { department_id: 7, name: 'Public Awareness and Partnership' },
    { department_id: 8, name: 'Capacity Building' },
    { department_id: 9, name: 'Internal Audit and Risk Assurance' },
    { department_id: 10, name: 'Supply Chain Management' },
    { department_id: 11, name: 'Human Resource & Administration' },
    { department_id: 12, name: 'Finance and Accounts' },
    { department_id: 13, name: 'Corporate Communications' },
    { department_id: 14, name: 'Legal Services' },
    { department_id: 15, name: 'ICT' }
];

/**
 * Fills a <select> with every department, always from the real
 * `departments` table (or DEMO_DEPARTMENTS in mock mode) — never
 * hand-typed, so it can never drift out of sync or contain a typo.
 */
async function populateDepartmentSelect(selectId, placeholder) {
    const select = document.getElementById(selectId);
    if (!select) return;

    let departments;
    if (API.isMock()) {
        departments = DEMO_DEPARTMENTS;
    } else {
        const res = await API.get('/departments/list.php');
        departments = res.success ? res.data : [];
    }

    const placeholderOption = placeholder ? '<option value="">' + escapeHtml(placeholder) + '</option>' : '';
    select.innerHTML = placeholderOption + departments.map(function (d) {
        return '<option value="' + d.department_id + '">' + escapeHtml(d.name) + '</option>';
    }).join('');
}

/**
 * Same as populateDepartmentSelect but option VALUES are the department
 * NAME, not the ID — for filter dropdowns (e.g. Reports) that match
 * against the display name already present in ticket/asset list data,
 * rather than submitting a department_id to the backend.
 */
async function populateDepartmentFilterByName(selectId, allLabel) {
    const select = document.getElementById(selectId);
    if (!select) return;

    let departments;
    if (API.isMock()) {
        departments = DEMO_DEPARTMENTS;
    } else {
        const res = await API.get('/departments/list.php');
        departments = res.success ? res.data : [];
    }

    const allOption = '<option value="all">' + escapeHtml(allLabel || 'All departments') + '</option>';
    select.innerHTML = allOption + departments.map(function (d) {
        return '<option value="' + escapeHtml(d.name) + '">' + escapeHtml(d.name) + '</option>';
    }).join('');
}
