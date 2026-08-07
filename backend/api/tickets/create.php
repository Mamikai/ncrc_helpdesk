<?php
/* ============================================
   POST /backend/api/tickets/create.php
   Any logged-in user (staff only in practice —
   ICT/Admin don't get a "New Ticket" button in
   the UI, but the endpoint itself doesn't need
   to block them; nothing breaks if it's used).
   Body: { title, department, priority, description }
   ============================================ */

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/constants.php';
require_once __DIR__ . '/../../includes/auth-middleware.php';
require_once __DIR__ . '/../../includes/functions.php';

requireLogin();

$body = getJsonBody();
$title = sanitizeInput($body['title'] ?? '');
$department = sanitizeInput($body['department'] ?? '');
$description = sanitizeInput($body['description'] ?? '');
$priority = sanitizeInput($body['priority'] ?? 'medium');

if (!$title || !$description) {
    jsonResponse(false, null, 'Title and description are required', 400);
}
if (!in_array($priority, TICKET_PRIORITIES, true)) {
    $priority = 'medium';
}

$ticketNumber = generateTicketNumber($pdo);

// SLA due date = now + resolution_hours for this priority
$sla = $pdo->prepare('SELECT resolution_hours FROM sla_rules WHERE priority = ?');
$sla->execute([$priority]);
$slaRow = $sla->fetch();
$slaDueAt = $slaRow ? date('Y-m-d H:i:s', strtotime('+' . $slaRow['resolution_hours'] . ' hours')) : null;

$stmt = $pdo->prepare(
    'INSERT INTO tickets (ticket_number, submitted_by, department, title, description, priority, status, sla_due_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, "open", ?, NOW())'
);
$stmt->execute([$ticketNumber, $_SESSION['user_id'], $department, $title, $description, $priority, $slaDueAt]);
$ticketId = $pdo->lastInsertId();

// Notify all ICT officers that a new ticket landed in the unclaimed queue
$ictOfficers = $pdo->query("SELECT user_id FROM users WHERE role = 'ict' AND is_active = 1")->fetchAll();
foreach ($ictOfficers as $officer) {
    notifyUser($pdo, $officer['user_id'], 'New ticket', "$ticketNumber: $title", "tickets/details.html?id=$ticketId");
}

jsonResponse(true, ['ticket_id' => $ticketId, 'ticket_number' => $ticketNumber], null, 201);
