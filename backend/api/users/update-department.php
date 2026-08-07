<?php
/* ============================================
   PUT /backend/api/users/update-department.php
   Admin-only. Body: { user_id, department }
   Department is admin-editable anytime — the
   user themselves cannot change it (see
   update-profile.php for what they CAN self-edit).
   ============================================ */

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../includes/auth-middleware.php';
require_once __DIR__ . '/../../includes/functions.php';

requireRole(['admin']);

$body = getJsonBody();
$userId = (int) ($body['user_id'] ?? 0);
$department = sanitizeInput($body['department'] ?? '');

if (!$userId) {
    jsonResponse(false, null, 'user_id is required', 400);
}

$stmt = $pdo->prepare('UPDATE users SET department = ? WHERE user_id = ?');
$stmt->execute([$department, $userId]);

jsonResponse(true, null);
