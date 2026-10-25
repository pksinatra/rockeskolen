<?php
$lang = strtolower(trim((string) ($_GET['lang'] ?? 'en')));
if (!in_array($lang, ['en', 'no'], true)) {
    $lang = 'en';
}
?>
<!doctype html>
<html lang="<?= $lang === 'no' ? 'nb' : 'en' ?>">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?= $lang === 'no' ? 'Akkord og skala' : 'Chord and scale' ?></title>
  <link rel="stylesheet" href="/tools/notes/chordscale.css?v=20260901-3">
  <script src="https://unpkg.com/vexflow@4.2.5/build/cjs/vexflow.js"></script>
  <script src="https://unpkg.com/tone@14.8.49/build/Tone.js"></script>
</head>
<body>
  <main class="cs-card" data-lang="<?= htmlspecialchars($lang, ENT_QUOTES) ?>">
    <header class="cs-heading">
      <div>
        <p class="cs-eyebrow"><?= $lang === 'no' ? 'Harmoni og melodi' : 'Harmony and melody' ?></p>
        <h1 id="csTitle"><?= $lang === 'no' ? 'Akkord og skala' : 'Chord and scale' ?></h1>
      </div>
      <div class="cs-legend" aria-label="<?= $lang === 'no' ? 'Fargeforklaring' : 'Colour legend' ?>">
        <span><i class="legend-dot chord"></i><?= $lang === 'no' ? 'Akkord' : 'Chord' ?></span>
        <span><i class="legend-dot melody"></i><?= $lang === 'no' ? 'Melodi' : 'Melody' ?></span>
      </div>
    </header>

    <p id="csExplanation" class="cs-explanation"></p>

    <section class="notation-panel" aria-label="<?= $lang === 'no' ? 'Notebilde med g-nøkkel og f-nøkkel' : 'Notation with treble and bass clefs' ?>">
      <div id="grandStaff"></div>
    </section>

    <section class="keyboard-panel" aria-label="<?= $lang === 'no' ? 'Pianotangenter' : 'Piano keyboard' ?>">
      <div id="keyboard" class="keyboard"></div>
    </section>

    <div class="controls" aria-label="<?= $lang === 'no' ? 'Avspilling' : 'Playback' ?>">
      <button id="playTogether" type="button"><span aria-hidden="true">▶</span> <?= $lang === 'no' ? 'Sammen' : 'Together' ?></button>
      <button id="playChord" type="button"><span aria-hidden="true">▶</span> <?= $lang === 'no' ? 'Akkord' : 'Chord' ?></button>
      <button id="playMelody" type="button"><span aria-hidden="true">▶</span> <?= $lang === 'no' ? 'Skala' : 'Scale' ?></button>
      <button id="stopPlayback" type="button"><span aria-hidden="true">■</span> <?= $lang === 'no' ? 'Stopp' : 'Stop' ?></button>
      <span id="playbackStatus" class="sr-only" role="status" aria-live="polite"></span>
    </div>
  </main>

  <script src="/tools/notes/chordscale.js?v=20260901-5"></script>
  <script src="/embed/autoheight.js?v=20261025-1"></script>
</body>
</html>
