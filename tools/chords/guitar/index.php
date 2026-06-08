<?php
session_start();
$user = $_SESSION['user_chordlink'] ?? null;
$isPro = ($user && in_array($user['role'] ?? '', ['pro','vip','admin'], true));
?>


<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>ChordLink – Gitar-akkordfinner</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />

  <link rel="stylesheet" href="./app.css?v=12">

  <!-- PHP → JS flags (må ligge før ui.js) -->
<script>
  window.CL_IS_PRO = <?= $isPro ? 'true' : 'false' ?>;
  window.CL_IS_LOGGED_IN = <?= $user ? 'true' : 'false' ?>;
  window.CL_USER_PLAN = <?= json_encode($user['role'] ?? 'guest') ?>;
  window.CL_UPGRADE_URL = "/members/upgrade.php";
</script>

</head>
<body>
  <div class="page">
    <div class="card">
      <div class="header">
        <div class="title-row">
          <div>
            <h1>ChordLink – Gitar-akkordfinner</h1>
            <div class="sub">
              Velg grunntone og akkordtype. Verktøyet laster grep fra <code>*.json</code> og viser standard lærebokgrep først.
            </div>
          </div>
          <div>
            <button id="themeBtn" type="button">
              Tema: <span id="themeLabel"></span>
            </button>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="field">
          <label for="root">Grunntone</label>
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
          <label for="extension">Akkordtype</label>
          <select id="extension">
            <option value="maj">Dur (treklang)</option>
            <option value="min">Moll (treklang)</option>
            <option value="5">5 (power)</option>
            <option value="6">6</option>
            <option value="m6">m6</option>
            <option value="69">6/9</option>
            <option value="m69">m6/9</option>
            <option value="m7">m7 (moll7)</option>
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
            <option value="altered">Legacy: Altererte akkorder</option>
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
            ▶ Spill akkord
          </button>
          <button id="debugToggle" class="secondary" type="button">
            Debug
          </button>
          <!-- Harmonics toggle is injected by JS after Debug (for stability) -->
        </div>
        <div class="small-note">
          Aktiv: <code id="fileNameInfo"></code>
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
      <div id="rkUserStatus" class="rk-status"></div>

    </div>
  </div>
<p>ChordLink © 2026 by OVERTONE WORKS AS</p>
  <!-- Tone.js from CDN -->
  <script src="https://unpkg.com/tone@latest/build/Tone.js"></script>

  <!-- Stable full UI (clone of Beta Final + inlays/harmonics) -->
  <script src="./ui.js?v=13"></script>
</body>
</html>
