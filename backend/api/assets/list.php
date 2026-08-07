<?php
/* ============================================
   GET /backend/api/assets/list.php
   Optional filters: ?status=in_store  ?category=laptop
   ============================================ */

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../includes/auth-middleware.php';
require_once __DIR__ . '/../../includes/functions.php';

requireLogin();

$conditions = [];
$params = [];

if (!empty($_GET['status'])) {
    $conditions[] = 'a.status = ?';
    $params[] = $_GET['status'];
}
if (!empty($_GET['category'])) {
    $conditions[] = 'a.category = ?';
    $params[] = $_GET['category'];
}

$where = $conditions ? 'WHERE ' . implode(' AND ', $conditions) : '';

$stmt = $pdo->prepare(
    "SELECT a.asset_id, a.asset_tag, a.category, a.department, a.model, a.serial_number,
            a.status, a.assigned_to_name, u.full_name AS assigned_to_login_name
     FROM assets a
     LEFT JOIN users u ON u.user_id = a.assigned_to_user_id
     $where
     ORDER BY a.asset_tag"
);
$stmt->execute($params);

jsonResponse(true, $stmt->fetchAll());
