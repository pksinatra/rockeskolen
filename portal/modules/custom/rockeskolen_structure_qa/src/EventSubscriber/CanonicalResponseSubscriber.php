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

    $content = $this->normalizeProductNames($content);
    $content = str_replace('Spill. Forstå. Skap.', 'Spill. Utforsk. Lag musikk.', $content);

    $path = '/' . trim($request->getPathInfo(), '/');
    $path = $path === '/' ? '/' : rtrim($path, '/');
    $canonical = 'https://portal.rockeskolen.com' . ($path === '/' ? '/' : $path);

    $content = $this->rewritePrimaryNavigation($content);
    $content = $this->rewriteToolLinks($content);
    $content = $this->enhanceTheoryArticleNavigation($content, $request);
    if ($path === '/') {
      $content = $this->enhanceFrontPage($content);
      $content = $this->removeFrontArticleCollection($content);
      $content = $this->rewriteFrontPageAuthState($content);
    }
    elseif ($path === '/verktoy') {
      $content = $this->enhanceToolsPage($content);
    }

    $title = 'Rockeskolen Portal';
    if (preg_match('/<title>(.*?)<\/title>/is', $content, $title_match) === 1) {
      $title = trim(html_entity_decode(strip_tags($title_match[1]), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
    }

    $description = $this->descriptionFromContent($content)
      ?? $this->descriptionForPath($path);
    $is_composer = $path === '/komponister' || str_starts_with($path, '/komponister/');
    $image = $is_composer
      ? 'https://portal.rockeskolen.com/sites/default/files/share/komponister.jpg'
      : 'https://portal.rockeskolen.com/sites/default/files/share/rockeskolen-portal.jpg';
    $image_alt = $is_composer
      ? 'Komponister – møt menneskene som formet musikken'
      : 'Rockeskolen Portal – musikkunnskap, verktøy og skaperglede';
    $image_type = 'image/jpeg';
    $image_width = 1200;
    $image_height = 630;
    $page_entity = $request->attributes->get('node');
    $content_image = $path !== '/' && $page_entity instanceof \Drupal\node\NodeInterface
      ? $this->imageFromContent($content)
      : NULL;
    $media_image = $path !== '/' && $page_entity instanceof \Drupal\node\NodeInterface
      ? $this->imageFromNode($page_entity)
      : NULL;
    if ($media_image !== NULL) {
      $content_image = $media_image;
    }
    if ($content_image !== NULL) {
      $image = $content_image['url'];
      $image_alt = $content_image['alt'] !== '' ? $content_image['alt'] : $title;
      $image_type = $content_image['type'];
      $image_width = $content_image['width'];
      $image_height = $content_image['height'];
    }

    $patterns = [
      '/<link\s+rel=["\']canonical["\'][^>]*>\s*/i',
      '/<meta\s+name=["\']description["\'][^>]*>\s*/i',
      '/<meta\s+(?:property|name)=["\'](?:og:|twitter:)[^"\']+["\'][^>]*>\s*/i',
    ];
    $content = preg_replace($patterns, '', $content);
    if (!is_string($content)) {
      return;
    }

    $article_times = $path !== '/' && $page_entity instanceof \Drupal\node\NodeInterface
      ? [
        'published' => date('c', (int) $page_entity->getCreatedTime()),
        'modified' => date('c', (int) $page_entity->getChangedTime()),
      ]
      : NULL;
    $meta = $this->buildMeta(
      $title,
      $description,
      $canonical,
      $image,
      $image_alt,
      $image_type,
      $image_width,
      $image_height,
      $article_times,
    );
    $content = str_replace('</head>', $meta . '</head>', $content);
    $response->setContent($this->normalizeProductNames($content));
  }

  /**
   * Normalizes visible product copy without touching URLs, classes or variables.
   */
  private function normalizeProductNames(string $content): string {
    $replace = static function (string $value): string {
      $value = str_replace([
        'Rockeskolens Digitale Øvingsrom',
        'Rockeskolens digitale øvingsrom',
        'Digitale Øvingsrom',
        'Øvingsrommet',
        'Øvingsrom',
        'Rockeskolens portal',
        'Rockeskolen Portal',
        'digitale læringsportal',
        'læringsportal',
        'Rockeskolen Tools',
        'RDØ',
      ], [
        'Rockeskolens Musikkportal',
        'Rockeskolens Musikkportal',
        'musikkportalen',
        'musikkportalen',
        'musikkportal',
        'Rockeskolens Musikkportal',
        'Rockeskolens Musikkportal',
        'musikkportal',
        'musikkportal',
        'Rockeskolens Musikkportal',
        'Rockeskolens Musikkportal',
      ], $value);
      $value = str_replace('n enkel og gratis spektrumanalysator', 'En enkel og gratis spektrumanalysator', $value);
      return preg_replace('/(?<![\\p{L}])Portalen(?![\\p{L}])/u', 'Musikkportalen', $value) ?? $value;
    };

    $parts = preg_split('/(<[^>]+>)/s', $content, -1, PREG_SPLIT_DELIM_CAPTURE);
    if (!is_array($parts)) {
      return $content;
    }
    foreach ($parts as $index => $part) {
      if ($part === '' || $part[0] === '<') {
        if ($part !== '' && $part[0] === '<') {
          $parts[$index] = preg_replace_callback(
            '/\\b(alt|title|aria-label|content|value)=("|\')(.*?)(\\2)/isu',
            static fn(array $match): string => $match[1] . '=' . $match[2] . $replace($match[3]) . $match[4],
            $part,
          ) ?? $part;
        }
        continue;
      }
      $parts[$index] = $replace($part);
    }
    return implode('', $parts);
  }

  /**
   * Removes the legacy Drupal article view that sits below the portal landing page.
   */
  private function removeFrontArticleCollection(string $content): string {
    $updated = preg_replace('/<section id="content-bottom"[^>]*>.*?<\/section>\s*(?=<section class="share-node")/is', '', $content, 1);
    return is_string($updated) ? $updated : $content;
  }

  /**
   * Presents a compact public navigation with grouped reference links.
   */
  private function rewritePrimaryNavigation(string $content): string {
    if (str_contains($content, 'data-rockeskolen-primary-nav')) {
      return $content;
    }

    $navigation = <<<'HTML'
<ul class="menu main-menu" data-rockeskolen-primary-nav>
  <li class="menu-item menu-item-level-1"><a href="/musikk-i-praksis">Musikk i praksis</a></li>
  <li class="menu-item menu-item-level-1"><a href="/verktoy">Verktøy</a></li>
  <li class="menu-item menu-item-level-1"><a href="/musikkteori">Musikkteori</a></li>
  <li class="menu-item menu-item-level-1 menu-item-has-children">
    <a href="#">Oppslag</a>
    <ul class="submenu">
      <li class="menu-item menu-item-level-2"><a href="/instrumenter">Instrumenter</a></li>
      <li class="menu-item menu-item-level-2"><a href="/komponister">Komponister</a></li>
      <li class="menu-item menu-item-level-2"><a href="https://rockeskolen.com/tools/symbols/">Musikksymboler</a></li>
    </ul>
  </li>
  <li class="menu-item menu-item-level-1 menu-item-has-children">
    <a href="/om-portalen">Om</a>
    <ul class="submenu">
      <li class="menu-item menu-item-level-2"><a href="/om-portalen">Om oss</a></li>
      <li class="menu-item menu-item-level-2"><a href="https://rockeskolen.com/skoler/">Bli pilotskole</a></li>
    </ul>
  </li>
</ul>
HTML;

    $updated = preg_replace('/<ul class="menu main-menu">.*?<\/ul>/is', $navigation, $content, 1);
    return is_string($updated) ? $updated : $content;
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

    $content = str_replace('<div class="view-content">', '<div class="view-content" hidden>', $content);
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
   * Builds the compact portal landing page from existing Drupal content.
   */
  private function renderCompactFrontPage(string $content): string {
    $storage = \Drupal::entityTypeManager()->getStorage('node');
    $ids = $storage->getQuery()
      ->accessCheck(TRUE)
      ->condition('status', 1)
      ->sort('created', 'DESC')
      ->range(0, 4)
      ->execute();
    $escape = static fn(string $value): string => htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $recent = '';
    foreach ($storage->loadMultiple($ids) as $node) {
      if (!$node->access('view')) {
        continue;
      }
      $summary = $node->hasField('field_ingress') && !$node->get('field_ingress')->isEmpty()
        ? trim(strip_tags((string) $node->get('field_ingress')->value))
        : 'Utforsk mer musikkunnskap og inspirasjon fra Rockeskolen.';
      $recent .= '<a class="rs-compact-news-card" href="' . $escape($node->toUrl()->toString()) . '">'
        . '<strong>' . $escape($node->label()) . '</strong>'
        . '<span>' . $escape($summary) . '</span><b aria-hidden="true">→</b></a>';
    }

    $front = '<div class="rs-compact-front" data-rockeskolen-compact-front>'
      . '<section class="rs-compact-intro" aria-labelledby="rs-compact-title">'
      . '<p class="rs-kicker">Rockeskolens Musikkportal</p><h1 id="rs-compact-title">Spill. Utforsk. Lag musikk.</h1>'
      . '<p>Utforsk verktøy, teori og oppslag som hjelper deg å utvikle deg musikalsk og finne egne ideer.</p></section>'
      . '<section class="rs-compact-entries" aria-labelledby="rs-compact-entries-title">'
      . '<h2 id="rs-compact-entries-title">Finn en inngang</h2><div class="rs-compact-entry-grid">'
      . $this->compactEntry('<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="17" cy="14" r="6"/><circle cx="32" cy="16" r="5"/><path d="M6 36c1-8 5-12 11-12s10 4 11 12M24 36c1-6 4-10 9-10 5 0 8 3 9 10"/></svg>', 'Samspill og musisering', 'Lær om samspill, øving, rytme, musikalsk kommunikasjon og det å spille sammen med andre.', '/musikk-i-praksis?tema=113')
      . $this->compactEntry('<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M18 35V12l20-4v23"/><circle cx="12" cy="36" r="6"/><circle cx="32" cy="32" r="6"/></svg>', 'Låtskriving og komposisjon', 'Utvikle musikalske ideer, skriv melodier og tekster, bygg låter og finn ditt eget uttrykk.', '/musikk-i-praksis?tema=94')
      . $this->compactEntry('<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M7 9h34v30H7zM7 15h34M24 15v24M7 29h17"/></svg>', 'Musikkteori', 'Teori, harmonikk, rytme, notasjon og kunnskap som gjør det lettere å forstå og bruke musikk.', '/musikkteori')
      . $this->compactEntry('<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 8v32M24 8v32M38 8v32M6 14h8M20 26h8M34 19h8M6 34h8M20 13h8M34 31h8"/></svg>', 'Verktøy', 'Interaktive hjelpemidler for akkorder, skalaer, stemming, komposisjon og praktisk musikkarbeid.', '/verktoy')
      . '</div></section>'
      . $this->courseStrip()
      . $this->membershipBand()
      . '<a class="rs-compact-reference" href="/node/152"><strong>B for H</strong><span>Rockeskolen bruker B i stedet for H. Det følger internasjonal standard, gjør musikkteori mer logisk og reduserer forvirring mellom undervisning, noter, apper og musikkprogramvare.</span><b aria-hidden="true">Les artikkelen →</b></a>'
      . '<section class="rs-compact-news" aria-labelledby="rs-compact-news-title"><h2 id="rs-compact-news-title">Aktuelt i Rockeskolen</h2>'
      . ($recent !== '' ? '<div class="rs-compact-news-grid">' . $recent . '</div>' : '')
      . '</section></div>';

    $front .= '<style>.rs-compact-front{max-width:1180px;margin:0 auto;padding:clamp(32px,6vw,76px) 24px}.rs-compact-intro{max-width:720px;margin-bottom:48px}.rs-compact-intro h1{margin:0 0 16px;font-size:clamp(42px,6vw,78px);line-height:.96}.rs-compact-intro>p:last-child{max-width:650px;font-size:20px;line-height:1.55;color:#c6c9d2}.rs-compact-front h2{margin:0 0 20px;font-size:clamp(26px,3vw,38px)}.rs-compact-entry-grid,.rs-compact-news-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}.rs-compact-entry-card,.rs-compact-news-card,.rs-compact-reference{display:flex;flex-direction:column;gap:12px;padding:24px;border:1px solid rgba(255,255,255,.16);border-radius:8px;color:#fff;text-decoration:none;background:rgba(255,255,255,.035);transition:transform .2s,border-color .2s}.rs-compact-entry-card:hover,.rs-compact-news-card:hover,.rs-compact-reference:hover{transform:translateY(-3px);border-color:var(--color-primary)}.rs-compact-entry-card i{display:block;height:38px;font-style:normal;color:var(--color-primary)}.rs-compact-entry-card i svg{width:38px;height:38px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.rs-compact-entry-card strong,.rs-compact-news-card strong,.rs-compact-reference strong{font-size:21px}.rs-compact-entry-card span,.rs-compact-news-card span,.rs-compact-reference span{color:#c6c9d2;line-height:1.5}.rs-compact-entry-card b,.rs-compact-news-card b,.rs-compact-reference b{margin-top:auto;color:var(--color-primary)}.rs-compact-reference{margin-top:24px;border-color:rgba(239,32,41,.6);background:rgba(239,32,41,.08)}.rs-compact-news.rs-compact-courses{margin-top:48px;padding-top:0;border-top:0}.rs-compact-courses-lead{margin:-8px 0 20px;color:#c6c9d2;line-height:1.5}.rs-compact-courses-lead a{color:#fff;font-weight:700}.rs-compact-news{margin-top:64px;padding-top:36px;border-top:1px solid rgba(255,255,255,.15)}.rs-compact-news-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.rs-compact-news-card{padding:20px}.rs-compact-news-card strong{font-size:18px}.rs-member-band{margin-top:48px}.rs-member-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.rs-member-card{display:flex;flex-direction:column;gap:12px;padding:24px;border:1px solid rgba(255,255,255,.16);border-radius:8px;background:rgba(255,255,255,.035)}.rs-member-card strong{font-size:21px}.rs-member-card p{margin:0;color:#c6c9d2;line-height:1.5}.rs-member-card .rs-member-price{color:#fff;font-weight:700}.rs-member-card a{margin-top:auto;align-self:flex-start;padding:10px 18px;border-radius:6px;border:1px solid rgba(255,255,255,.3);color:#fff;text-decoration:none;font-weight:700}.rs-member-card a:hover{border-color:var(--color-primary)}.rs-member-card-vip{border-color:rgba(239,32,41,.6);background:rgba(239,32,41,.08)}.rs-member-card-vip a{background:var(--color-primary);border-color:var(--color-primary)}@media(max-width:900px){.rs-member-grid{grid-template-columns:1fr}}@media(max-width:900px){.rs-compact-entry-grid,.rs-compact-news-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.rs-compact-entry-grid,.rs-compact-news-grid{grid-template-columns:1fr}.rs-compact-front{padding-inline:16px}}</style>';

    $updated = preg_replace(
      '/<div class="field field--name-body field--type-text-with-summary field--label-hidden field-item">.*?<\/div>/is',
      '<div class="field field--name-body field--type-text-with-summary field--label-hidden field-item">' . $front . '</div>',
      $content,
      1,
    );
    return is_string($updated) ? $updated : $content;
  }

  /**
   * Shows the courses from rs_kurs on the front page, with a link to /kurs.
   */
  private function courseStrip(): string {
    $class = '\\Drupal\\rs_kurs\\CourseRegistry';
    if (!class_exists($class)) {
      return '';
    }
    $escape = static fn(string $value): string => htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $cards = '';
    foreach ($class::all() as $course) {
      $cards .= '<a class="rs-compact-news-card" href="/kurs/' . $escape($course['slug']) . '">'
        . '<strong>' . $escape($course['title']) . '</strong>'
        . '<span>' . $escape(($course['area'] ?? 'Kurs') . ' · ' . $class::lessonCount($course) . ' leksjoner. ' . $course['module']) . '</span>'
        . '<b aria-hidden="true">Start kurset →</b></a>';
    }
    return '<section class="rs-compact-news rs-compact-courses" aria-labelledby="rs-compact-courses-title">'
      . '<h2 id="rs-compact-courses-title">Kurs</h2>'
      . '<p class="rs-compact-courses-lead">Korte kurs der du lytter, prøver og løser oppgaver. Første leksjon er åpen for alle. <a href="/kurs">Se alle kurs →</a></p>'
      . '<div class="rs-compact-news-grid">' . $cards . '</div></section>';
  }

  /**
   * Shows how to become a member; adapts to the visitor and hides for VIP.
   */
  private function membershipBand(): string {
    $account = \Drupal::currentUser();
    if ($account->hasRole('vip_member') || $account->hasRole('administrator')) {
      return '';
    }
    $cards = '';
    if ($account->isAnonymous()) {
      $cards .= '<div class="rs-member-card"><strong>Gratis konto</strong>'
        . '<p>Én innlogging for Rockeskolen og musikkportalen, og varsel om nytt innhold og nye verktøy.</p>'
        . '<a href="https://rockeskolen.com/members/register.php?redirect=%2Fmembers%2Fportal.php">Opprett gratis konto</a></div>';
    }
    $cards .= '<div class="rs-member-card rs-member-card-vip"><strong>VIP</strong>'
      . '<p>Alle akkorder, skalaer og funksjoner i verktøyene, og alt VIP-innhold i musikkportalen.</p>'
      . '<p class="rs-member-price">39,90 kr/mnd eller 299 kr/år</p>'
      . '<a href="https://rockeskolen.com/members/upgrade.php">Bli VIP</a></div>';
    $cards .= '<div class="rs-member-card"><strong>For skoler</strong>'
      . '<p>Elever og lærere kan logge inn med FEIDE. Les hvordan skolen din kan bruke musikkportalen.</p>'
      . '<a href="https://rockeskolen.com/skoler/">Les om skoletilgang</a></div>';
    return '<section class="rs-member-band" aria-labelledby="rs-member-band-title">'
      . '<h2 id="rs-member-band-title">Bli medlem</h2>'
      . '<div class="rs-member-grid">' . $cards . '</div></section>';
  }

  private function compactEntry(string $icon, string $title, string $description, string $url): string {
    $escape = static fn(string $value): string => htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    return '<a class="rs-compact-entry-card" href="' . $escape($url) . '"><i aria-hidden="true">' . $icon . '</i><strong>' . $escape($title) . '</strong><span>' . $escape($description) . '</span><b aria-hidden="true">Åpne →</b></a>';
  }

  /**
   * Replaces the legacy two-paragraph front page with the compact landing page.
   */
  private function enhanceFrontPage(string $content): string {
    return $this->renderCompactFrontPage($content);
    if (str_contains($content, 'data-rockeskolen-pilot-front')) {
      return $content;
    }

    $catalog = $this->renderToolCatalog('Alle musikkverktøy', 'Åpne verktøyet', TRUE);
    $front = <<<'HTML'
<div class="rs-pilot-front" data-rockeskolen-pilot-front>
  <section class="rs-pilot-hero" aria-labelledby="rs-pilot-title">
    <div class="rs-pilot-hero-copy">
      <p class="rs-kicker">Rockeskolens Musikkportal</p>
      <h1 id="rs-pilot-title">Spill. Utforsk. Lag musikk.</h1>
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
      <p><strong>VIP: 39,90 kr/mnd eller 299 kr/år</strong><br>Månedsprisen er en introduksjonspris; normalpris 49,90. Behold introduksjonsprisen så lenge abonnementet er aktivt.</p>
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
      <a class="rs-entry-card" href="/artikkelserie/110">
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
      <p>Vi inviterer 3–5 skoler til å prøve musikkportalen i undervisningen. Pilotskolene får avtalt tilgang, et kort oppstartsmøte og direkte oppfølging.</p>
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
  private function renderToolCatalog(string $title, string $cta, bool $front_page = FALSE): string {
    $catalog_file = dirname(DRUPAL_ROOT) . '/includes/content.php';
    if (!is_file($catalog_file)) {
      return '';
    }
    require_once $catalog_file;
    if (!function_exists('rs_public_tools')) {
      return '';
    }
    $tools = rs_public_tools();
    $canonical_urls = [
      'Pianoakkorder' => 'https://rockeskolen.com/tools/chords/piano/',
      'Gitarakkorder' => 'https://rockeskolen.com/tools/chords/guitar/',
      'Pianoskalaer' => 'https://rockeskolen.com/tools/scales/piano/',
      'Gitarskalaer' => 'https://rockeskolen.com/tools/scales/guitar/',
      'Kvintsirkelen' => 'https://rockeskolen.com/tools/circles/fifths/',
      'Tuner' => 'https://rockeskolen.com/tools/tuners/',
      'Tuner og stemmetoner' => 'https://rockeskolen.com/tools/tuners/',
    ];
    // Tools whose code unlocks more with VIP; the others are free to use.
    // Tools not listed in either are shown without an access label.
    $vip_extended = ['Pianoakkorder', 'Gitarakkorder', 'Pianoskalaer', 'Gitarskalaer', 'Kvintsirkelen', 'Pianovisualisering', 'ChordLog'];
    $free = ['Tuner og stemmetoner', 'Tuner', 'Musikksymboler', 'ChordProg'];
    $escape = static fn(string $value): string => htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $cards = '';
    foreach ($tools as $tool) {
      $access = in_array($tool['title'], $vip_extended, TRUE) ? 'Gratis · mer med VIP'
        : (in_array($tool['title'], $free, TRUE) ? 'Gratis' : '');
      $app_url = (string) $tool['app_url'];
      $url = $canonical_urls[$tool['title']] ?? (preg_match('#^https?://#i', $app_url) ? $app_url : 'https://rockeskolen.com' . $app_url);
      $cards .= '<article class="rs-tool-card">'
        . '<div class="rs-tool-meta"><span>' . $escape($tool['category']) . '</span><span>' . $escape($tool['product_status']) . '</span>'
        . ($access !== '' ? '<span class="rs-tool-access">' . $escape($access) . '</span>' : '') . '</div>'
        . '<h3>' . $escape($tool['title']) . '</h3>'
        . '<p>' . $escape($tool['short_description']) . '</p>'
        . '<a href="' . $escape($url) . '">' . $escape($cta) . '<span aria-hidden="true">→</span></a>'
        . '</article>';
    }
    return '<section class="rs-tool-catalog" data-rockeskolen-tool-catalog aria-labelledby="rs-tool-catalog-title">'
      . '<div class="rs-tool-catalog-head"><p class="rs-kicker">Rockeskolen Tools</p><h2 id="rs-tool-catalog-title">' . $escape($title) . '</h2>'
      . '<p>Én samlet oversikt – samme verktøy på Rockeskolen og i musikkportalen.</p>'
      . '<p class="rs-tool-vip-note">Grunnfunksjonene er gratis. VIP låser opp alle akkorder, skalaer og funksjoner for 39,90 kr/mnd eller 299 kr/år. '
      . '<a href="https://rockeskolen.com/members/upgrade.php">Bli VIP</a></p></div>'
      . '<div class="rs-tool-grid">' . $cards . '</div></section>';
  }

  /**
   * Returns concise search and sharing copy for the portal's public sections.
   */
  private function descriptionForPath(string $path): string {
    if (preg_match('#^/kurs/([a-z0-9-]+)$#', $path, $match) && class_exists('\\Drupal\\rs_kurs\\CourseRegistry')) {
      $course = \Drupal\rs_kurs\CourseRegistry::bySlug($match[1]);
      if ($course !== NULL) {
        return 'Kurs: ' . $course['title'] . '. ' . $course['module'];
      }
    }
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
      return 'Om Rockeskolens Musikkportal for musikkunnskap, praktiske verktøy og skaperglede.';
    }
    return 'Rockeskolens Musikkportal med musikkunnskap, instrumentleksikon, komponister og praktiske verktøy.';
  }

  /**
   * Uses the editor-written ingress as the page's search and sharing text.
   */
  private function descriptionFromContent(string $content): ?string {
    if (preg_match(
      '/class=["\'][^"\']*field--name-field-ingress[^"\']*["\'][^>]*>(.*?)<\/div>/is',
      $content,
      $match,
    ) !== 1) {
      return NULL;
    }
    $description = trim(preg_replace(
      '/\s+/u',
      ' ',
      html_entity_decode(strip_tags($match[1]), ENT_QUOTES | ENT_HTML5, 'UTF-8'),
    ) ?? '');
    if ($description === '') {
      return NULL;
    }
    return $this->shortenDescription($description);
  }

  /**
   * Shortens to at most 160 characters, ending on a whole sentence if one fits.
   */
  private function shortenDescription(string $description): string {
    if (mb_strlen($description) <= 160) {
      return $description;
    }
    $head = mb_substr($description, 0, 160);
    if (preg_match('/^(.{40,}[.!?])\s/us', $head . ' ', $match) === 1) {
      return $match[1];
    }
    $cut = mb_substr($head, 0, 157);
    $space = mb_strrpos($cut, ' ');
    if ($space !== FALSE && $space > 100) {
      $cut = mb_substr($cut, 0, $space);
    }
    return rtrim($cut, " \t\n\r\0\x0B,.;:–-") . '…';
  }

  /**
   * Uses the article's own image file, in a format all sharing services read.
   */
  private function imageFromNode(\Drupal\node\NodeInterface $node): ?array {
    if (!$node->hasField('field_bilde') || $node->get('field_bilde')->isEmpty()) {
      return NULL;
    }
    $media = $node->get('field_bilde')->entity;
    if (!$media || !$media->hasField('field_media_image') || $media->get('field_media_image')->isEmpty()) {
      return NULL;
    }
    $item = $media->get('field_media_image')->first();
    $file = $item?->entity;
    // WebP and very large files are not read by every service; use the page image then.
    if (!$file || !in_array($file->getMimeType(), ['image/jpeg', 'image/png'], TRUE) || (int) $file->getSize() > 5000000) {
      return NULL;
    }
    $url = \Drupal::service('file_url_generator')->generateAbsoluteString($file->getFileUri());
    if (!str_starts_with($url, 'https://portal.rockeskolen.com/')) {
      return NULL;
    }
    return [
      'url' => $url,
      'alt' => trim((string) $item->alt),
      'type' => $file->getMimeType(),
      'width' => (int) $item->width ?: 1200,
      'height' => (int) $item->height ?: 630,
    ];
  }

  /**
   * Reuses the page's own lead image instead of a generic sharing image.
   */
  private function imageFromContent(string $content): ?array {
    if (preg_match('/<img\b[^>]*class=["\'][^"\']*image-field[^"\']*["\'][^>]*>/is', $content, $match) !== 1) {
      return NULL;
    }
    $tag = $match[0];
    if (preg_match('/\bsrc=["\']([^"\']+)["\']/i', $tag, $src_match) !== 1) {
      return NULL;
    }
    $url = html_entity_decode($src_match[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
    if (str_starts_with($url, '/')) {
      $url = 'https://portal.rockeskolen.com' . $url;
    }
    if (!str_starts_with($url, 'https://portal.rockeskolen.com/')) {
      return NULL;
    }
    $alt = '';
    if (preg_match('/\balt=["\']([^"\']*)["\']/i', $tag, $alt_match) === 1) {
      $alt = trim(html_entity_decode($alt_match[1], ENT_QUOTES | ENT_HTML5, 'UTF-8'));
    }
    $width = 1200;
    $height = 630;
    if (preg_match('/\bwidth=["\'](\d+)["\']/i', $tag, $width_match) === 1) {
      $width = max(1, (int) $width_match[1]);
    }
    if (preg_match('/\bheight=["\'](\d+)["\']/i', $tag, $height_match) === 1) {
      $height = max(1, (int) $height_match[1]);
    }
    $path = strtolower((string) parse_url($url, PHP_URL_PATH));
    $type = str_ends_with($path, '.webp') ? 'image/webp' : (str_ends_with($path, '.png') ? 'image/png' : 'image/jpeg');
    return [
      'url' => $url,
      'alt' => $alt,
      'type' => $type,
      'width' => $width,
      'height' => $height,
    ];
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
    string $image_type,
    int $image_width,
    int $image_height,
    ?array $article_times = NULL,
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
      'image_type',
    ));
    $og_type = $article_times === NULL ? 'website' : 'article';
    $article_meta = $article_times === NULL ? '' : "\n"
      . '<meta property="article:published_time" content="' . $escape($article_times['published']) . '" />' . "\n"
      . '<meta property="article:modified_time" content="' . $escape($article_times['modified']) . '" />';

    return <<<HTML
<meta name="description" content="{$values['description']}" />
<link rel="canonical" href="{$values['canonical']}" />
<meta property="og:locale" content="nb_NO" />
<meta property="og:site_name" content="Rockeskolen" />
<meta property="og:type" content="{$og_type}" />{$article_meta}
<meta property="og:title" content="{$values['title']}" />
<meta property="og:description" content="{$values['description']}" />
<meta property="og:url" content="{$values['canonical']}" />
<meta property="og:image" content="{$values['image']}" />
<meta property="og:image:secure_url" content="{$values['image']}" />
<meta property="og:image:type" content="{$values['image_type']}" />
<meta property="og:image:width" content="{$image_width}" />
<meta property="og:image:height" content="{$image_height}" />
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
