<?php

declare(strict_types=1);

namespace Drupal\rockeskolen_membership;

/**
 * Validates where a login may continue after crossing between the two hosts.
 *
 * SSO tokens store either a portal path ("/node/1"), a rockeskolen.com URL
 * that the portal returns to after login, or a "rs:" path that only
 * rockeskolen.com may consume (portal-to-membership bridge).
 */
final class ReturnDestination {

  public const SITE = 'https://rockeskolen.com';
  public const MEMBER_PREFIX = 'rs:';

  /**
   * Member pages that must never be a post-login target (would loop).
   */
  private const BLOCKED_SITE_PATHS = [
    '/members/login.php',
    '/members/logout.php',
    '/members/portal.php',
    '/members/portal-return.php',
  ];

  /**
   * Returns a safe rockeskolen.com path, or NULL.
   */
  public static function sitePath(mixed $value): ?string {
    if (
      !is_string($value)
      || $value === ''
      || $value[0] !== '/'
      || str_starts_with($value, '//')
      || strlen($value) > 400
      || preg_match('/[\x00-\x1F\x7F\\\\]/', $value)
    ) {
      return NULL;
    }
    $path = (string) parse_url($value, PHP_URL_PATH);
    if (in_array($path, self::BLOCKED_SITE_PATHS, TRUE)) {
      return NULL;
    }
    return $value;
  }

  /**
   * Returns the rockeskolen.com URL for a stored destination, or NULL.
   */
  public static function siteUrl(string $destination): ?string {
    if (!str_starts_with($destination, self::SITE . '/')) {
      return NULL;
    }
    $path = self::sitePath(substr($destination, strlen(self::SITE)));
    return $path === NULL ? NULL : self::SITE . $path;
  }

  /**
   * Returns a safe internal portal path, falling back to the front page.
   */
  public static function portalPath(string $destination): string {
    if ($destination === '' || $destination[0] !== '/' || str_starts_with($destination, '//')) {
      return '/';
    }
    return $destination;
  }

  /**
   * Whether a stored destination belongs to the rockeskolen.com consumer.
   */
  public static function isMemberBound(string $destination): bool {
    return str_starts_with($destination, self::MEMBER_PREFIX);
  }

}
