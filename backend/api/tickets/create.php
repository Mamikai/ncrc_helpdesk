<?php
/* ============================================
   POST /backend/api/tickets/create.php
   Any logged-in user. Body: { title, department_id, description }

   Priority is never taken from the client — nobody picks their
   own ticket's priority. It's decided here from the submitting
   user's can_prioritize flag (set by an Admin on their account):
     can_prioritize = 1  -> ticket is auto-High
     can_prioritize = 0  -> ticket is Medium (the default for everyone)
   ============================================ */

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/constants.php';
require_once __DIR__ . '/../../includes/auth-middleware.php';
require_once __DIR__ . '/../../includes/functions.php';

requireLogin();

$body = getJsonBody();
$title = sanitizeInput($body['title'] ?? '');
$departmentId = isset($body['department_id']) && $body['department_id'] !== '' ? (int) $body['department_id'] : null;
$description = sanitizeInput($body['description'] ?? '');

if ($_SESSION['role'] === 'user') {
    $userDept = $pdo->prepare('SELECT department_id FROM users WHERE user_id = ? AND is_active = 1');
    $userDept->execute([$_SESSION['user_id']]);
    $departmentId = (int) ($userDept->fetchColumn() ?: 0);
}

if (!$title || !$description || !$departmentId) {
    jsonResponse(false, null, 'Title, description, and department are required', 400);
}

$deptCheck = $pdo->prepare('SELECT department_id FROM departments WHERE department_id = ?');
$deptCheck->execute([$departmentId]);
if (!$deptCheck->fetch()) {
    jsonResponse(false, null, 'Invalid department', 400);
}

// Look up the submitter's priority privilege fresh from the DB —
// never trust anything the client might send for this.
$privStmt = $pdo->prepare('SELECT can_prioritize FROM users WHERE user_id = ?');
$privStmt->execute([$_SESSION['user_id']]);
$priv = $privStmt->fetch();
$priority = (!empty($priv['can_prioritize'])) ? 'high' : 'medium';

$ticketNumber = generateTicketNumber($pdo);

// SLA due date = now + resolution_hours for this priority
$sla = $pdo->prepare('SELECT resolution_hours FROM sla_rules WHERE priority = ?');
$sla->execute([$priority]);
$slaRow = $sla->fetch();
$slaDueAt = $slaRow ? date('Y-m-d H:i:s', strtotime('+' . $slaRow['resolution_hours'] . ' hours')) : null;

$stmt = $pdo->prepare(
    'INSERT INTO tickets (ticket_number, submitted_by, department_id, title, description, priority, status, sla_due_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, "open", ?, NOW())'
);
$stmt->execute([$ticketNumber, $_SESSION['user_id'], $departmentId, $title, $description, $priority, $slaDueAt]);
$ticketId = $pdo->lastInsertId();

// Notify all ICT officers that a new ticket landed in the unclaimed queue
$ictOfficers = $pdo->query("SELECT user_id FROM users WHERE role = 'ict' AND is_active = 1")->fetchAll();
foreach ($ictOfficers as $officer) {
    notifyUser($pdo, $officer['user_id'], 'New ticket', "$ticketNumber: $title", "tickets/details.html?id=$ticketId");
}

jsonResponse(true, ['ticket_id' => $ticketId, 'ticket_number' => $ticketNumber, 'priority' => $priority], null, 201);
