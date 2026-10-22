<?php

declare(strict_types=1);

namespace Drupal\rockeskolen_membership\Controller;

use Drupal\Component\Utility\Html;
use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Url;
use Symfony\Component\HttpFoundation\RedirectResponse;

/**
 * Provides a clear, separate entry for local Drupal administrators.
 */
final class AdminLoginController extends ControllerBase {

  /**
   * Redirects anonymous visitors or explains how to switch accounts.
   */
  public function login(): array|RedirectResponse {
    // Do not use "destination" on this redirecting route: Drupal treats it as
    // a reserved redirect override before this controller response is sent.
    $destination = (string) \Drupal::request()->query->get('return_to', '/');
    if ($destination === '' || $destination[0] !== '/' || str_starts_with($destination, '//')) {
      $destination = '/';
    }

    if ($this->currentUser()->isAnonymous()) {
      $url = Url::fromRoute('user.login', [], [
        'query' => ['admin' => '1', 'destination' => $destination],
      ])->toString();
      return new RedirectResponse($url, 303);
    }

    $returnUrl = Url::fromRoute('rockeskolen_membership.logout_continue', [], [
      'query' => ['return' => 'admin'],
    ])->toString();
    $logoutUrl = Url::fromRoute('user.logout', [], [
      'query' => ['destination' => $returnUrl],
    ])->toString();
    $name = Html::escape($this->currentUser()->getDisplayName());

    return [
      '#markup' => '<div class="rs-admin-switch"><h1>Bytt til administratorkonto</h1>'
        . '<p>Du er nå logget inn som <strong>' . $name . '</strong>.</p>'
        . '<p><a class="button button--primary" href="' . Html::escape($logoutUrl) . '">Logg ut av begge systemene og fortsett som administrator</a></p>'
        . '<p><a href="/">Avbryt</a></p></div>',
      '#cache' => ['contexts' => ['user', 'url.query_args:destination']],
    ];
  }

}
