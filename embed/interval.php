<?php
// Intervall-embed for artikler i musikkportalen. Styres med URL-parametere, se interval.js.
$lang = ($_GET['lang'] ?? 'en') === 'no' ? 'no' : 'en';
$no = $lang === 'no';
?>
<!doctype html>
<html lang="<?= $lang ?>">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title><?= $no ? 'Intervaller' : 'Intervals' ?></title>
  <link rel="stylesheet" href="interval.css?v=20261023-1">
</head>
<body>
  <main class="interval" data-lang="<?= $lang ?>">
    <header>
      <div>
        <p class="eyebrow"><?= $no ? 'Intervaller' : 'Intervals' ?></p>
        <h1 id="title"></h1>
      </div>
      <div class="playmode" role="group" aria-label="<?= $no ? 'Avspilling' : 'Playback' ?>">
        <button id="melodic" type="button" aria-pressed="true"><?= $no ? 'Etter hverandre' : 'Melodic' ?></button>
        <button id="harmonic" type="button" aria-pressed="false"><?= $no ? 'Samtidig' : 'Harmonic' ?></button>
      </div>
    </header>

    <nav id="presets" aria-label="<?= $no ? 'Velg intervall' : 'Choose interval' ?>"></nav>
    <section id="cards" class="cards" aria-live="polite"></section>

    <section class="piano-panel" aria-label="Piano">
      <div id="piano" class="piano"></div>
    </section>

    <footer>
      <div class="transport" id="transport"></div>
      <p id="status" role="status"></p>
    </footer>
  </main>
  <script src="interval.js?v=20261023-1"></script>
</body>
</html>
