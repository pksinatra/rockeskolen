<?php
require_once __DIR__ . '/includes/content.php';

$pageTitle = 'Rockeskolen | Digitale verktøy for musikk, kreativitet og læring';
$description = 'Rockeskolen er et digitalt lærings- og arbeidsrom for musikk med praktiske verktøy for akkorder, skalaer, instrumenter, teori og musikkskaping.';
$heroImage = '/images/computermusic.jpg';
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
      <a class="brand" href="/" aria-label="Rockeskolen">
        <img src="/images/rock-logo.png" alt="Rockeskolen">
      </a>
      <nav class="nav" aria-label="Hovednavigasjon">
        <a href="/tools/">Verktøy</a>
        <a href="/tools/#instrument">Instrumenter</a>
        <a href="/tools/#teori">Skolebenken</a>
        <a href="https://portal.rockeskolen.com">RDØ</a>
        <a href="/article.php?slug=fra-ide-til-ferdig-musikk">Om</a>
      </nav>
    </div>

    <div class="hero-inner">
      <div class="hero-copy">
        <p class="eyebrow">Musikkskole. Kulturarena. Digitalt øvingsrom.</p>
        <h1>Finn lyden din.</h1>
        <p class="lead">
          Rockeskolen er for ungdom i alle aldre: band, instrumenter, musikkproduksjon, workshops og digitale verktøy som gjør det morsomt å lære, øve og skape.
        </p>
        <div class="actions">
          <a class="button primary" href="/tools/">Start her</a>
          <a class="button secondary" href="https://portal.rockeskolen.com">Gå til RDØ</a>
        </div>
        <div class="hero-tags" aria-label="Rockeskolen aktiviteter">
          <span>Band</span>
          <span>Beats</span>
          <span>Gitar</span>
          <span>Piano</span>
          <span>Workshops</span>
        </div>
      </div>
    </div>
  </header>

  <main class="main">
    <section class="section" aria-labelledby="featured-tools">
      <div class="section-head">
        <div>
          <p class="eyebrow">Verktøy</p>
          <h2 id="featured-tools">Raske innganger til å spille, skjønne og lage.</h2>
          <p>Interaktive verktøy for akkorder, skalaer, instrumenter og låtidéer. Åpent, visuelt og lett å bruke når du faktisk holder på med musikk.</p>
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
        <p class="eyebrow">Hva Rockeskolen er</p>
        <div class="value-grid">
          <article class="value">
            <h3>Band og samspill</h3>
            <p>Instrumentundervisning, samspill og bandaktiviteter med base i Gullesfjord og digital rekkevidde.</p>
          </article>
          <article class="value">
            <h3>Produksjon og teknologi</h3>
            <p>Musikkproduksjon, musikkteknologi og digitale verktøy side om side med tradisjonell undervisning.</p>
          </article>
          <article class="value">
            <h3>Øvingsrom på nett</h3>
            <p>Instrumentleksikon, teori, øvingsressurser og digitale møteplasser bygges ut mot lansering.</p>
          </article>
        </div>
      </div>
    </section>

    <section class="section" aria-labelledby="updates">
      <div class="section-head">
        <div>
          <p class="eyebrow">Prosjekt</p>
          <h2 id="updates">Skolebenken møter scenen.</h2>
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
