<?php

declare(strict_types=1);

namespace Drupal\rockeskolen_structure_qa\EventSubscriber;

use Drupal\taxonomy\TermInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Gives practice landing and series pages page-specific search descriptions.
 */
final class PracticeSeoSubscriber implements EventSubscriberInterface {

  public function onResponse(ResponseEvent $event): void {
    if (!$event->isMainRequest()) {
      return;
    }

    $request = $event->getRequest();
    $route = (string) $request->attributes->get('_route');
    $description = NULL;
    if ($route === 'rockeskolen_structure_qa.music_practice') {
      $description = 'Praktiske guider om låtskriving, musikkproduksjon, utgivelse, markedsføring, rettigheter og økonomi.';
    }
    elseif ($route === 'rockeskolen_structure_qa.article_series') {
      $term = $request->attributes->get('taxonomy_term');
      if ($term instanceof TermInterface) {
        $term_description = trim(strip_tags((string) ($term->getDescription() ?? '')));
        $description = $term_description !== ''
          ? $this->truncate($term_description)
          : sprintf('Les artikkelserien %s med praktiske artikler fra Rockeskolen.', $term->label());
      }
    }
    if ($description === NULL) {
      return;
    }

    $response = $event->getResponse();
    $content = $response->getContent();
    if (!is_string($content) || !str_contains($response->headers->get('Content-Type', ''), 'text/html')) {
      return;
    }
    $escaped = htmlspecialchars($description, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $patterns = [
      '/(<meta\s+name=["\']description["\']\s+content=["\'])[^"\']*(["\']\s*\/?>)/i',
      '/(<meta\s+property=["\']og:description["\']\s+content=["\'])[^"\']*(["\']\s*\/?>)/i',
      '/(<meta\s+name=["\']twitter:description["\']\s+content=["\'])[^"\']*(["\']\s*\/?>)/i',
    ];
    foreach ($patterns as $pattern) {
      $content = preg_replace($pattern, '$1' . $escaped . '$2', $content, 1) ?? $content;
    }
    $response->setContent($content);
  }

  private function truncate(string $description): string {
    $description = preg_replace('/\s+/u', ' ', $description) ?? $description;
    return mb_strlen($description) > 160
      ? rtrim(mb_substr($description, 0, 157), " \t\n\r\0\x0B,.;:") . '…'
      : $description;
  }

  public static function getSubscribedEvents(): array {
    // Run after the shared canonical/meta subscriber at priority -100.
    return [KernelEvents::RESPONSE => ['onResponse', -120]];
  }

}
