<?php
/* ============================================
   NCRC HELP DESK - SHARED HELPER FUNCTIONS
   ============================================ */

function jsonResponse($success, $data = null, $error = null, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode(['success' => $success, 'data' => $data, 'error' => $error]);
    exit;
}

function sanitizeInput($value) {
    return htmlspecialchars(trim($value), ENT_QUOTES, 'UTF-8');
}

function getJsonBody() {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}

/** Generates the next sequential ticket number, e.g. NCRC-0001 */
function generateTicketNumber(PDO $pdo) {
    $stmt = $pdo->query('SELECT COUNT(*) AS total FROM tickets');
    $next = (int) $stmt->fetch()['total'] + 1;
    return 'NCRC-' . str_pad($next, 4, '0', STR_PAD_LEFT);
}

/** Creates an in-app notification for a user */
function notifyUser(PDO $pdo, $userId, $title, $message, $link = null) {
    $stmt = $pdo->prepare('INSERT INTO notifications (user_id, title, message, link) VALUES (?, ?, ?, ?)');
    $stmt->execute([$userId, $title, $message, $link]);
}

/** Logs an action to the audit trail */
function logAudit(PDO $pdo, $userId, $action, $tableName = null, $recordId = null) {
    $stmt = $pdo->prepare('INSERT INTO audit_log (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)');
    $stmt->execute([$userId, $action, $tableName, $recordId]);
}
