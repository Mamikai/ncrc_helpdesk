<?php
/* ============================================
   POST /backend/api/auth/logout.php
   ============================================ */

require_once __DIR__ . '/../../includes/functions.php';

if (session_status() === PHP_SESSION_NONE) session_start();
$_SESSION = [];
session_destroy();

jsonResponse(true, null);
