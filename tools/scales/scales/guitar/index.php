<!DOCTYPE html>
<?php
require $_SERVER['DOCUMENT_ROOT'] . '/members/config.php';
// require_login(); // demo is public
$user = current_user();
$isPro =
    ($user && in_array($user['role'], ['pro','vip','admin'], true));

// Optional: force demo mode with ?demo=1
if (isset($_GET['demo']) && $_GET['demo'] === '1') {
  $isPro = false;
}
?>


<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Guitar Scales</title>
  <link rel="stylesheet" href="app.css?v=13">
</head>
<body>

<div class="page">
  <div class="card">
    <div class="header">
      <div>
        <h1>🎸 Guitar Scales</h1>
        <p class="sub">
  Choose root note and scale. Display note names or intervals on the fretboard.
</p>
      </div>
    </div>
<div class="toolbar">
  <div class="field">
    <label for="rootSelect">Root note</label>
    <select id="rootSelect">
      <option value="C">C</option>
      <option value="C#">C# / Db</option>
      <option value="D">D</option>
      <option value="D#">D# / Eb</option>
      <option value="E">E</option>
      <option value="F">F</option>
      <option value="F#">F# / Gb</option>
      <option value="G">G</option>
      <option value="G#">G# / Ab</option>
      <option value="A">A</option>
      <option value="A#">A# / Bb</option>
      <option value="B">B</option>
    </select>
  </div>

  <div class="field">
    <label for="scaleSelect">Scale</label>
    <select id="scaleSelect"></select>
  </div>

  <div class="field">
    <label for="viewMode">View</label>
<select id="viewMode">
  <option value="full">Full neck</option>
  <option value="open">5 frets</option>
</select>
  </div>


  <div class="field">
    <label for="soundType">Sound</label>
    <select id="soundType">
      <option value="triangle" selected>Triangle</option>
      <option value="sine">Sine</option>
      <option value="square">Square</option>
      <option value="sawtooth">Sawtooth</option>
    </select>
  </div>

  <div class="field">
    <label for="sustain">Sustain</label>
    <input id="sustain" type="range" min="20" max="180" value="85">
  </div>

  <div class="field">
    <label for="volume">Volume</label>
    <input id="volume" type="range" min="0" max="100" value="74">
  </div>

  <div class="field">
    <label for="drive">Drive</label>
    <input id="drive" type="range" min="0" max="40" value="0">
  </div>

<div class="gs-controls-right">
  <button id="toggleLabelsBtn" class="gs-btn">Intervals</button>
  <button id="noteStyleBtn" class="gs-btn">Show ♯ / ♭</button>
  <button id="playScaleBtn" class="gs-btn">Play scale</button>
</div>
</div>
<div class="statusbar">
  <span id="statusText">Loading scales...</span>
</div>


<div id="guitarboard"></div>
  </div>
</div>
<script>
window.CL_IS_PRO = <?= $isPro ? 'true' : 'false' ?>;
window.CL_IS_LOGGED_IN = <?= $user ? 'true' : 'false' ?>;
</script>
<script src="ui.js?v=13"></script>
</body>
</html>