<?php
/* ============================================
   GET /backend/api/knowledge-base/list.php?q=printer
   ICT/Admin only. Returns every resolved/closed ticket
   that has a resolution note — the knowledge base is
   just this: no separate content system, the mandatory
   resolution note captured in update-status.php IS the
   knowledge base entry. Optional ?q= does a simple
   search across title + resolution notes.
   ============================================ */

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../includes/auth-middleware.php';
require_once __DIR__ . '/../../includes/functions.php';

requireRole(['ict', 'admin']);

$q = trim($_GET['q'] ?? '');

$base = "SELECT t.ticket_id, t.ticket_number, t.title, t.resolution_notes, t.priority, t.status,
                 d.name AS department, a.full_name AS resolved_by, t.resolved_at
          FROM tickets t
          LEFT JOIN departments d ON d.department_id = t.department_id
          LEFT JOIN users a ON a.user_id = t.assigned_to
          WHERE t.status IN ('resolved', 'closed') AND t.resolution_notes IS NOT NULL AND t.resolution_notes != ''";

if ($q !== '') {
    $stmt = $pdo->prepare($base . ' AND (t.title LIKE ? OR t.resolution_notes LIKE ?) ORDER BY t.resolved_at DESC');
    $like = '%' . $q . '%';
    $stmt->execute([$like, $like]);
} else {
    $stmt = $pdo->query($base . ' ORDER BY t.resolved_at DESC');
}

jsonResponse(true, $stmt->fetchAll());
