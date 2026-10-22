<?php

declare(strict_types=1);

namespace Drupal\rockeskolen_structure_qa\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Adds the Musikk i praksis entry to the enhanced portal front page.
 */
final class HomepagePracticeSubscriber implements EventSubscriberInterface {

  public function onResponse(ResponseEvent $event): void {
    if (!$event->isMainRequest()
      || $event->getRequest()->getHost() !== 'portal.rockeskolen.com'
      || $event->getRequest()->getPathInfo() !== '/') {
      return;
    }

    $response = $event->getResponse();
    $content = $response->getContent();
    if (!is_string($content)
      || !str_contains($response->headers->get('Content-Type', ''), 'text/html')
      || str_contains($content, 'data-rs-practice-feature')) {
      return;
    }

    $feature = <<<'HTML'
<section class="rs-home-practice" data-rs-practice-feature aria-labelledby="rs-home-practice-title">
  <div class="rs-home-practice__copy">
    <p class="rs-kicker">Musikk i praksis</p>
    <h2 id="rs-home-practice-title">Fra kunnskap til ferdig musikk.</h2>
    <p>Praktiske guider om låtskriving, produksjon, utgivelse, markedsføring, rettigheter og økonomi.</p>
  </div>
  <div class="rs-home-practice__actions">
    <a class="rs-button rs-button-primary" href="/musikk-i-praksis">Utforsk alle artiklene</a>
    <a class="rs-button" href="https://portal.rockeskolen.com/artikkelserie/110">Følg låtskrivingsserien</a>
  </div>
</section>
HTML;

    $updated = preg_replace(
      '/(<a class="rs-symbol-feature")/i',
      $feature . '$1',
      $content,
      1,
    );
    if (!is_string($updated) || $updated === $content) {
      $updated = str_replace('</main>', $feature . '</main>', $content);
    }
    $response->setContent($updated);
  }

  public static function getSubscribedEvents(): array {
    // Run after the existing front-page enhancer at priority -100.
    return [KernelEvents::RESPONSE => ['onResponse', -110]];
  }

}
