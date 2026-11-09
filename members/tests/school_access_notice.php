<?php

declare(strict_types=1);

require dirname(__DIR__, 2) . '/portal/modules/custom/rockeskolen_membership/src/SchoolEntitlementPolicy.php';
require dirname(__DIR__, 2) . '/portal/modules/custom/rockeskolen_membership/src/SchoolAccessNotice.php';

use Drupal\rockeskolen_membership\SchoolAccessNotice;

$cases = [
    [[], 'student'],
    [[['affiliation' => 'student']], 'student'],
    [[['affiliation' => 'faculty']], 'teacher'],
    [[['affiliation' => 'student'], ['affiliation' => 'staff']], 'teacher'],
    [[['affiliation' => 'member']], 'student'],
];
foreach ($cases as [$memberships, $expected]) {
    if (SchoolAccessNotice::audience($memberships) !== $expected) {
        fwrite(STDERR, 'Wrong audience for ' . json_encode($memberships) . "\n");
        exit(1);
    }
}
if (!str_contains(SchoolAccessNotice::html('student'), 'Spør læreren din om klassen eller skolen kan få tilgang.')
    || !str_contains(SchoolAccessNotice::html('teacher'), 'skoleledelsen eller kommunen')
    || !str_contains(SchoolAccessNotice::html('teacher'), 'https://rockeskolen.com/skoler/')) {
    fwrite(STDERR, 'School access notice text is wrong' . "\n");
    exit(1);
}

echo "School access notice tests passed\n";
