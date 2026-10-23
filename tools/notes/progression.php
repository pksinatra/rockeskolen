<?php
$lang = ($_GET['lang'] ?? 'en') === 'no' ? 'no' : 'en';
?>
<!doctype html>
<html lang="<?= $lang ?>">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title><?= $lang === 'no' ? 'Akkordprogresjon' : 'Chord progression' ?></title>
  <link rel="stylesheet" href="progression.css?v=20260909-1">
  <script src="https://cdn.jsdelivr.net/npm/vexflow@4.1.0/build/cjs/vexflow.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/tone@14.7.77/build/Tone.js"></script>
</head>
<body>
  <main class="progression" data-lang="<?= $lang ?>">
    <header>
      <div>
        <p class="eyebrow"><?= $lang === 'no' ? 'Akkordprogresjon' : 'Chord progression' ?></p>
        <h1 id="title"></h1>
      </div>
      <label class="tempo">
        <span><?= $lang === 'no' ? 'Tempo' : 'Tempo' ?></span>
        <input id="tempo" type="range" min="50" max="160" step="1">
        <output id="tempoValue"></output>
      </label>
    </header>

    <nav id="presets" aria-label="<?= $lang === 'no' ? 'Velg progresjon' : 'Choose progression' ?>"></nav>
    <section id="chordCards" class="chord-cards" aria-live="polite"></section>

    <section class="notation-panel" aria-label="<?= $lang === 'no' ? 'Progresjonen på noter' : 'Progression in notation' ?>">
      <div id="notation"></div>
    </section>

    <section class="piano-panel" aria-label="<?= $lang === 'no' ? 'Progresjonen på piano' : 'Progression on piano' ?>">
      <div id="piano" class="piano"></div>
    </section>

    <footer>
      <div class="transport">
        <button id="play" type="button">▶ <span><?= $lang === 'no' ? 'Spill' : 'Play' ?></span></button>
        <button id="stop" type="button">■ <span><?= $lang === 'no' ? 'Stopp' : 'Stop' ?></span></button>
        <button id="loop" type="button" aria-pressed="false">↻ <span><?= $lang === 'no' ? 'Gjenta' : 'Loop' ?></span></button>
      </div>
      <p id="status" role="status"></p>
    </footer>
  </main>
  <script src="progression.js?v=20261023-5"></script>
</body>
</html>
