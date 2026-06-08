<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Akkordvisning</title>
<script src="https://cdn.jsdelivr.net/npm/vexflow@4.1.0/build/cjs/vexflow.js"></script>
<script src="https://cdn.jsdelivr.net/npm/tone@14.7.77/build/Tone.js"></script>
<link rel="stylesheet" href="./style.css">
</head>
<body>
  <div class="notation-row">
    <div class="notation-wrapper">
        <button id="toggleNotation"></button>
      <div id="notation"></div>
    </div>
  </div>
  <div class="piano-row">
    <div id="piano"></div>
  </div>
  <div class="button-row">
    <div class="chord-buttons">
      <button onclick="playChord()">Spill akkord</button>
      <button onclick="playArpeggio()">Arpeggio</button>
    </div>
  </div>
<script src="./ui.js"></script>
</body>
</html>
