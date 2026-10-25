<?php
$output = $_GET['output'] ?? 'notation';
$output = in_array($output, ['notation', 'piano', 'both'], true) ? $output : 'notation';
?>
<!doctype html>
<html lang="no">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Notes</title>
  <link rel="stylesheet" href="/tools/notes/notes.css?v=20260901-2">
  <script src="https://unpkg.com/vexflow@4.2.5/build/cjs/vexflow.js"></script>
  <script src="https://unpkg.com/tone@14.8.49/build/Tone.js"></script>
</head>
<body>
  <div id="notation"<?php if ($output === 'piano') echo ' hidden'; ?>></div>

  <div id="pianoroll-panel"<?php if ($output === 'notation') echo ' hidden'; ?>>
    <canvas id="roll"></canvas>
  </div>

  <div id="controls" aria-label="Avspilling">
    <button id="playScale" type="button"><span aria-hidden="true">▶</span> Spill</button>
    <button id="stopScale" type="button"><span aria-hidden="true">■</span> Stopp</button>
    <div id="directionControls" class="direction-controls" role="group" aria-label="Velg retning">
      <button type="button" class="direction-button" data-direction="up" aria-label="Spill oppover" aria-pressed="false" title="Oppover">↑</button>
      <button type="button" class="direction-button" data-direction="down" aria-label="Spill nedover" aria-pressed="false" title="Nedover">↓</button>
      <button type="button" class="direction-button" data-direction="both" aria-label="Spill opp og ned" aria-pressed="false" title="Opp og ned">↕</button>
    </div>
    <span id="playbackStatus" class="sr-only" role="status" aria-live="polite"></span>
  </div>

  <script src="notes.js?v=20260909-1"></script>
  <script src="pianoroll.js?v=20260901-2"></script>
  <script src="/embed/autoheight.js?v=20261025-1"></script>
</body>
</html>
