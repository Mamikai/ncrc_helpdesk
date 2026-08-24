<?php
/* ============================================
   POST /backend/api/assets/create.php
   Admin-only. Body: { asset_tag, category, department_id,
                        model, serial_number, status, notes }
   Registers a brand-new asset into the system — this was
   missing before: assign.php could only hand off an
   EXISTING in-store asset, nothing could add a new one.
   ============================================ */

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/constants.php';
require_once __DIR__ . '/../../includes/auth-middleware.php';
require_once __DIR__ . '/../../includes/functions.php';

requireRole(['admin']);

$body = getJsonBody();
$assetTag = sanitizeInput($body['asset_tag'] ?? '');
$category = sanitizeInput($body['category'] ?? '');
$departmentId = isset($body['department_id']) && $body['department_id'] !== '' ? (int) $body['department_id'] : null;
$model = sanitizeInput($body['model'] ?? '');
$serialNumber = sanitizeInput($body['serial_number'] ?? '');
$status = sanitizeInput($body['status'] ?? 'in_store');
$notes = sanitizeInput($body['notes'] ?? '');

if (!$assetTag || !in_array($category, ASSET_CATEGORIES, true)) {
    jsonResponse(false, null, 'A unique asset_tag and a valid category are required', 400);
}
if (!in_array($status, ASSET_STATUSES, true)) {
    $status = 'in_store';
}

$check = $pdo->prepare('SELECT asset_id FROM assets WHERE asset_tag = ?');
$check->execute([$assetTag]);
if ($check->fetch()) {
    jsonResponse(false, null, 'An asset with this tag already exists', 409);
}

$stmt = $pdo->prepare(
    'INSERT INTO assets (asset_tag, category, department_id, model, serial_number, status, notes, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
);
$stmt->execute([$assetTag, $category, $departmentId, $model, $serialNumber, $status, $notes, $_SESSION['user_id']]);

jsonResponse(true, ['asset_id' => $pdo->lastInsertId()], null, 201);
