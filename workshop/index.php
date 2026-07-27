<?php
$plans = [
    [
        'title' => 'Bandverksted',
        'tag' => 'Samspill',
        'summary' => 'For ungdom i alle aldre som vil spille sammen, bygge låter og forstå rollen sin i bandet.',
        'points' => ['Oppvarming og groove', 'Låtstruktur og arrangement', 'Samspill, lytting og sceneøving'],
    ],
    [
        'title' => 'Låtskriving uten sperre',
        'tag' => 'Kreativitet',
        'summary' => 'En praktisk workshop for å komme fra idé til skisse uten å overtenke alt før musikken får starte.',
        'points' => ['Tekst, riff eller akkordidé', 'Vers, refreng og kontrast', 'Demo og enkel innspilling'],
    ],
    [
        'title' => 'Musikkproduksjon og beats',
        'tag' => 'Teknologi',
        'summary' => 'Kom i gang med lyd, beats, MIDI, arrangement og enkle produksjonsgrep i digitalt studio.',
        'points' => ['Beat og basslinje', 'Lydvalg og effekter', 'Fra loop til ferdig idé'],
    ],
    [
        'title' => 'Skolebenken live',
        'tag' => 'Teori i praksis',
        'summary' => 'Musikkteori koblet rett til instrument, øre og låter. Mindre pugging, mer aha.',
        'points' => ['Akkorder og skalaer', 'Kvintsirkelen i praksis', 'Hvordan høre det du ser'],
    ],
];
?><!doctype html>
<html lang="no">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Workshop | Rockeskolen</title>
  <meta name="description" content="Oversikt over Rockeskolens kursplaner og workshops innen band, låtskriving, musikkproduksjon og musikkteori i praksis.">
  <link rel="canonical" href="https://rockeskolen.com/workshop/index.php">
  <link rel="stylesheet" href="/includes/site.css?v=2">
  <style>
    @media (max-width: 640px) {
      .page-title h1 {
        font-size: clamp(38px, 11vw, 48px);
        overflow-wrap: anywhere;
      }
    }
  </style>
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
      <p class="eyebrow">Kursplaner</p>
      <h1>Workshop på Rockeskolen.</h1>
      <p class="lead">
        Kurs, samlinger og workshops bygges rundt ekte musikkarbeid: spille sammen, lage noe, forstå mer og dra hjem med mer lyd i kroppen.
      </p>
    </section>

    <section class="section">
      <div class="resource-grid">
        <?php foreach ($plans as $plan): ?>
          <article class="resource-card">
            <span><?php echo htmlspecialchars($plan['tag'], ENT_QUOTES, 'UTF-8'); ?></span>
            <strong><?php echo htmlspecialchars($plan['title'], ENT_QUOTES, 'UTF-8'); ?></strong>
            <p><?php echo htmlspecialchars($plan['summary'], ENT_QUOTES, 'UTF-8'); ?></p>
            <ul>
              <?php foreach ($plan['points'] as $point): ?>
                <li><?php echo htmlspecialchars($point, ENT_QUOTES, 'UTF-8'); ?></li>
              <?php endforeach; ?>
            </ul>
          </article>
        <?php endforeach; ?>
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="footer-inner">
      <strong>Rockeskolen Workshop</strong>
      <span>Detaljer, datoer og påmelding kan kobles på når kursplanene er klare.</span>
    </div>
  </footer>
</body>
</html>
