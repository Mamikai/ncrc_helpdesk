<?php
/* ============================================
   PUT /backend/api/users/update-profile.php
   Any logged-in user, self-service only. Body: { full_name }
   Deliberately does NOT accept department or role —
   department is admin-only (update-department.php),
   role is never self-editable by design.
   ============================================ */

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../includes/auth-middleware.php';
require_once __DIR__ . '/../../includes/functions.php';

requireLogin();

$body = getJsonBody();
$fullName = sanitizeInput($body['full_name'] ?? '');

if (!$fullName || strlen($fullName) < 2) {
    jsonResponse(false, null, 'A valid name is required', 400);
}

$stmt = $pdo->prepare('UPDATE users SET full_name = ? WHERE user_id = ?');
$stmt->execute([$fullName, $_SESSION['user_id']]);
$_SESSION['name'] = $fullName;

jsonResponse(true, null);
