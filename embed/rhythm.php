<?php
// Rytme-embed for artikler i musikkportalen. Styres med URL-parametere, se rhythm.js.
$lang = ($_GET['lang'] ?? 'en') === 'no' ? 'no' : 'en';
$no = $lang === 'no';
?>
<!doctype html>
<html lang="<?= $lang ?>">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title><?= $no ? 'Rytme' : 'Rhythm' ?></title>
  <link rel="stylesheet" href="rhythm.css?v=20261023-3">
</head>
<body>
  <main class="rhythm" data-lang="<?= $lang ?>">
    <header>
      <div>
        <p class="eyebrow"><?= $no ? 'Rytme' : 'Rhythm' ?></p>
        <h1 id="title"></h1>
      </div>
      <label class="tempo">
        <span>Tempo</span>
        <input id="tempo" type="range" min="40" max="220" step="1">
        <output id="tempoValue"></output>
      </label>
    </header>

    <nav id="presets" aria-label="<?= $no ? 'Velg variant' : 'Choose variant' ?>"></nav>

    <section id="swingPanel" class="swing" hidden>
      <label>
        <span><?= $no ? 'Swing' : 'Swing' ?></span>
        <input id="swing" type="range" min="0" max="100" step="1">
        <output id="swingValue"></output>
      </label>
    </section>

    <section id="grid" class="grid" aria-live="off"></section>
    <p id="explain" class="explain"></p>

    <footer>
      <div class="transport">
        <button id="play" type="button">▶ <span><?= $no ? 'Spill' : 'Play' ?></span></button>
        <button id="stop" type="button">■ <span><?= $no ? 'Stopp' : 'Stop' ?></span></button>
        <button id="tap" type="button" hidden>👆 <span><?= $no ? 'Tapp tempo' : 'Tap tempo' ?></span></button>
      </div>
      <p id="status" role="status"></p>
    </footer>
  </main>
  <script src="rhythm.js?v=20261023-4"></script>
  <script src="/embed/autoheight.js?v=20261025-1"></script>
</body>
</html>
