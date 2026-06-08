<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/members/config.php';
require_once __DIR__ . '/../vendor/stripe/init.php';

\Stripe\Stripe::setCABundlePath(__DIR__ . '/../_certs/cacert.pem');
\Stripe\Stripe::setApiKey(CHORDLINK_STRIPE_SECRET_KEY);

$endpointSecret = CHORDLINK_STRIPE_WEBHOOK_SECRET;

$payload = @file_get_contents("php://input");
$sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

try {
  $event = \Stripe\Webhook::constructEvent($payload, $sigHeader, $endpointSecret);
} catch (Exception $e) {
  http_response_code(400);
  exit("Webhook error");
}

switch ($event->type) {

case 'checkout.session.completed':

$session = $event->data->object;

// 🔑 Hent begge
$userId = (int)($session->metadata->user_id ?? 0);
$email  = $session->metadata->email ?? null;
file_put_contents(__DIR__.'/debug.txt', print_r($session->metadata, true));


if (!$email) {
    exit("No email in metadata");
}


$plan   = $session->metadata->type ?? 'unknown';

// 🧠 1. Hvis vi har user_id → bruk den
if ($userId > 0) {

    $stmt = $pdo->prepare("SELECT id FROM " . USER_TABLE . " WHERE id=?");
    $stmt->execute([$userId]);
    $existing = $stmt->fetch();

    if (!$existing) {
        // fallback hvis noe er feil
        $userId = 0;
    }
}

// 🧠 2. Hvis user_id ikke funker → bruk email
if ($userId === 0 && $email) {

    $stmt = $pdo->prepare("SELECT id FROM " . USER_TABLE . " WHERE email=?");
    $stmt->execute([$email]);
    $existing = $stmt->fetch();

    if ($existing) {
        $userId = $existing['id'];
    } else {
        // 🔥 Opprett ny bruker
        $hash = password_hash(bin2hex(random_bytes(8)), PASSWORD_DEFAULT);

        $stmt = $pdo->prepare("
            INSERT INTO " . USER_TABLE . " (email, password_hash, is_active, role)
            VALUES (?, ?, 1, 'vip')
        ");
        $stmt->execute([$email, $hash]);

        $userId = $pdo->lastInsertId();

$token = bin2hex(random_bytes(32));
$hash  = hash('sha256', $token);

$pdo->prepare("
  UPDATE " . USER_TABLE . "
  SET password_reset_token = ?, password_reset_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR)
  WHERE id = ?
")->execute([$hash, $userId]);

$link = "https://www.rockeskolen.com/members/reset.php?token=$token";

$headers = [];
$headers[] = "From: Rockeskolen <post@rockeskolen.com>";
$headers[] = "Reply-To: post@rockeskolen.com";
$headers[] = "Content-Type: text/plain; charset=UTF-8";

mail(
  $email,
  "Velkommen til Rockeskolen – lag passord",
  "Hei!\n\nVIP-medlemskapet ditt er nå aktivert.\n\nLag passord her:\n$link\n\nLenken er gyldig i 1 time.\n\nDu er allerede logget inn nå, men passordet gjør at du kan logge inn senere.\n\n– Rockeskolen",
  implode("\r\n", $headers)
);

    

    }
}



   // 👉 RESTEN AV DIN KODE (uendret)

    if (empty($session->subscription)) {
        break;
    }

    $subscription = \Stripe\Subscription::retrieve($session->subscription);

    $periodStart = date('Y-m-d H:i:s', $subscription->current_period_start);
    $periodEnd   = date('Y-m-d H:i:s', $subscription->current_period_end);

    $stmt = $pdo->prepare("
      INSERT INTO chordlink_subscriptions
        (user_id, provider, provider_customer_id, provider_subscription_id,
         provider_price_id, plan, status,
         current_period_start, current_period_end, cancel_at_period_end)
      VALUES (?, 'stripe', ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        current_period_end = VALUES(current_period_end),
        cancel_at_period_end = VALUES(cancel_at_period_end),
        updated_at = NOW()
    ");

    $stmt->execute([
        $userId,
        $subscription->customer,
        $subscription->id,
        $subscription->items->data[0]->price->id,
        $plan,
        $subscription->status,
        $periodStart,
        $periodEnd,
        $subscription->cancel_at_period_end ? 1 : 0
    ]);

    // 🔥 SET ROLE
    $targetRole = 'pro';
    if (strpos($plan, 'vip_') === 0) {
        $targetRole = 'vip';
    }

    $pdo->prepare(
        "UPDATE " . USER_TABLE . " SET role=? WHERE id=?"
    )->execute([$targetRole, $userId]);

    // 🔥 SEND MAIL
    $stmt = $pdo->prepare("SELECT email FROM " . USER_TABLE . " WHERE id=? LIMIT 1");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        $planName = ($plan === 'vip_yearly') ? "VIP Årlig" : "VIP Månedlig";

        send_membership_email(
            $user['email'],
            $planName,
            date('Y-m-d', $subscription->current_period_end)
        );
    }

    break;

case 'customer.subscription.updated':
    // behold din kode
    break;

case 'customer.subscription.deleted':
    // behold din kode
    break;
}

http_response_code(200);
echo "ok";