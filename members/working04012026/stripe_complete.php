<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require __DIR__ . '/config.php';
require_login();

require_once __DIR__ . '/../../vendor/stripe/init.php';
\Stripe\Stripe::setApiKey(CHORDLINK_STRIPE_SECRET_KEY);
\Stripe\Stripe::setCABundlePath(__DIR__ . '/../../_certs/cacert.pem');


$sessionId = $_GET['session_id'] ?? '';
if (!$sessionId) { header("Location: /members/upgrade.php"); exit; }

$u = current_user();
$userId = (int)$u['id'];

try {
  $session = \Stripe\Checkout\Session::retrieve($sessionId);

  // Sikkerhet: sjekk at dette faktisk er denne brukeren
  $metaUserId = $session->metadata->user_id ?? '';
  if ((string)$userId !== (string)$metaUserId) { http_response_code(403); exit('Forbidden'); }

  // For one-time product: kan gi entitlement her også (webhook er “fasit”)
  if (($session->mode ?? '') === 'payment' && ($session->payment_status ?? '') === 'paid') {
    $type = $session->metadata->type ?? '';
    if ($type === 'guitar_chord_finder') {
      // TODO: lag tabell + funksjon hvis du vil (jeg kan gi deg SQL)
      // Foreløpig kan du bare oppgradere til pro eller logge kjøp.
    }
  }

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
<title>Payment received | ChordLink</title>
</head><body>
<div class="wrap">
  <div class="card">
    <div class="h1">Thanks! 🎉</div>
    <div class="small">Payment received. Access is activated via Stripe webhook.</div>
    <div class="row" style="margin-top:12px;">
      <a class="btn primary" href="/members/account.php">Go to account</a>
    </div>
  </div>
</div>
</body></html>
