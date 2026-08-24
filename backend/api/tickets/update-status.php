<?php
/* ============================================
   PUT /backend/api/tickets/update-status.php
   ICT/Admin only. Body: { ticket_id, status, resolution_notes }
   This is the REAL enforcement point — the frontend
   only hides the update UI for staff, this endpoint
   is what actually blocks them if they call it directly.

   resolution_notes is REQUIRED when status is 'resolved' or
   'closed' — this doubles as the knowledge base entry (see
   backend/api/knowledge-base/list.php). No note, no closing.
   ============================================ */

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/constants.php';
require_once __DIR__ . '/../../includes/auth-middleware.php';
require_once __DIR__ . '/../../includes/functions.php';

requireRole(['ict', 'admin']);

$body = getJsonBody();
$ticketId = (int) ($body['ticket_id'] ?? 0);
$status = sanitizeInput($body['status'] ?? '');
$resolutionNotes = sanitizeInput($body['resolution_notes'] ?? '');

if (!$ticketId || !in_array($status, TICKET_STATUSES, true)) {
    jsonResponse(false, null, 'Valid ticket_id and status are required', 400);
}

$needsNote = in_array($status, ['resolved', 'closed'], true);
if ($needsNote && !$resolutionNotes) {
    jsonResponse(false, null, 'Please describe how this was resolved before closing the ticket — this becomes the knowledge base entry', 400);
}

$extra = '';
$params = [$status];

if ($status === 'resolved') {
    $extra = ', resolved_at = NOW(), resolution_notes = ?';
    $params[] = $resolutionNotes;
} elseif ($status === 'closed') {
    $extra = ', resolved_at = COALESCE(resolved_at, NOW()), closed_at = NOW(), resolution_notes = COALESCE(NULLIF(resolution_notes, \'\'), ?)';
    $params[] = $resolutionNotes;
}

$params[] = $ticketId;

$stmt = $pdo->prepare("UPDATE tickets SET status = ? $extra WHERE ticket_id = ?");
$stmt->execute($params);

$ticket = $pdo->prepare('SELECT submitted_by, ticket_number, title FROM tickets WHERE ticket_id = ?');
$ticket->execute([$ticketId]);
$t = $ticket->fetch();
if ($t) {
    notifyUser($pdo, $t['submitted_by'], 'Ticket status updated',
        $t['ticket_number'] . ' (' . $t['title'] . ') is now ' . $status, "tickets/details.html?id=$ticketId");
}

jsonResponse(true, null);
