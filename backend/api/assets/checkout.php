<?php
/* ============================================
   POST /backend/api/assets/checkout.php
   ICT/Admin only. Body: { asset_tag, assigned_to_name,
                            assigned_to_user_id, notes }
   Assigns an existing in-store asset to someone (free-text
   name, since not every asset holder has a login) and logs
   the movement for history.
   ============================================ */

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../includes/auth-middleware.php';
require_once __DIR__ . '/../../includes/functions.php';

requireRole(['ict', 'admin']);

$body = getJsonBody();
$assetTag = sanitizeInput($body['asset_tag'] ?? '');
$assignedToName = sanitizeInput($body['assigned_to_name'] ?? '');
$assignedToUserId = !empty($body['assigned_to_user_id']) ? (int) $body['assigned_to_user_id'] : null;
$notes = sanitizeInput($body['notes'] ?? '');

if (!$assetTag || !$assignedToName) {
    jsonResponse(false, null, 'asset_tag and assigned_to_name are required', 400);
}

$assetStmt = $pdo->prepare('SELECT asset_id FROM assets WHERE asset_tag = ?');
$assetStmt->execute([$assetTag]);
$asset = $assetStmt->fetch();
if (!$asset) {
    jsonResponse(false, null, 'Asset not found', 404);
}

$pdo->beginTransaction();
try {
    $update = $pdo->prepare('UPDATE assets SET status = "working", assigned_to_name = ?, assigned_to_user_id = ? WHERE asset_id = ?');
    $update->execute([$assignedToName, $assignedToUserId, $asset['asset_id']]);

    $log = $pdo->prepare('INSERT INTO asset_movement (asset_id, moved_by, to_user_id, to_user_name, notes) VALUES (?, ?, ?, ?, ?)');
    $log->execute([$asset['asset_id'], $_SESSION['user_id'], $assignedToUserId, $assignedToName, $notes]);

    $pdo->commit();
    jsonResponse(true, null);
} catch (Exception $e) {
    $pdo->rollBack();
    jsonResponse(false, null, 'Failed to assign asset', 500);
}
