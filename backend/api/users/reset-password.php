<?php
/* ============================================
   PUT /backend/api/users/reset-password.php
   Admin-only. Body: { user_id }
   For a staff member who's forgotten their password.
   Resets it back to the same default every new account
   gets (FightCrime01) and forces a reset on next login —
   reuses the exact same forced-reset flow new hires go
   through, no separate mechanism needed.
   ============================================ */

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/constants.php';
require_once __DIR__ . '/../../includes/auth-middleware.php';
require_once __DIR__ . '/../../includes/functions.php';

requireRole(['admin']);

$body = getJsonBody();
$userId = (int) ($body['user_id'] ?? 0);

if (!$userId) {
    jsonResponse(false, null, 'user_id is required', 400);
}

$check = $pdo->prepare('SELECT user_id FROM users WHERE user_id = ?');
$check->execute([$userId]);
if (!$check->fetch()) {
    jsonResponse(false, null, 'User not found', 404);
}

$hashedPassword = password_hash(DEFAULT_TEMP_PASSWORD, PASSWORD_DEFAULT);

$stmt = $pdo->prepare('UPDATE users SET password_hash = ?, must_reset_password = 1 WHERE user_id = ?');
$stmt->execute([$hashedPassword, $userId]);

logAudit($pdo, $_SESSION['user_id'], 'reset_password', 'users', $userId);

jsonResponse(true, ['default_password' => DEFAULT_TEMP_PASSWORD]);
