/* ============================================
   NCRC HELP DESK - AUTH LOGIC (login page only)
   Mock mode: any password works for the 3 demo
   emails below, sets a fake session so you can
   preview all 3 dashboards with zero backend setup.
   Real mode: posts to auth/login.php, which checks
   the real users table and starts a PHP session.
   ============================================ */

(function () {
    'use strict';

    const loginBtn = document.getElementById('loginBtn');
    if (!loginBtn) return;

    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');

    // Mock-mode only — never used once USE_MOCK is false in api.js
    const MOCK_ACCOUNTS = {
        'admin@crimeresearch.go.ke': { role: 'admin', name: 'System Administrator', department: 'ICT', userId: 1 },
        'ict@crimeresearch.go.ke': { role: 'ict', name: 'Test ICT Officer', department: 'ICT', userId: 2 },
        'user@crimeresearch.go.ke': { role: 'user', name: 'Test Employee', department: 'Research', userId: 3 }
    };

    const dashboardMap = {
        admin: getRelativePath('pages/dashboard/admin.html'),
        ict: getRelativePath('pages/dashboard/ict.html'),
        user: getRelativePath('pages/dashboard/user.html')
    };

    loginBtn.addEventListener('click', async function (e) {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        showFieldError('emailError', false);
        showFieldError('passwordError', false);

        let hasError = false;
        if (!email || !isValidEmail(email)) { showFieldError('emailError', true); hasError = true; }
        if (!password) { showFieldError('passwordError', true); hasError = true; }
        if (hasError) return;

        loginBtn.classList.add('loading');
        loginBtn.textContent = 'Logging in...';

        if (API.isMock()) {
            const account = MOCK_ACCOUNTS[email.toLowerCase()];
            setTimeout(function () {
                loginBtn.classList.remove('loading');
                loginBtn.textContent = 'LOGIN';

                if (!account) {
                    showToast('Unknown demo account — try one of the three listed below', 'error');
                    return;
                }
                setMockSession(account.role, account.name, account.department, account.userId);
                showToast('Welcome, ' + account.name, 'success', 1200);
                setTimeout(function () { window.location.href = dashboardMap[account.role]; }, 500);
            }, 700);
            return;
        }

        const res = await API.post('/auth/login.php', { email, password });
        loginBtn.classList.remove('loading');
        loginBtn.textContent = 'LOGIN';

        if (!res.success) {
            showToast(res.error || 'Invalid email or password', 'error');
            return;
        }

        if (res.data.must_reset_password) {
            window.location.href = getRelativePath('pages/settings/settings.html') + '?forceReset=1';
            return;
        }
        window.location.href = dashboardMap[res.data.role];
    });

    initEnterKeySubmit(['emailInput', 'passwordInput'], 'loginBtn');
})();
