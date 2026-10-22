<?php

declare(strict_types=1);

require dirname(__DIR__, 2) . '/portal/modules/custom/rockeskolen_membership/src/SchoolEntitlementPolicy.php';
require dirname(__DIR__, 2) . '/portal/modules/custom/rockeskolen_membership/src/FeideGroupNormalizer.php';

use Drupal\rockeskolen_membership\FeideGroupNormalizer;

$groups = [[
    'id' => 'fc:org:testusers.feide.no:unit:NO876326126',
    'type' => 'fc:org',
    'displayName' => 'Bjerke grunnskole',
    'orgType' => ['primary_and_lower_secondary'],
    'membership' => ['affiliation' => ['member', 'student']],
], [
    'id' => 'fc:gogroup:eksempel.kommune.no:b:NO987654321:3a:2026-07-01:2027-06-30',
    'type' => 'fc:gogroup',
    'displayName' => '3A',
    'membership' => ['basic' => 'member', 'affiliation' => 'student'],
    'notBefore' => '2026-06-30T22:00:00Z',
    'notAfter' => '2027-06-30T22:00:00Z',
    'go_type' => 'b',
    'parent' => 'fc:gogroup:eksempel.kommune.no:unit:NO987654321',
], [
    'id' => 'fc:gogroup:eksempel.kommune.no:u:NO987654321:musikk',
    'type' => 'fc:gogroup',
    'go_type' => 'u',
    'parent' => 'fc:gogroup:eksempel.kommune.no:unit:NO987654321',
    'membership' => ['affiliation' => 'student'],
]];

$normalized = FeideGroupNormalizer::memberships($groups, strtotime('2026-08-29T12:00:00Z'));
if ($normalized !== [[
    'org_unit_id' => 'NO876326126',
    'group_id' => '',
    'affiliation' => 'student',
], [
    'org_unit_id' => 'NO987654321',
    'group_id' => 'fc:gogroup:eksempel.kommune.no:b:NO987654321:3a:2026-07-01:2027-06-30',
    'affiliation' => 'student',
]]) {
    fwrite(STDERR, 'Feide basis group normalization failed' . "\n");
    exit(1);
}

$expired = $groups;
$expired[1]['notAfter'] = '2026-07-01T00:00:00Z';
$expiredNormalized = FeideGroupNormalizer::memberships($expired, strtotime('2026-08-29T12:00:00Z'));
if (count($expiredNormalized) !== 1 || $expiredNormalized[0]['org_unit_id'] !== 'NO876326126') {
    fwrite(STDERR, 'Expired Feide group was not rejected' . "\n");
    exit(1);
}

echo "Feide group normalizer tests passed\n";
