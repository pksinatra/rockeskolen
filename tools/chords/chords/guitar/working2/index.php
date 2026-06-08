<?php
require $_SERVER['DOCUMENT_ROOT'] . '/members/config.php';

$user = current_user(); // kan være null (public)
$isPro = ($user && in_array($user['role'], ['pro','admin'], true));
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>ChordLink – Guitar Chord Finder</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />

  <link rel="stylesheet" href="./app.css?v=12">

  <!-- PHP → JS flags (må ligge før ui.js) -->
<script>
  window.CL_IS_PRO = <?php echo $isPro ? 'true' : 'false'; ?>;
  window.CL_IS_LOGGED_IN = <?php echo $user ? 'true' : 'false'; ?>;

  // Send ikke-innloggede rett til signup (med redirect til upgrade)
  window.CL_UPGRADE_URL = window.CL_IS_LOGGED_IN
    ? "/members/upgrade.php"
    : "/members/register.php?redirect=" + encodeURIComponent("/members/upgrade.php");
</script>

</head>
<body>
  <div class="page">
    <div class="card">
      <div class="header">
        <div class="title-row">
          <div>
            <h1>ChordLink – Guitar Chord Finder (beta)</h1>
            <div class="sub">
              Select root, quality (Major/Minor etc.) and extension.
              The tool loads chord shapes from
              <code>guitarchords_*.json</code> and shows standard textbook shapes first.
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
          <label for="quality">Quality</label>
          <select id="quality">
            <option value="major" selected>Major</option>
            <option value="minor">Minor</option>
            <option value="dim">Diminished</option>
            <option value="aug">Augmented</option>
          </select>
        </div>

        <div class="field">
          <label for="extension">Extension</label>
          <select id="extension">
            <option value="none">– (triad)</option>
            <option value="6">6</option>
            <option value="7">7</option>
            <option value="maj7">maj7</option>
            <option value="add9">add9</option>
            <option value="sus2">sus2</option>
            <option value="sus4">sus4</option>
            <option value="9">9</option>
            <option value="11">11</option>
            <option value="13">13</option>
            <option value="altered">Crazychords (altered)</option>
          </select>
        </div>

        <div class="field">
          <label for="variantSelect">Variant</label>
          <select id="variantSelect"></select>
        </div>
      </div>

      <div class="row" style="align-items:center; justify-content:space-between;">
        <div>
          <button id="playBtn" type="button">
            ▶ Play chord (MIDI/Audio later)
          </button>
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
  <script src="./ui.js?v=12"></script>
</body>
</html>
