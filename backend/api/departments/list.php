<?php
/* ============================================
   GET /backend/api/departments/list.php
   Any logged-in user. Returns { department_id, name }
   for every department — used to populate every
   department dropdown (add-user, ticket-create, etc.)
   so the list is never hand-typed and never drifts.
   ============================================ */

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../includes/auth-middleware.php';
require_once __DIR__ . '/../../includes/functions.php';

requireLogin();

$stmt = $pdo->query('SELECT department_id, name FROM departments ORDER BY name');
jsonResponse(true, $stmt->fetchAll());
