<?php
/* ============================================
   PUT /backend/api/notifications/mark-read.php
   Body: { notification_id }  (or omit for "mark all read")
   ============================================ */

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../includes/auth-middleware.php';
require_once __DIR__ . '/../../includes/functions.php';

requireLogin();

$body = getJsonBody();
$notificationId = !empty($body['notification_id']) ? (int) $body['notification_id'] : null;

if ($notificationId) {
    $stmt = $pdo->prepare('UPDATE notifications SET is_read = 1 WHERE notification_id = ? AND user_id = ?');
    $stmt->execute([$notificationId, $_SESSION['user_id']]);
} else {
    $stmt = $pdo->prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?');
    $stmt->execute([$_SESSION['user_id']]);
}

jsonResponse(true, null);
