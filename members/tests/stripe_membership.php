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

if ($failures) {
    fwrite(STDERR, implode("\n", $failures) . "\n");
    exit(1);
}

echo "Stripe membership tests passed\n";
