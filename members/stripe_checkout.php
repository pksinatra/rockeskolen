<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require __DIR__ . '/config.php';
require_once __DIR__ . '/../vendor/stripe/init.php';
\Stripe\Stripe::setCABundlePath(__DIR__ . '/../_certs/cacert.pem');

\Stripe\Stripe::setApiKey(CHORDLINK_STRIPE_SECRET_KEY);


$PRICE = [
  'vip_monthly' => 'price_1T3hFSQ77UW38jdQdJ9SiFSQ',
  'vip_yearly'  => 'price_1T3hG4Q77UW38jdQ8oHncOeq',
];

$type = $_POST['type'] ?? $_GET['type'] ?? ($_SESSION['pending_checkout']['type'] ?? '');
if (!isset($PRICE[$type])) {
    http_response_code(400);
    exit('Bad type');
}

$u = current_user();
$pending = $_SESSION['pending_checkout'] ?? [];

$name = '';
$email = '';
$userId = 0;

if ($u) {
    $userId = (int)$u['id'];
    $email = $u['email'] ?? '';
    $name  = $pending['name'] ?? '';
} else {
    $name  = trim($pending['name'] ?? '');
    $email = trim($pending['email'] ?? '');

    if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        header("Location: /members/upgrade.php");
        exit;
    }
}

$mode = 'subscription';

$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host   = $_SERVER['HTTP_HOST'] ?? '';
$base   = $scheme . '://' . $host;

$successUrl = $base . "/members/stripe_complete.php?session_id={CHECKOUT_SESSION_ID}";
$cancelUrl  = $base . "/members/upgrade.php?cancel=1";


$email = strtolower(trim($email));
$_SESSION['pending_checkout']['email'] = $email;


$params = [
  'mode' => 'subscription',
'line_items' => [[
    'price' => $PRICE[$type],
    'quantity' => 1
]],
'success_url' => $successUrl,
'cancel_url'  => $cancelUrl,
  'customer_email' => $email,
  'client_reference_id' => (string)$userId,
  'metadata' => [
    'user_id' => (string)$userId,
    'type'    => $type,
    'name'    => $name,
    'email'   => $email
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