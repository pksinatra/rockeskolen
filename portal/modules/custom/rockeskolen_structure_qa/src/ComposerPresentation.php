<?php

declare(strict_types=1);

namespace Drupal\rockeskolen_structure_qa;

use Drupal\Core\Cache\CacheableMetadata;
use Drupal\node\NodeInterface;

/**
 * Presents existing composer data without modifying editorial content.
 */
final class ComposerPresentation {

  public static function year(string $date): ?int {
    return preg_match('/(?<!\d)(\d{3,4})(?!\d)/u', $date, $match) ? (int) $match[1] : NULL;
  }

  private static function text(NodeInterface $node, string $field, CacheableMetadata $cache): string {
    if (!$node->hasField($field)) {
      return '';
    }
    $items = $node->get($field);
    $access = $items->access('view', NULL, TRUE);
    $cache->addCacheableDependency($access);
    return $access->isAllowed() && !$items->isEmpty() ? trim((string) $items->value) : '';
  }

  /**
   * Builds a chronological presentation of the Views result, with field access.
   */
  public static function overview(array &$variables): void {
    $view = $variables['view'];
    $current = \Drupal::routeMatch()->getParameter('node');
    $neighbors = $view->current_display === 'block_1' && $current instanceof NodeInterface && $current->bundle() === 'komponister';
    if ($view->id() !== 'komponister' || ($view->current_display !== 'page_1' && !$neighbors)) {
      return;
    }
    $cache = (new CacheableMetadata())->setCacheTags(['node_list:komponister', 'taxonomy_term_list']);
    $cards = [];
    $periods = [];
    foreach ($view->result as $row) {
      $node = $row->_entity;
      $access = $node->access('view', NULL, TRUE);
      $cache->addCacheableDependency($node)->addCacheableDependency($access);
      if (!$access->isAllowed()) {
        continue;
      }
      $birth = self::text($node, 'field_fodt', $cache);
      $death = self::text($node, 'field_dod', $cache);
      $era = [];
      $field = $node->get('field_musikkhistorie');
      $era_access = $field->access('view', NULL, TRUE);
      $cache->addCacheableDependency($era_access);
      if ($era_access->isAllowed()) {
        foreach ($field->referencedEntities() as $term) {
          $term_access = $term->access('view', NULL, TRUE);
          $cache->addCacheableDependency($term)->addCacheableDependency($term_access);
          if ($term_access->isAllowed()) {
            $era[] = $term->label();
            $periods[$term->label()] = $term->label();
          }
        }
      }
      $image = $node->get('field_bilde')->view(['label' => 'hidden', 'type' => 'media_thumbnail', 'settings' => ['image_style' => 'max_650x650', 'image_link' => '', 'image_loading' => ['attribute' => 'lazy']]]);
      $url = $node->toUrl()->toString(TRUE);
      $cache->addCacheableDependency($url);
      $cards[] = [
        'id' => $node->id(), 'title' => $node->label(), 'url' => $url->getGeneratedUrl(), 'image' => $image,
        'birth' => $birth, 'death' => self::year($death) ? $death : '',
        'year' => self::year($birth), 'period' => implode(' · ', $era),
        'nationality' => self::text($node, 'field_nasjonalitet', $cache),
        'summary' => self::text($node, 'field_ingress', $cache),
      ];
    }
    usort($cards, static fn(array $a, array $b): int => (($a['year'] ?? PHP_INT_MAX) <=> ($b['year'] ?? PHP_INT_MAX)) ?: strnatcasecmp($a['title'], $b['title']));
    if ($neighbors) {
      $cache->addCacheContexts(['route'])->addCacheableDependency($current);
      $position = array_search($current->id(), array_column($cards, 'id'));
      $variables['rows'] = [
        '#theme' => 'rockeskolen_composer_neighbors',
        '#previous' => $position !== FALSE && $position > 0 ? $cards[$position - 1] : NULL,
        '#next' => $position !== FALSE ? ($cards[$position + 1] ?? NULL) : NULL,
        '#attached' => ['library' => ['rockeskolen_structure_qa/composers']],
      ];
      $cache->applyTo($variables['rows']);
      return;
    }
    $variables['rows'] = [
      '#theme' => 'rockeskolen_composers', '#cards' => $cards, '#periods' => array_values($periods),
      '#attached' => ['library' => ['rockeskolen_structure_qa/composers']],
    ];
    $cache->applyTo($variables['rows']);
  }

  /**
   * Groups Drupal's own rendered fields, retaining filtering and field access.
   */
  public static function profile(array &$variables): void {
    $node = $variables['node'];
    $cache = CacheableMetadata::createFromObject($node);
    $groups = [
      'intro' => ['field_ingress', 'field_bilde'],
      'facts' => ['field_kallenavn_rolle', 'field_musikkhistorie', 'field_fodt', 'field_dod', 'field_fodt_i', 'field_nasjonalitet', 'field_virket_hovedsakelig_i', 'field_hovedinstrument'],
      'body' => ['field_body'],
      'listening' => ['field_hva_bor_du_lytte_etter', 'field_kjente_verk', 'field_sjanger_form', 'field_hvorfor_er_denne_komponist'],
      'connections' => ['field_relasjoner', 'field_elever_og_etterfolgere', 'field_samtidskomponister'],
      'sources' => ['field_kilder_referanser', 'field_url'],
    ];
    $profile = ['#theme' => 'rockeskolen_composer_profile', '#weight' => -10, '#attached' => ['library' => ['rockeskolen_structure_qa/composers']]];
    foreach ($groups as $group => $fields) {
      $profile['#' . $group] = [];
      foreach ($fields as $name) {
        if (!isset($variables['content'][$name]) || !$node->hasField($name)) {
          continue;
        }
        $field = $node->get($name);
        $access = $field->access('view', NULL, TRUE);
        $cache->addCacheableDependency($access);
        if (!$field->isEmpty() && $access->isAllowed()) {
          $render = $variables['content'][$name];
          $render['#label_display'] = in_array($group, ['intro', 'body'], TRUE) ? 'hidden' : 'above';
          $profile['#' . $group][] = $render;
        }
        unset($variables['content'][$name]);
      }
    }
    $profile['#birth'] = self::text($node, 'field_fodt', $cache);
    $death = self::text($node, 'field_dod', $cache);
    $profile['#death'] = self::year($death) ? $death : '';
    $cache->applyTo($profile);
    $variables['content']['composer_profile'] = $profile;
  }

}
