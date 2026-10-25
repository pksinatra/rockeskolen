<?php

declare(strict_types=1);

namespace Drupal\rockeskolen_structure_qa;

use Drupal\Component\Utility\Html;
use Drupal\Core\Cache\CacheableMetadata;
use Drupal\Core\Render\Markup;
use Drupal\Core\Template\Attribute;
use Drupal\Core\Url;
use Drupal\node\NodeInterface;
use Drupal\taxonomy\TermInterface;

/**
 * Shows each music-theory topic on /musikkteori as a learning path.
 *
 * Adds the number of parts, how many of them have interactive examples, a link
 * to part 1 and, where one exists, the matching course in rs_kurs.
 */
final class TheoryPathPresentation {

  /**
   * Courses that supplement a topic, keyed by musikkteori term ID.
   */
  private const COURSES = [
    35 => 'musikkteori',
    120 => 'rytme',
  ];

  /**
   * Tools to practise a topic in, keyed by musikkteori term ID.
   */
  private const TOOLS = [
    36 => ['url' => 'https://rockeskolen.com/tools/intervals/', 'label' => 'Øv i intervallverktøyet'],
  ];

  public static function fields(array &$variables): void {
    $view = $variables['view'];
    $term = $variables['row']->_entity ?? NULL;
    if ($view->id() !== 'musikkteori' || $view->current_display !== 'page_1'
      || !$term instanceof TermInterface || !isset($variables['fields']['description__value'])) {
      return;
    }

    $cache = (new CacheableMetadata())
      ->setCacheTags(['node_list:musikkteori'])
      ->addCacheContexts(['languages:language_content', 'user.node_grants:view', 'user.permissions']);
    $storage = \Drupal::entityTypeManager()->getStorage('node');
    $ids = $storage->getQuery()
      ->accessCheck(TRUE)
      ->condition('type', 'musikkteori')
      ->condition('status', NodeInterface::PUBLISHED)
      ->condition('field_musikkteori.target_id', $term->id())
      ->execute();

    $parts = [];
    foreach ($storage->loadMultiple($ids) as $node) {
      $access = $node->access('view', NULL, TRUE);
      $cache->addCacheableDependency($access);
      if ($access->isAllowed()) {
        $parts[] = $node;
      }
    }
    if ($parts === []) {
      return;
    }
    usort($parts, static fn(NodeInterface $a, NodeInterface $b): int =>
      ((rockeskolen_structure_qa_part_number($a) ?? PHP_INT_MAX) <=> (rockeskolen_structure_qa_part_number($b) ?? PHP_INT_MAX))
      ?: ((int) $a->id() <=> (int) $b->id()));

    $interactive = count(array_filter($parts, static fn(NodeInterface $node): bool =>
      $node->hasField('field_body') && str_contains((string) $node->get('field_body')->value, '<iframe')));
    $total = count($parts);
    $meta = $total === 1 ? '1 del' : $total . ' deler';
    if ($interactive === $total) {
      $meta .= $total === 1 ? ' · med interaktive eksempler' : ' · alle med interaktive eksempler';
    }
    elseif ($interactive > 0) {
      $meta .= ' · ' . $interactive . ' med interaktive eksempler';
    }

    $first = $parts[0];
    $first_url = $first->toUrl()->toString(TRUE);
    $cache->addCacheableDependency($first_url);
    $html = '<p class="rs-theory-path__meta"><span class="rs-theory-path__label">Læringssti</span> ' . Html::escape($meta) . '</p>'
      . '<a class="rs-theory-path__start" href="' . Html::escape($first_url->getGeneratedUrl()) . '">'
      . '<span>Start med del 1</span> ' . Html::escape(self::plainTitle($first->label())) . '</a>';

    if (isset(self::TOOLS[(int) $term->id()])) {
      $tool = self::TOOLS[(int) $term->id()];
      $html .= '<a class="rs-theory-path__course" href="' . Html::escape($tool['url']) . '">' . Html::escape($tool['label']) . '</a>';
    }

    $course = self::course((int) $term->id(), $cache);
    if ($course !== NULL) {
      $html .= '<a class="rs-theory-path__course" href="' . Html::escape($course['url']) . '">'
        . 'Øv videre i kurset «' . Html::escape($course['title']) . '»</a>';
    }

    $field = clone $variables['fields']['description__value'];
    $field->element_type = 'div';
    $field->wrapper_attributes = new Attribute(['class' => ['views-field', 'rs-theory-path']]);
    $render = [
      '#markup' => Markup::create($html),
      '#attached' => ['library' => ['rockeskolen_structure_qa/theory-paths']],
    ];
    $cache->applyTo($render);
    $field->content = $render;

    $fields = [];
    foreach ($variables['fields'] as $id => $existing) {
      if ($id === 'view_taxonomy_term') {
        $fields['theory_path'] = $field;
      }
      $fields[$id] = $existing;
    }
    $fields['theory_path'] ??= $field;
    $variables['fields'] = $fields;
  }

  /**
   * Strips a leading or trailing emoji or symbol from an article title.
   */
  private static function plainTitle(string $title): string {
    return trim((string) preg_replace('/^[\s\x{FE0F}\x{200D}\p{So}\p{Sk}]+|[\s\x{FE0F}\x{200D}\p{So}\p{Sk}]+$/u', '', $title)) ?: $title;
  }

  /**
   * Returns the supplementing course, if the rs_kurs module offers it.
   */
  private static function course(int $term_id, CacheableMetadata $cache): ?array {
    $class = '\Drupal\rs_kurs\CourseRegistry';
    if (!isset(self::COURSES[$term_id]) || !class_exists($class)) {
      return NULL;
    }
    $course = $class::bySlug(self::COURSES[$term_id]);
    if ($course === NULL) {
      return NULL;
    }
    $url = Url::fromUserInput('/kurs/' . $course['slug'])->toString(TRUE);
    $cache->addCacheableDependency($url);
    return ['title' => $course['title'], 'url' => $url->getGeneratedUrl()];
  }

}
