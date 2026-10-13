<?php

declare(strict_types=1);

namespace Drupal\rockeskolen_structure_qa\Controller;

use Drupal\Component\Utility\Unicode;
use Drupal\Core\Cache\CacheableMetadata;
use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Language\LanguageManagerInterface;
use Drupal\Core\Pager\PagerManagerInterface;
use Drupal\Core\Url;
use Drupal\node\NodeInterface;
use Drupal\taxonomy\TermInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * Builds the dynamic landing page for practical music articles.
 */
final class MusicPracticeController extends ControllerBase {

  private const PAGE_SIZE = 12;

  private const CATEGORY_ORDER = [
    'Låtskriving',
    'Musikkproduksjon',
    'Utgivelse og distribusjon',
    'Markedsføring',
    'Rettigheter og økonomi',
  ];

  public function __construct(
    EntityTypeManagerInterface $entityTypeManager,
    LanguageManagerInterface $languageManager,
    private readonly RequestStack $requestStack,
    private readonly PagerManagerInterface $pagerManager,
  ) {
    $this->entityTypeManager = $entityTypeManager;
    $this->languageManager = $languageManager;
  }

  public static function create(ContainerInterface $container): static {
    return new static(
      $container->get('entity_type.manager'),
      $container->get('language_manager'),
      $container->get('request_stack'),
      $container->get('pager.manager'),
    );
  }

  /**
   * Returns the access-aware, filterable article archive.
   */
  public function view(): array {
    $cacheability = (new CacheableMetadata())
      ->addCacheTags([
        'node_list:musikk_i_praksis',
        'taxonomy_term_list:artikkelserier',
        'taxonomy_term_list:musikk_i_praksis',
      ])
      ->addCacheContexts([
        'languages:language_content',
        'url.query_args:page',
        'url.query_args:tema',
        'user.node_grants:view',
        'user.permissions',
      ]);

    $categories = $this->loadTerms('musikk_i_praksis', $cacheability);
    usort($categories, static function (TermInterface $left, TermInterface $right): int {
      $left_order = array_search($left->label(), self::CATEGORY_ORDER, TRUE);
      $right_order = array_search($right->label(), self::CATEGORY_ORDER, TRUE);
      return ($left_order === FALSE ? PHP_INT_MAX : $left_order)
        <=> ($right_order === FALSE ? PHP_INT_MAX : $right_order)
        ?: strnatcasecmp($left->label(), $right->label());
    });

    $requested_category = (string) ($this->requestStack->getCurrentRequest()?->query->get('tema') ?? '');
    $active_category = NULL;
    foreach ($categories as $category) {
      if ($requested_category !== '' && hash_equals((string) $category->id(), $requested_category)) {
        $active_category = $category;
        break;
      }
    }

    $category_items = [];
    foreach ($categories as $category) {
      $count = $this->articleIdsForTerm('field_praksis', $category, $cacheability);
      $url = Url::fromRoute('rockeskolen_structure_qa.music_practice', [], [
        'query' => ['tema' => $category->id()],
      ])->toString(TRUE);
      $cacheability->addCacheableDependency($url);
      $category_items[] = [
        'name' => $category->label(),
        'count' => count($count),
        'url' => $url->getGeneratedUrl(),
        'active' => $active_category?->id() === $category->id(),
      ];
    }

    $series_items = [];
    foreach ($this->loadTerms('artikkelserier', $cacheability) as $series_term) {
      $series_ids = $this->articleIdsForTerm('field_artikkelserie', $series_term, $cacheability);
      if ($series_ids === []) {
        continue;
      }
      $url = Url::fromRoute('rockeskolen_structure_qa.article_series', [
        'taxonomy_term' => $series_term->id(),
      ])->toString(TRUE);
      $cacheability->addCacheableDependency($url);
      $description = $this->termDescription($series_term);
      $series_items[] = [
        'name' => $series_term->label(),
        'description' => $description !== ''
          ? $description
          : $this->t('Følg serien del for del, fra første steg til ferdig resultat.'),
        'count_label' => $this->formatPlural(count($series_ids), '1 artikkel', '@count artikler'),
        'url' => $url->getGeneratedUrl(),
      ];
    }

    $node_storage = $this->entityTypeManager->getStorage('node');
    $query = $node_storage->getQuery()
      ->accessCheck(TRUE)
      ->condition('type', 'musikk_i_praksis')
      ->condition('status', NodeInterface::PUBLISHED)
      ->sort('changed', 'DESC')
      ->sort('nid', 'DESC');
    if ($active_category !== NULL) {
      $query->condition('field_praksis.target_id', $active_category->id());
    }
    $ids = $query->execute();
    $accessible_nodes = [];
    foreach ($node_storage->loadMultiple($ids) as $node) {
      $node = $this->translatedNode($node);
      $access = $node->access('view', NULL, TRUE);
      $cacheability->addCacheableDependency($node)->addCacheableDependency($access);
      if ($access->isAllowed()) {
        $accessible_nodes[] = $node;
      }
    }

    $total = count($accessible_nodes);
    $pager = $this->pagerManager->createPager($total, self::PAGE_SIZE);
    $offset = $pager->getCurrentPage() * self::PAGE_SIZE;
    $cards = [];
    foreach (array_slice($accessible_nodes, $offset, self::PAGE_SIZE) as $node) {
      $cards[] = $this->articleCard($node, $cacheability);
    }

    $build = [
      '#theme' => 'rockeskolen_music_practice',
      '#series' => $series_items,
      '#categories' => $category_items,
      '#active_category' => $active_category?->label(),
      '#article_count_label' => $this->formatPlural($total, '1 artikkel', '@count artikler'),
      '#cards' => $cards,
      '#pager' => ['#type' => 'pager'],
      '#empty' => $this->t('Det finnes ingen publiserte artikler i dette temaet ennå.'),
      '#attached' => ['library' => ['rockeskolen_structure_qa/music-practice']],
    ];
    $cacheability->applyTo($build);
    return $build;
  }

