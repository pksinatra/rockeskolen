<?php
require_once __DIR__ . '/includes/content.php';

$pageTitle = 'Rockeskolen | Digitale verktøy for musikk, kreativitet og læring';
$description = 'Rockeskolen er et digitalt lærings- og arbeidsrom for musikk med praktiske verktøy for akkorder, skalaer, instrumenter, teori og musikkskaping.';
$heroImage = '/images/rockeskolen-hero.png';
$homeTools = rs_public_tools(6, true);
$latestArticles = array_slice(rs_articles(), 0, 3);
?><!doctype html>
<html lang="no">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?php echo rs_h($pageTitle); ?></title>
  <meta name="description" content="<?php echo rs_h($description); ?>">
  <link rel="canonical" href="https://www.rockeskolen.com/">
  <meta property="og:type" content="website">
  <meta property="og:title" content="<?php echo rs_h($pageTitle); ?>">
  <meta property="og:description" content="<?php echo rs_h($description); ?>">
  <meta property="og:url" content="https://www.rockeskolen.com/">
  <meta property="og:image" content="<?php echo rs_h($heroImage); ?>">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="stylesheet" href="/includes/site.css?v=1">
</head>
<body>
  <header class="hero" style="--hero-image:url('<?php echo rs_h($heroImage); ?>')">
    <div class="topbar">
      <a class="brand" href="/">
        <span class="brand-mark">R</span>
        <span>Rockeskolen</span>
      </a>
      <nav class="nav" aria-label="Hovednavigasjon">
        <a href="/tools/">Verktøy</a>
        <a href="/article.php?slug=fra-ide-til-ferdig-musikk">Om prosjektet</a>
        <a href="https://portal.rockeskolen.com">RDØ</a>
        <a href="/members/account.php">Min side</a>
      </nav>
    </div>

    <div class="hero-inner">
      <div class="hero-copy">
        <p class="eyebrow">Digitalt lærings- og arbeidsrom</p>
        <h1>Lær, utforsk og skap musikk.</h1>
        <p class="lead">
          Rockeskolen samler praktiske musikkverktøy, interaktive ressurser og moderne musikkteknologi for veien fra idé til ferdig musikk.
        </p>
        <div class="actions">
          <a class="button primary" href="/tools/">Åpne verktøy</a>
          <a class="button secondary" href="https://portal.rockeskolen.com">Gå til RDØ</a>
        </div>
      </div>
    </div>
  </header>

  <main class="main">
    <section class="section" aria-labelledby="featured-tools">
      <div class="section-head">
        <div>
          <p class="eyebrow">Verktøy</p>
          <h2 id="featured-tools">Arbeidsflater for teori, øving og låtskriving.</h2>
          <p>Verktøyene bygger på samme funksjonalitet som ChordLink, men presenteres for Rockeskolen med norsk språk, læringsfokus og tydelige innganger.</p>
        </div>
        <a class="learn" href="/tools/">Alle verktøy</a>
      </div>

      <div class="tool-grid">
        <?php foreach ($homeTools as $tool): ?>
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

    <section class="band">
      <div class="section">
        <p class="eyebrow">Fra idé til ferdig musikk</p>
        <div class="value-grid">
          <article class="value">
            <h3>Forstå</h3>
            <p>Se akkorder, skalaer, symboler og harmonikk som konkrete mønstre på instrumentet.</p>
          </article>
          <article class="value">
            <h3>Øv</h3>
            <p>Bruk piano, gitar, tuner og øvingsrom som praktiske arbeidsflater i undervisning og egenøving.</p>
          </article>
          <article class="value">
            <h3>Skap</h3>
            <p>Flytt ideer videre inn i låtskriving, akkordskjemaer, samspill og digital musikkproduksjon.</p>
          </article>
        </div>
      </div>
    </section>

    <section class="section" aria-labelledby="updates">
      <div class="section-head">
        <div>
          <p class="eyebrow">Prosjekt</p>
          <h2 id="updates">Notater og retning.</h2>
        </div>
      </div>
      <div class="article-list">
        <?php foreach ($latestArticles as $article): ?>
          <a class="article-row" href="/article.php?slug=<?php echo rawurlencode($article['slug']); ?>">
            <div>
              <strong><?php echo rs_h($article['title']); ?></strong>
              <span><?php echo rs_h($article['ingress']); ?></span>
            </div>
            <span>Les</span>
          </a>
        <?php endforeach; ?>
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="footer-inner">
      <strong>Rockeskolen</strong>
      <span>Digitale verktøy for musikkopplæring, kreativitet og musikkskaping.</span>
    </div>
  </footer>
</body>
</html>
