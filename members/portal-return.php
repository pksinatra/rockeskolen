<?php
declare(strict_types=1);

require __DIR__ . '/config.php';
require_database();

$token = (string)($_GET['token'] ?? '');
$binding = (string)($_COOKIE['rs_sso_browser'] ?? '');
if (!preg_match('/^[a-f0-9]{64}$/', $token) || !preg_match('/^[a-f0-9]{64}$/', $binding)) {
    header('Location: /members/login.php?redirect=%2Fmembers%2Faccount.php', true, 303);
    exit;
}

try {
    $pdo->beginTransaction();
    $statement = $pdo->prepare(
        'SELECT t.destination, t.ip_hash, u.id, u.email, u.role
           FROM chordlink_sso_tokens t
           JOIN ' . USER_TABLE . ' u ON u.id = t.user_id
          WHERE t.token_hash = ?
            AND t.consumed_at IS NULL
            AND t.expires_at >= NOW()
            AND u.is_active = 1
          FOR UPDATE'
    );
    $statement->execute([hash('sha256', $token)]);
    $member = $statement->fetch(PDO::FETCH_ASSOC);
    if (!$member || !hash_equals((string)$member['ip_hash'], hash('sha256', $binding))) {
        $pdo->rollBack();
        throw new RuntimeException('Invalid portal return token.');
    }
    // Only portal-to-membership tokens ("rs:" path) are valid here; the plain
    // account path is accepted from bridge tokens issued before this change.
    $storedDestination = (string)$member['destination'];
    if (str_starts_with($storedDestination, 'rs:')) {
        $returnTo = rs_safe_return_path(substr($storedDestination, 3)) ?? '/members/account.php';
    } elseif ($storedDestination === '/members/account.php') {
        $returnTo = '/members/account.php';
    } else {
        $pdo->rollBack();
        throw new RuntimeException('Portal return token has a portal destination.');
    }

    $consume = $pdo->prepare(
        'UPDATE chordlink_sso_tokens SET consumed_at = NOW()
          WHERE token_hash = ? AND consumed_at IS NULL'
    );
    $consume->execute([hash('sha256', $token)]);
    if ($consume->rowCount() !== 1) {
        $pdo->rollBack();
        throw new RuntimeException('Portal return token was already consumed.');
    }
    $pdo->commit();

    set_current_user($member);
    session_regenerate_id(true);
    header('Location: ' . $returnTo, true, 303);
    exit;
}
catch (Throwable $exception) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Portal return failed: ' . $exception->getMessage());
    header('Location: /members/login.php?redirect=%2Fmembers%2Faccount.php', true, 303);
    exit;
}
