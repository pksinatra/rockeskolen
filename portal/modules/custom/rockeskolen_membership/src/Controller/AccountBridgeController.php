<?php

declare(strict_types=1);

namespace Drupal\rockeskolen_membership\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Routing\TrustedRedirectResponse;
use Drupal\rockeskolen_membership\AccessSynchronizer;
use Drupal\rockeskolen_membership\MembershipConnection;
use Drupal\rockeskolen_membership\ReturnDestination;
use Drupal\user\UserInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Returns an authenticated portal user to the matching membership account.
 */
final class AccountBridgeController extends ControllerBase {

  public function __construct(
    private readonly MembershipConnection $membershipConnection,
  ) {}

  public static function create(ContainerInterface $container): static {
    return new static($container->get('rockeskolen_membership.connection'));
  }

  public function returnToAccount(Request $request): Response {
    $returnPath = ReturnDestination::sitePath($request->query->get('return'));
    try {
      $uid = (int) $this->currentUser()->id();
      if ($uid < 1) {
        return $this->failure($returnPath);
      }

      $pdo = $this->membershipConnection->get();
      $membershipUserId = $this->resolveMembershipUserId($pdo, $uid);
      if ($membershipUserId < 1) {
        return $this->failure($returnPath);
      }

      $binding = (string) $request->cookies->get('rs_sso_browser', '');
      $setBindingCookie = !preg_match('/^[a-f0-9]{64}$/', $binding);
      if ($setBindingCookie) {
        $binding = bin2hex(random_bytes(32));
      }

      $token = bin2hex(random_bytes(32));
      $pdo->prepare(
        'DELETE FROM chordlink_sso_tokens WHERE expires_at < DATE_SUB(NOW(), INTERVAL 1 DAY)'
      )->execute();
      $insert = $pdo->prepare(
        'INSERT INTO chordlink_sso_tokens
          (token_hash, user_id, destination, ip_hash, expires_at)
         VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 2 MINUTE))'
      );
      // The "rs:" prefix makes the token valid only on rockeskolen.com, which
      // then continues to the requested page (default: the account page).
      $insert->execute([
        hash('sha256', $token),
        $membershipUserId,
        ReturnDestination::MEMBER_PREFIX . ($returnPath ?? '/members/account.php'),
        hash('sha256', $binding),
      ]);

