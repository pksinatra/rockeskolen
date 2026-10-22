<?php

declare(strict_types=1);

namespace Drupal\rockeskolen_membership;

use PDO;
use Drupal\user\UserInterface;

/**
 * Mirrors authoritative Drupal account access to the membership database.
 */
final class AccessSynchronizer {

  /**
   * Returns the membership access role represented by Drupal roles.
   */
  public static function membershipRole(UserInterface $account): string {
    if ($account->hasRole('administrator')) {
      return 'admin';
    }
    if ($account->hasRole('vip_member')) {
      return 'vip';
    }
    return 'free';
  }

  /**
   * Updates the linked membership record from the Drupal account.
   */
  public static function applyToMembership(PDO $pdo, int $membershipUserId, UserInterface $account): bool {
    $role = self::membershipRole($account);
    // ChordLink Pro is a product entitlement, not a Drupal site role. Preserve
    // it for authenticated non-VIP users while an eligible plan is active.
    if ($role === 'free' && self::hasActiveProSubscription($pdo, $membershipUserId)) {
      $role = 'pro';
    }
    $active = $account->isActive() ? 1 : 0;
    $statement = $pdo->prepare(
      'UPDATE chordlink_users
          SET role = ?, is_active = ?
        WHERE id = ? AND (role <> ? OR is_active <> ?)'
    );
    $statement->execute([$role, $active, $membershipUserId, $role, $active]);
    return $statement->rowCount() === 1;
  }

  /**
   * Checks for a current ChordLink Pro subscription.
   */
  private static function hasActiveProSubscription(PDO $pdo, int $membershipUserId): bool {
    $statement = $pdo->prepare(
      "SELECT 1 FROM chordlink_subscriptions
        WHERE user_id = ?
          AND plan IN ('pro_monthly', 'pro_yearly')
          AND status IN ('active', 'trialing')
          AND (current_period_end IS NULL OR current_period_end >= NOW())
        LIMIT 1"
    );
    $statement->execute([$membershipUserId]);
    return (bool) $statement->fetchColumn();
  }

  /**
   * Preserves a legacy VIP role once, before Drupal becomes authoritative.
   *
   * Legacy admin never grants Drupal administrator privileges automatically.
   */
  public static function importLegacyVip(UserInterface $account, string $membershipRole): bool {
    if ($membershipRole !== 'vip' || $account->hasRole('vip_member')) {
      return FALSE;
    }
    $account->addRole('vip_member');
    $account->save();
    return TRUE;
  }

}
