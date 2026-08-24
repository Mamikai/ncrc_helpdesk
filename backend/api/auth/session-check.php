<?php
/* ============================================
   GET /backend/api/auth/session-check.php
   Used by frontend/index.html (router) and the
   sidebar/header on every page to know who's
   logged in without asking them to log in again.
   ============================================ */

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../includes/functions.php';

if (session_status() === PHP_SESSION_NONE) session_start();

if (empty($_SESSION['user_id'])) {
    jsonResponse(false, null, 'Not logged in', 401);
}

$stmt = $pdo->prepare('SELECT u.user_id, u.role, u.full_name, u.department_id, d.name AS department FROM users u LEFT JOIN departments d ON d.department_id = u.department_id WHERE u.user_id = ? AND u.is_active = 1');
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch();
if (!$user) jsonResponse(false, null, 'Session user is no longer active', 401);

$_SESSION['department'] = $user['department'];
$_SESSION['department_id'] = $user['department_id'];
jsonResponse(true, [
    'user_id' => $user['user_id'],
    'role' => $user['role'],
    'name' => $user['full_name'],
    'department' => $user['department'],
    'department_id' => $user['department_id'],
]);
