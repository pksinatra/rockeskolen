<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/meta.php';
?><!doctype html>
<html lang="no">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
<?php rs_render_meta(
    'Spill. Utforsk. Lag musikk. | Rockeskolen',
    'Rockeskolen er en læringsarena for musikalsk utvikling og kreativitet. I Rockeskolens Musikkportal finner du kunnskap, veiledning og verktøy som hjelper deg å utvikle dine egne musikalske ideer, samarbeide med andre og finne ditt eget uttrykk.',
    'https://rockeskolen.com/'
); ?>
  <link rel="stylesheet" href="/includes/site.css?v=5">
  <link rel="stylesheet" href="/includes/home.css?v=20261015-2">
</head>
<body class="rs-home">
  <main class="home-gateway">
    <header class="home-header">
      <a class="home-brand" href="/" aria-label="Rockeskolen – forside">
        <img src="/images/rock-logo.png" alt="Rockeskolen" class="home-logo">
      </a>
      <a class="home-nav-primary" href="https://portal.rockeskolen.com">Til musikkportalen <span aria-hidden="true">→</span></a>
    </header>

    <section class="home-hero" aria-labelledby="home-title">
      <div class="home-hero__content">
        <p class="eyebrow">Rockeskolens digitale læringsarena</p>
        <h1 id="home-title">Spill. Utforsk.<br>Lag musikk.</h1>
        <p class="home-hero__lead">Rockeskolen er en læringsarena for musikalsk utvikling og kreativitet. I Rockeskolens Musikkportal finner du kunnskap, veiledning og verktøy som hjelper deg å utvikle dine egne musikalske ideer, samarbeide med andre og finne ditt eget uttrykk.</p>
        <p class="home-hero__closing">For musikk skal være både morsomt, spennende og lærerikt.</p>
        <a class="home-hero__cta" href="https://portal.rockeskolen.com">Utforsk musikkportalen <span aria-hidden="true">→</span></a>
      </div>
      <div class="home-hero__image">
        <img src="/images/workshops.jpg" alt="Musiker arbeider med gitar og keyboard i Rockeskolens studio" width="987" height="1280" fetchpriority="high">
      </div>
    </section>

    <footer class="home-footer">
      <span>Rockeskolen</span>
      <span>Musikk på nett og i virkeligheten.</span>
      <a href="/workshop/">Kurs og workshops</a>
      <a href="/skoler/">For skoler</a>
    </footer>
  </main>
</body>
</html>
