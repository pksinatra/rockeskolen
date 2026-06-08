<!DOCTYPE html>
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


<html lang="no">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Skalaer på gitar</title>
  <link rel="stylesheet" href="guitarscales.css">
</head>
<body>

<div class="page">
  <div class="card">
    <div class="header">
      <div>
        <h1>🎸 Skalaer på gitar</h1>
        <p class="sub">
          Velg grunntone og skala. Vis enten tonenavn eller intervaller på gitarhalsen.
        </p>
      </div>
    </div>
<div class="toolbar">
  <div class="field">
    <label for="rootSelect">Grunntone</label>
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
    <label for="scaleSelect">Skala</label>
    <select id="scaleSelect"></select>
  </div>

  <div class="field">
    <label for="viewMode">Visning</label>
<select id="viewMode">
  <option value="full">Hele halsen</option>
  <option value="open">5-bånd</option>
</select>
  </div>

<div class="gs-controls-right">
  <button id="toggleLabelsBtn" class="gs-btn">Intervaller</button>
  <button id="noteStyleBtn" class="gs-btn">Vis ♯ / ♭</button>
</div>
</div>
<div class="statusbar">
  <span id="statusText">Laster skalaer...</span>
</div>


<div id="guitarboard"></div>
  </div>
</div>
<script>
window.CL_IS_PRO = <?= $isPro ? 'true' : 'false' ?>;
window.CL_IS_LOGGED_IN = <?= $user ? 'true' : 'false' ?>;
</script>
<script src="guitarscales.js"></script>
</body>
</html>