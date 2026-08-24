<?php
/* ============================================
   PUT /backend/api/users/update-department.php
   Admin-only. Body: { user_id, department_id }
   Department is admin-editable anytime — the
   user themselves cannot change it (see
   update-profile.php for what they CAN self-edit).
   ============================================ */

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../includes/auth-middleware.php';
require_once __DIR__ . '/../../includes/functions.php';

requireRole(['admin']);

$body = getJsonBody();
$userId = (int) ($body['user_id'] ?? 0);
$departmentId = isset($body['department_id']) && $body['department_id'] !== '' ? (int) $body['department_id'] : null;

if (!$userId || !$departmentId) {
    jsonResponse(false, null, 'user_id and department_id are required', 400);
}

$deptCheck = $pdo->prepare('SELECT department_id FROM departments WHERE department_id = ?');
$deptCheck->execute([$departmentId]);
if (!$deptCheck->fetch()) {
    jsonResponse(false, null, 'Invalid department', 400);
}

$stmt = $pdo->prepare('UPDATE users SET department_id = ? WHERE user_id = ?');
$stmt->execute([$departmentId, $userId]);

jsonResponse(true, null);
