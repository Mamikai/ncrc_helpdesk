<?php
/* ============================================
   NCRC HELP DESK - AUTH MIDDLEWARE
   Drop requireLogin() / requireRole([...]) at
   the top of any protected API file. This is
   the REAL security layer — frontend hiding
   buttons is UX only, this is what actually
   blocks unauthorized requests.
   ============================================ */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function requireLogin() {
    if (empty($_SESSION['user_id'])) {
        http_response_code(401);
        die(json_encode(['success' => false, 'error' => 'Not logged in']));
    }
}

/**
 * @param array $allowedRoles e.g. ['admin'], ['admin', 'ict']
 */
function requireRole(array $allowedRoles) {
    requireLogin();
    if (empty($_SESSION['role']) || !in_array($_SESSION['role'], $allowedRoles, true)) {
        http_response_code(403);
        die(json_encode(['success' => false, 'error' => 'Insufficient permissions']));
    }
}
