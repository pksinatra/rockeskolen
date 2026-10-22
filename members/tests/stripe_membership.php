<?php
declare(strict_types=1);

if (!defined('USER_TABLE')) {
    define('USER_TABLE', 'chordlink_users');
}
require dirname(__DIR__) . '/stripe_membership.php';

$failures = [];
$assertSame = static function (mixed $expected, mixed $actual, string $label) use (&$failures): void {
    if ($expected !== $actual) {
        $failures[] = $label . ': expected ' . var_export($expected, true)
            . ', got ' . var_export($actual, true);
    }
};

$assertSame('active', rs_local_subscription_status('active'), 'Active status');
$assertSame('expired', rs_local_subscription_status('incomplete_expired'), 'Expired mapping');
$assertSame('paused', rs_local_subscription_status('paused'), 'Paused status');
$assertSame('expired', rs_local_subscription_status('future_status'), 'Unknown status fails closed');
$assertSame('2026-10-11 10:01:35', rs_stripe_datetime(1791712895), 'Stripe timestamp');
$assertSame(null, rs_stripe_datetime(0), 'Missing timestamp');

$subscription = (object)['current_period_start' => 100, 'current_period_end' => 200];
$item = (object)['current_period_start' => 300, 'current_period_end' => 400];
$assertSame(
    ['1970-01-01 00:01:40', '1970-01-01 00:03:20'],
    rs_stripe_subscription_period($subscription, $item),
    'Subscription period preferred over item period'
);

$pdo = new PDO('sqlite::memory:', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$pdo->exec(
    "CREATE TABLE chordlink_subscriptions (
       user_id INTEGER, provider TEXT, provider_subscription_id TEXT,
       status TEXT, cancel_at_period_end INTEGER, current_period_end TEXT
     )"
);
$pdo->exec(
    "INSERT INTO chordlink_subscriptions VALUES
       (1, 'stripe', 'sub_own', 'active', 0, '2027-01-01 00:00:00'),
       (2, 'stripe', 'sub_other', 'active', 0, '2027-01-01 00:00:00'),
       (3, 'stripe', 'sub_already', 'active', 1, '2027-01-01 00:00:00'),
       (4, 'stripe', 'sub_old', 'canceled', 0, '2026-01-01 00:00:00'),
       (5, 'paypal', 'pp_sub', 'active', 0, '2027-01-01 00:00:00')"
);
$assertSame('sub_own', rs_find_cancelable_subscription($pdo, 1), 'Cancels own subscription');
$assertSame(null, rs_find_cancelable_subscription($pdo, 0), 'No user cancels nothing');
$assertSame(null, rs_find_cancelable_subscription($pdo, 3), 'Already cancelled');
$assertSame(null, rs_find_cancelable_subscription($pdo, 4), 'Inactive subscription');
$assertSame(null, rs_find_cancelable_subscription($pdo, 5), 'Only Stripe subscriptions');

if ($failures) {
    fwrite(STDERR, implode("\n", $failures) . "\n");
    exit(1);
}

echo "Stripe membership tests passed\n";