  /**
   * Loads translated and viewable terms from a vocabulary.
   */
  private function loadTerms(string $vocabulary, CacheableMetadata $cacheability): array {
    $storage = $this->entityTypeManager->getStorage('taxonomy_term');
    $ids = $storage->getQuery()
      ->accessCheck(TRUE)
      ->condition('vid', $vocabulary)
      ->condition('status', 1)
      ->sort('weight')
      ->sort('name')
      ->execute();
    $terms = [];
    foreach ($storage->loadMultiple($ids) as $term) {
      $term = $this->translatedTerm($term);
      $access = $term->access('view', NULL, TRUE);
      $cacheability->addCacheableDependency($term)->addCacheableDependency($access);
      if ($access->isAllowed()) {
        $terms[] = $term;
      }
    }
    return $terms;
  }

  /**
   * Returns unique, accessible published article IDs for a referenced term.
   */
  private function articleIdsForTerm(string $field, TermInterface $term, CacheableMetadata $cacheability): array {
    $ids = $this->entityTypeManager->getStorage('node')->getQuery()
      ->accessCheck(TRUE)
      ->condition('type', 'musikk_i_praksis')
      ->condition('status', NodeInterface::PUBLISHED)
      ->condition("{$field}.target_id", $term->id())
      ->execute();
    $accessible_ids = [];
    foreach ($this->entityTypeManager->getStorage('node')->loadMultiple($ids) as $node) {
      $access = $node->access('view', NULL, TRUE);
      $cacheability->addCacheableDependency($node)->addCacheableDependency($access);
      if ($access->isAllowed()) {
        $accessible_ids[] = (int) $node->id();
      }
    }
    return array_values(array_unique($accessible_ids));
  }

  /**
   * Builds one article card from existing fields.
   */
  private function articleCard(NodeInterface $node, CacheableMetadata $cacheability): array {
    $image = NULL;
    if ($node->hasField('field_bilde') && !$node->get('field_bilde')->isEmpty() && $node->get('field_bilde')->access('view')) {
      $image = $this->entityTypeManager->getViewBuilder('node')->viewField(
        $node->get('field_bilde'),
        [
          'label' => 'hidden',
          'type' => 'entity_reference_entity_view',
          'settings' => ['view_mode' => 'teaser'],
        ],
      );
    }

    $categories = [];
    if ($node->hasField('field_praksis') && $node->get('field_praksis')->access('view')) {
      foreach ($node->get('field_praksis')->referencedEntities() as $category) {
        if (!$category instanceof TermInterface) {
          continue;
        }
        $category = $this->translatedTerm($category);
        $access = $category->access('view', NULL, TRUE);
        $cacheability->addCacheableDependency($category)->addCacheableDependency($access);
        if ($access->isAllowed()) {
          $categories[] = $category->label();
        }
      }
    }

    $series = NULL;
    $part = NULL;
    if ($node->hasField('field_artikkelserie') && $node->get('field_artikkelserie')->access('view')) {
      $series_term = $node->get('field_artikkelserie')->entity;
      if ($series_term instanceof TermInterface) {
        $series_term = $this->translatedTerm($series_term);
        $access = $series_term->access('view', NULL, TRUE);
        $cacheability->addCacheableDependency($series_term)->addCacheableDependency($access);
        if ($access->isAllowed()) {
          $series = $series_term->label();
          if ($node->hasField('field_delnummer') && !$node->get('field_delnummer')->isEmpty() && $node->get('field_delnummer')->access('view')) {
            $part = (int) $node->get('field_delnummer')->value;
          }
        }
      }
    }

    return [
      '#theme' => 'rockeskolen_music_practice_card',
      '#node' => $node,
      '#summary' => $this->summary($node),
      '#image' => $image,
      '#url' => $node->toUrl()->toString(),
      '#categories' => $categories,
      '#series' => $series,
      '#part' => $part,
    ];
  }

  private function summary(NodeInterface $node): string {
    if ($node->hasField('field_ingress') && !$node->get('field_ingress')->isEmpty() && $node->get('field_ingress')->access('view')) {
      return trim((string) $node->get('field_ingress')->value);
    }
    if ($node->hasField('field_body') && !$node->get('field_body')->isEmpty() && $node->get('field_body')->access('view')) {
      $item = $node->get('field_body')->first();
      return Unicode::truncate(trim(strip_tags((string) ($item->summary ?: $item->value))), 220, TRUE, TRUE);
    }
    return '';
  }

  private function termDescription(TermInterface $term): string {
    if (!$term->hasField('description') || $term->get('description')->isEmpty() || !$term->get('description')->access('view')) {
      return '';
    }
    return trim(strip_tags((string) $term->get('description')->value));
  }

  private function translatedTerm(TermInterface $term): TermInterface {
    $langcode = $this->languageManager->getCurrentLanguage()->getId();
    return $term->hasTranslation($langcode) ? $term->getTranslation($langcode) : $term;
  }

  private function translatedNode(NodeInterface $node): NodeInterface {
    $langcode = $this->languageManager->getCurrentLanguage()->getId();
    return $node->hasTranslation($langcode) ? $node->getTranslation($langcode) : $node;
  }

}
