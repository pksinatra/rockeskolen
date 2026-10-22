<?php

declare(strict_types=1);

namespace Drupal\rockeskolen_membership\EventSubscriber;

use Drupal\Core\Database\Connection;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Logger\LoggerChannelInterface;
use Drupal\Core\Session\AccountProxyInterface;
use Drupal\rockeskolen_membership\AccessSynchronizer;
use Drupal\rockeskolen_membership\MembershipConnection;
use Drupal\rockeskolen_membership\SchoolEntitlementResolver;
use Drupal\rockeskolen_membership\VipGrantManager;
use Drupal\user\UserInterface;
use PDO;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Links Feide identities and keeps their Drupal VIP role current.
 */
final class FeideMembershipSubscriber implements EventSubscriberInterface {

  public function __construct(
    private readonly AccountProxyInterface $currentUser,
    private readonly EntityTypeManagerInterface $entityTypeManager,
    private readonly Connection $drupalDatabase,
    private readonly MembershipConnection $membershipConnection,
    private readonly LoggerChannelInterface $logger,
    private readonly VipGrantManager $vipGrantManager,
    private readonly SchoolEntitlementResolver $schoolEntitlementResolver,
  ) {}

  /**
   * Synchronizes an authenticated Feide account once per PHP session.
   */
  public function onRequest(RequestEvent $event): void {
    if (!$event->isMainRequest() || $this->currentUser->isAnonymous()) {
      return;
    }
    $session = $event->getRequest()->getSession();
    $uid = (int) $this->currentUser->id();
    $lastSync = (int) $session->get('rockeskolen_membership_synced_at', 0);
    if (
      $session->get('rockeskolen_membership_synced_uid') === $uid
      && $lastSync >= time() - 60
    ) {
      return;
    }

    $account = $this->entityTypeManager->getStorage('user')->load($uid);
    if (!$account instanceof UserInterface || !$account->isActive()) {
      return;
    }

    try {
      $pdo = $this->membershipConnection->get();
      $authname = $this->drupalDatabase->select('authmap', 'a')
        ->fields('a', ['authname'])
        ->condition('uid', $uid)
        ->condition('provider', 'openid_connect.feide')
        ->execute()
        ->fetchField();
      if (!is_string($authname) || $authname === '') {
        return;
      }
      $membership = $this->loadLinkedMembership($pdo, $uid);
      if ($membership === NULL) {
        $membership = $this->linkAndLoadMembership(
          $pdo,
          $authname,
          strtolower(trim((string) $account->getEmail())),
        );
        $this->linkDrupalAccount($pdo, (int) $membership['id'], $uid);
      }
      // Feide proves identity, but Rockeskolen remains authoritative for
      // premium access. Revoke the legacy unconditional Feide grant and only
      // add a school grant when an active, pre-verified school entitlement
      // exists. Group synchronization can create or renew that assignment.
      $feideGrantId = hash('sha256', $authname);
      $verifiedMemberships = [];
      $groupsFetchedAt = (int) $session->get('rockeskolen_feide_memberships_fetched_at', 0);
      $sessionMemberships = $session->get('rockeskolen_feide_memberships', []);
      if ($groupsFetchedAt >= time() - 900 && is_array($sessionMemberships)) {
        $verifiedMemberships = $sessionMemberships;
      }
      $schoolDecision = $this->schoolEntitlementResolver->resolve(
        $pdo,
        (int) $membership['id'],
        $authname,
        $verifiedMemberships,
      );
      // Resolve first so a missing migration or temporary membership-database
      // failure cannot remove existing access during rollout.
      $this->vipGrantManager->setGrant($uid, 'feide', $feideGrantId, FALSE);
      $this->vipGrantManager->deactivateSourceForUser($uid, 'school');
      if ($schoolDecision['allowed']) {
        $schoolGrantId = 'contract-' . (int) $schoolDecision['contract_id']
          . '-user-' . substr($feideGrantId, 0, 24);
        $this->vipGrantManager->setGrant($uid, 'school', $schoolGrantId, TRUE);
      }
      AccessSynchronizer::applyToMembership($pdo, (int) $membership['id'], $account);
      $session->set('rockeskolen_membership_synced_uid', $uid);
      $session->set('rockeskolen_membership_synced_at', time());
    }
    catch (\Throwable $exception) {
      $this->logger->error('Feide membership synchronization failed for uid @uid: @message', [
        '@uid' => $uid,
        '@message' => $exception->getMessage(),
      ]);
    }
  }

