<?php

declare(strict_types=1);

namespace Drupal\rockeskolen_membership\EventSubscriber;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Session\AccountProxyInterface;
use Drupal\openid_connect\OpenIDConnectClaims;
use Drupal\openid_connect\OpenIDConnectSessionInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Starts Feide login directly from /user/login?feide=1.
 *
 * The Feide button on rockeskolen.com links here, so the user goes straight
 * to Feide instead of pressing a second Feide button on the portal. The
 * destination parameter is kept, exactly as when the portal button is used.
 */
final class FeideLoginStartSubscriber implements EventSubscriberInterface {

  public function __construct(
    private readonly AccountProxyInterface $currentUser,
    private readonly EntityTypeManagerInterface $entityTypeManager,
    private readonly OpenIDConnectClaims $claims,
    private readonly OpenIDConnectSessionInterface $session,
  ) {}

  public function onRequest(RequestEvent $event): void {
    $request = $event->getRequest();
    if (!$event->isMainRequest()
      || $request->getMethod() !== 'GET'
      || rtrim($request->getPathInfo(), '/') !== '/user/login'
      || (string) $request->query->get('feide', '') !== '1'
      || !$this->currentUser->isAnonymous()) {
      return;
    }
    $client = $this->entityTypeManager->getStorage('openid_connect_client')->load('feide');
    if ($client === NULL || !$client->status()) {
      return;
    }
    $this->session->saveDestination();
    $plugin = $client->getPlugin();
    $this->session->saveOp('login');
    $event->setResponse($plugin->authorize($this->claims->getScopes($plugin)));
  }

  /**
   * {@inheritdoc}
   */
  public static function getSubscribedEvents(): array {
    // After authentication (300) and routing (32), before the controller.
    return [KernelEvents::REQUEST => ['onRequest', 0]];
  }

}
