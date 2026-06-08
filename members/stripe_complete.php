<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require __DIR__ . '/config.php';
$sessionId = $_GET['session_id'] ?? '';
if (!$sessionId) {
    header("Location: /members/upgrade.php");
    exit;
}
$userId = (int)($session->metadata->user_id ?? 0);
$email  = $session->metadata->email ?? null;

if ($userId > 0) {
    $stmt = $pdo->prepare("SELECT id, email, role FROM " . USER_TABLE . " WHERE id=?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
} elseif ($email) {
    $stmt = $pdo->prepare("SELECT id, email, role FROM " . USER_TABLE . " WHERE email=?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
}

if (!empty($user)) {
    set_current_user($user);
}

require_once __DIR__ . '/../vendor/stripe/init.php';
\Stripe\Stripe::setApiKey(CHORDLINK_STRIPE_SECRET_KEY);
\Stripe\Stripe::setCABundlePath(__DIR__ . '/../_certs/cacert.pem');

try {
$session = \Stripe\Checkout\Session::retrieve($sessionId);

$userId = (int)($session->metadata->user_id ?? 0);
$email  = $session->metadata->email ?? null;
    // 🔥 BRUK DIN EMAIL – ikke Stripe sin
    $email = $session->metadata->email ?? null;

} catch (Exception $e) {
    echo "<pre>Stripe COMPLETE error:\n";
    echo htmlspecialchars($e->getMessage());
    echo "</pre>";
    exit;
}
?>
<!doctype html>
<html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/members/members.css?v=1">
<title>Betaling mottatt | Rockeskolen</title>
</head><body>
<div class="wrap">
  <div class="card">
    <div class="h1">VIP aktivert 🎉</div>
    <div class="small">Du har nå full tilgang til alle verktøyene.</div>
    <div class="row" style="margin-top:12px;">
      <a class="btn primary" href="/members/account.php">Gå til min side</a>
    </div>
  </div>
</div>
</body></html>
