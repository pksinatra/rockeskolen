<?php
// Skala- og modus-embed for artikler i musikkportalen. Styres med URL-parametere, se mode.js.
$lang = ($_GET['lang'] ?? 'en') === 'no' ? 'no' : 'en';
$no = $lang === 'no';
?>
<!doctype html>
<html lang="<?= $lang ?>">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title><?= $no ? 'Skalaer og kirketonearter' : 'Scales and modes' ?></title>
  <link rel="stylesheet" href="mode.css?v=20261025-1">
  <script src="https://cdn.jsdelivr.net/npm/vexflow@4.1.0/build/cjs/vexflow.js"></script>
</head>
<body>
  <main class="mode" data-lang="<?= $lang ?>">
    <header>
      <div>
        <p class="eyebrow" id="eyebrow"><?= $no ? 'Skalaer og kirketonearter' : 'Scales and modes' ?></p>
        <h1 id="title"></h1>
      </div>
      <div class="options" role="group" aria-label="<?= $no ? 'Avspilling' : 'Playback' ?>">
        <button id="drone" type="button" aria-pressed="false"><?= $no ? 'Borduntone' : 'Drone' ?></button>
        <button id="updown" type="button" aria-pressed="false" title="<?= $no ? 'Opp og ned' : 'Up and down' ?>">↕</button>
      </div>
    </header>

    <section id="cards" class="cards" aria-label="<?= $no ? 'Velg skala' : 'Choose scale' ?>"></section>

    <section class="detail" aria-live="polite">
      <div id="steps" class="steps"></div>
      <p id="info" class="info"></p>
    </section>

    <section class="notation-panel" aria-label="<?= $no ? 'Skalaen på noter' : 'The scale in notation' ?>">
      <div id="notation"></div>
    </section>

    <section class="piano-panel" aria-label="Piano">
      <div id="piano" class="piano"></div>
    </section>

    <footer>
      <div class="transport">
        <button id="play" type="button">▶ <?= $no ? 'Spill' : 'Play' ?></button>
        <button id="playAll" type="button" hidden>▶ <?= $no ? 'Spill alle' : 'Play all' ?></button>
        <button id="playMark" type="button" hidden>♪ <?= $no ? 'Hør karaktertonen' : 'Hear the colour tone' ?></button>
        <button id="stop" type="button">■ <?= $no ? 'Stopp' : 'Stop' ?></button>
      </div>
      <p id="status" role="status"></p>
    </footer>
  </main>
  <script src="mode.js?v=20261025-1"></script>
  <script src="/embed/autoheight.js?v=20261025-1"></script>
</body>
</html>
