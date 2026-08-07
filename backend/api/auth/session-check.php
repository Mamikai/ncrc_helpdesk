<?php
/* ============================================
   GET /backend/api/auth/session-check.php
   Used by frontend/index.html (router) and the
   sidebar/header on every page to know who's
   logged in without asking them to log in again.
   ============================================ */

require_once __DIR__ . '/../../includes/functions.php';

if (session_status() === PHP_SESSION_NONE) session_start();

if (empty($_SESSION['user_id'])) {
    jsonResponse(false, null, 'Not logged in', 401);
}

jsonResponse(true, [
    'user_id' => $_SESSION['user_id'],
    'role' => $_SESSION['role'],
    'name' => $_SESSION['name'],
    'department' => $_SESSION['department'] ?? null,
]);
