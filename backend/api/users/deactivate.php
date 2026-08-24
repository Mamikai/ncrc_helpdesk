<?php
/* ============================================
   PUT /backend/api/users/deactivate.php
   Admin-only. Body: { user_id }
   Soft-delete — flips is_active to 0. We never hard-delete
   a user because tickets/assets/comments reference their
   user_id; deleting the row would break that history.
   ============================================ */

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../includes/auth-middleware.php';
require_once __DIR__ . '/../../includes/functions.php';

requireRole(['admin']);

$body = getJsonBody();
$userId = (int) ($body['user_id'] ?? 0);

if (!$userId) {
    jsonResponse(false, null, 'user_id is required', 400);
}
if ($userId === (int) $_SESSION['user_id']) {
    jsonResponse(false, null, 'You cannot deactivate your own account', 400);
}

$stmt = $pdo->prepare('UPDATE users SET is_active = 0 WHERE user_id = ?');
$stmt->execute([$userId]);

logAudit($pdo, $_SESSION['user_id'], 'deactivate_user', 'users', $userId);

jsonResponse(true, null);
