<?php
require $_SERVER['DOCUMENT_ROOT'] . '/members/config.php';
require_once __DIR__ . '/../vendor/stripe/init.php';

\Stripe\Stripe::setApiKey(CHORDLINK_STRIPE_SECRET_KEY);

// hent user_id
$userId = (int)($_POST['user_id'] ?? 0);
if (!$userId) exit("Missing user");

// finn subscription
$stmt = $pdo->prepare("
  SELECT provider_subscription_id 
  FROM chordlink_subscriptions 
  WHERE user_id=? AND status='active' 
  LIMIT 1
");
$stmt->execute([$userId]);
$sub = $stmt->fetch();

if (!$sub) exit("No active subscription");

// kanseller hos Stripe
\Stripe\Subscription::update($sub['provider_subscription_id'], [
  'cancel_at_period_end' => true
]);

echo "Abonnement avsluttes ved periodens slutt.";