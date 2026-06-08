<?php
require $_SERVER['DOCUMENT_ROOT'] . '/members/config.php';
// require_login(); // demo is public
$user = current_user();
$isPro = ($user && in_array($user['role'], ['pro','admin'], true));
// Optional: force demo mode with ?demo=1
if (isset($_GET['demo']) && $_GET['demo'] === '1') {
  $isPro = false;
}
?>

<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />


<title>Piano Scales</title>

<link rel="stylesheet" href="./app.css?v=13">
<script>
  window.CL_IS_PRO = <?= $isPro ? 'true' : 'false' ?>;
</script>


</head>
<body>
  <div class="wrap">
    <h1>🎹 Piano Scales</h1>

    <div class="card">
      <div class="row">
        <label>
          <span>Root</span>
          <select id="root"></select>
        </label>

        <label>
          <span>Scale type</span>
          <div class="scale-picker" id="scalePicker">
            <button type="button" id="scaleToggle" class="scale-toggle">
              <span class="label-main">Major</span>
              <span class="chevron">▼</span>
            </button>
            <div id="scaleMenu" class="scale-menu"></div>
<input type="hidden" id="scaleType" value="">
          </div>
        </label>

        <label>
          <span>Accidentals</span>
          <span class="switch" aria-label="Switch between # and b">
            <button type="button" id="sharpBtn" class="acc-btn acc-active">♯</button>
            <button type="button" id="flatBtn" class="acc-btn">♭</button>
          </span>
        </label>

        <label>
          <span>&nbsp;</span>
          <span>
            <input type="checkbox" id="showAll" />
            Show across the whole keyboard
          </span>
        </label>

        <label>
          <span>&nbsp;</span>
          <span>
            <input type="checkbox" id="playUpDown" />
            Play up and down
          </span>
        </label>

        <button class="primary" id="playScale">Play scale</button>
        <button id="clear">Clear selection</button>
      </div>
      <div class="row sound-row">
        <label><span>Sound</span>
          <select id="soundType">
            <option value="triangle" selected>Triangle</option>
            <option value="sine">Sine</option>
            <option value="square">Square</option>
            <option value="sawtooth">Sawtooth</option>
          </select>
        </label>
        <label><span>Sustain</span>
          <input type="range" id="sustain" min="0" max="100" value="55" />
        </label>
        <label><span>Volume</span>
          <input type="range" id="volume" min="0" max="100" value="75" />
        </label>
      </div>


      <div class="badges">
        <span id="scaleName" class="badge" style="font-weight:600"></span>
      </div>
      <div class="badges" id="noteBadges"></div>
      <div class="muted" id="degreeInfo"></div>
      <div class="muted" id="aliasInfo"></div>
    </div>
<div id="scaleProMsg" style="display:none"></div>
    <div class="card">
      <div id="piano" class="piano" aria-label="Clickable piano"></div>
    </div>
  </div>

<script src="./ui.js?v=14"></script>
<script>
  // Keeps the Scale type button label in sync with the selected menu item
  (function () {
    const toggle = document.getElementById("scaleToggle");
    const labelMain = toggle ? toggle.querySelector(".label-main") : null;
    const menu = document.getElementById("scaleMenu");
    if (!labelMain || !menu) return;

    menu.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const t = (btn.textContent || "").trim();
      if (t) labelMain.textContent = t;
    });
  })();
</script>


</body>
</html>
