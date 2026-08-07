<?php
/* ============================================
   PUT /backend/api/tickets/update-status.php
   ICT/Admin only. Body: { ticket_id, status }
   This is the REAL enforcement point — the frontend
   only hides the update UI for staff, this endpoint
   is what actually blocks them if they call it directly.
   ============================================ */

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/constants.php';
require_once __DIR__ . '/../../includes/auth-middleware.php';
require_once __DIR__ . '/../../includes/functions.php';

requireRole(['ict', 'admin']);

$body = getJsonBody();
$ticketId = (int) ($body['ticket_id'] ?? 0);
$status = sanitizeInput($body['status'] ?? '');

if (!$ticketId || !in_array($status, TICKET_STATUSES, true)) {
    jsonResponse(false, null, 'Valid ticket_id and status are required', 400);
}

$extra = '';
if ($status === 'resolved') {
    $extra = ', resolved_at = NOW()';
}
if ($status === 'closed') {
    $extra = ', resolved_at = COALESCE(resolved_at, NOW()), closed_at = NOW()';
}

$stmt = $pdo->prepare("UPDATE tickets SET status = ? $extra WHERE ticket_id = ?");
$stmt->execute([$status, $ticketId]);

$ticket = $pdo->prepare('SELECT submitted_by, ticket_number, title FROM tickets WHERE ticket_id = ?');
$ticket->execute([$ticketId]);
$t = $ticket->fetch();
if ($t) {
    notifyUser($pdo, $t['submitted_by'], 'Ticket status updated',
        $t['ticket_number'] . ' (' . $t['title'] . ') is now ' . $status, "tickets/details.html?id=$ticketId");
}

jsonResponse(true, null);