      $response = new TrustedRedirectResponse(
        'https://rockeskolen.com/members/portal-return.php?token=' . rawurlencode($token),
        303,
      );
      if ($setBindingCookie) {
        $response->headers->setCookie(Cookie::create(
          'rs_sso_browser',
          $binding,
          time() + 2592000,
          '/',
          '.rockeskolen.com',
          TRUE,
          TRUE,
          FALSE,
          'lax',
        ));
      }
      return $response;
    }
    catch (\Throwable $exception) {
      $this->getLogger('rockeskolen_membership')->error(
        'Portal-to-membership account bridge failed: @message',
        ['@message' => $exception->getMessage()],
      );
      return $this->failure($returnPath);
    }
  }

  private function failure(?string $returnPath = NULL): TrustedRedirectResponse {
    // Without a membership session the page still opens, just logged out.
    if ($returnPath !== NULL) {
      return new TrustedRedirectResponse(ReturnDestination::SITE . $returnPath, 303);
    }
    return new TrustedRedirectResponse('/user', 303);
  }

  /**
   * Finds the linked member or creates one for a trusted local VIP account.
   */
  private function resolveMembershipUserId(\PDO $pdo, int $uid): int {
    $account = $this->entityTypeManager()->getStorage('user')->load($uid);
    if (!$account instanceof UserInterface || !$account->isActive()) {
      return 0;
    }

    $statement = $pdo->prepare(
      'SELECT user_id FROM chordlink_drupal_links WHERE drupal_uid = ? LIMIT 1'
    );
    $statement->execute([$uid]);
    $membershipUserId = (int) $statement->fetchColumn();
    if ($membershipUserId > 0) {
      $this->syncPasswordIfRequired($pdo, $membershipUserId, $account);
      return $membershipUserId;
    }

    if (!$account->hasRole('vip_member')) {
      return 0;
    }
    $email = strtolower(trim((string) $account->getEmail()));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
      throw new \RuntimeException('The portal account has no valid email address.');
    }

    $pdo->beginTransaction();
    try {
      $member = $pdo->prepare(
        'SELECT id, is_active FROM chordlink_users WHERE email = ? LIMIT 1 FOR UPDATE'
      );
      $member->execute([$email]);
      $memberRow = $member->fetch(\PDO::FETCH_ASSOC) ?: [];
      $membershipUserId = (int) ($memberRow['id'] ?? 0);
      if ($membershipUserId > 0 && empty($memberRow['is_active'])) {
        throw new \RuntimeException('The matching membership account is inactive.');
      }

      if ($membershipUserId === 0) {
        $drupalPasswordHash = $this->compatiblePasswordHash($account);
        $passwordSetupRequired = $drupalPasswordHash === NULL ? 1 : 0;
        $insert = $pdo->prepare(
          'INSERT INTO chordlink_users
            (email, password_hash, role, is_active, provider, password_setup_required)
           VALUES (?, ?, ?, 1, ?, ?)'
        );
        $insert->execute([
          $email,
          $drupalPasswordHash ?? password_hash(bin2hex(random_bytes(32)), PASSWORD_DEFAULT),
          AccessSynchronizer::membershipRole($account),
          'local',
          $passwordSetupRequired,
        ]);
        $membershipUserId = (int) $pdo->lastInsertId();
      }

      $conflict = $pdo->prepare(
        'SELECT user_id, drupal_uid FROM chordlink_drupal_links
          WHERE user_id = ? OR drupal_uid = ?
          FOR UPDATE'
      );
      $conflict->execute([$membershipUserId, $uid]);
      $alreadyLinked = FALSE;
      foreach ($conflict->fetchAll(\PDO::FETCH_ASSOC) as $link) {
        if ((int) $link['user_id'] !== $membershipUserId || (int) $link['drupal_uid'] !== $uid) {
          throw new \RuntimeException('The membership or portal account is already linked elsewhere.');
        }
        $alreadyLinked = TRUE;
      }

      if (!$alreadyLinked) {
        $link = $pdo->prepare(
          'INSERT INTO chordlink_drupal_links (user_id, drupal_uid) VALUES (?, ?)'
        );
        $link->execute([$membershipUserId, $uid]);
      }
      $pdo->commit();
    }
    catch (\Throwable $exception) {
      if ($pdo->inTransaction()) {
        $pdo->rollBack();
      }
      throw $exception;
    }

    AccessSynchronizer::applyToMembership($pdo, $membershipUserId, $account);
    $this->syncPasswordIfRequired($pdo, $membershipUserId, $account);
    return $membershipUserId;
  }

  /**
   * Reuses a compatible local Drupal password verifier for a new member link.
   */
  private function compatiblePasswordHash(UserInterface $account): ?string {
    $hash = (string) $account->getPassword();
    if ($hash === '') {
      return NULL;
    }
    $info = password_get_info($hash);
    return !empty($info['algo']) ? $hash : NULL;
  }

  /**
   * Clears first-time setup only when Drupal already has a usable password.
   */
  private function syncPasswordIfRequired(\PDO $pdo, int $membershipUserId, UserInterface $account): void {
    $hash = $this->compatiblePasswordHash($account);
    if ($hash === NULL) {
      return;
    }
    $statement = $pdo->prepare(
      'UPDATE chordlink_users
          SET password_hash = ?, password_setup_required = 0,
              password_reset_token = NULL, password_reset_expires = NULL
        WHERE id = ? AND password_setup_required = 1
          AND COALESCE(provider, ?) <> ?
          AND (feide_id IS NULL OR feide_id = ?)'
    );
    $statement->execute([$hash, $membershipUserId, 'local', 'feide', '']);
  }

}
