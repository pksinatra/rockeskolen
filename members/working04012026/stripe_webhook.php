<?php
require __DIR__ . '/config.php';
require_once __DIR__ . '/../../vendor/stripe/init.php';

\Stripe\Stripe::setApiKey(getenv('CHORDLINK_STRIPE_SECRET_KEY') ?: '');
\Stripe\Stripe::setCABundlePath(__DIR__ . '/../../_certs/cacert.pem');

$endpointSecret = defined('CHORDLINK_STRIPE_WEBHOOK_SECRET')
  ? CHORDLINK_STRIPE_WEBHOOK_SECRET
  : '';

$payload = @file_get_contents("php://input");
$sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

try {
  $event = \Stripe\Webhook::constructEvent($payload, $sigHeader, $endpointSecret);
} catch (Exception $e) {
  http_response_code(400);
  exit("Webhook error");
}

if ($event->type === 'checkout.session.completed') {
  $session = $event->data->object;

  $userId = (int)($session->metadata->user_id ?? 0);
  $mode   = (string)($session->mode ?? '');

  if ($userId > 0) {
    if ($mode === 'subscription') {
      $upd = $pdo->prepare("UPDATE " . USER_TABLE . " SET role='pro' WHERE id=?");
      $upd->execute([$userId]);
    }
    if ($mode === 'payment') {
      // TODO: her kan vi senere gi “entitlement” for guitar_chord_finder
      // eller oppgradere til pro hvis det er kjøpsmodellen din.
    }
  }
}

http_response_code(200);
echo "ok";
