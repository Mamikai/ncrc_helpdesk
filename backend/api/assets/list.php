<?php
/* ============================================
   GET /backend/api/assets/list.php
    Optional filters: ?status=in_store  ?category=laptop  ?search=router

   Visibility: ICT/Admin always see this. A staff member
   (role 'user') can only see it if their own department is
   Internal Audit and Risk Assurance or Supply Chain
   Management (see ASSET_VISIBLE_DEPARTMENTS) — everyone
   else with role 'user' is blocked, matching the sidebar
   link being hidden from them too.
   ============================================ */

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/constants.php';
require_once __DIR__ . '/../../includes/auth-middleware.php';
require_once __DIR__ . '/../../includes/functions.php';

requireLogin();

if ($_SESSION['role'] === 'user') {
    $deptStmt = $pdo->prepare(
        'SELECT d.name FROM users u JOIN departments d ON d.department_id = u.department_id WHERE u.user_id = ?'
    );
    $deptStmt->execute([$_SESSION['user_id']]);
    $deptRow = $deptStmt->fetch();
    $deptName = $deptRow['name'] ?? null;

    if (!$deptName || !in_array($deptName, ASSET_VISIBLE_DEPARTMENTS, true)) {
        jsonResponse(false, null, 'You do not have access to the asset inventory', 403);
    }
}

$conditions = [];
$params = [];

if (!empty($_GET['status'])) {
    $status = sanitizeInput($_GET['status']);
    if (!in_array($status, ASSET_STATUSES, true)) {
        jsonResponse(false, null, 'Invalid asset status filter', 400);
    }
    $conditions[] = 'a.status = ?';
    $params[] = $status;
}
if (!empty($_GET['category'])) {
    $category = sanitizeInput($_GET['category']);
    if (!in_array($category, ASSET_CATEGORIES, true)) {
        jsonResponse(false, null, 'Invalid asset category filter', 400);
    }
    $conditions[] = 'a.category = ?';
    $params[] = $category;
}
if (!empty($_GET['search'])) {
    $search = '%' . sanitizeInput($_GET['search']) . '%';
    $conditions[] = '(a.asset_tag LIKE ? OR a.serial_number LIKE ? OR a.model LIKE ? OR a.assigned_to_name LIKE ?)';
    $params = array_merge($params, [$search, $search, $search, $search]);
}

$where = $conditions ? 'WHERE ' . implode(' AND ', $conditions) : '';

$stmt = $pdo->prepare(
        "SELECT a.asset_id, a.asset_tag, a.category, a.department_id, d.name AS department, a.model, a.serial_number,
            a.status, a.notes, a.assigned_to_name, u.full_name AS assigned_to_login_name
     FROM assets a
     LEFT JOIN users u ON u.user_id = a.assigned_to_user_id
     LEFT JOIN departments d ON d.department_id = a.department_id
     $where
     ORDER BY a.asset_tag"
);
$stmt->execute($params);

jsonResponse(true, $stmt->fetchAll());
