<?php
declare(strict_types=1);

require $_SERVER['DOCUMENT_ROOT'] . '/members/config.php';

// Bare en innlogget medlem kan si opp, og bare sitt eget abonnement.
// Bruker-ID hentes fra sesjonen, aldri fra forespørselen.
require_login();

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    exit('Method not allowed');
}

require_database();
require_once __DIR__ . '/stripe_membership.php';
require_once __DIR__ . '/../vendor/stripe/init.php';

\Stripe\Stripe::setCABundlePath(__DIR__ . '/../_certs/cacert.pem');
\Stripe\Stripe::setApiKey(CHORDLINK_STRIPE_SECRET_KEY);

$userId = (int)(current_user()['id'] ?? 0);
$subscriptionId = rs_find_cancelable_subscription($pdo, $userId);
if ($subscriptionId === null) {
    http_response_code(404);
    exit('Fant ikke noe aktivt abonnement å si opp.');
}

try {
    $subscription = \Stripe\Subscription::update($subscriptionId, [
        'cancel_at_period_end' => true,
    ]);
}
catch (Throwable $exception) {
    error_log('Stripe cancellation error for membership user ' . $userId . ': ' . $exception->getMessage());
    http_response_code(502);
    exit('Kunne ikke si opp abonnementet nå. Prøv igjen om litt.');
}

// Oppsigelsen er registrert hos Stripe; webhooken synkroniserer også dersom dette feiler.
try {
    rs_store_stripe_subscription($pdo, $subscription);
}
catch (Throwable $exception) {
    error_log('Non-fatal local sync error after cancellation for membership user ' . $userId . ': ' . $exception->getMessage());
}

echo 'Abonnementet avsluttes ved periodens slutt.';
