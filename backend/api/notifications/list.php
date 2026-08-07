<?php
/* ============================================
   GET /backend/api/notifications/list.php
   Any logged-in user — their own notifications only.
   ============================================ */

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../includes/auth-middleware.php';
require_once __DIR__ . '/../../includes/functions.php';

requireLogin();

$stmt = $pdo->prepare(
    'SELECT notification_id, title, message, link, is_read, created_at
     FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20'
);
$stmt->execute([$_SESSION['user_id']]);

jsonResponse(true, $stmt->fetchAll());
