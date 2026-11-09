<?php

declare(strict_types=1);

namespace Drupal\rockeskolen_membership;

/**
 * Internal account addresses for Feide users without an e-mail address.
 *
 * Many pupils have no e-mail address in Feide, but Drupal requires one to
 * create an account. These addresses are derived from the stable Feide
 * subject, live on a Rockeskolen subdomain without mail service and are never
 * shown to the user.
 */
final class FeidePlaceholderEmail {

  public const DOMAIN = 'feide.rockeskolen.com';

  /**
   * Returns the internal address for a Feide subject.
   */
  public static function forSubject(string $subject): string {
    $subject = trim($subject);
    if ($subject === '') {
      throw new \InvalidArgumentException('A Feide subject is required.');
    }
    return substr(hash('sha256', $subject), 0, 32) . '@' . self::DOMAIN;
  }

  /**
   * Returns whether an address is an internal Feide placeholder.
   */
  public static function isPlaceholder(string $email): bool {
    return str_ends_with(strtolower(trim($email)), '@' . self::DOMAIN);
  }

}
