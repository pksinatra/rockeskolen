<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require __DIR__ . '/config.php';
require_login();

require_once __DIR__ . '/../../vendor/stripe/init.php';

\Stripe\Stripe::setApiKey(CHORDLINK_STRIPE_SECRET_KEY);

\Stripe\Stripe::setCABundlePath(__DIR__ . '/../../_certs/cacert.pem');

// TODO: legg inn dine ekte Stripe Price IDs (price_...)
$PRICE = [
  'pro_monthly' => 'price_1SlsoxPzkZC2sd9qiml5Alim',
//   'pro_yearly'  => 'price_PRO_YEARLY_NOK',
//   'guitar_chord_finder' => 'price_GUITAR_CHORD_FINDER_NOK',
];

$type = $_POST['type'] ?? $_GET['type'] ?? '';
if (!isset($PRICE[$type])) { http_response_code(400); exit('Bad type'); }

$mode = ($type === 'guitar_chord_finder') ? 'payment' : 'subscription';

$u = current_user();
$userId = (int)$u['id'];

$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host   = $_SERVER['HTTP_HOST'] ?? '';
$base   = $scheme . '://' . $host;

// Merk: siden chordlink ligger under /chordlink, må URL-ene peke dit
$successUrl = $base . "/members/stripe_complete.php?session_id={CHECKOUT_SESSION_ID}";
$cancelUrl  = $base . "/members/upgrade.php?cancel=1";

$params = [
  'mode' => $mode,
  'line_items' => [[ 'price' => $PRICE[$type], 'quantity' => 1 ]],
  'success_url' => $successUrl,
  'cancel_url'  => $cancelUrl,
  'client_reference_id' => (string)$userId,
  'metadata' => [
    'user_id' => (string)$userId,
    'type'    => $type
  ],
];

try {
  $session = \Stripe\Checkout\Session::create($params);
  header("Location: " . $session->url, true, 303);
  exit;
} catch (Exception $e) {
  http_response_code(500);
  echo "<pre>Stripe error:\n" . htmlspecialchars($e->getMessage()) . "</pre>";
  exit;
}

