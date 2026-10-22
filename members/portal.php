<?php
declare(strict_types=1);

require __DIR__ . '/config.php';
require_login();
require_database();
refresh_user_from_db();

$user = current_user();
// ?return= continues on rockeskolen.com after the portal login; otherwise
// ?destination= is a page in the portal.
$returnPath = rs_safe_return_path($_GET['return'] ?? null);
if ($returnPath !== null) {
    $destination = 'https://rockeskolen.com' . $returnPath;
} else {
    $destination = $_GET['destination'] ?? '/';
    if (!is_string($destination) || $destination === '' || $destination[0] !== '/' || str_starts_with($destination, '//')) {
        $destination = '/';
    }
}

$token = bin2hex(random_bytes(32));
$tokenHash = hash('sha256', $token);
$browserBinding = $_COOKIE['rs_sso_browser'] ?? '';
if (!is_string($browserBinding) || !preg_match('/^[a-f0-9]{64}$/', $browserBinding)) {
    $browserBinding = bin2hex(random_bytes(32));
    setcookie('rs_sso_browser', $browserBinding, [
        'expires' => time() + 2592000,
        'path' => '/',
        'domain' => '.rockeskolen.com',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}
$ipHash = hash('sha256', $browserBinding);

$pdo->prepare('DELETE FROM chordlink_sso_tokens WHERE expires_at < DATE_SUB(NOW(), INTERVAL 1 DAY)')->execute();
$stmt = $pdo->prepare(
    'INSERT INTO chordlink_sso_tokens
        (token_hash, user_id, destination, ip_hash, expires_at)
     VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))'
);
$stmt->execute([$tokenHash, (int)$user['id'], $destination, $ipHash]);

$url = 'https://portal.rockeskolen.com/members/sso?token=' . rawurlencode($token);
header('Location: ' . $url, true, 303);
exit;
