<?php
/* ============================================
   POST /backend/api/auth/change-password.php
   Any logged-in user. Body: { current_password, new_password }
   Used both for the forced first-login reset and
   for voluntary changes from the Settings page.
   ============================================ */

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../includes/auth-middleware.php';
require_once __DIR__ . '/../../includes/functions.php';

requireLogin();

$body = getJsonBody();
$currentPassword = $body['current_password'] ?? '';
$newPassword = $body['new_password'] ?? '';

if (!$currentPassword || !$newPassword) {
    jsonResponse(false, null, 'Current and new password are required', 400);
}
if (strlen($newPassword) < 8) {
    jsonResponse(false, null, 'New password must be at least 8 characters', 400);
}

$stmt = $pdo->prepare('SELECT password_hash FROM users WHERE user_id = ?');
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch();

if (!$user || !password_verify($currentPassword, $user['password_hash'])) {
    jsonResponse(false, null, 'Current password is incorrect', 401);
}

$newHash = password_hash($newPassword, PASSWORD_DEFAULT);
$update = $pdo->prepare('UPDATE users SET password_hash = ?, must_reset_password = 0 WHERE user_id = ?');
$update->execute([$newHash, $_SESSION['user_id']]);

jsonResponse(true, null);
