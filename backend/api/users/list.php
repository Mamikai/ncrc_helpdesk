<?php
/* ============================================
   GET /backend/api/users/list.php
   Admin-only.
   ============================================ */

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../includes/auth-middleware.php';
require_once __DIR__ . '/../../includes/functions.php';

requireRole(['admin']);

$stmt = $pdo->query('SELECT user_id, full_name, email, role, department, is_active, last_login, created_at FROM users ORDER BY created_at DESC');
jsonResponse(true, $stmt->fetchAll());
