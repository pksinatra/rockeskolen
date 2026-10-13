<?php

declare(strict_types=1);

namespace Drupal\rockeskolen_structure_qa\Controller;

use Drupal\Core\Cache\CacheableMetadata;
use Drupal\Core\Cache\CacheableResponse;
use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Session\AnonymousUserSession;
use Drupal\Core\Url;
use Drupal\node\NodeInterface;
use Drupal\taxonomy\TermInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * Builds a small public sitemap without requiring an extra Drupal module.
 */
final class SitemapController extends ControllerBase {

  public function __construct(
    EntityTypeManagerInterface $entityTypeManager,
    private readonly RequestStack $requestStack,
  ) {
    $this->entityTypeManager = $entityTypeManager;
  }

  public static function create(ContainerInterface $container): static {
    return new static(
      $container->get('entity_type.manager'),
      $container->get('request_stack'),
    );
  }

  public function view(): CacheableResponse {
    $request = $this->requestStack->getCurrentRequest();
    $origin = $request?->getSchemeAndHttpHost() ?: 'https://portal.rockeskolen.com';
    $urls = [
      $origin . '/',
      $origin . '/musikkteori',
      $origin . '/verktoy',
      $origin . '/musikk-i-praksis',
    ];
    $lastmod = [];
    $anonymous = new AnonymousUserSession();
    $cacheability = (new CacheableMetadata())
      ->addCacheTags(['node_list', 'taxonomy_term_list:artikkelserier'])
      ->setCacheMaxAge(3600);

    $node_storage = $this->entityTypeManager->getStorage('node');
    $node_ids = $node_storage->getQuery()
      ->accessCheck(FALSE)
      ->condition('status', NodeInterface::PUBLISHED)
      ->sort('nid')
      ->execute();
    foreach ($node_storage->loadMultiple($node_ids) as $node) {
      $access = $node->access('view', $anonymous, TRUE);
      $cacheability->addCacheableDependency($node)->addCacheableDependency($access);
      if (!$access->isAllowed()) {
        continue;
      }
      $url = $node->toUrl('canonical', ['absolute' => TRUE])->toString();
      $urls[] = $url;
      $lastmod[$url] = gmdate('Y-m-d', $node->getChangedTime());
    }

    $term_storage = $this->entityTypeManager->getStorage('taxonomy_term');
    $term_ids = $term_storage->getQuery()
      ->accessCheck(FALSE)
      ->condition('vid', 'artikkelserier')
      ->condition('status', 1)
      ->execute();
    foreach ($term_storage->loadMultiple($term_ids) as $term) {
      if (!$term instanceof TermInterface || !$term->access('view', $anonymous)) {
        continue;
      }
      $published = $node_storage->getQuery()
        ->accessCheck(FALSE)
        ->condition('status', NodeInterface::PUBLISHED)
        ->condition('field_artikkelserie.target_id', $term->id())
        ->range(0, 1)
        ->execute();
      if ($published === []) {
        continue;
      }
      $cacheability->addCacheableDependency($term);
      $urls[] = Url::fromRoute('rockeskolen_structure_qa.article_series', [
        'taxonomy_term' => $term->id(),
      ], ['absolute' => TRUE])->toString();
    }

    $items = '';
    foreach (array_values(array_unique($urls)) as $url) {
      $escaped = htmlspecialchars($url, ENT_XML1 | ENT_QUOTES, 'UTF-8');
      $modified = isset($lastmod[$url]) ? '<lastmod>' . $lastmod[$url] . '</lastmod>' : '';
      $items .= "  <url><loc>{$escaped}</loc>{$modified}</url>\n";
    }
    $xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
      . "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n"
      . $items
      . "</urlset>\n";
    $response = new CacheableResponse($xml, 200, ['Content-Type' => 'application/xml; charset=UTF-8']);
    $response->addCacheableDependency($cacheability);
    return $response;
  }

}
