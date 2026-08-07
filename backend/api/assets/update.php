<?php
/* ============================================
   PUT /backend/api/assets/update.php
   Admin-only. Body: { asset_id, status, department, notes }
   For status changes (e.g. marking something
   "requires_servicing" or "decommissioned") without
   going through the full assign/checkout flow.
   ============================================ */

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/constants.php';
require_once __DIR__ . '/../../includes/auth-middleware.php';
require_once __DIR__ . '/../../includes/functions.php';

requireRole(['admin']);

$body = getJsonBody();
$assetId = (int) ($body['asset_id'] ?? 0);
$status = sanitizeInput($body['status'] ?? '');
$department = sanitizeInput($body['department'] ?? '');
$notes = sanitizeInput($body['notes'] ?? '');

if (!$assetId || !in_array($status, ASSET_STATUSES, true)) {
    jsonResponse(false, null, 'Valid asset_id and status are required', 400);
}

$stmt = $pdo->prepare('UPDATE assets SET status = ?, department = ?, notes = ? WHERE asset_id = ?');
$stmt->execute([$status, $department, $notes, $assetId]);

jsonResponse(true, null);
