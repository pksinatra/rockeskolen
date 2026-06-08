<?php
session_start();
$user = $_SESSION['user_chordlink'] ?? null;
$isPro =
    ($user && in_array($user['role'] ?? '', ['pro','vip','admin'], true))
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
<title>Piano / Keyboard Chord Finder</title>
<script>
  window.CL_IS_LOGGED_IN = <?= $user ? 'true' : 'false' ?>;
  window.CL_IS_PRO = <?= $isPro ? 'true' : 'false' ?>;
  window.CL_USER_PLAN = "<?= $user['role'] ?? 'guest' ?>";
</script>
<link rel="stylesheet" href="./app.css">
</head>
<body>
  <div class="wrap">
    <h1>🎹 Akkordverktøy for Piano / Keyboard</h1>
    <div class="card">
      <div class="row">
        <label><span>Grunntone</span><select id="root"></select></label>
        <label><span>Kvalitet</span><select id="qual"></select></label>
        <label><span>Oktav-anker</span>
          <select id="anchor">
            <option value="3">C3</option>
            <option value="4" selected>C4</option>
            <option value="5">C5</option>
          </select>
        </label>
            <button type="button" id="sharpBtn" class="acc-btn acc-active">♯</button>
            <button type="button" id="flatBtn" class="acc-btn">♭</button>
        <button id="play">Spill akkord</button>
        <button id="invertUp">Inverter ↑</button>
        <button id="invertDown">Inverter ↓</button>
        <button id="clear">Reset</button>
        <label><input type="checkbox" id="showAll"> Vis over hele klaviaturet</label>
        <label><input type="checkbox" id="showBass"> Marker bass</label>
      </div>
      <div class="badges" id="voicingBadges"></div>
      <div class="badges"><span id="chordName" class="badge" style="font-weight:600"></span></div>
    </div>
<div class="card" id="proCard" style="display:none">
  <div id="proBox"></div>
</div>
    <div class="card"><div id="piano" class="piano" aria-label="Clickable piano keyboard"></div></div>

    <div id="rkUserStatus" class="rk-status"></div>
  </div>
<script src="ui.js" defer></script>
</body>
</html>
