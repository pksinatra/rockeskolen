<?php

declare(strict_types=1);

namespace Drupal\rockeskolen_structure_qa\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Adds canonical, SEO and social-sharing metadata to public portal pages.
 */
final class CanonicalResponseSubscriber implements EventSubscriberInterface {

  /**
   * Replaces incomplete or internal metadata with one public, consistent set.
   */
  public function onResponse(ResponseEvent $event): void {
    if (!$event->isMainRequest()) {
      return;
    }

    $request = $event->getRequest();
    if ($request->getHost() !== 'portal.rockeskolen.com') {
      return;
    }

    $response = $event->getResponse();
    $contentType = $response->headers->get('Content-Type', '');
    $content = $response->getContent();
    if (!str_contains($contentType, 'text/html') || !is_string($content)) {
      return;
    }

    $path = '/' . trim($request->getPathInfo(), '/');
    $path = $path === '/' ? '/' : rtrim($path, '/');
    $canonical = 'https://portal.rockeskolen.com' . ($path === '/' ? '/' : $path);

    $content = $this->addSchoolNavigation($content);
    $content = $this->rewriteToolLinks($content);
    $content = $this->enhanceTheoryArticleNavigation($content, $request);
    if ($path === '/') {
      $content = $this->enhanceFrontPage($content);
      $content = $this->rewriteFrontPageAuthState($content);
    }
    elseif ($path === '/verktoy') {
      $content = $this->enhanceToolsPage($content);
    }

    $title = 'Rockeskolen Portal';
    if (preg_match('/<title>(.*?)<\/title>/is', $content, $title_match) === 1) {
      $title = trim(html_entity_decode(strip_tags($title_match[1]), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
    }

    $description = $this->descriptionForPath($path);
    $is_composer = $path === '/komponister' || str_starts_with($path, '/komponister/');
    $image = $is_composer
      ? 'https://portal.rockeskolen.com/sites/default/files/share/komponister.jpg'
      : 'https://portal.rockeskolen.com/sites/default/files/share/rockeskolen-portal.jpg';
    $image_alt = $is_composer
      ? 'Komponister – møt menneskene som formet musikken'
      : 'Rockeskolen Portal – musikkunnskap, verktøy og skaperglede';

    $patterns = [
      '/<link\s+rel=["\']canonical["\'][^>]*>\s*/i',
      '/<meta\s+name=["\']description["\'][^>]*>\s*/i',
      '/<meta\s+(?:property|name)=["\'](?:og:|twitter:)[^"\']+["\'][^>]*>\s*/i',
    ];
    $content = preg_replace($patterns, '', $content);
    if (!is_string($content)) {
      return;
    }

    $meta = $this->buildMeta($title, $description, $canonical, $image, $image_alt);
    $response->setContent(str_replace('</head>', $meta . '</head>', $content));
  }

  /**
   * Adds the launch-critical school route without changing Drupal menu state.
   */
  private function addSchoolNavigation(string $content): string {
    if (str_contains($content, 'data-rockeskolen-school-link')) {
      return $content;
    }

    $school_link = <<<'HTML'
<li class="menu-item menu-item-level-1" data-rockeskolen-school-link>
  <a href="https://rockeskolen.com/skoler/">For skoler</a>
</li>
HTML;

    $updated = preg_replace(
      '/(<li class="menu-item menu-item-level-1">\s*<a href="\/om-portalen")/i',
      $school_link . '$1',
      $content,
      1,
    );
    return is_string($updated) ? $updated : $content;
  }

  /**
   * Sends public tool links to the web root where the applications live.
   */
  private function rewriteToolLinks(string $content): string {
    $updated = preg_replace(
      '#href=(["\'])(?:https://portal\.rockeskolen\.com)?/tools/#i',
      'href=$1https://rockeskolen.com/tools/',
      $content,
    );
    return is_string($updated) ? $updated : $content;
  }

  /**
   * Adds category-scoped article links and the complete theory-section list.
   */
  private function enhanceTheoryArticleNavigation(
    string $content,
    \Symfony\Component\HttpFoundation\Request $request,
  ): string {
    if (str_contains($content, 'data-rs-theory-navigation')) {
      return $content;
    }
    $node = $request->attributes->get('node');
    if (!$node instanceof \Drupal\node\NodeInterface
      || !in_array($node->bundle(), ['musikkteori', 'verktoy'], TRUE)) {
      return $content;
    }
    $is_tool = $node->bundle() === 'verktoy';
    $field = $is_tool ? 'field_tema_verktoy' : 'field_musikkteori';
    if (!$node->hasField($field) || $node->get($field)->isEmpty()) {
      return $content;
    }
    $category_id = (int) $node->get($field)->target_id;
    $entity_type_manager = \Drupal::entityTypeManager();
    $term_storage = $entity_type_manager->getStorage('taxonomy_term');
    $category = $term_storage->load($category_id);
    if (!$category) {
      return $content;
    }

    $node_storage = $entity_type_manager->getStorage('node');
    $related_query = $node_storage->getQuery()
      ->accessCheck(TRUE)
      ->condition('type', $node->bundle())
      ->condition('status', 1)
      ->condition($field . '.target_id', $category_id);
    if (!$is_tool) {
      $related_query->condition('nid', $node->id(), '<>');
    }
    $related_ids = $related_query->sort($is_tool ? 'title' : 'nid', 'ASC')->execute();
    $escape = static fn(string $value): string => htmlspecialchars(
      $value,
      ENT_QUOTES | ENT_SUBSTITUTE,
      'UTF-8',
    );

    $cards = '';
    foreach ($node_storage->loadMultiple($related_ids) as $related) {
      $ingress = $related->hasField('field_ingress') && !$related->get('field_ingress')->isEmpty()
        ? trim((string) $related->get('field_ingress')->value)
        : '';
      $cards .= '<a class="rs-theory-article-card" href="' . $escape($related->toUrl()->toString()) . '">'
        . '<strong>' . $escape($related->label()) . '</strong>'
        . ($ingress !== '' ? '<span>' . $escape($ingress) . '</span>' : '')
        . '</a>';
    }
    if ($cards === '') {
      $cards = $is_tool ? '<p>Ingen publiserte verktøy i denne kategorien.</p>' : '<p>Det finnes foreløpig ingen andre artikler i denne teoridelen.</p>';
    }

    $sections = '';
    foreach ($term_storage->loadTree($category->bundle()) as $term) {
      $url = \Drupal\Core\Url::fromRoute('entity.taxonomy_term.canonical', [
        'taxonomy_term' => $term->tid,
      ])->toString();
      $active = (int) $term->tid === $category_id
        ? ' class="active" aria-current="page"'
        : '';
      $sections .= '<li><a href="' . $escape($url) . '"' . $active . '>' . $escape($term->name) . '</a></li>';
    }

    $related_section = '<section class="rs-theory-related" aria-labelledby="rs-theory-related-title">'
      . '<p class="rs-theory-kicker">' . ($is_tool ? 'I samme verktøykategori' : 'I samme teoridel') . '</p>'
      . '<h2 id="rs-theory-related-title">' . ($is_tool ? 'Alle verktøy i ' : 'Flere artikler om ') . $escape($category->label()) . '</h2>'
      . '<div class="rs-theory-article-grid">' . $cards . '</div></section>';
    $category_section = '<section class="rs-theory-sections" aria-labelledby="rs-theory-sections-title">'
      . '<p class="rs-theory-kicker">' . ($is_tool ? 'Verktøykassen' : 'Skolebenken') . '</p><h2 id="rs-theory-sections-title">' . ($is_tool ? 'Alle verktøykategorier' : 'Velg teoridel') . '</h2>'
      . '<ul>' . $sections . '</ul></section>';
    $navigation = '<nav class="rs-theory-navigation" data-rs-theory-navigation aria-label="' . ($is_tool ? 'Navigasjon i verktøy' : 'Navigasjon i musikkteori') . '">'
      . ($is_tool ? $category_section . $related_section : $related_section . $category_section)
      . '</nav>';

    $updated = preg_replace('/<\/article>/', $navigation . '</article>', $content, 1);
    return is_string($updated) ? $updated : $content;
  }

  /**
   * Replaces the legacy two-paragraph front page with the pilot user journey.
   */
  private function enhanceFrontPage(string $content): string {
    if (str_contains($content, 'data-rockeskolen-pilot-front')) {
      return $content;
    }

    $catalog = $this->renderToolCatalog('Alle musikkverktøy', 'Åpne verktøyet');
    $front = <<<'HTML'
<div class="rs-pilot-front" data-rockeskolen-pilot-front>
  <section class="rs-pilot-hero" aria-labelledby="rs-pilot-title">
    <div class="rs-pilot-hero-copy">
      <p class="rs-kicker">Rockeskolens Digitale Øvingsrom</p>
      <h1 id="rs-pilot-title">Spill. Forstå. Skap.</h1>
      <p class="rs-lead">Praktiske musikkverktøy, øvelser og læringsressurser for elever, lærere og alle som vil utforske musikk.</p>
      <div class="rs-actions">
        <a class="rs-button rs-button-primary" data-rockeskolen-auth-action href="/user/login">Logg inn</a>
        <a class="rs-button" href="/verktoy">Utforsk åpne verktøy</a>
      </div>
      <p class="rs-helper" data-rockeskolen-auth-helper>Mye av innholdet er åpent og kan brukes med en gang.</p>
    </div>
  </section>

  <section class="rs-member-campaign" data-rockeskolen-member-campaign aria-labelledby="rs-member-campaign-title">
    <div class="rs-member-campaign-copy">
      <h2 id="rs-member-campaign-title">Bli med fra starten.</h2>
      <p>Opprett en gratis konto og bli en del av Rockeskolens digitale øvingsrom. Du får en samlet inngang til verktøy, læringsressurser og nye funksjoner etter hvert som de lanseres.</p>
    </div>
    <div class="rs-member-campaign-actions">
      <a class="rs-button rs-button-primary" data-rockeskolen-member-action href="https://rockeskolen.com/members/register.php?redirect=%2Fmembers%2Fportal.php">Bli gratis medlem</a>
      <a class="rs-button" href="https://rockeskolen.com/members/upgrade.php">Se VIP-introen</a>
      <p><strong>VIP-intro: 39,90 kr/mnd</strong><br>Normalpris 49,90. Behold introduksjonsprisen så lenge abonnementet er aktivt.</p>
    </div>
  </section>

  <section class="rs-entry-section" aria-labelledby="rs-entry-title">
    <p class="rs-kicker">Hvor vil du begynne?</p>
    <h2 id="rs-entry-title">Finn din vei inn i musikken.</h2>
    <div class="rs-entry-grid">
      <a class="rs-entry-card" href="/verktoy">
        <span>Spill</span>
        <strong>Prøv instrumenter og verktøy</strong>
        <p>Akkorder, skalaer, stemming og visuelle hjelpemidler.</p>
      </a>
      <a class="rs-entry-card" href="/musikkteori">
        <span>Forstå</span>
        <strong>Se hvordan musikken henger sammen</strong>
        <p>Rytme, toner, intervaller, akkorder, skalaer og form.</p>
      </a>
      <a class="rs-entry-card" href="/node/219">
        <span>Skap</span>
        <strong>Kom i gang med en egen idé</strong>
        <p>Låtskriving, akkordrekker og enkle kreative startpunkt.</p>
      </a>
    </div>
  </section>

  <a class="rs-symbol-feature" style="grid-template-columns: minmax(0, 1fr);" href="https://rockeskolen.com/tools/symbols/" aria-labelledby="rs-symbol-feature-title">
    <div class="rs-symbol-feature-copy">
      <p class="rs-kicker">Nytt oppslagsverk</p>
      <h2 id="rs-symbol-feature-title">Musikalske symboler – hva betyr de?</h2>
      <p>Fra mordent og cesur til pedaltegn og oktavlinjer. Søk blant symbolene, se dem notert og få en kort forklaring.</p>
      <span>Utforsk musikksymbolene →</span>
    </div>
  </a>

  {{TOOLS_CATALOG}}

  <section class="rs-school-panel" aria-labelledby="rs-school-title">
    <div>
      <p class="rs-kicker">For lærere og skoler</p>
      <h2 id="rs-school-title">Bli med i Høstpilot 2026.</h2>
      <p>Vi inviterer 3–5 skoler til å prøve Øvingsrommet i undervisningen. Pilotskolene får avtalt tilgang, et kort oppstartsmøte og direkte oppfølging.</p>
    </div>
    <div class="rs-actions rs-school-actions">
      <a class="rs-button rs-button-primary" href="https://rockeskolen.com/skoler/">Les om skolepiloten</a>
      <a class="rs-button" href="mailto:post@rockeskolen.com?subject=Interesse%20for%20Rockeskolens%20skolepilot">Meld interesse</a>
    </div>
  </section>

  <style>[data-rs-b-articles] h2::before,[data-rs-b-articles] h2::after{display:none!important}[data-rs-b-articles] a span{color:#b8bcc7}</style>
  <aside data-rs-b-articles aria-labelledby="rs-b-articles-title" style="margin-top:24px;padding:20px 0;border-top:1px solid rgba(255,255,255,.15);">
    <h2 id="rs-b-articles-title" style="font-size:18px;line-height:1.4;margin:0 0 8px;text-transform:none;">Rockeskolen bruker B</h2>
    <p style="font-size:15px;margin:0 0 14px;">Vi bruker tonenavnene A, B, C, D, E, F og G. Her er bakgrunnen.</p>
    <div style="display:flex;flex-wrap:wrap;gap:12px;">
      <a href="/node/152" style="flex:1 1 260px;padding:12px 16px;border:1px solid rgba(255,255,255,.15);border-radius:6px;font-size:15px;line-height:1.5;text-decoration:none;">
        <strong>B for H</strong><br><span style="font-size:14px;">Kort om tonenavnene vi bruker.</span>
      </a>
      <a href="/node/153" style="flex:1 1 260px;padding:12px 16px;border:1px solid rgba(255,255,255,.15);border-radius:6px;font-size:15px;line-height:1.5;text-decoration:none;">
        <strong>B eller H i musikk? Derfor bør tonen hete B</strong><br><span style="font-size:14px;">Les begrunnelsen for valget.</span>
      </a>
    </div>
  </aside>
</div>
HTML;
    $front = str_replace('{{TOOLS_CATALOG}}', $catalog, $front);

    $updated = preg_replace(
      '/<div class="field field--name-body field--type-text-with-summary field--label-hidden field-item">.*?<\/div>/is',
      '<div class="field field--name-body field--type-text-with-summary field--label-hidden field-item">' . $front . '</div>',
      $content,
      1,
    );
    return is_string($updated) ? $updated : $content;
  }

  /**
   * Keeps the cached front-page shell consistent with the current user.
   */
  private function rewriteFrontPageAuthState(string $content): string {
    // Normalize front pages generated before the state-aware action existed.
    $content = str_replace(
      '<a class="rs-button rs-button-primary" href="/user/login">Logg inn med FEIDE</a>',
      '<a class="rs-button rs-button-primary" data-rockeskolen-auth-action href="/user/login">Logg inn</a>',
      $content,
    );
    $content = str_replace(
      '<p class="rs-helper">Mye av innholdet er åpent og kan brukes med en gang.</p>',
      '<p class="rs-helper" data-rockeskolen-auth-helper>Mye av innholdet er åpent og kan brukes med en gang.</p>',
      $content,
    );

    $authenticated = !\Drupal::currentUser()->isAnonymous();
    $action = $authenticated
      ? '<a class="rs-button rs-button-primary" data-rockeskolen-auth-action href="/user">Min profil</a>'
      : '<a class="rs-button rs-button-primary" data-rockeskolen-auth-action href="/user/login">Logg inn</a>';
    $helper = $authenticated
      ? '<p class="rs-helper" data-rockeskolen-auth-helper>Du er innlogget og kan fortsette der du slapp.</p>'
      : '<p class="rs-helper" data-rockeskolen-auth-helper>Mye av innholdet er åpent og kan brukes med en gang.</p>';
    $member_action = $authenticated
      ? '<a class="rs-button rs-button-primary" data-rockeskolen-member-action href="/user">Du er allerede medlem</a>'
      : '<a class="rs-button rs-button-primary" data-rockeskolen-member-action href="https://rockeskolen.com/members/register.php?redirect=%2Fmembers%2Fportal.php">Bli gratis medlem</a>';

    $updated = preg_replace(
      '/<a class="rs-button rs-button-primary" data-rockeskolen-auth-action[^>]*>.*?<\/a>/is',
      $action,
      $content,
      1,
    );
    if (!is_string($updated)) {
      return $content;
    }
    $updated = preg_replace(
      '/<a class="rs-button rs-button-primary" data-rockeskolen-member-action[^>]*>.*?<\/a>/is',
      $member_action,
      $updated,
      1,
    );
    if (!is_string($updated)) {
      return $content;
    }
    $updated = preg_replace(
      '/<p class="rs-helper" data-rockeskolen-auth-helper>.*?<\/p>/is',
      $helper,
      $updated,
      1,
    );
    return is_string($updated) ? $updated : $content;
  }

  /**
   * Replaces the partial Drupal view with the shared public tool catalogue.
   */
  private function enhanceToolsPage(string $content): string {
    if (str_contains($content, 'data-rockeskolen-tool-catalog')) {
      return $content;
    }
    $catalog = $this->renderToolCatalog('Våre verktøy', 'Åpne verktøyet');
    $catalog .= $this->renderExternalToolCatalog();
    $updated = preg_replace(
      '/(<div class="view-content">)/i',
      $catalog . '$1',
      $content,
      1,
    );
    return is_string($updated) ? $updated : $content;
  }

  /**
   * Lists published tools outside the Rockeskolen tools taxonomy category.
   */
  private function renderExternalToolCatalog(): string {
    $storage = \Drupal::entityTypeManager()->getStorage('node');
    $ids = $storage->getQuery()
      ->accessCheck(TRUE)
      ->condition('type', 'verktoy')
      ->condition('status', 1)
      ->condition('field_tema_verktoy', 79, '<>')
      ->sort('title')
      ->execute();
    $escape = static fn(string $value): string => htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $cards = '';
    foreach ($storage->loadMultiple($ids) as $node) {
      if (!$node->access('view')) {
        continue;
      }
      $categories = [];
      foreach ($node->get('field_tema_verktoy')->referencedEntities() as $term) {
        $categories[] = $term->label();
      }
      $description = (string) ($node->get('field_ingress')->value ?? '');
      $cards .= '<article class="rs-tool-card">'
        . '<div class="rs-tool-meta"><span>' . $escape(implode(' · ', $categories)) . '</span></div>'
        . '<h3>' . $escape($node->label()) . '</h3>'
        . '<p>' . $escape(strip_tags($description)) . '</p>'
        . '<a href="' . $escape($node->toUrl()->toString()) . '">Les om verktøyet<span aria-hidden="true">→</span></a>'
        . '</article>';
    }
    if ($cards === '') {
      return '';
    }
    return '<section class="rs-tool-catalog" data-rockeskolen-external-tools aria-labelledby="rs-external-tools-title">'
      . '<div class="rs-tool-catalog-head"><p class="rs-kicker">Verktøysamlingen</p>'
      . '<h2 id="rs-external-tools-title">Eksterne verktøy</h2>'
      . '<p>Utforsk samlingen vår av musikkprogrammer og verktøy fra andre utviklere.</p></div>'
      . '<div class="rs-tool-grid">' . $cards . '</div></section>';
  }

  /**
   * Renders the same catalogue used by rockeskolen.com.
   */
  private function renderToolCatalog(string $title, string $cta): string {
    $catalog_file = dirname(DRUPAL_ROOT) . '/includes/content.php';
    if (!is_file($catalog_file)) {
      return '';
    }
    require_once $catalog_file;
    if (!function_exists('rs_public_tools')) {
      return '';
    }
    $tools = rs_public_tools();
    $escape = static fn(string $value): string => htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $cards = '';
    foreach ($tools as $tool) {
      $url = 'https://rockeskolen.com' . $tool['app_url'];
      $cards .= '<article class="rs-tool-card">'
        . '<div class="rs-tool-meta"><span>' . $escape($tool['category']) . '</span><span>' . $escape($tool['product_status']) . '</span></div>'
        . '<h3>' . $escape($tool['title']) . '</h3>'
        . '<p>' . $escape($tool['short_description']) . '</p>'
        . '<a href="' . $escape($url) . '">' . $escape($cta) . '<span aria-hidden="true">→</span></a>'
        . '</article>';
    }
    return '<section class="rs-tool-catalog" data-rockeskolen-tool-catalog aria-labelledby="rs-tool-catalog-title">'
      . '<div class="rs-tool-catalog-head"><p class="rs-kicker">Rockeskolen Tools</p><h2 id="rs-tool-catalog-title">' . $escape($title) . '</h2>'
      . '<p>Én samlet oversikt – samme verktøy på Rockeskolen og i Øvingsrommet.</p></div>'
      . '<div class="rs-tool-grid">' . $cards . '</div></section>';
  }

  /**
   * Returns concise search and sharing copy for the portal's public sections.
   */
  private function descriptionForPath(string $path): string {
    if ($path === '/komponister' || str_starts_with($path, '/komponister/')) {
      return 'Utforsk komponister, musikkhistorie og ideene som har formet musikken – fra tidlige mestre til vår egen tid.';
    }
    if ($path === '/instrumenter' || str_starts_with($path, '/instrumenter/')) {
      return 'Utforsk instrumenter, klang, historie og spilleteknikk i Rockeskolens visuelle instrumentleksikon.';
    }
    if ($path === '/musikkteori' || str_starts_with($path, '/musikkteori/')) {
      return 'Lær musikkteori i praksis med tydelige forklaringer om toner, rytme, skalaer, akkorder og harmonikk.';
    }
    if ($path === '/verktoy' || str_starts_with($path, '/verktoy/')) {
      return 'Praktiske musikkverktøy for akkorder, skalaer, gehør, stemming, låtskriving og øving.';
    }
    if ($path === '/om-portalen') {
      return 'Om Rockeskolens digitale læringsportal for musikkunnskap, praktiske verktøy og skaperglede.';
    }
    return 'Rockeskolens digitale læringsportal med musikkunnskap, instrumentleksikon, komponister og praktiske verktøy.';
  }

  /**
   * Builds fully qualified Open Graph, X/Twitter and canonical tags.
   */
  private function buildMeta(
    string $title,
    string $description,
    string $canonical,
    string $image,
    string $image_alt,
  ): string {
    $escape = static fn(string $value): string => htmlspecialchars(
      $value,
      ENT_QUOTES | ENT_SUBSTITUTE,
      'UTF-8'
    );
    $values = array_map($escape, compact(
      'title',
      'description',
      'canonical',
      'image',
      'image_alt',
    ));

    return <<<HTML
<meta name="description" content="{$values['description']}" />
<link rel="canonical" href="{$values['canonical']}" />
<meta property="og:locale" content="nb_NO" />
<meta property="og:site_name" content="Rockeskolen" />
<meta property="og:type" content="website" />
<meta property="og:title" content="{$values['title']}" />
<meta property="og:description" content="{$values['description']}" />
<meta property="og:url" content="{$values['canonical']}" />
<meta property="og:image" content="{$values['image']}" />
<meta property="og:image:secure_url" content="{$values['image']}" />
<meta property="og:image:type" content="image/jpeg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="{$values['image_alt']}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{$values['title']}" />
<meta name="twitter:description" content="{$values['description']}" />
<meta name="twitter:image" content="{$values['image']}" />
<meta name="twitter:image:alt" content="{$values['image_alt']}" />

HTML;
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
