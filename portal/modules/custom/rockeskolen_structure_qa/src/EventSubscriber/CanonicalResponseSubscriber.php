<?php

declare(strict_types=1);

namespace Drupal\rockeskolen_structure_qa\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Standardizes canonicals for the two restructured public routes.
 */
final class CanonicalResponseSubscriber implements EventSubscriberInterface {

  /**
   * Replaces Drupal's internal node canonical with the public route.
   */
  public function onResponse(ResponseEvent $event): void {
    if (!$event->isMainRequest()) {
      return;
    }

    $request = $event->getRequest();
    if ($request->getHost() !== 'portal.rockeskolen.com') {
      return;
    }

    $canonical = match ($request->getPathInfo()) {
      '/' => 'https://portal.rockeskolen.com/',
      '/musikkteori' => 'https://portal.rockeskolen.com/musikkteori',
      default => NULL,
    };
    if ($canonical === NULL) {
      return;
    }

    $response = $event->getResponse();
    $contentType = $response->headers->get('Content-Type', '');
    $content = $response->getContent();
    if (!str_contains($contentType, 'text/html') || !is_string($content)) {
      return;
    }

    $content = preg_replace(
      '/<link\s+rel=["\']canonical["\'][^>]*>\s*/i',
      '',
      $content
    );
    if (!is_string($content)) {
      return;
    }

    $tag = '<link rel="canonical" href="' . $canonical . '" />' . "\n";
    $response->setContent(str_replace('</head>', $tag . '</head>', $content));
  }

  /**
   * {@inheritdoc}
   */
  public static function getSubscribedEvents(): array {
    return [
      KernelEvents::RESPONSE => ['onResponse', -100],
    ];
  }

}
