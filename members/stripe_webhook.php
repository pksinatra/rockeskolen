<?php
declare(strict_types=1);

require_once $_SERVER['DOCUMENT_ROOT'] . '/members/config.php';
require_once __DIR__ . '/stripe_membership.php';
require_once __DIR__ . '/../vendor/stripe/init.php';

require_database();
\Stripe\Stripe::setCABundlePath(__DIR__ . '/../_certs/cacert.pem');
\Stripe\Stripe::setApiKey(CHORDLINK_STRIPE_SECRET_KEY);

$payload = file_get_contents('php://input') ?: '';
$signature = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
try {
    $event = \Stripe\Webhook::constructEvent($payload, $signature, CHORDLINK_STRIPE_WEBHOOK_SECRET);
}
catch (Throwable $exception) {
    error_log('Stripe webhook signature error: ' . $exception->getMessage());
    http_response_code(400);
    exit('Webhook error');
}

try {
    switch ($event->type) {
        case 'checkout.session.completed':
            $session = $event->data->object;
            if (!empty($session->subscription)) {
                $subscription = \Stripe\Subscription::retrieve((string)$session->subscription);
                rs_store_stripe_subscription($pdo, $subscription, [
                    'user_id' => (int)($session->metadata->user_id ?? 0),
                    'email' => (string)($session->metadata->email ?? ''),
                    'type' => (string)($session->metadata->type ?? ''),
                ]);
            }
            break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
            rs_store_stripe_subscription($pdo, $event->data->object);
            break;

        case 'invoice.paid':
        case 'invoice.payment_failed':
            $invoice = $event->data->object;
            $subscriptionId = (string)(
                $invoice->subscription
                ?? $invoice->parent->subscription_details->subscription
                ?? ''
            );
            if ($subscriptionId !== '') {
                rs_store_stripe_subscription(
                    $pdo,
                    \Stripe\Subscription::retrieve($subscriptionId)
                );
            }
            break;
    }
}
catch (Throwable $exception) {
    error_log('Stripe webhook processing error for ' . $event->type . ': ' . $exception->getMessage());
    http_response_code(500);
    exit('Processing error');
}

http_response_code(200);
echo 'ok';
