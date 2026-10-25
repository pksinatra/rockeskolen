<?php
// Form-embed for artikler i musikkportalen. Styres med URL-parametere, se form.js.
$lang = ($_GET['lang'] ?? 'en') === 'no' ? 'no' : 'en';
$no = $lang === 'no';
?>
<!doctype html>
<html lang="<?= $lang ?>">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title><?= $no ? 'Form og struktur' : 'Song form' ?></title>
  <link rel="stylesheet" href="form.css?v=20261025-1">
</head>
<body>
  <main class="form" data-lang="<?= $lang ?>">
    <header>
      <div>
        <p class="eyebrow"><?= $no ? 'Form og struktur' : 'Song form' ?></p>
        <h1 id="title"></h1>
      </div>
      <label class="tempo">
        <span>Tempo</span>
        <input id="tempo" type="range" min="60" max="160" step="1">
        <output id="tempoValue"></output>
      </label>
    </header>

    <nav id="presets" aria-label="<?= $no ? 'Velg form' : 'Choose form' ?>"></nav>
    <section id="timeline" class="timeline" aria-label="<?= $no ? 'Delene i låten' : 'The sections of the song' ?>"></section>
    <section class="bars-panel" aria-live="polite">
      <p id="sectionInfo" class="section-info"></p>
      <div id="bars" class="bars"></div>
    </section>

    <footer>
      <div class="transport">
        <button id="play" type="button">▶ <?= $no ? 'Spill hele' : 'Play all' ?></button>
        <button id="stop" type="button">■ <?= $no ? 'Stopp' : 'Stop' ?></button>
      </div>
      <p id="status" role="status"></p>
    </footer>
  </main>
  <script src="form.js?v=20261025-1"></script>
  <script src="/embed/autoheight.js?v=20261025-1"></script>
</body>
</html>
