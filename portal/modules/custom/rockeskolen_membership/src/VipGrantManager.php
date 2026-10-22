<?php

declare(strict_types=1);

namespace Drupal\rockeskolen_membership;

use Drupal\Core\Database\Connection;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\user\UserInterface;

/**
 * Reconciles source-aware VIP grants with the authoritative Drupal role.
 */
final class VipGrantManager {

  private static bool $saving = FALSE;

  public function __construct(
    private readonly Connection $database,
    private readonly EntityTypeManagerInterface $entityTypeManager,
  ) {}

  /**
   * Records a grant and reconciles VIP without removing manually assigned VIP.
   */
  public function setGrant(int $uid, string $source, string $sourceId, bool $active): bool {
    if (!preg_match('/^[a-z][a-z0-9_]{1,31}$/', $source) || $sourceId === '' || strlen($sourceId) > 128) {
      throw new \InvalidArgumentException('Invalid VIP grant identity.');
    }
    $account = $this->entityTypeManager->getStorage('user')->load($uid);
    if (!$account instanceof UserInterface || !$account->isActive()) {
      throw new \RuntimeException('VIP grant account is unavailable.');
    }

    $now = time();
    $this->database->merge('rockeskolen_vip_grant')
      ->keys(['source' => $source, 'source_id' => $sourceId])
      ->insertFields([
        'source' => $source,
        'source_id' => $sourceId,
        'uid' => $uid,
        'active' => $active ? 1 : 0,
        'created' => $now,
        'changed' => $now,
      ])
      ->updateFields(['uid' => $uid, 'active' => $active ? 1 : 0, 'changed' => $now])
      ->execute();

    return $this->reconcile($account);
  }

  /**
   * Deactivates every automated grant from one source for a user.
   */
  public function deactivateSourceForUser(int $uid, string $source): bool {
    if (!preg_match('/^[a-z][a-z0-9_]{1,31}$/', $source)) {
      throw new \InvalidArgumentException('Invalid VIP grant source.');
    }
    $account = $this->entityTypeManager->getStorage('user')->load($uid);
    if (!$account instanceof UserInterface || !$account->isActive()) {
      throw new \RuntimeException('VIP grant account is unavailable.');
    }
    $this->database->update('rockeskolen_vip_grant')
      ->fields(['active' => 0, 'changed' => time()])
      ->condition('uid', $uid)
      ->condition('source', $source)
      ->condition('active', 1)
      ->execute();
    return $this->reconcile($account);
  }

  /**
   * Returns TRUE while this service is saving a role change.
   */
  public static function isSaving(): bool {
    return self::$saving;
  }

  /**
   * Applies active grants, preserving VIP roles that were assigned manually.
   */
  private function reconcile(UserInterface $account): bool {
    $uid = (int) $account->id();
    $activeGrants = (int) $this->database->select('rockeskolen_vip_grant', 'g')
      ->condition('uid', $uid)
      ->condition('active', 1)
      ->countQuery()
      ->execute()
      ->fetchField();
    $managed = (bool) $this->database->select('rockeskolen_vip_managed', 'm')
      ->fields('m', ['uid'])
      ->condition('uid', $uid)
      ->execute()
      ->fetchField();

    if ($activeGrants > 0 && !$account->hasRole('vip_member')) {
      $this->database->merge('rockeskolen_vip_managed')
        ->keys(['uid' => $uid])
        ->insertFields(['uid' => $uid, 'created' => time()])
        ->updateFields(['created' => time()])
        ->execute();
      $account->addRole('vip_member');
      $this->save($account);
      return TRUE;
    }
    if ($activeGrants === 0 && $managed && $account->hasRole('vip_member')) {
      $account->removeRole('vip_member');
      $this->save($account);
      $this->database->delete('rockeskolen_vip_managed')->condition('uid', $uid)->execute();
      return TRUE;
    }
    return FALSE;
  }

  /**
   * Saves without mistaking the automated change for a manual role edit.
   */
  private function save(UserInterface $account): void {
    self::$saving = TRUE;
    try {
      $account->save();
    }
    finally {
      self::$saving = FALSE;
    }
  }

}
