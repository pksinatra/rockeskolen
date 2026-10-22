<?php
require $_SERVER['DOCUMENT_ROOT'] . '/members/config.php';
require_once $_SERVER['DOCUMENT_ROOT'] . '/includes/app-header.php';
require_once $_SERVER['DOCUMENT_ROOT'] . '/includes/meta.php';

$user = current_user();
$userId = $user ? $user['id'] : null;
$isPro = has_rockeskolen_access($user);
$displayName = $user['email'] ?? '';
?>
<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
<?php rs_render_meta(
    'ChordLog – akkordskjema og låtidéer | Rockeskolen',
    'Lag, lagre og organiser akkordskjema og låtidéer med ChordLog fra Rockeskolen.',
    'https://rockeskolen.com/tools/chordlog/',
    'https://rockeskolen.com/images/share/rockeskolen-2026.jpg',
    'ChordLog – akkordskjema og låtidéer'
); ?>
  <link rel="stylesheet" href="/includes/app-header.css?v=1">
  <link rel="stylesheet" href="style.css">
  <script>
window.CL_IS_PRO = <?php echo $isPro ? 'true' : 'false'; ?>;
window.CL_IS_LOGGED_IN = <?php echo $user ? 'true' : 'false'; ?>;

window.CL_USER_ID = <?php echo $user ? $user['id'] : 'null'; ?>;
window.CL_USER_NAME = <?php echo $user ? json_encode($displayName) : 'null'; ?>;

window.CL_UPGRADE_URL = window.CL_IS_LOGGED_IN
  ? "/members/upgrade.php"
  : "/members/register.php?redirect=" + encodeURIComponent("/members/upgrade.php");
</script>

</head>
<body>
<?php rs_render_app_header('tools'); ?>
<main class="editorPanel">
<header class="appHeader">
  <div>
    <p class="eyebrow">Rockeskolen verktøy</p>
    <h1>Lag akkordskjema raskt.</h1>
  </div>
  <div id="userStatus"></div>
</header>

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
    <select name="key">
      <option value="" selected>Ingen toneart</option>
      <optgroup label="Dur-tonearter">
        <option value="C">C</option>
        <option value="C#">C#</option>
        <option value="Db">Db</option>
        <option value="D">D</option>
        <option value="D#">D#</option>
        <option value="Eb">Eb</option>
        <option value="A">A</option>
        <option value="A#">A#</option>
        <option value="Bb">Bb</option>
        <option value="E">E</option>
        <option value="F">F</option>
        <option value="F#">F#</option>
        <option value="Gb">Gb</option>
        <option value="G">G</option>
        <option value="G#">G#</option>
        <option value="Ab">Ab</option>
        <option value="B">B</option>
      </optgroup>
      <optgroup label="Moll-tonearter">
        <option value="Am">Am</option>
        <option value="A#m">A#m</option>
        <option value="Bbm">Bbm</option>
        <option value="Bm">Bm</option>
        <option value="Cm">Cm</option>
        <option value="C#m">C#m</option>
        <option value="Dbm">Dbm</option>
        <option value="Dm">Dm</option>
        <option value="D#m">D#m</option>
        <option value="Ebm">Ebm</option>
        <option value="Em">Em</option>
        <option value="Fm">Fm</option>
        <option value="F#m">F#m</option>
        <option value="Gbm">Gbm</option>
        <option value="Gm">Gm</option>
        <option value="G#m">G#m</option>
        <option value="Abm">Abm</option>
      </optgroup>
    </select>
  </div>

<div class="metaBox metaButtons">
  <button>Lag skjema</button>
</div>
</div>
</form>

<div id="songHeader"></div>
<section class="editorSection">
  <div class="sectionHeader">
    <h2>Editor</h2>
    <p>Bruk Tab for å flytte slag for slag. Legg seksjonsnavn over taktene og marker dobbelstrek med ||.</p>
  </div>
  <div id="chordGrid"></div>
</section>

<div class="toolbar">
<button id="addTaktBtn" type="button">+ Takt</button>
<button id="removeTaktBtn" type="button">- Takt</button>
<button id="btnRenderNotation" type="button">Vis notasjon</button>
<button id="btnSaveChart" type="button">Lagre skjema</button>
<button id="btnUpdateChart" type="button">Oppdater notasjon</button>
<button id="btnExportPdf" type="button">Eksporter PDF</button>
<button id="layoutToggle" type="button">Papirmodus</button>
</div>

<section class="notationSection">
  <div class="sectionHeader notationHeader">
    <div>
      <h2>Notasjon / PDF-forhåndsvisning</h2>
      <p>Dette er utskriftsvisningen av akkordskjemaet.</p>
    </div>
    <label for="measuresPerLine" class="inlineControl">
      Takter per linje
      <select id="measuresPerLine">
        <option value="4" selected>4</option>
        <option value="6">6</option>
        <option value="8">8</option>
      </select>
    </label>
  </div>
  <div id="notation"></div>
</section>

<hr>
<section class="librarySection">
  <h2>Mine låter</h2>
  <div id="songList"></div>
</section>
<hr>
<div class="print-container" id="printPreview"></div>
</main>

<script src="https://unpkg.com/vexflow@4.1.0/build/cjs/vexflow.js"></script>
<script src="script.js?v=4"></script>
</body>
</html>
