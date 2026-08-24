<?php
/* ============================================
   GET /backend/api/users/list.php
   Admin-only.
   ============================================ */

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../includes/auth-middleware.php';
require_once __DIR__ . '/../../includes/functions.php';

requireRole(['admin']);

$stmt = $pdo->query(
    'SELECT u.user_id, u.full_name, u.email, u.role, d.name AS department, u.department_id,
            u.can_prioritize, u.is_active, u.last_login, u.created_at
     FROM users u
     LEFT JOIN departments d ON d.department_id = u.department_id
     ORDER BY u.created_at DESC'
);
jsonResponse(true, $stmt->fetchAll());
