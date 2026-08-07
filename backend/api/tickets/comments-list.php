<?php
/* ============================================
   GET /backend/api/tickets/comments-list.php?ticket_id=123
   Staff viewers never see is_internal = 1 comments,
   even if they somehow guess the endpoint — filtered
   server-side, not just hidden in the UI.
   ============================================ */

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../includes/auth-middleware.php';
require_once __DIR__ . '/../../includes/functions.php';

requireLogin();

$ticketId = (int) ($_GET['ticket_id'] ?? 0);
if (!$ticketId) {
    jsonResponse(false, null, 'ticket_id is required', 400);
}

$internalClause = in_array($_SESSION['role'], ['ict', 'admin'], true) ? '' : 'AND c.is_internal = 0';

$stmt = $pdo->prepare(
    "SELECT c.comment_id, c.comment, c.is_internal, c.created_at, u.full_name AS author_name
     FROM ticket_comments c
     JOIN users u ON u.user_id = c.author_id
     WHERE c.ticket_id = ? $internalClause
     ORDER BY c.created_at ASC"
);
$stmt->execute([$ticketId]);

jsonResponse(true, $stmt->fetchAll());
