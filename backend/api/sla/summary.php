<?php
/* ============================================
   GET /backend/api/sla/summary.php
   ICT/Admin only. Powers the real "SLA Compliance %"
   stat — replaces the hardcoded fake number from the
   early mockup. Compliance = resolved-in-time / total-resolved.
   ============================================ */

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../includes/auth-middleware.php';
require_once __DIR__ . '/../../includes/functions.php';

requireRole(['ict', 'admin']);

$stmt = $pdo->query(
    "SELECT
        COUNT(*) AS total_resolved,
        SUM(CASE WHEN resolved_at <= sla_due_at THEN 1 ELSE 0 END) AS within_sla
     FROM tickets
     WHERE status IN ('resolved', 'closed') AND resolved_at IS NOT NULL AND sla_due_at IS NOT NULL"
);
$row = $stmt->fetch();

$total = (int) $row['total_resolved'];
$withinSla = (int) $row['within_sla'];
$compliancePercent = $total > 0 ? round(($withinSla / $total) * 100, 1) : null;

jsonResponse(true, [
    'total_resolved' => $total,
    'within_sla' => $withinSla,
    'compliance_percent' => $compliancePercent,
]);
