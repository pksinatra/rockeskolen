<?php
// /members/config.php
// Shared config for ChordLink members + app gating.
//
// SECURITY NOTE:
// Keep secrets out of Git. Put local overrides in ../config.local.php
// or set environment variables on the server.

$localConfig = dirname(__DIR__) . '/config.local.php';
if (is_file($localConfig)) {
    require $localConfig;
}

session_start();

// ---- Error reporting ----
// Production: keep display_errors OFF (log instead).
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);

// ---- DB ----
$DB_HOST = getenv('CHORDLINK_DB_HOST') ?: 'localhost';
$DB_NAME = getenv('CHORDLINK_DB_NAME') ?: '';
$DB_USER = getenv('CHORDLINK_DB_USER') ?: '';
$DB_PASS = getenv('CHORDLINK_DB_PASS') ?: '';

try {
    $pdo = new PDO(
        "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4",
        $DB_USER,
        $DB_PASS,
        [ PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    die("Database connection error.");
}

define('USER_TABLE', 'chordlink_users');
define('PAYMENT_TABLE', 'chordlink_payments');



function current_user() {
    return $_SESSION['user_chordlink'] ?? null;
}

function set_current_user(array $row) {
    $_SESSION['user_chordlink'] = [
        'id'    => $row['id'],
        'email' => $row['email'],
        'role'  => $row['role'],
    ];
}

function refresh_user_from_db(): void {
  global $pdo;
  if (empty($_SESSION['user_chordlink']['id'])) return;
  $id = (int)$_SESSION['user_chordlink']['id'];
  $stmt = $pdo->prepare("SELECT id, email, role FROM " . USER_TABLE . " WHERE id=? LIMIT 1");
  $stmt->execute([$id]);
  if ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    set_current_user($row);
  }
}

function is_logged_in(): bool {
    return (bool) current_user();
}

function is_pro_user(?array $u = null): bool {
    $u = $u ?: current_user();
    if (!$u) return false;
    return in_array($u['role'], ['pro','admin'], true);
}

function safe_redirect(string $fallback = '/members/account.php'): string {
    $r = $_GET['redirect'] ?? ($_POST['redirect'] ?? '');
    if (!is_string($r) || $r === '') return $fallback;
    if ($r[0] !== '/') return $fallback;
    if (strpos($r, '//') === 0) return $fallback;
    return $r;
}

function require_login() {
    if (!current_user()) {
        $redir = $_SERVER['REQUEST_URI'] ?? '/';
        header("Location: /members/login.php?redirect=" . urlencode($redir));
        exit;
    }
}

function require_pro() {
    require_login();
    $u = current_user();
    if (!in_array($u['role'], ['pro','admin'], true)) {
        header("Location: /members/upgrade.php");
        exit;
    }
}

// ---- Stripe (Test mode) ----
define('CHORDLINK_STRIPE_SECRET_KEY', getenv('CHORDLINK_STRIPE_SECRET_KEY') ?: '');
define('CHORDLINK_STRIPE_WEBHOOK_SECRET', getenv('CHORDLINK_STRIPE_WEBHOOK_SECRET') ?: '');



