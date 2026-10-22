<?php
declare(strict_types=1);

require dirname(__DIR__) . '/subscriptions.php';

$failures = [];
$assertSame = static function (mixed $expected, mixed $actual, string $label) use (&$failures): void {
    if ($expected !== $actual) {
        $failures[] = "{$label}: expected " . var_export($expected, true) . ', got ' . var_export($actual, true);
    }
};

$assertSame('free', strongest_subscription_role([]), 'No subscription');
$assertSame('pro', strongest_subscription_role([
    ['plan' => 'pro_monthly', 'status' => 'active'],
]), 'Active Pro');
$assertSame('vip', strongest_subscription_role([
    ['plan' => 'pro_yearly', 'status' => 'active'],
    ['plan' => 'vip_monthly', 'status' => 'trialing'],
]), 'VIP outranks Pro');
$assertSame('free', strongest_subscription_role([
    ['plan' => 'vip_monthly', 'status' => 'past_due'],
    ['plan' => 'pro_monthly', 'status' => 'canceled'],
]), 'Inactive subscriptions grant no access');
$assertSame('pro', subscription_plan_role('pro_yearly'), 'Pro plan mapping');
$assertSame('vip', subscription_plan_role('vip_yearly'), 'VIP plan mapping');
$assertSame('free', subscription_plan_role('unknown'), 'Unknown plan is fail-closed');

if ($failures) {
    fwrite(STDERR, implode("\n", $failures) . "\n");
    exit(1);
}

echo "Access matrix tests passed\n";
