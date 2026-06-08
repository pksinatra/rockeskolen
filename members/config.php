<?php
// /members/config.php
// Shared config for ChordLink members + app gating.
//
// SECURITY NOTE:
// Keep secrets out of Git. Put local overrides in members/config.local.php
// or set environment variables on the server.

$localConfig = __DIR__ . '/config.local.php';
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
$DB_HOST = getenv('CHORDLINK_DB_HOST') ?: '';
$DB_NAME = getenv('CHORDLINK_DB_NAME') ?: '';
$DB_USER = getenv('CHORDLINK_DB_USER') ?: '';
$DB_PASS = getenv('CHORDLINK_DB_PASS') ?: '';

$pdo = null;

if ($DB_HOST !== '' && $DB_NAME !== '' && $DB_USER !== '') {
    try {
        $pdo = new PDO(
            "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4",
            $DB_USER,
            $DB_PASS,
            [ PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION ]
        );
    } catch (PDOException $e) {
        error_log('Rockeskolen DB connection error: ' . $e->getMessage());
    }
}

define('USER_TABLE', 'chordlink_users');
define('PAYMENT_TABLE', 'chordlink_payments');
define('PRO_ROLES', ['pro','vip','admin']);
define('VIP_ROLES', ['vip','admin']);


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

if (!function_exists('refresh_user_from_db')) {
    function refresh_user_from_db(): void {
        global $pdo;
        if (empty($_SESSION['user_chordlink']['id'])) return;
        if (!$pdo instanceof PDO) return;

        $id = (int)$_SESSION['user_chordlink']['id'];
        $stmt = $pdo->prepare("SELECT id, email, role FROM " . USER_TABLE . " WHERE id=? LIMIT 1");
        $stmt->execute([$id]);

        if ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            set_current_user($row);
        }
    }
}

if (!function_exists('pro_required')) {
    function pro_required(bool $allowDemo = false): void {
        refresh_user_from_db();

        if (is_pro_user()) return;
        if ($allowDemo) return;

        if (!is_logged_in()) {
            header("Location: /members/login.php?reason=pro");
            exit;
        }

        header("Location: /members/upgrade.php");
        exit;
    }
}

function get_active_subscription(int $userId) {
    global $pdo;
    if (!$pdo instanceof PDO) return null;

    $stmt = $pdo->prepare("
        SELECT *
        FROM chordlink_subscriptions
        WHERE user_id = ?
          AND status IN ('active','trialing')
        ORDER BY current_period_end DESC
        LIMIT 1
    ");
    $stmt->execute([$userId]);

    return $stmt->fetch(PDO::FETCH_ASSOC);
}


function is_logged_in(): bool {
    return (bool) current_user();
}

function has_chordlink_access(?array $u = null): bool {
    $u = $u ?: current_user();
    if (!$u) return false;
    return in_array($u['role'], PRO_ROLES, true);
}

function safe_redirect(string $fallback = '/members/account.php'): string {
    $r = $_GET['redirect'] ?? ($_POST['redirect'] ?? '');
    if (!is_string($r) || $r === '') return $fallback;
    if ($r[0] !== '/') return $fallback;
    if (strpos($r, '//') === 0) return $fallback;
    return $r;
}

function has_rockeskolen_access(?array $u = null): bool {
    $u = $u ?: current_user();
    if (!$u) return false;
    return in_array($u['role'], VIP_ROLES, true);
}

function require_login() {
    if (!current_user()) {
        $redir = $_SERVER['REQUEST_URI'] ?? '/';
        header("Location: /members/login.php?redirect=" . urlencode($redir));
        exit;
    }
}

function require_database(): void {
    global $pdo;

    if ($pdo instanceof PDO) return;

    http_response_code(503);
    die("Database connection unavailable.");
}

function require_pro() {
    require_login();
    $u = current_user();
    if (!in_array($u['role'], PRO_ROLES, true)) {
        header("Location: /members/upgrade.php");
        exit;
    }
}

function is_pro_user(?array $u = null): bool {
    return has_chordlink_access($u);
}

function send_membership_email(string $to, string $plan, string $periodEnd): void {

    $subject = "Your ChordLink Pro subscription";

    $message = "
Hei,

Ditt VIP-medlemskap hos Rockeskolen er nå aktivert. 

Konto: $to
Plan: $plan
Fornyes: $periodEnd

Du kan redigere ditt medlemsskap her:
https://www.rockeskolen.com/members/account.php

Takk for at du er medlem hos oss.
";

    $headers = "From: Rockeskolen VIP <noreply@rockeskolen.com>\r\n";
    $headers .= "Reply-To: post@rockeskolen.com\r\n";

    mail($to, $subject, $message, $headers);
}


// ---- Stripe ----
define('CHORDLINK_STRIPE_SECRET_KEY', getenv('CHORDLINK_STRIPE_SECRET_KEY') ?: '');
define('CHORDLINK_STRIPE_WEBHOOK_SECRET', getenv('CHORDLINK_STRIPE_WEBHOOK_SECRET') ?: '');


