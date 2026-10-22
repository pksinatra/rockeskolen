<?php
declare(strict_types=1);
require_once __DIR__ . '/includes/meta.php';
?><!doctype html>
<html lang="no">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
<?php rs_render_meta(
    'Rockeskolen | To veier inn i musikken',
    'Velg mellom Rockeskolens digitale øvingsrom og våre kurs og workshops.',
    'https://rockeskolen.com/'
); ?>
  <link rel="stylesheet" href="/includes/site.css?v=5">
  <link rel="stylesheet" href="/includes/home.css?v=1">
</head>
<body class="rs-home">
  <main class="home-gateway">
    <header class="home-header">
      <a class="home-brand" href="/" aria-label="Rockeskolen – forside">
        <img src="/images/rock-logo.png" alt="Rockeskolen" class="home-logo">
      </a>
      <nav class="home-nav" aria-label="Hovednavigasjon">
        <a href="https://portal.rockeskolen.com">Øvingsrommet</a>
        <a href="/workshop/">Kurs og workshops</a>
      </nav>
    </header>

    <div class="home-intro">
      <p class="eyebrow">Rockeskolen</p>
      <h1>To veier inn i musikken.</h1>
      <p>Arbeid med musikk på nett, eller møt oss på kurs og workshops.</p>
    </div>

    <section class="member-campaign" aria-labelledby="member-campaign-title">
      <div class="member-campaign__copy">
        <h2 id="member-campaign-title">Bli med fra starten.</h2>
        <p>Opprett en gratis konto og bli en del av Rockeskolens digitale øvingsrom. Du får en samlet inngang til verktøy, læringsressurser og nye funksjoner etter hvert som de lanseres.</p>
      </div>
      <div class="member-campaign__actions">
        <a class="member-campaign__primary" href="/members/register.php?redirect=%2Fmembers%2Fportal.php">Bli gratis medlem <span aria-hidden="true">→</span></a>
        <a class="member-campaign__secondary" href="/members/upgrade.php">Se VIP-introen</a>
        <p><strong>VIP-intro: 39,90 kr/mnd</strong><br>Normalpris 49,90. Behold introduksjonsprisen så lenge abonnementet er aktivt.</p>
      </div>
    </section>

    <section class="gateway-grid" aria-label="Velg del av Rockeskolen">
      <a class="gateway-card gateway-card--digital" href="https://portal.rockeskolen.com">
        <div class="gateway-card__copy">
          <p class="gateway-card__label">På nett</p>
          <h2>Øvingsrommet</h2>
          <p>Verktøy, musikkteori, instrumenter og læringsressurser for elever, lærere og alle som vil forstå mer.</p>
          <span>Gå til den digitale plattformen <b aria-hidden="true">→</b></span>
        </div>
      </a>

      <a class="gateway-card gateway-card--courses" href="/workshop/">
        <div class="gateway-card__copy">
          <p class="gateway-card__label">Sammen med andre</p>
          <h2>Kurs og workshops</h2>
          <p>Praktiske musikkaktiviteter, samspill og skapende arbeid på tid og sted.</p>
          <span>Se kurs og samlinger <b aria-hidden="true">→</b></span>
        </div>
      </a>
    </section>

    <footer class="home-footer">
      <span>Rockeskolen</span>
      <span>Musikk på nett og i virkeligheten.</span>
    </footer>
  </main>
</body>
</html>
