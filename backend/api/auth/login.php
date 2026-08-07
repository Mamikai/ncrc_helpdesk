<?php
/* ============================================
   POST /backend/api/auth/login.php
   Body: { email, password }
   ============================================ */

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../includes/functions.php';

if (session_status() === PHP_SESSION_NONE) session_start();

$body = getJsonBody();
$email = sanitizeInput($body['email'] ?? '');
$password = $body['password'] ?? '';

if (!$email || !$password) {
    jsonResponse(false, null, 'Email and password are required', 400);
}

$stmt = $pdo->prepare('SELECT user_id, full_name, email, password_hash, role, department, must_reset_password FROM users WHERE email = ? AND is_active = 1');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    jsonResponse(false, null, 'Invalid email or password', 401);
}

$_SESSION['user_id'] = $user['user_id'];
$_SESSION['role'] = $user['role'];
$_SESSION['name'] = $user['full_name'];
$_SESSION['department'] = $user['department'];

$update = $pdo->prepare('UPDATE users SET last_login = NOW() WHERE user_id = ?');
$update->execute([$user['user_id']]);

jsonResponse(true, [
    'role' => $user['role'],
    'name' => $user['full_name'],
    'department' => $user['department'],
    'must_reset_password' => (bool) $user['must_reset_password'],
]);
