<?php

declare(strict_types=1);

namespace Drupal\rockeskolen_membership\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Routing\TrustedRedirectResponse;
use Drupal\rockeskolen_membership\MembershipConnection;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

/**
 * Continues a completed Drupal logout through the membership host.
 */
final class LogoutController extends ControllerBase {

  public function __construct(
    private readonly MembershipConnection $membershipConnection,
  ) {}

  /**
   * Starts a complete logout from a Rockeskolen membership page.
   */
  public function startLogout(): TrustedRedirectResponse {
    if ($this->currentUser()->isAnonymous()) {
      $return = 'https://portal.rockeskolen.com/user/login?logged_out=1';
      return new TrustedRedirectResponse(
        'https://rockeskolen.com/members/logout.php?redirect=' . rawurlencode($return),
        303,
      );
    }
    $request = \Drupal::request();
    $membershipUserId = (int) $request->query->get('mid', 0);
    $timestamp = (int) $request->query->get('ts', 0);
    $signature = (string) $request->query->get('sig', '');
    $pdo = $this->membershipConnection->get();
    $secret = getenv('CHORDLINK_ROLE_SYNC_SECRET') ?: '';
    $expected = $secret !== '' ? hash_hmac('sha256', "logout:$membershipUserId:$timestamp", $secret) : '';
    $statement = $pdo->prepare(
      'SELECT 1 FROM chordlink_drupal_links WHERE user_id = ? AND drupal_uid = ? LIMIT 1'
    );
    $statement->execute([$membershipUserId, (int) $this->currentUser()->id()]);
    if (
      $membershipUserId < 1
      || abs(time() - $timestamp) > 300
      || $expected === ''
      || !hash_equals($expected, $signature)
      || !$statement->fetchColumn()
    ) {
      throw new AccessDeniedHttpException('Invalid logout request.');
    }
    user_logout();
    $return = 'https://portal.rockeskolen.com/user/login?logged_out=1';
    return new TrustedRedirectResponse(
      'https://rockeskolen.com/members/logout.php?redirect=' . rawurlencode($return),
      303,
    );
  }

  /**
   * Logs out a user who starts from the Drupal portal.
   */
  public function portalLogout(): TrustedRedirectResponse {
    user_logout();
    $return = 'https://portal.rockeskolen.com/user/login?logged_out=1';
    return new TrustedRedirectResponse(
      'https://rockeskolen.com/members/logout.php?redirect=' . rawurlencode($return),
      303,
    );
  }

  /**
   * Clears the Rockeskolen session after Drupal has logged the user out.
   */
  public function continueLogout(): TrustedRedirectResponse {
    if ((string) \Drupal::request()->query->get('portal', '') === '1' && !$this->currentUser()->isAnonymous()) {
      user_logout();
    }
    $return = (string) \Drupal::request()->query->get('return', '') === 'admin'
      ? 'https://portal.rockeskolen.com/admin-login'
      : 'https://portal.rockeskolen.com/user/login?logged_out=1';
    $url = 'https://rockeskolen.com/members/logout.php?redirect=' . rawurlencode($return);
    return new TrustedRedirectResponse($url, 303);
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container): static {
    return new static($container->get('rockeskolen_membership.connection'));
  }

}
