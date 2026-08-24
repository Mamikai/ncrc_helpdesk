/* ============================================
   NCRC HELP DESK - API WRAPPER
   Single place all backend fetch() calls go through.

   USE_MOCK = true  -> runs on dummy in-memory data,
                       works instantly with zero setup
   USE_MOCK = false -> hits the real PHP endpoints —
                       flip this ONE line once XAMPP +
                       MySQL + schema import are done
                       (see docs/setup-guide.md)
   ============================================ */

const API = (function () {
    const BASE_URL = '/help-desk-system/backend/api'; // adjust if your XAMPP folder name differs
    // Open frontend\assets\js\api.js in a text editor. Find: const USE_MOCK = true;
    const USE_MOCK = false; // real PHP API is enabled for production

    async function request(endpoint, options) {
        options = options || {};

        if (USE_MOCK) {
            console.warn('[API] Mock mode — no real request sent for', endpoint);
            return { success: true, data: null, mock: true};
        }

        try {
            const url = BASE_URL + endpoint + (options.query ? '?' + new URLSearchParams(options.query) : '');
            const res = await fetch(url, {
                method: options.method || 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: options.body ? JSON.stringify(options.body) : undefined
            });
            const json = await res.json();
            if (!res.ok && res.status !== 401 && res.status !== 403) {
                console.error('[API] Error response from', endpoint, json);
            }
            return json;
        } catch (err) {
            console.error('[API] Network error calling', endpoint, err);
            return { success: false, error: 'Network error' };
        }
    }

    return {
        get: function (endpoint, query) { return request(endpoint, { method: 'GET', query: query }); },
        post: function (endpoint, body) { return request(endpoint, { method: 'POST', body: body }); },
        put: function (endpoint, body) { return request(endpoint, { method: 'PUT', body: body }); },
        delete: function (endpoint) { return request(endpoint, { method: 'DELETE' }); },
        isMock: function () { return USE_MOCK; }
    };
})();
