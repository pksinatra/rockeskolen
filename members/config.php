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

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_set_cookie_params([
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Lax',
        'path' => '/',
    ]);
    session_start();
}

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
// Access matrix:
// - Pro: all ChordLink tools, no Rockeskolen member content.
// - VIP: all Rockeskolen member content and all ChordLink tools.
define('CHORDLINK_ACCESS_ROLES', ['pro', 'vip', 'admin']);
define('ROCKESKOLEN_ACCESS_ROLES', ['vip', 'admin']);
// Backwards-compatible names used by existing tools and account pages.
define('PRO_ROLES', CHORDLINK_ACCESS_ROLES);
define('VIP_ROLES', ROCKESKOLEN_ACCESS_ROLES);


function current_user() {
    return $_SESSION['user_chordlink'] ?? null;
}

/**
 * Returns a short-lived, member-bound URL that logs out both systems.
 */
function member_logout_url(): string {
    $user = current_user();
    $userId = (int)($user['id'] ?? 0);
    $secret = getenv('CHORDLINK_ROLE_SYNC_SECRET') ?: '';
    if ($userId < 1 || $secret === '') {
        return '/members/logout.php';
    }
    $timestamp = time();
    $signature = hash_hmac('sha256', "logout:$userId:$timestamp", $secret);
    return 'https://portal.rockeskolen.com/members/logout-all?mid=' . $userId
        . '&ts=' . $timestamp . '&sig=' . rawurlencode($signature);
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
    if ($u === null || (!empty($u['id']) && !empty($_SESSION['user_chordlink']['id']) && (int) $u['id'] === (int) $_SESSION['user_chordlink']['id'])) {
        refresh_user_from_db();
        $u = current_user();
    }

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

require_once __DIR__ . '/return_path.php';

function has_rockeskolen_access(?array $u = null): bool {
    if ($u === null || (!empty($u['id']) && !empty($_SESSION['user_chordlink']['id']) && (int) $u['id'] === (int) $_SESSION['user_chordlink']['id'])) {
        refresh_user_from_db();
        $u = current_user();
    }

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

function require_vip() {
    require_login();
    refresh_user_from_db();
    $u = current_user();
    if (!in_array($u['role'] ?? '', VIP_ROLES, true)) {
        header("Location: /members/upgrade.php?reason=vip");
        exit;
    }
}

function is_pro_user(?array $u = null): bool {
    return has_chordlink_access($u);
}

function is_vip_user(?array $u = null): bool {
    return has_rockeskolen_access($u);
}

function send_membership_email(string $to, string $plan, string $periodEnd): void {

    $subject = "Ditt VIP-medlemskap hos Rockeskolen";

    $message = "
Hei,

Ditt VIP-medlemskap hos Rockeskolen er nå aktivert. 

Konto: $to
Plan: $plan
Fornyes: $periodEnd

Du kan redigere ditt medlemsskap her:
https://rockeskolen.com/members/account.php

Takk for at du er medlem hos oss.
";

    $headers = "From: Rockeskolen VIP <noreply@rockeskolen.com>\r\n";
    $headers .= "Reply-To: post@rockeskolen.com\r\n";

    mail($to, $subject, $message, $headers);
}


// ---- Stripe ----
define('CHORDLINK_STRIPE_SECRET_KEY', getenv('CHORDLINK_STRIPE_SECRET_KEY') ?: '');
define('CHORDLINK_STRIPE_WEBHOOK_SECRET', getenv('CHORDLINK_STRIPE_WEBHOOK_SECRET') ?: '');
