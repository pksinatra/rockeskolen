<?php
declare(strict_types=1);

require dirname(__DIR__) . '/return_path.php';
require dirname(__DIR__, 2) . '/portal/modules/custom/rockeskolen_membership/src/ReturnDestination.php';

use Drupal\rockeskolen_membership\ReturnDestination;

$failures = [];
$assertSame = static function (mixed $expected, mixed $actual, string $label) use (&$failures): void {
    if ($expected !== $actual) {
        $failures[] = $label . ': expected ' . var_export($expected, true)
            . ', got ' . var_export($actual, true);
    }
};

$cases = [
    '/tools/chords/piano/' => '/tools/chords/piano/',
    '/tools/scales/guitar/?lang=en' => '/tools/scales/guitar/?lang=en',
    '/members/upgrade.php' => '/members/upgrade.php',
    '/members/account.php' => '/members/account.php',
    '' => null,
    'tools/' => null,
    '//evil.example/' => null,
    'https://evil.example/' => null,
    "/tools/\r\nX: y" => null,
    '/\\evil.example' => null,
    '/members/login.php?redirect=/x' => null,
    '/members/logout.php' => null,
    '/members/portal.php?return=/x' => null,
    '/members/portal-return.php' => null,
    '/' . str_repeat('a', 400) => null,
];
foreach ($cases as $input => $expected) {
    $input = (string) $input;
    $assertSame($expected, rs_safe_return_path($input), 'Membership ' . json_encode($input));
    $assertSame($expected, ReturnDestination::sitePath($input), 'Drupal ' . json_encode($input));
}
$assertSame(null, rs_safe_return_path(['/tools/']), 'Array input');

$assertSame('https://rockeskolen.com/tools/tuners/', ReturnDestination::siteUrl('https://rockeskolen.com/tools/tuners/'), 'Site URL');
$assertSame(null, ReturnDestination::siteUrl('https://rockeskolen.com.evil.example/'), 'Look-alike host');
$assertSame(null, ReturnDestination::siteUrl('https://rockeskolen.com//evil.example/'), 'Protocol-relative path');
$assertSame(null, ReturnDestination::siteUrl('/node/1'), 'Portal path is not a site URL');
$assertSame('/node/1', ReturnDestination::portalPath('/node/1'), 'Portal path');
$assertSame('/', ReturnDestination::portalPath('https://evil.example/'), 'External portal path');
$assertSame(true, ReturnDestination::isMemberBound('rs:/tools/'), 'Member-bound token');
$assertSame(false, ReturnDestination::isMemberBound('/members/account.php'), 'Portal token');

if ($failures) {
    fwrite(STDERR, implode("\n", $failures) . "\n");
    exit(1);
}

echo "Return path tests passed\n";
