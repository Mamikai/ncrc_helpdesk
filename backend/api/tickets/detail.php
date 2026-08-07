<?php
/* ============================================
   GET /backend/api/tickets/detail.php?id=123
   Role-checked: a staff member can only fetch
   their OWN ticket; ICT/Admin can fetch any.
   ============================================ */

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../includes/auth-middleware.php';
require_once __DIR__ . '/../../includes/functions.php';

requireLogin();

$ticketId = (int) ($_GET['id'] ?? 0);
if (!$ticketId) {
    jsonResponse(false, null, 'id is required', 400);
}

$stmt = $pdo->prepare(
    'SELECT t.*, u.full_name AS reported_by, u.email AS reported_by_email,
            a.full_name AS assigned_to_name, a.user_id AS assigned_to_id
     FROM tickets t
     JOIN users u ON u.user_id = t.submitted_by
     LEFT JOIN users a ON a.user_id = t.assigned_to
     WHERE t.ticket_id = ?'
);
$stmt->execute([$ticketId]);
$ticket = $stmt->fetch();

if (!$ticket) {
    jsonResponse(false, null, 'Ticket not found', 404);
}

if ($_SESSION['role'] === 'user' && (int) $ticket['submitted_by'] !== (int) $_SESSION['user_id']) {
    jsonResponse(false, null, 'Not your ticket', 403);
}

jsonResponse(true, $ticket);
