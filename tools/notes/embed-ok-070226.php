<?php 
$output = $_GET['output'] ?? 'notation';
?>

<!doctype html>
<html lang="no">
<head>
  <meta charset="utf-8">
  <title>Notes</title>
  <link rel="stylesheet" href="/tools/notes/notes.css">
<script src="https://unpkg.com/vexflow@4.2.5/build/cjs/vexflow.js"></script>
<script src="https://unpkg.com/tone@14.8.49/build/Tone.js"></script>
</head>
<body>

<div
  id="notation"
  <?php if ($output === 'piano') echo 'style="display:none"'; ?>
></div>
<div
  id="pianoroll-panel"
  <?php if ($output === 'notation') echo 'style="display:none"'; ?>
>
  <canvas id="roll"></canvas>
</div>

<div id="controls">
  <button id="playScale">▶ Play</button>
  <button id="stopScale">■ Stop</button>
</div>
<script src="notes.js"></script>
<script src="pianoroll.js"></script>

</body>
</html>
