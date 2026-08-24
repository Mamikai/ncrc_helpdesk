<?php
/* ============================================
   NCRC HELP DESK - DATABASE CONNECTION
   Single PDO connection, reused by every
   endpoint via require_once.
   ============================================ */

// TODO: backend - move these to environment variables before deploying,
// never commit real credentials to GitHub.
$host = 'localhost';
$db   = 'ncrc_helpdesk';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (PDOException $e) {
    http_response_code(500);
    die(json_encode(['success' => false, 'error' => 'Database connection failed']));
}
