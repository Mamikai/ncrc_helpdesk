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
