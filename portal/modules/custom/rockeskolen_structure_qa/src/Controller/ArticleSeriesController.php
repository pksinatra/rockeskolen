<?php

declare(strict_types=1);

namespace Drupal\rockeskolen_structure_qa\Controller;

use Drupal\Component\Utility\Unicode;
use Drupal\Core\Cache\Cache;
use Drupal\Core\Cache\CacheableMetadata;
use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Language\LanguageManagerInterface;
use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\Core\Url;
use Drupal\node\NodeInterface;
use Drupal\taxonomy\TermInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Displays a reusable overview of the articles assigned to a series term.
 */
final class ArticleSeriesController extends ControllerBase {

  public function __construct(
    EntityTypeManagerInterface $entityTypeManager,
    LanguageManagerInterface $languageManager,
  ) {
    $this->entityTypeManager = $entityTypeManager;
    $this->languageManager = $languageManager;
  }

  public static function create(ContainerInterface $container): static {
    return new static(
      $container->get('entity_type.manager'),
      $container->get('language_manager'),
    );
  }

  /**
   * Returns the translated page title.
   */
  public function title(TermInterface $taxonomy_term): string {
    return $this->translatedTerm($taxonomy_term)->label();
  }

  /**
   * Builds an access-aware, automatically sorted article series.
   */
  public function view(TermInterface $taxonomy_term): array {
    if ($taxonomy_term->bundle() !== 'artikkelserier') {
      throw new NotFoundHttpException();
    }

    $term = $this->translatedTerm($taxonomy_term);
    $storage = $this->entityTypeManager->getStorage('node');
    $ids = $storage->getQuery()
      ->accessCheck(TRUE)
      ->condition('status', NodeInterface::PUBLISHED)
      ->condition('field_artikkelserie.target_id', $term->id())
      ->sort('field_delnummer.value', 'ASC')
      ->sort('title', 'ASC')
      ->execute();

    $cards = [];
    $cacheability = CacheableMetadata::createFromObject($term)
      ->addCacheTags(['node_list'])
      ->addCacheContexts(['languages:language_content', 'user.node_grants:view', 'user.permissions']);

    foreach ($storage->loadMultiple($ids) as $node) {
      $node = $this->translatedNode($node);
      $access = $node->access('view', NULL, TRUE);
      $cacheability->addCacheableDependency($node)->addCacheableDependency($access);
      if (!$access->isAllowed()) {
        continue;
      }

      $part = !$node->get('field_delnummer')->isEmpty()
        ? (int) $node->get('field_delnummer')->value
        : NULL;
      $summary = $this->summary($node);
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

      $cards[] = [
        '#theme' => 'rockeskolen_article_series_card',
        '#node' => $node,
        '#part' => $part,
        '#summary' => $summary,
        '#image' => $image,
        '#url' => $node->toUrl()->toString(),
      ];
    }

    $count = count($cards);
    $description = NULL;
    if ($term->hasField('description') && !$term->get('description')->isEmpty()) {
      $description = $term->get('description')->view(['label' => 'hidden']);
    }

    $build = [
      '#theme' => 'rockeskolen_article_series',
      '#term' => $term,
      '#description' => $description,
      '#article_count' => $count,
      '#article_count_label' => $this->formatPlural($count, '1 artikkel', '@count artikler'),
      '#cards' => $cards,
      '#empty' => $this->t('Det er ingen publiserte artikler i denne serien ennå.'),
      '#attached' => ['library' => ['rockeskolen_structure_qa/article-series']],
      '#cache' => [
        'tags' => Cache::mergeTags($term->getCacheTags(), ['node_list']),
        'contexts' => ['languages:language_content', 'url.path', 'user.node_grants:view', 'user.permissions'],
      ],
    ];
    $cacheability->applyTo($build);
    return $build;
  }

  private function translatedTerm(TermInterface $term): TermInterface {
    $langcode = $this->languageManager->getCurrentLanguage()->getId();
    return $term->hasTranslation($langcode) ? $term->getTranslation($langcode) : $term;
  }

  private function translatedNode(NodeInterface $node): NodeInterface {
    $langcode = $this->languageManager->getCurrentLanguage()->getId();
    return $node->hasTranslation($langcode) ? $node->getTranslation($langcode) : $node;
  }

  private function summary(NodeInterface $node): string {
    if ($node->hasField('field_ingress') && !$node->get('field_ingress')->isEmpty() && $node->get('field_ingress')->access('view')) {
      return trim((string) $node->get('field_ingress')->value);
    }
    if ($node->hasField('field_body') && !$node->get('field_body')->isEmpty() && $node->get('field_body')->access('view')) {
      $item = $node->get('field_body')->first();
      $text = trim(strip_tags((string) ($item->summary ?: $item->value)));
      return Unicode::truncate($text, 220, TRUE, TRUE);
    }
    return '';
  }

}
