<?php
require_once dirname(__DIR__) . '/includes/content.php';

$pageTitle = 'Verktøy | Rockeskolen';
$description = 'Utforsk Rockeskolens digitale musikkverktøy for akkorder, skalaer, instrumenter, teori, stemming og låtskriving.';
$tools = rs_public_tools();
$categories = array_values(array_unique(array_map(function ($tool) { return $tool['category']; }, $tools)));
$portalSections = rs_portal_sections();
?><!doctype html>
<html lang="no">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?php echo rs_h($pageTitle); ?></title>
  <meta name="description" content="<?php echo rs_h($description); ?>">
  <link rel="canonical" href="https://rockeskolen.com/tools/">
  <link rel="stylesheet" href="/includes/site.css?v=2">
</head>
<body>
  <header class="page-header">
    <div class="topbar">
      <a class="brand" href="/" aria-label="Rockeskolen">
        <img src="/images/rock-logo.png" alt="Rockeskolen">
      </a>
      <nav class="nav" aria-label="Hovednavigasjon">
        <a href="/workshop/index.php">Workshop</a>
        <a href="https://portal.rockeskolen.com">Portal</a>
      </nav>
    </div>
  </header>

  <main class="page-shell">
    <section class="page-title">
      <p class="eyebrow">Rockeskolen Tools</p>
      <h1>Verktøy som gjør teori spillbar.</h1>
      <p class="lead">
        Akkorder, skalaer, tuner, låtskriving og instrumentressurser. Bruk dem i øving, band, undervisning og når en idé plutselig dukker opp.
      </p>
    </section>

    <?php foreach ($categories as $category): ?>
      <section class="section" id="<?php echo in_array($category, ['Instrument', 'Teori'], true) ? rs_h(strtolower(str_replace(['Instrument', 'Teori'], ['instrument', 'teori'], $category))) : 'cat-' . rs_h(rs_slugify($category)); ?>" aria-labelledby="cat-<?php echo rs_h(rs_slugify($category)); ?>">
        <div class="section-head">
          <div>
            <p class="eyebrow"><?php echo rs_h($category); ?></p>
            <h2 id="cat-<?php echo rs_h(rs_slugify($category)); ?>"><?php echo rs_h($category); ?></h2>
          </div>
        </div>
        <div class="tool-grid">
          <?php foreach ($tools as $tool): ?>
            <?php if ($tool['category'] !== $category) continue; ?>
            <article class="tool-card">
              <div class="tool-art"></div>
              <div class="tool-body">
                <div class="meta">
                  <span class="pill"><?php echo rs_h($tool['category']); ?></span>
                  <span class="pill"><?php echo rs_h($tool['product_status']); ?></span>
                </div>
                <h3><?php echo rs_h($tool['title']); ?></h3>
                <p><?php echo rs_h($tool['short_description']); ?></p>
                <div class="link-row">
                  <a class="open" href="<?php echo rs_h($tool['app_url']); ?>"><?php echo rs_h($tool['cta_label']); ?></a>
                  <a class="learn" href="/tool.php?slug=<?php echo rawurlencode($tool['slug']); ?>">Les mer</a>
                </div>
              </div>
            </article>
          <?php endforeach; ?>
        </div>
      </section>
    <?php endforeach; ?>

    <?php foreach ($portalSections as $section): ?>
      <section class="section portal-section" aria-labelledby="portal-<?php echo rs_h(rs_slugify($section['title'])); ?>">
        <div class="section-head">
          <div>
            <p class="eyebrow"><?php echo rs_h($section['eyebrow']); ?></p>
            <h2 id="portal-<?php echo rs_h(rs_slugify($section['title'])); ?>"><?php echo rs_h($section['title']); ?></h2>
            <p><?php echo rs_h($section['summary']); ?></p>
          </div>
          <a class="learn" href="<?php echo rs_h($section['url']); ?>">Åpne i portalen</a>
        </div>
        <div class="resource-grid">
          <?php foreach ($section['items'] as $item): ?>
            <a class="resource-card" href="<?php echo rs_h($item['url']); ?>">
              <span><?php echo rs_h($section['eyebrow']); ?></span>
              <strong><?php echo rs_h($item['title']); ?></strong>
              <p><?php echo rs_h($item['summary']); ?></p>
            </a>
          <?php endforeach; ?>
        </div>
      </section>
    <?php endforeach; ?>
  </main>

  <footer class="footer">
    <div class="footer-inner">
      <strong>Rockeskolen</strong>
      <span>Samme kjerne som ChordLink, med Rockeskolen-uttrykk og norsk læringskontekst.</span>
    </div>
  </footer>
</body>
</html>
