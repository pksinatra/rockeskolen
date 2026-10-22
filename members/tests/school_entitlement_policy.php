<?php

declare(strict_types=1);

require dirname(__DIR__, 2) . '/portal/modules/custom/rockeskolen_membership/src/SchoolEntitlementPolicy.php';

use Drupal\rockeskolen_membership\SchoolEntitlementPolicy;

$failures = [];
$assertSame = static function (mixed $expected, mixed $actual, string $label) use (&$failures): void {
    if ($expected !== $actual) {
        $failures[] = $label . ': expected ' . var_export($expected, true)
            . ', got ' . var_export($actual, true);
    }
};

$assertSame(TRUE, SchoolEntitlementPolicy::hasCapacity('student', 9, 10, 0, 10, FALSE), 'Small class seat 10');
$assertSame(FALSE, SchoolEntitlementPolicy::hasCapacity('student', 10, 10, 0, 10, FALSE), 'Small class is full');
$assertSame(TRUE, SchoolEntitlementPolicy::hasCapacity('student', 24, 24, 0, 10, TRUE), 'Existing student keeps seat');
$assertSame(TRUE, SchoolEntitlementPolicy::hasCapacity('student', 23, 24, 0, 10, FALSE), 'Class seat 24');
$assertSame(FALSE, SchoolEntitlementPolicy::hasCapacity('student', 24, 24, 0, 10, FALSE), 'Class is full');
$assertSame(TRUE, SchoolEntitlementPolicy::hasCapacity('student', 499, 500, 0, NULL, FALSE), 'School seat 500');
$assertSame(FALSE, SchoolEntitlementPolicy::hasCapacity('student', 500, 500, 0, NULL, FALSE), 'School 500 is full');
$assertSame(TRUE, SchoolEntitlementPolicy::hasCapacity('teacher', 500, 500, 20, NULL, FALSE), 'Teacher excluded from student limit');
$assertSame(FALSE, SchoolEntitlementPolicy::hasCapacity('teacher', 20, 24, 10, 10, FALSE), 'Teacher limit enforced');
$assertSame('student', SchoolEntitlementPolicy::normalizeAffiliation('elev'), 'Norwegian student affiliation');
$assertSame('teacher', SchoolEntitlementPolicy::normalizeAffiliation('faculty'), 'Feide faculty affiliation');
$assertSame(NULL, SchoolEntitlementPolicy::normalizeAffiliation('member'), 'Ambiguous affiliation fails closed');

if ($failures) {
    fwrite(STDERR, implode("\n", $failures) . "\n");
    exit(1);
}

echo "School entitlement policy tests passed\n";
