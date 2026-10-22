<?php

declare(strict_types=1);

namespace Drupal\rockeskolen_membership\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\DependencyInjection\ContainerInjectionInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Logger\LoggerChannelInterface;
use Drupal\Core\Routing\TrustedRedirectResponse;
use Drupal\rockeskolen_membership\AccessSynchronizer;
use Drupal\rockeskolen_membership\MembershipConnection;
use Drupal\rockeskolen_membership\ReturnDestination;
use Drupal\rockeskolen_membership\VipGrantManager;
use Drupal\user\UserInterface;
use PDO;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Consumes short-lived, one-time membership SSO tokens.
 */
final class MembershipSsoController extends ControllerBase implements ContainerInjectionInterface {

  public function __construct(
    private readonly MembershipConnection $membershipConnection,
    private readonly EntityTypeManagerInterface $membershipEntityTypeManager,
    private readonly LoggerChannelInterface $membershipLogger,
    private readonly VipGrantManager $vipGrantManager,
  ) {}

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container): static {
    return new static(
      $container->get('rockeskolen_membership.connection'),
      $container->get('entity_type.manager'),
      $container->get('logger.channel.rockeskolen_membership'),
      $container->get('rockeskolen_membership.vip_grant_manager'),
    );
  }

  /**
   * Consumes a token, synchronizes access, and starts the Drupal session.
   */
  public function consume(Request $request): Response {
    $token = (string) $request->query->get('token', '');
    if (!preg_match('/^[a-f0-9]{64}$/', $token)) {
      return $this->failure();
    }

    // Set once the token is consumed. A login that started on rockeskolen.com
    // is already valid there, so it returns there even if the portal fails.
    $siteUrl = NULL;
    try {
      $pdo = $this->membershipConnection->get();
      $membership = $this->consumeToken(
        $pdo,
        hash('sha256', $token),
        $this->browserBindingHash($request),
      );
      if ($membership === NULL) {
        return $this->failure();
      }
      $destination = (string) $membership['destination'];
      if (ReturnDestination::isMemberBound($destination)) {
        // Portal-to-membership tokens are only valid on rockeskolen.com.
        return $this->failure();
      }
      $siteUrl = ReturnDestination::siteUrl($destination);

      [$account, $newLink] = $this->loadOrCreateAccount(
        (int) $membership['user_id'],
        (string) $membership['email'],
        $pdo,
      );
      // Stripe first: a paid VIP becomes a managed grant that ends with the
      // subscription. Only VIP that Stripe does not explain is imported as a
      // permanent (manually assigned) role.
      $this->vipGrantManager->syncStripeGrant($pdo, (int) $membership['user_id'], (int) $account->id());
      if ($newLink) {
        AccessSynchronizer::importLegacyVip($account, (string) $membership['role']);
      }
      AccessSynchronizer::applyToMembership($pdo, (int) $membership['user_id'], $account);
      user_login_finalize($account);

      if ($siteUrl !== NULL) {
        // Drupal would append ?check_logged_in=1 to verify its own cookie,
        // which means nothing on rockeskolen.com.
        $request->getSession()->remove('check_logged_in');
        return new TrustedRedirectResponse($siteUrl, 303);
      }
      return new RedirectResponse(ReturnDestination::portalPath($destination), 303);
    }
    catch (\Throwable $exception) {
      $this->membershipLogger->error('Membership SSO failed: @message', [
        '@message' => $exception->getMessage(),
      ]);
      if ($siteUrl !== NULL) {
        return new TrustedRedirectResponse($siteUrl, 303);
      }
      return $this->failure();
    }
  }

  /**
   * Atomically consumes a valid token.
   */
  private function consumeToken(PDO $pdo, string $tokenHash, string $ipHash): ?array {
    $pdo->beginTransaction();
    try {
      $statement = $pdo->prepare(
        'SELECT t.destination, t.ip_hash, u.id AS user_id, u.email, u.role
           FROM chordlink_sso_tokens t
           JOIN chordlink_users u ON u.id = t.user_id
          WHERE t.token_hash = ?
            AND t.consumed_at IS NULL
            AND t.expires_at >= NOW()
            AND u.is_active = 1
          FOR UPDATE'
      );
      $statement->execute([$tokenHash]);
      $membership = $statement->fetch(PDO::FETCH_ASSOC);
      if (!$membership || !hash_equals((string) $membership['ip_hash'], $ipHash)) {
        $pdo->rollBack();
        return NULL;
      }

      $update = $pdo->prepare(
        'UPDATE chordlink_sso_tokens
            SET consumed_at = NOW()
          WHERE token_hash = ? AND consumed_at IS NULL'
      );
      $update->execute([$tokenHash]);
      if ($update->rowCount() !== 1) {
        $pdo->rollBack();
        return NULL;
      }
      $pdo->commit();
      return $membership;
    }
    catch (\Throwable $exception) {
      if ($pdo->inTransaction()) {
        $pdo->rollBack();
      }
      throw $exception;
    }
  }

  /**
   * Uses an explicitly linked account or safely establishes a unique link.
   *
   * @return array{0: \Drupal\user\UserInterface, 1: bool}
   *   The Drupal account and whether the identity link was created now.
   */
  private function loadOrCreateAccount(int $membershipUserId, string $email, PDO $pdo): array {
    $storage = $this->membershipEntityTypeManager->getStorage('user');
    $link = $pdo->prepare(
      'SELECT drupal_uid FROM chordlink_drupal_links WHERE user_id = ? LIMIT 1'
    );
    $link->execute([$membershipUserId]);
    $linkedUid = (int) $link->fetchColumn();
    if ($linkedUid > 0) {
      $account = $storage->load($linkedUid);
      if (!$account instanceof UserInterface || !$account->isActive()) {
        throw new \RuntimeException('The linked portal account is unavailable.');
      }
      return [$account, FALSE];
    }

    $accounts = $storage->loadByProperties(['mail' => $email]);
    $account = $accounts ? reset($accounts) : NULL;
    if (!$account instanceof UserInterface) {
      $account = $storage->create([
        'name' => $email,
        'mail' => $email,
        'status' => 1,
        'langcode' => 'nb',
      ]);
      $account->activate();
      $account->save();
    }
    elseif (!$account->isActive()) {
      throw new \RuntimeException('The matching portal account is blocked.');
    }

    $existingDrupalLink = $pdo->prepare(
      'SELECT user_id FROM chordlink_drupal_links WHERE drupal_uid = ? LIMIT 1'
    );
    $existingDrupalLink->execute([(int) $account->id()]);
    $linkedMembershipId = (int) $existingDrupalLink->fetchColumn();
    if ($linkedMembershipId > 0 && $linkedMembershipId !== $membershipUserId) {
      throw new \RuntimeException('The portal account is already linked to another membership.');
    }

    $link = $pdo->prepare(
      'INSERT INTO chordlink_drupal_links (user_id, drupal_uid) VALUES (?, ?)'
    );
    $link->execute([$membershipUserId, (int) $account->id()]);
    return [$account, TRUE];
  }

  /**
   * Hashes the high-entropy browser binding shared by both Rockeskolen hosts.
   */
  private function browserBindingHash(Request $request): string {
    $binding = (string) $request->cookies->get('rs_sso_browser', '');
    if (!preg_match('/^[a-f0-9]{64}$/', $binding)) {
      return '';
    }
    return hash('sha256', $binding);
  }

  /**
   * Returns a generic response that does not disclose token state.
   */
  private function failure(): Response {
    $loginUrl = '/user/login';
    return new Response(
      '<!doctype html><html lang="no"><head><meta charset="utf-8">'
      . '<meta name="viewport" content="width=device-width,initial-scale=1">'
      . '<title>Innlogging | Rockeskolen</title></head><body>'
      . '<main style="max-width:640px;margin:10vh auto;padding:32px;font-family:Arial,sans-serif">'
      . '<h1>Innloggingen kunne ikke fullføres</h1>'
      . '<p>Innloggingslenken er brukt eller har utløpt. Start innloggingen på nytt.</p>'
      . '<p><a href="' . $loginUrl . '">Til innlogging</a></p>'
      . '</main></body></html>',
      403,
      ['Content-Type' => 'text/html; charset=UTF-8'],
    );
  }

}
