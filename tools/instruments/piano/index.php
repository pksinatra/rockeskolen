<?php
declare(strict_types=1);

// Spillbart piano – hentet fra ChordLinks Playable Piano og tilpasset Rockeskolen.
// JS- og CSS-filene i denne mappen er felles med ChordLink og skal holdes byte-identiske.
// Norsk er standard; engelsk bare med ?lang=en (ingen cookie).
require_once dirname(__DIR__, 2) . '/shared/bootstrap.php';

$isNorwegian = rs_updated_lang() !== 'en';
$steps = $isNorwegian
    ? [
        'Klikk eller trykk på tangentene for å spille. På berøringsskjerm kan du spille akkorder med flere fingre, og på datamaskin kan du bruke tastene Z–M og Q–P.',
        'Bruk pilene over klaviaturet for å bytte oktav, og velg hvor mange oktaver og hvilke tonenavn som skal vises.',
        'Velg et lydvalg eller juster lyden selv. Koble til et MIDI-klaviatur med Koble til MIDI.',
        'For å lage et mønster: slå på Ta opp toner, velg et steg og spill tonene du vil ha på steget. Velg tempo og notelengde, og trykk Spill.',
      ]
    : [
        'Click or tap the keys to play. You can play chords with several fingers on a touch screen, or use the computer keys Z–M and Q–P.',
        'Use the arrows above the keyboard to change octave, and choose how many octaves and which note names to show.',
        'Pick a sound preset or adjust the sound controls. Connect a MIDI keyboard with Connect MIDI.',
        'For a pattern, turn on Record notes, choose a step and play the notes you want on that step. Set tempo and note length, then press Play.',
      ];
?><!doctype html>
<html lang="<?= rs_updated_lang() ?>">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<?php chordlink_share_meta([
    'title' => $isNorwegian ? 'Spillbart piano | Rockeskolen' : 'Playable piano | Rockeskolen',
    'description' => $isNorwegian
        ? 'Spill piano direkte i nettleseren og hør toner når du øver, underviser eller lager musikk.'
        : 'Play piano in your browser and hear notes while you practise, teach or make music.',
]); ?>
<?php chordlink_app_header_styles(); ?>
<link rel="stylesheet" href="piano.css?v=20261101-5">

<!-- Tone.js for lyd -->
<script src="https://unpkg.com/tone@14.7.77/build/Tone.js"></script>
<script>window.CL_PIANO_CONFIG = { lang: <?= json_encode(rs_updated_lang()) ?> };</script>

<!-- Musikkteori (akkordnavn) og pianomodulene -->
<script src="/tools/chordprog/music.js" defer></script>
<script src="piano-engine.js?v=20261101-5" defer></script>
<script src="piano-keyboard.js?v=20261101-5" defer></script>
<script src="piano-sequencer.js?v=20261101-5" defer></script>
<script src="piano-app.js?v=20261101-5" defer></script>
</head>
<body>
  <?php chordlink_app_header($isNorwegian ? 'Spillbart piano' : 'Playable piano'); ?>
  <main class="pk-page">
    <h1><?= $isNorwegian ? 'Spillbart piano' : 'Playable piano' ?></h1>
    <div id="piano-app">
      <noscript><p><?= $isNorwegian ? 'Pianoet trenger JavaScript for å spille lyd.' : 'The piano needs JavaScript to play sound.' ?></p></noscript>
    </div>
    <details class="rs-app-help">
      <summary><?= $isNorwegian ? 'Hjelp' : 'Help' ?></summary>
      <ol>
        <?php foreach ($steps as $step): ?>
        <li><?= rs_updated_h($step) ?></li>
        <?php endforeach; ?>
      </ol>
    </details>
  </main>
</body>
</html>
