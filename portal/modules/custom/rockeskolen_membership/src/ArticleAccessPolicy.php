<?php

declare(strict_types=1);

namespace Drupal\rockeskolen_membership;

use Drupal\Core\Access\AccessResult;
use Drupal\Core\Entity\EntityInterface;
use Drupal\Core\Session\AccountInterface;
use Drupal\node\NodeInterface;

/** Resolves editorial article tiers against the authoritative Drupal role. */
final class ArticleAccessPolicy {

  public const PUBLIC = 'public';
  public const AUTHENTICATED = 'authenticated';
  public const VIP = 'vip';

  public static function level(NodeInterface $node): string {
    if (!$node->hasField('field_access_level') || $node->get('field_access_level')->isEmpty()) {
      return self::PUBLIC;
    }
    $level = (string) $node->get('field_access_level')->value;
    return in_array($level, [self::PUBLIC, self::AUTHENTICATED, self::VIP], TRUE) ? $level : self::PUBLIC;
  }

  public static function canView(NodeInterface $node, AccountInterface $account): bool {
    if ($account->hasPermission('bypass node access') || $account->hasRole('administrator') || $account->hasRole('content_editor')) {
      return TRUE;
    }
    return match (self::level($node)) {
      self::PUBLIC => TRUE,
      self::AUTHENTICATED => !$account->isAnonymous(),
      self::VIP => $account->hasRole('vip_member'),
      default => FALSE,
    };
  }

  public static function access(NodeInterface $node, AccountInterface $account): AccessResult {
    return AccessResult::allowedIf(self::canView($node, $account))
      ->addCacheableDependency($node)
      ->cachePerUser();
  }

  /** Prevents the protected body field from being rendered or exposed. */
  public static function fieldAccess(string $operation, EntityInterface $entity, AccountInterface $account, string $fieldName): AccessResult {
    if ($operation !== 'view' || !$entity instanceof NodeInterface || $fieldName !== 'field_body') {
      return AccessResult::neutral();
    }
    return self::access($entity, $account);
  }
}
