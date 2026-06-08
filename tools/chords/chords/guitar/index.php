<?php
require $_SERVER['DOCUMENT_ROOT'] . '/members/config.php';

$user = current_user(); // kan være null (public)
$isPro = ($user && in_array($user['role'], ['pro','admin'], true));
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Guitar Chords</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />

  <link rel="stylesheet" href="./app.css?v=15">

  <!-- PHP → JS flags (må ligge før ui.js) -->
<script>
  window.CL_IS_PRO = <?php echo $isPro ? 'true' : 'false'; ?>;
  window.CL_IS_LOGGED_IN = <?php echo $user ? 'true' : 'false'; ?>;
  window.CL_UPGRADE_URL = "/members/upgrade.php";
</script>

</head>
<body>
  <div class="page">
    <div class="card">
      <div class="header">
        <div class="title-row">
          <div>
            <h1>Guitar Chords</h1>
            <div class="sub">
              Select root and chord type.
              The tool loads chord shapes from
              <code>/api/music.php</code> and shows standard textbook shapes first.
            </div>
          </div>
          <div>
            <button id="themeBtn" type="button">
              Theme: <span id="themeLabel"></span>
            </button>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="field">
          <label for="root">Root</label>
            <select id="root">
              <option value="C">C</option>
              <option value="C#">C♯ / D♭</option>
              <option value="D">D</option>
              <option value="D#">D♯ / E♭</option>
              <option value="E">E</option>
              <option value="F">F</option>
              <option value="F#">F♯ / G♭</option>
              <option value="G">G</option>
              <option value="G#">G♯ / A♭</option>
              <option value="A">A</option>
              <option value="A#">A♯ / B♭</option>
              <option value="B">B</option>
            </select>
        </div>


        <div class="field">
          <label for="extension">Chord type</label>
          <select id="extension">
            <option value="maj">Major (triad)</option>
            <option value="min">Minor (triad)</option>
            <option value="5">5 (power)</option>
            <option value="6">6</option>
            <option value="m6">m6</option>
            <option value="69">6/9</option>
            <option value="m69">m6/9</option>
            <option value="m7">m7</option>
            <option value="7">7</option>
            <option value="7sus2">7sus2</option>
            <option value="7sus4">7sus4</option>
            <option value="7b5">7(b5)</option>
            <option value="7#5">7(#5)</option>
            <option value="7b9">7(b9)</option>
            <option value="7#9">7(#9)</option>
            <option value="maj7">maj7</option>
            <option value="m7b5">m7b5</option>
            <option value="add9">add9</option>
            <option value="sus2">sus2</option>
            <option value="sus4">sus4</option>
            <option value="9">9</option>
            <option value="maj9">maj9</option>
            <option value="m9">m9</option>
            <option value="9sus4">9sus4</option>
            <option value="11">11</option>
            <option value="13">13</option>
            <option value="13sus4">13sus4</option>
            <option value="altered">Legacy: altered bucket</option>
          </select>
        </div>


        <div class="field">
          <label for="variantSelect">Variant</label>
          <select id="variantSelect"></select>
        </div>

        <div class="field">
          <label for="cagedSelect">CAGED</label>
          <select id="cagedSelect">
            <option value="all">All shapes</option>
            <option value="C">C shape</option>
            <option value="A">A shape</option>
            <option value="G">G shape</option>
            <option value="E">E shape</option>
            <option value="D">D shape</option>
          </select>
        </div>
      </div>

      <div class="row" style="align-items:center; justify-content:space-between;">
        <div>
          <button id="playBtn" type="button">
            ▶ Play chord
          </button>
          <label class="small-note" style="margin-left:10px;">Sustain <input id="sustain" type="range" min="20" max="180" value="80"></label>
          <label class="small-note" style="margin-left:10px;">Volume <input id="volume" type="range" min="0" max="100" value="78"></label>
          <label class="small-note" style="margin-left:10px;">Drive <input id="drive" type="range" min="0" max="40" value="0"></label>
          <button id="debugToggle" class="secondary" type="button">
            Debug
          </button>
          <!-- Harmonics toggle is injected by JS after Debug (for stability) -->
        </div>
        <div class="small-note">
          File currently in use: <code id="fileNameInfo"></code>
        </div>
      </div>

      <div class="chord-header">
        <div>
          <span class="chord-name-main" id="chordNameMain">C</span>
          <span class="chord-name-book" id="chordNameBook"></span>
        </div>
        <div>
          <span class="tag" id="tagFamily"></span>
          <span class="tag moll" id="tagQuality"></span>
        </div>
      </div>

      <div id="fretboard"></div>
      <div class="small-note" id="variantInfo"></div>
      <pre id="debug"></pre>
    </div>
  </div>
<p>ChordLink © 2026 by OVERTONE WORKS AS</p>
  <!-- Tone.js from CDN -->
  <script src="https://unpkg.com/tone@latest/build/Tone.js"></script>

  <!-- Stable full UI (clone of Beta Final + inlays/harmonics) -->
  <script src="./ui.js?v=15"></script>
</body>
</html>
