<?php
require $_SERVER['DOCUMENT_ROOT'] . '/members/config.php';
// require_login(); // demo is public
$user = current_user();
$isPro =
    ($user && in_array($user['role'], ['pro','admin'], true))
    || isset($_COOKIE['rockeskolen_pro']);
// Optional: force demo mode with ?demo=1
if (isset($_GET['demo']) && $_GET['demo'] === '1') {
  $isPro = false;
}
?>

<!doctype html>
<html lang="nb">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />


<title>Skalaverktøy for Piano / Keyboard</title>

<link rel="stylesheet" href="./app.css">
<script>
  window.CL_IS_PRO = <?= $isPro ? 'true' : 'false' ?>;
</script>


</head>
<body>
  <div class="wrap">
    <h1>🎹 Skalaverktøy for Piano / Keyboard</h1>

    <div class="card">
      <div class="row">
        <label>
          <span>Rot</span>
          <select id="root"></select>
        </label>

        <label>
          <span>Skala-type</span>
          <div class="scale-picker" id="scalePicker">
            <button type="button" id="scaleToggle" class="scale-toggle">
              <span class="label-main">Dur</span>
              <span class="chevron">▼</span>
            </button>
            <div id="scaleMenu" class="scale-menu"></div>
<input type="hidden" id="scaleType" value="">
          </div>
        </label>

        <label>
          <span>Fortegn</span>
          <span class="switch" aria-label="Bytt mellom # og b">
            <button type="button" id="sharpBtn" class="acc-btn acc-active">♯</button>
            <button type="button" id="flatBtn" class="acc-btn">♭</button>
          </span>
        </label>

        <label>
          <span>&nbsp;</span>
          <span>
            <input type="checkbox" id="showAll" />
            Vis over hele klaviaturet
          </span>
        </label>

        <label>
          <span>&nbsp;</span>
          <span>
            <input type="checkbox" id="playUpDown" />
            Spill opp og ned
          </span>
        </label>

        <button class="primary" id="playScale">Spill skala</button>
        <button id="clear">Nullstill</button>
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
      <div id="piano" class="piano" aria-label="Klikkbare pianotangenter"></div>
    </div>
  </div>
<div id="scaleProMsg" style="display:none"></div>
<script src="./ui.js"></script>
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
<script>
  // Ensure initial scale is rendered once the scale menu is actually built
  (function () {
    let tries = 0;
    const timer = setInterval(() => {
      tries++;

      const menu = document.getElementById("scaleMenu");
      if (!menu) { if (tries > 40) clearInterval(timer); return; }

      const btn =
        menu.querySelector(".selected, .active, [aria-current='true']") ||
        menu.querySelector("button");

      if (btn) {
      //  btn.click();              // triggers the same code path as a real user click
        clearInterval(timer);     // run once
      }

      if (tries > 40) clearInterval(timer); // ~2 seconds max (40 * 50ms)
    }, 50);
  })();
</script>

</body>
</html>