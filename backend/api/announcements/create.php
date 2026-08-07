<?php
/* ============================================
   POST /backend/api/announcements/create.php
   Admin-only. Body: { title, body }
   ============================================ */

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../includes/auth-middleware.php';
require_once __DIR__ . '/../../includes/functions.php';

requireRole(['admin']);

$body = getJsonBody();
$title = sanitizeInput($body['title'] ?? '');
$text = sanitizeInput($body['body'] ?? '');

if (!$title || !$text) {
    jsonResponse(false, null, 'Title and body are required', 400);
}

$stmt = $pdo->prepare('INSERT INTO announcements (title, body, posted_by) VALUES (?, ?, ?)');
$stmt->execute([$title, $text, $_SESSION['user_id']]);

jsonResponse(true, ['announcement_id' => $pdo->lastInsertId()], null, 201);
