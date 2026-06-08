<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Chord Notes</title>
<script src="https://cdn.jsdelivr.net/npm/vexflow@4.1.0/build/cjs/vexflow.js"></script>
<script src="https://cdn.jsdelivr.net/npm/tone@14.7.77/build/Tone.js"></script>
<link rel="stylesheet" href="style.css">

</head>

<body>
<div class="app">
  <h2>Chord Notes</h2>

  <div class="controls">
<select id="root">
  <option>C</option><option>C#</option><option>Db</option>
  <option>D</option><option>Eb</option><option>E</option>
  <option>F</option><option>F#</option><option>Gb</option>
  <option>G</option><option>Ab</option><option>A</option>
  <option>Bb</option><option>B</option>
</select>

<select id="type">
  <option value="maj">Major</option>
<option value="min">Minor</option>
  <option value="dim">Dim</option>
  <option value="aug">Aug</option>
  <option value="7">7</option>
  <option value="maj7">Maj7</option>
  <option value="min7">m7</option>
  <option value="m7b5">m7b5</option>
  <option value="dim7">dim7</option>
  <option value="sus2">sus2</option>
  <option value="sus4">sus4</option>
  <option value="6">6</option>
  <option value="min6">m6</option>
  <option value="add9">add9</option>
  <option value="13">13</option>
</select>
  </div>

  <div class="notation-row">
    <div class="notation-wrapper">
      <div class="notation-header">
        <button id="toggleNotation"></button>
      </div>
      <div id="notation"></div>
    </div>
  </div>

  <div class="piano-row">
    <div id="piano"></div>
  </div>

  <div class="button-row">
    <div class="chord-buttons">
      <button onclick="playChord()">Play chord</button>
<button onclick="playArpeggio()">Arpeggio</button>
    </div>
  </div>




</div>


<script src="ui.js"></script>
</body>
</html>
