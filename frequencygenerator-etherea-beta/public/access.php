<?php
declare(strict_types=1);

// This adapter uses ChordLink's existing session and database entitlement checks.
// Never accept a role, membership flag or entitlement from the request.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: private, no-store, max-age=0');
header('Vary: Cookie');
header('X-Content-Type-Options: nosniff');

function fg_reply(int $status, array $payload): void {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if (!in_array($method, ['GET', 'POST'], true)) {
    header('Allow: GET, POST');
    fg_reply(405, ['error' => 'method_not_allowed']);
}
if (($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '') === 'cross-site') {
    fg_reply(403, ['error' => 'same_origin_required']);
}

// Extend this one feature registry when a future Pro feature is implemented.
$proFeatures = ['multi.extraVoices', 'sweep.loop', 'sweep.pingpong',
    'presets.custom', 'sharing.advanced'];
try {
    require_once $_SERVER['DOCUMENT_ROOT'] . '/members/config.php';
    if (!chordlink_db_available()) {
        throw new RuntimeException('Membership storage unavailable');
    }
    refresh_user_from_db();
    $pro = is_pro_user();
} catch (Throwable $error) {
    // No credentials or database exception details are sent to the browser.
    fg_reply(503, ['error' => 'membership_unavailable']);
}

if ($method === 'GET') {
    fg_reply(200, ['features' => $pro ? $proFeatures : [], 'maxVoices' => $pro ? 8 : 2]);
}
if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 4096) {
    fg_reply(413, ['error' => 'request_too_large']);
}
$payload = json_decode(file_get_contents('php://input'), true);
$feature = is_array($payload) ? ($payload['feature'] ?? null) : null;
if (!is_string($feature) || !in_array($feature, $proFeatures, true)) {
    fg_reply(400, ['error' => 'unknown_feature']);
}
if (!$pro) {
    fg_reply(403, ['error' => 'pro_required', 'upgradeUrl' => '/members/upgrade.php']);
}
fg_reply(200, ['authorized' => true, 'feature' => $feature]);
