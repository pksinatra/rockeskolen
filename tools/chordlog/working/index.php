<?php
require $_SERVER['DOCUMENT_ROOT'] . '/members/config.php';

$user = current_user();
$userId = $user ? $user['id'] : null;
?>
<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="UTF-8">
  <title>ChordLog </title>
  <div id="userStatus"></div>
  <link rel="stylesheet" href="style.css">
  <script>
window.CL_IS_PRO = <?php echo $isPro ? 'true' : 'false'; ?>;
window.CL_IS_LOGGED_IN = <?php echo $user ? 'true' : 'false'; ?>;

window.CL_USER_ID = <?php echo $user ? $user['id'] : 'null'; ?>;
window.CL_USER_NAME = <?php echo $user ? json_encode($user['name']) : 'null'; ?>;

window.CL_UPGRADE_URL = window.CL_IS_LOGGED_IN
  ? "/members/upgrade.php"
  : "/members/register.php?redirect=" + encodeURIComponent("/members/upgrade.php");
</script>

</head>
<body>
<h1>ChordLog</h1>
<form id="songForm">
<div class="songMeta">

  <div class="metaBox">
    <label>Tittel</label>
    <input id="title" name="title">
  </div>

  <div class="metaBox">
    <label>Tempo (BPM)</label>
    <input name="tempo" value="120">
  </div>

  <div class="metaBox">
    <label>Taktart</label>
    <select name="timeSignature">
  <option value="4/4" selected>4/4</option>
  <option value="3/4">3/4</option>
  <option value="2/4">2/4</option>
  <option value="6/8">6/8</option>
</select>

  </div>

  <div class="metaBox">
    <label>Toneart</label>
    <input type="text" name="key" placeholder="C, Dm..."><br>
  </div>

<div class="metaBox metaButtons">
  <button>Opprett / Oppdater</button>
</div>
</div>
</form>

<div id="songHeader"></div>
<div id="chordGrid"></div>

<div class="toolbar">
<button id="addTaktBtn" type="button">+ Takt</button>
<button id="removeTaktBtn" type="button">- Takt</button>
<button id="btnRenderNotation" type="button">Vis notasjon</button>
<button onclick="saveChordData()">Lagre Skjema</button> 
<button id="btnUpdateChart">Oppdater notasjon</button>
<button id="btnExportPdf" type="button">Eksporter PDF</button>
<button id="layoutToggle">⿻</button>
</div>

<h2>Notasjon (beta)</h2>
<label for="measuresPerLine">Takter pr. linje:</label>
<select id="measuresPerLine">
  <option value="4" selected>4</option>
  <option value="6">6</option>
  <option value="8">8</option>
</select>




<div id="notation" style="margin-top:20px;"></div>

<hr>
<h2>Mine låter</h2>
<div id="songList"></div>
<hr>
<div class="print-container" id="printPreview"></div>

<script src="https://unpkg.com/vexflow@4.1.0/build/cjs/vexflow.js"></script>
<script src="script.js"></script>
</body>
</html>
