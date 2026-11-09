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

  private const LOGIN_RETURN = 'https://portal.rockeskolen.com/user/login?logged_out=1';

  private const FEIDE_END_SESSION = 'https://auth.dataporten.no/openid/endsession';

  private const FEIDE_LOGOUT_STORE = 'rockeskolen_feide_logout';

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
    $feideReturn = $this->prepareFeideLogout();
    user_logout();
    $return = $feideReturn ?? self::LOGIN_RETURN;
    return new TrustedRedirectResponse(
      'https://rockeskolen.com/members/logout.php?redirect=' . rawurlencode($return),
      303,
    );
  }

  /**
   * Logs out a user who starts from the Drupal portal.
   */
  public function portalLogout(): TrustedRedirectResponse {
    $feideReturn = $this->prepareFeideLogout();
    user_logout();
    $return = $feideReturn ?? self::LOGIN_RETURN;
    return new TrustedRedirectResponse(
      'https://rockeskolen.com/members/logout.php?redirect=' . rawurlencode($return),
      303,
    );
  }

  /**
   * Clears the Rockeskolen session after Drupal has logged the user out.
   */
  public function continueLogout(): TrustedRedirectResponse {
    $feideNonce = (string) \Drupal::request()->query->get('feide', '');
    if ($feideNonce !== '') {
      return $this->feideLogout($feideNonce);
    }
    $feideReturn = NULL;
    if ((string) \Drupal::request()->query->get('portal', '') === '1' && !$this->currentUser()->isAnonymous()) {
      $feideReturn = $this->prepareFeideLogout();
      user_logout();
    }
    $return = (string) \Drupal::request()->query->get('return', '') === 'admin'
      ? 'https://portal.rockeskolen.com/admin-login'
      : ($feideReturn ?? self::LOGIN_RETURN);
    $url = 'https://rockeskolen.com/members/logout.php?redirect=' . rawurlencode($return);
    return new TrustedRedirectResponse($url, 303);
  }

  /**
   * Ends the Feide session after Rockeskolen has logged the user out.
   *
   * Without this, Feide keeps its own session and the next press on
   * "Logg inn med FEIDE" signs the previous user in again, which matters on
   * shared school devices.
   */
  private function feideLogout(string $nonce): TrustedRedirectResponse {
    $store = \Drupal::service('keyvalue.expirable')->get(self::FEIDE_LOGOUT_STORE);
    $token = preg_match('/^[0-9a-f]{32}$/', $nonce) ? $store->get($nonce) : NULL;
    if (!is_string($token)) {
      return new TrustedRedirectResponse(self::LOGIN_RETURN, 303);
    }
    $store->delete($nonce);
    $query = ['post_logout_redirect_uri' => self::LOGIN_RETURN];
    if ($token !== '') {
      $query['id_token_hint'] = $token;
    }
    return new TrustedRedirectResponse(self::FEIDE_END_SESSION . '?' . http_build_query($query), 303);
  }

  /**
   * Prepares the Feide end-session step for a Feide user about to log out.
   *
   * The ID token is kept server-side for five minutes under a random key, so
   * it survives the Drupal logout and never travels through rockeskolen.com.
   *
   * @return string|null
   *   The portal URL that ends the Feide session, or NULL for other users.
   */
  private function prepareFeideLogout(): ?string {
    $uid = (int) $this->currentUser()->id();
    if ($uid < 1 || !\Drupal::service('externalauth.authmap')->get($uid, 'openid_connect.feide')) {
      return NULL;
    }
    $token = (string) (\Drupal::service('openid_connect.session')->retrieveIdToken() ?? '');
    $nonce = bin2hex(random_bytes(16));
    \Drupal::service('keyvalue.expirable')->get(self::FEIDE_LOGOUT_STORE)->setWithExpire($nonce, $token, 300);
    return 'https://portal.rockeskolen.com/members/logout-continue?feide=' . $nonce;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container): static {
    return new static($container->get('rockeskolen_membership.connection'));
  }

}
