<?php

declare(strict_types=1);

namespace Drupal\rs_kurs;

use Drupal\Core\Session\AccountInterface;

/**
 * Lesson 1 is open to everyone; the rest require VIP.
 */
final class CourseAccess {

  public static function canViewLesson(AccountInterface $account, int $index): bool {
    return $index === 0 || self::isVip($account);
  }

  public static function isVip(AccountInterface $account): bool {
    // Feide school entitlements and ChordLink Pro both arrive as vip_member.
    return $account->hasRole('vip_member')
      || $account->hasRole('administrator')
      || $account->hasRole('content_editor')
      || $account->hasPermission('bypass node access');
  }

}
