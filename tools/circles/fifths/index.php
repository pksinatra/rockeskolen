<?php
require $_SERVER['DOCUMENT_ROOT'] . '/members/config.php';

// Circle of Fifths is a public tool
// Login is optional, Pro status is used only for feature gating

$user = current_user();               // returnerer null / false hvis ikke innlogget
$isLoggedIn = is_array($user);
$isPro = $isLoggedIn && in_array($user['role'], ['pro','admin'], true);
?>

<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Interaktiv kvintsirkel</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link rel="stylesheet" href="./app.css">

  <!-- PHP → JS flags -->
  <script>
    window.CL_LOGGED_IN = <?= $isLoggedIn ? 'true' : 'false' ?>;
    window.CL_IS_PRO    = <?= $isPro ? 'true' : 'false' ?>;
  </script>
  <script src="https://unpkg.com/tone@15.1.22/build/Tone.js"></script>
  <script src="./ui.js" defer></script>
</head>

<body class="darkPremium">    

<header class="top">
  <div class="brand">
    <h1>Interaktiv kvintsirkel</h1>
    <div class="sub">Shift+klikk = parallel moll. <span class="build">Debug: TEST2_FULL</span></div>
  </div>
</header>

<main class="layout">
  <section class="stage card">
    <div id="wheelWrap" class="wheelWrap" aria-label="Circle of fifths"></div>
  </section>

  <aside class="panel card">
    <div class="section">
      <div class="sectionTitle">Info</div>
      <div id="infoPanel" class="infoPanel"></div>
    </div>

    <div class="section">
      <div class="sectionTitle">Dur / Moll</div>
      <div class="seg" role="tablist" aria-label="Choose major or minor">
        <button type="button" class="segBtn isOn" data-quality="maj">Dur</button>
        <button type="button" class="segBtn" data-quality="min">Moll</button>
      </div>
    </div>

    <div class="section grid2">
      <div>
        <div class="label">Oktav</div>
        <select id="octSel" class="control">
          <option value="3">3</option>
          <option value="4" selected>4</option>
          <option value="5">5</option>
        </select>
      </div>
      <div>
        <div class="label">Tempo</div>
        <input id="bpm" type="range" min="60" max="180" value="110" />
        <div class="mini">BPM: <span id="bpmVal">110</span></div>
      </div>
    </div>

    <div class="section btnRow">
      <button id="playChordBtn" class="btn primary">Spill akkord</button>
      <button id="playScaleBtn" class="btn">Spill skala</button>
      <button id="panicBtn" title="Stop all sound">⏹︎</button>
    </div>

    <div class="section hint">
      Tips: <strong>Shift+klikk</strong> spiller den paralelle moll'en for valgte segment.
    </div>
  </aside>
</main>

</body>
</html>
