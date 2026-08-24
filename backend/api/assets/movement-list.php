<?php
/* ============================================
   GET /backend/api/assets/movement-list.php
   ICT/Admin only. Optional filters: asset_tag, search
   Read-only asset assignment history.
   ============================================ */

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../includes/auth-middleware.php';
require_once __DIR__ . '/../../includes/functions.php';

requireRole(['ict', 'admin']);

$conditions = [];
$params = [];

if (!empty($_GET['asset_tag'])) {
    $conditions[] = 'a.asset_tag = ?';
    $params[] = sanitizeInput($_GET['asset_tag']);
}
if (!empty($_GET['search'])) {
    $search = '%' . sanitizeInput($_GET['search']) . '%';
    $conditions[] = '(a.asset_tag LIKE ? OR m.to_user_name LIKE ? OR m.notes LIKE ? OR mover.full_name LIKE ?)';
    $params = array_merge($params, [$search, $search, $search, $search]);
}

$where = $conditions ? 'WHERE ' . implode(' AND ', $conditions) : '';
$stmt = $pdo->prepare(
    "SELECT m.movement_id, m.asset_id, a.asset_tag, a.category, a.model,
            m.to_user_name, recipient.full_name AS recipient_login_name,
            mover.full_name AS moved_by_name, m.notes, m.moved_at
     FROM asset_movement m
     JOIN assets a ON a.asset_id = m.asset_id
     JOIN users mover ON mover.user_id = m.moved_by
     LEFT JOIN users recipient ON recipient.user_id = m.to_user_id
     $where
     ORDER BY m.moved_at DESC, m.movement_id DESC"
);
$stmt->execute($params);

jsonResponse(true, $stmt->fetchAll());
