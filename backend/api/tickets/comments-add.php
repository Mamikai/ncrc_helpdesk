<?php
/* ============================================
   POST /backend/api/tickets/comments-add.php
   Any logged-in user with access to the ticket.
   Body: { ticket_id, comment, is_internal }
   is_internal can only be set true by ICT/Admin —
   a staff member's comment is always public.
   ============================================ */

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../includes/auth-middleware.php';
require_once __DIR__ . '/../../includes/functions.php';

requireLogin();

$body = getJsonBody();
$ticketId = (int) ($body['ticket_id'] ?? 0);
$comment = sanitizeInput($body['comment'] ?? '');
$isInternal = !empty($body['is_internal']) && in_array($_SESSION['role'], ['ict', 'admin'], true) ? 1 : 0;

if (!$ticketId || !$comment) {
    jsonResponse(false, null, 'ticket_id and comment are required', 400);
}

// Staff can only comment on their own ticket
$check = $pdo->prepare('SELECT submitted_by FROM tickets WHERE ticket_id = ?');
$check->execute([$ticketId]);
$ticket = $check->fetch();
if (!$ticket) {
    jsonResponse(false, null, 'Ticket not found', 404);
}
if ($_SESSION['role'] === 'user' && (int) $ticket['submitted_by'] !== (int) $_SESSION['user_id']) {
    jsonResponse(false, null, 'Not your ticket', 403);
}

$stmt = $pdo->prepare('INSERT INTO ticket_comments (ticket_id, author_id, comment, is_internal) VALUES (?, ?, ?, ?)');
$stmt->execute([$ticketId, $_SESSION['user_id'], $comment, $isInternal]);

jsonResponse(true, ['comment_id' => $pdo->lastInsertId()], null, 201);
