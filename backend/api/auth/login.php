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

$stmt = $pdo->prepare(
    'SELECT u.user_id, u.full_name, u.email, u.password_hash, u.role, u.department_id, u.must_reset_password,
            d.name AS department
     FROM users u
     LEFT JOIN departments d ON d.department_id = u.department_id
     WHERE u.email = ? AND u.is_active = 1'
);
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    jsonResponse(false, null, 'Invalid email or password', 401);
}

$_SESSION['user_id'] = $user['user_id'];
$_SESSION['role'] = $user['role'];
$_SESSION['name'] = $user['full_name'];
$_SESSION['department'] = $user['department'];
$_SESSION['department_id'] = $user['department_id'];

$update = $pdo->prepare('UPDATE users SET last_login = NOW() WHERE user_id = ?');
$update->execute([$user['user_id']]);

jsonResponse(true, [
    'user_id' => $user['user_id'],
    'role' => $user['role'],
    'name' => $user['full_name'],
    'department' => $user['department'],
    'department_id' => $user['department_id'],
    'must_reset_password' => (bool) $user['must_reset_password'],
]);
