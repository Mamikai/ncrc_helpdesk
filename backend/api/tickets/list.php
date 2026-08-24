<?php
/* ============================================
   GET /backend/api/tickets/list.php
   Role-filtered, plus a `view` param for ICT's queue tabs:
     - user  -> always just their own tickets (view param ignored)
     - ict   -> ?view=all (default) | unclaimed | mine
     - admin -> always all tickets
   ============================================ */

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../includes/auth-middleware.php';
require_once __DIR__ . '/../../includes/functions.php';

requireLogin();

$role = $_SESSION['role'];
$userId = $_SESSION['user_id'];
$view = $_GET['view'] ?? 'all';

$base = 'SELECT t.ticket_id, t.ticket_number, t.title, d.name AS department, t.priority, t.status,
                t.created_at, t.sla_due_at,
                u.full_name AS reported_by,
                a.full_name AS assigned_to_name
         FROM tickets t
         JOIN users u ON u.user_id = t.submitted_by
         LEFT JOIN users a ON a.user_id = t.assigned_to
         LEFT JOIN departments d ON d.department_id = t.department_id';

if ($role === 'user') {
    $stmt = $pdo->prepare($base . ' WHERE t.submitted_by = ? ORDER BY t.created_at DESC');
    $stmt->execute([$userId]);
} elseif ($role === 'ict' && $view === 'unclaimed') {
    $stmt = $pdo->query($base . ' WHERE t.assigned_to IS NULL ORDER BY t.created_at DESC');
} elseif ($role === 'ict' && $view === 'mine') {
    $stmt = $pdo->prepare($base . ' WHERE t.assigned_to = ? ORDER BY t.created_at DESC');
    $stmt->execute([$userId]);
} else {
    // ict view=all, or admin (always sees everything)
    $stmt = $pdo->query($base . ' ORDER BY t.created_at DESC');
}

jsonResponse(true, $stmt->fetchAll());
