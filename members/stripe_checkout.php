<?php
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);

require __DIR__ . '/config.php';
require_once __DIR__ . '/../vendor/stripe/init.php';
\Stripe\Stripe::setCABundlePath(__DIR__ . '/../_certs/cacert.pem');

\Stripe\Stripe::setApiKey(CHORDLINK_STRIPE_SECRET_KEY);


$PRICE = [
  'vip_monthly' => 'price_1UDt9UQ77UW38jdQaDYKvQG6',
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

    $existing = $pdo->prepare('SELECT id FROM ' . USER_TABLE . ' WHERE email = ? AND is_active = 1 LIMIT 1');
    $existing->execute([strtolower($email)]);
    if ($existing->fetchColumn()) {
        header('Location: /members/login.php?redirect=' . rawurlencode('/members/upgrade.php'));
        exit;
    }
}

$mode = 'subscription';

$base = 'https://rockeskolen.com';

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
  'subscription_data' => [
    'metadata' => [
      'user_id' => (string)$userId,
      'type'    => $type,
      'email'   => $email,
    ],
  ],
];


try {
  $session = \Stripe\Checkout\Session::create($params);
  header("Location: " . $session->url, true, 303);
  exit;
} catch (Exception $e) {
  error_log('Stripe checkout creation error: ' . $e->getMessage());
  http_response_code(500);
  echo 'Kunne ikke starte betalingen. Prøv igjen om litt.';
  exit;
}
