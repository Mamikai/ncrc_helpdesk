<?php
/* ============================================
   PUT /backend/api/tickets/assign.php
   Admin-only. Body: { ticket_id, assigned_to_user_id }
   Admin proactively hands an unclaimed ticket to a
   specific ICT officer, rather than waiting for
   someone to self-claim it.
   ============================================ */

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../includes/auth-middleware.php';
require_once __DIR__ . '/../../includes/functions.php';

requireRole(['admin']);

$body = getJsonBody();
$ticketId = (int) ($body['ticket_id'] ?? 0);
$assignedTo = (int) ($body['assigned_to_user_id'] ?? 0);

if (!$ticketId || !$assignedTo) {
    jsonResponse(false, null, 'ticket_id and assigned_to_user_id are required', 400);
}

$roleCheck = $pdo->prepare("SELECT role FROM users WHERE user_id = ? AND is_active = 1");
$roleCheck->execute([$assignedTo]);
$targetUser = $roleCheck->fetch();
if (!$targetUser || $targetUser['role'] !== 'ict') {
    jsonResponse(false, null, 'Can only assign tickets to an active ICT officer', 400);
}

$stmt = $pdo->prepare('UPDATE tickets SET assigned_to = ?, status = "inprogress" WHERE ticket_id = ?');
$stmt->execute([$assignedTo, $ticketId]);

$ticket = $pdo->prepare('SELECT ticket_number, title FROM tickets WHERE ticket_id = ?');
$ticket->execute([$ticketId]);
$t = $ticket->fetch();
notifyUser($pdo, $assignedTo, 'Ticket assigned to you', $t['ticket_number'] . ': ' . $t['title'], "tickets/details.html?id=$ticketId");

jsonResponse(true, null);