  /**
   * Loads a membership account already explicitly linked to this Drupal user.
   */
  private function loadLinkedMembership(PDO $pdo, int $uid): ?array {
    $statement = $pdo->prepare(
      'SELECT u.id, u.role
         FROM chordlink_drupal_links l
         JOIN chordlink_users u ON u.id = l.user_id
        WHERE l.drupal_uid = ? AND u.is_active = 1
        LIMIT 1'
    );
    $statement->execute([$uid]);
    $membership = $statement->fetch(PDO::FETCH_ASSOC);
    return $membership ?: NULL;
  }

  /**
   * Links by stable Feide ID first, then by verified Feide email.
   */
  private function linkAndLoadMembership(PDO $pdo, string $feideId, string $email): array {
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
      throw new \RuntimeException('Feide did not provide a valid email address.');
    }

    $byFeide = $pdo->prepare(
      'SELECT id, role FROM chordlink_users
        WHERE feide_id = ? AND is_active = 1
        LIMIT 1'
    );
    $byFeide->execute([$feideId]);
    if ($member = $byFeide->fetch(PDO::FETCH_ASSOC)) {
      return $member;
    }

    $byEmail = $pdo->prepare(
      'SELECT id, role, feide_id FROM chordlink_users
        WHERE email = ? AND is_active = 1
        LIMIT 1'
    );
    $byEmail->execute([$email]);
    if ($member = $byEmail->fetch(PDO::FETCH_ASSOC)) {
      if (!empty($member['feide_id']) && !hash_equals((string) $member['feide_id'], $feideId)) {
        throw new \RuntimeException('The email address is already linked to another Feide identity.');
      }
      $link = $pdo->prepare(
        "UPDATE chordlink_users
            SET feide_id = ?
          WHERE id = ? AND (feide_id IS NULL OR feide_id = '')"
      );
      $link->execute([$feideId, (int) $member['id']]);
      return $member;
    }

    $passwordHash = password_hash(bin2hex(random_bytes(24)), PASSWORD_DEFAULT);
    $insert = $pdo->prepare(
      "INSERT INTO chordlink_users
        (email, password_hash, role, is_active, provider, feide_id)
       VALUES (?, ?, 'free', 1, 'feide', ?)"
    );
    $insert->execute([$email, $passwordHash, $feideId]);
    return ['id' => (int) $pdo->lastInsertId(), 'role' => 'free'];
  }

  /**
   * Stores an explicit one-to-one link used by local membership SSO.
   */
  private function linkDrupalAccount(PDO $pdo, int $membershipUserId, int $uid): void {
    $statement = $pdo->prepare(
      'SELECT user_id, drupal_uid
         FROM chordlink_drupal_links
        WHERE user_id = ? OR drupal_uid = ?'
    );
    $statement->execute([$membershipUserId, $uid]);
    $links = $statement->fetchAll(PDO::FETCH_ASSOC);
    foreach ($links as $link) {
      if ((int) $link['user_id'] !== $membershipUserId || (int) $link['drupal_uid'] !== $uid) {
        throw new \RuntimeException('The membership or Drupal account is already linked elsewhere.');
      }
      return;
    }

    $insert = $pdo->prepare(
      'INSERT INTO chordlink_drupal_links (user_id, drupal_uid) VALUES (?, ?)'
    );
    $insert->execute([$membershipUserId, $uid]);
  }

  /**
   * {@inheritdoc}
   */
  public static function getSubscribedEvents(): array {
    return [
      KernelEvents::REQUEST => ['onRequest', -50],
    ];
  }

}
