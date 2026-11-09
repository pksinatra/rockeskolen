<?php

declare(strict_types=1);

require dirname(__DIR__, 2) . '/portal/modules/custom/rockeskolen_membership/src/FeidePlaceholderEmail.php';

use Drupal\rockeskolen_membership\FeidePlaceholderEmail;

$email = FeidePlaceholderEmail::forSubject('76a7a061-3c55-430d-8ee0-6f82ec42501f');
if (!preg_match('/^[0-9a-f]{32}@feide\.rockeskolen\.com$/', $email)
    || $email !== FeidePlaceholderEmail::forSubject(' 76a7a061-3c55-430d-8ee0-6f82ec42501f ')
    || $email === FeidePlaceholderEmail::forSubject('another-subject')
    || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fwrite(STDERR, 'Feide placeholder address is not stable, unique and valid' . "\n");
    exit(1);
}
if (!FeidePlaceholderEmail::isPlaceholder(strtoupper($email))
    || FeidePlaceholderEmail::isPlaceholder('elev@skole.no')
    || FeidePlaceholderEmail::isPlaceholder('x@notfeide.rockeskolen.com.evil.no')) {
    fwrite(STDERR, 'Feide placeholder detection failed' . "\n");
    exit(1);
}
try {
    FeidePlaceholderEmail::forSubject('  ');
    fwrite(STDERR, 'Empty Feide subject was accepted' . "\n");
    exit(1);
}
catch (InvalidArgumentException) {
}

echo "Feide placeholder email tests passed\n";
