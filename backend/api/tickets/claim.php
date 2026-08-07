<?php
/* ============================================
   PUT /backend/api/tickets/claim.php
   ICT-only. Body: { ticket_id }
   The ICT officer claims an unclaimed ticket for
   themselves — sets assigned_to = them, status -> inprogress.
   Rejects if someone already claimed it first (avoids two
   officers both thinking they own the same ticket).
   ============================================ */

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../includes/auth-middleware.php';
require_once __DIR__ . '/../../includes/functions.php';

requireRole(['ict']);

$body = getJsonBody();
$ticketId = (int) ($body['ticket_id'] ?? 0);

if (!$ticketId) {
    jsonResponse(false, null, 'ticket_id is required', 400);
}

$check = $pdo->prepare('SELECT assigned_to, submitted_by, ticket_number, title FROM tickets WHERE ticket_id = ?');
$check->execute([$ticketId]);
$ticket = $check->fetch();

if (!$ticket) {
    jsonResponse(false, null, 'Ticket not found', 404);
}
if ($ticket['assigned_to'] !== null) {
    jsonResponse(false, null, 'This ticket has already been claimed by someone else', 409);
}

$stmt = $pdo->prepare('UPDATE tickets SET assigned_to = ?, status = "inprogress" WHERE ticket_id = ?');
$stmt->execute([$_SESSION['user_id'], $ticketId]);

notifyUser($pdo, $ticket['submitted_by'], 'Ticket claimed',
    $ticket['ticket_number'] . ' (' . $ticket['title'] . ') is now being handled by ' . $_SESSION['name'],
    "tickets/details.html?id=$ticketId");

jsonResponse(true, null);
