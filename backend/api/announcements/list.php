<?php
/* ============================================
   GET /backend/api/announcements/list.php
   Any logged-in user. Returns the latest 5.
   ============================================ */

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../includes/auth-middleware.php';
require_once __DIR__ . '/../../includes/functions.php';

requireLogin();

$stmt = $pdo->query(
    'SELECT a.announcement_id, a.title, a.body, a.posted_at, u.full_name AS posted_by_name
     FROM announcements a
     JOIN users u ON u.user_id = a.posted_by
     ORDER BY a.posted_at DESC
     LIMIT 5'
);

jsonResponse(true, $stmt->fetchAll());
