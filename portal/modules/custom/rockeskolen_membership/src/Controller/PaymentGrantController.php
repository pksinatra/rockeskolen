<?php

declare(strict_types=1);

namespace Drupal\rockeskolen_membership\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\rockeskolen_membership\AccessSynchronizer;
use Drupal\rockeskolen_membership\MembershipConnection;
use Drupal\rockeskolen_membership\VipGrantManager;
use Drupal\user\UserInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Receives authenticated VIP entitlement changes from the Stripe webhook.
 */
final class PaymentGrantController extends ControllerBase {

  public function __construct(
    private readonly MembershipConnection $membershipConnection,
    private readonly VipGrantManager $vipGrantManager,
  ) {}

  /**
   * Applies an aggregate Stripe VIP grant to an already linked Drupal user.
   */
  public function update(Request $request): JsonResponse {
    // Loading the membership connection also loads the shared local secrets.
    $pdo = $this->membershipConnection->get();
    $secret = getenv('CHORDLINK_ROLE_SYNC_SECRET') ?: '';
    $timestamp = (string) $request->headers->get('X-Rockeskolen-Timestamp', '');
    $signature = (string) $request->headers->get('X-Rockeskolen-Signature', '');
    $body = (string) $request->getContent();
    if (
      $secret === ''
      || !ctype_digit($timestamp)
      || abs(time() - (int) $timestamp) > 300
      || !hash_equals(hash_hmac('sha256', $timestamp . '.' . $body, $secret), $signature)
    ) {
      return new JsonResponse(['ok' => FALSE], 403);
    }

    try {
      $data = json_decode($body, TRUE, 16, JSON_THROW_ON_ERROR);
      $membershipUserId = (int) ($data['membership_user_id'] ?? 0);
      $active = $data['active'] ?? NULL;
      if ($membershipUserId < 1 || !is_bool($active)) {
        return new JsonResponse(['ok' => FALSE], 400);
      }

      $statement = $pdo->prepare(
        'SELECT drupal_uid FROM chordlink_drupal_links WHERE user_id = ? LIMIT 1'
      );
      $statement->execute([$membershipUserId]);
      $uid = (int) $statement->fetchColumn();
      if ($uid < 1) {
        // The SSO controller will reconcile the subscription when the member
        // first establishes a Drupal identity link.
        return new JsonResponse(['ok' => TRUE, 'pending_identity_link' => TRUE], 202);
      }

      $this->vipGrantManager->setGrant(
        $uid,
        'stripe',
        'membership-' . $membershipUserId,
        $active,
      );
      // The membership side has just recalculated the role from Stripe alone.
      // Write the authoritative Drupal role back even when it did not change,
      // so manual or school VIP is not left as "free" on rockeskolen.com.
      $account = $this->entityTypeManager()->getStorage('user')->load($uid);
      if ($account instanceof UserInterface) {
        AccessSynchronizer::applyToMembership($pdo, $membershipUserId, $account);
      }
      return new JsonResponse(['ok' => TRUE]);
    }
    catch (\Throwable $exception) {
      $this->getLogger('rockeskolen_membership')->error(
        'Payment VIP synchronization failed: @message',
        ['@message' => $exception->getMessage()],
      );
      return new JsonResponse(['ok' => FALSE], 500);
    }
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container): static {
    return new static(
      $container->get('rockeskolen_membership.connection'),
      $container->get('rockeskolen_membership.vip_grant_manager'),
    );
  }

}
