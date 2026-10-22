<?php
declare(strict_types=1);

/**
 * Returns a rockeskolen.com path that a login may continue to, or null.
 * Mirrors ReturnDestination::sitePath() in the Drupal membership module.
 */
function rs_safe_return_path(mixed $value): ?string {
    if (!is_string($value) || $value === '' || $value[0] !== '/' || str_starts_with($value, '//')
        || strlen($value) > 400 || preg_match('/[\x00-\x1F\x7F\\\\]/', $value)) {
        return null;
    }
    $blocked = ['/members/login.php', '/members/logout.php', '/members/portal.php', '/members/portal-return.php'];
    if (in_array((string) parse_url($value, PHP_URL_PATH), $blocked, true)) {
        return null;
    }
    return $value;
}
