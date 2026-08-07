<?php
/* ============================================
   POST /backend/api/users/create.php
   Admin-only. Body: { name, email, role, department }
   Every new account gets the same default password
   (FightCrime01, per team decision) and must reset it
   on first login. There is deliberately no register.php —
   only an Admin can provision accounts.
   ============================================ */

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/constants.php';
require_once __DIR__ . '/../../includes/auth-middleware.php';
require_once __DIR__ . '/../../includes/functions.php';

requireRole(['admin']);

$body = getJsonBody();
$name = sanitizeInput($body['name'] ?? '');
$email = sanitizeInput($body['email'] ?? '');
$role = sanitizeInput($body['role'] ?? '');
$department = sanitizeInput($body['department'] ?? '');

if (!$name || !$email || !in_array($role, ROLES, true)) {
    jsonResponse(false, null, 'Name, valid email, and a valid role are required', 400);
}

$check = $pdo->prepare('SELECT user_id FROM users WHERE email = ?');
$check->execute([$email]);
if ($check->fetch()) {
    jsonResponse(false, null, 'A user with this email already exists', 409);
}

$hashedPassword = password_hash(DEFAULT_TEMP_PASSWORD, PASSWORD_DEFAULT);

$stmt = $pdo->prepare(
    'INSERT INTO users (full_name, email, password_hash, role, department, must_reset_password, is_active)
     VALUES (?, ?, ?, ?, ?, 1, 1)'
);
$stmt->execute([$name, $email, $hashedPassword, $role, $department]);

logAudit($pdo, $_SESSION['user_id'], 'create_user', 'users', $pdo->lastInsertId());

jsonResponse(true, ['default_password' => DEFAULT_TEMP_PASSWORD], null, 201);
