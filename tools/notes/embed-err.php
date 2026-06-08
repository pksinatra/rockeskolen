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
<div id="notation" style="width:100%; max-width:100%;"></div>
  <div id="pianoroll-wrapper">
  <canvas id="pianoRoll" width="1000" height="180"></canvas>
</div>


<div id="controls">
  <button id="playScale">▶ Play</button>
  <button id="stopScale">■ Stop</button>
</div>
<script src="notes.js"></script>
</body>
</html>
