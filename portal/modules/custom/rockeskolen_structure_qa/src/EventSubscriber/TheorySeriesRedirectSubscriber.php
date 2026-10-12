<?php

declare(strict_types=1);

namespace Drupal\rockeskolen_structure_qa\EventSubscriber;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Url;
use Drupal\node\NodeInterface;
use Drupal\taxonomy\TermInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Replaces legacy music-theory category pages with their article series.
 */
final class TheorySeriesRedirectSubscriber implements EventSubscriberInterface {

  public function __construct(
    private readonly EntityTypeManagerInterface $entityTypeManager,
  ) {}

  public function onRequest(RequestEvent $event): void {
    if (!$event->isMainRequest()) {
      return;
    }

    $request = $event->getRequest();
    $term = $request->attributes->get('taxonomy_term');
    if ($request->attributes->get('_route') !== 'entity.taxonomy_term.canonical'
      || !$term instanceof TermInterface
      || $term->bundle() !== 'musikkteori') {
      return;
    }

    $node_storage = $this->entityTypeManager->getStorage('node');
    $ids = $node_storage->getQuery()
      ->accessCheck(TRUE)
      ->condition('type', 'musikkteori')
      ->condition('status', NodeInterface::PUBLISHED)
      ->condition('field_musikkteori.target_id', $term->id())
      ->execute();
    if ($ids === []) {
      return;
    }

    $series_ids = [];
    foreach ($node_storage->loadMultiple($ids) as $node) {
      if (!$node->access('view') || $node->get('field_artikkelserie')->isEmpty()) {
        continue;
      }
      $series_ids[(int) $node->get('field_artikkelserie')->target_id] = TRUE;
    }
    if (count($series_ids) !== 1) {
      return;
    }

    $series_id = array_key_first($series_ids);
    $url = Url::fromRoute('rockeskolen_structure_qa.article_series', [
      'taxonomy_term' => $series_id,
    ], [
      'query' => $request->query->all(),
      'absolute' => TRUE,
    ])->toString();
    $response = new RedirectResponse($url, 301);
    $response->setPublic();
    $response->setMaxAge(3600);
    $event->setResponse($response);
  }

  public static function getSubscribedEvents(): array {
    // Run after routing and parameter conversion, before controller execution.
    return [KernelEvents::REQUEST => ['onRequest', 28]];
  }

}
