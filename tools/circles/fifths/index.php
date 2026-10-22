<?php require_once dirname(__DIR__, 2) . '/shared/bootstrap.php'; ?>

<!doctype html>
<html lang="<?= rs_updated_lang() ?>">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <?php chordlink_share_meta(['title' => 'Interactive Circle of Fifths | ChordLink', 'description' => 'Navigate keys, chords, scales, and harmonic relationships with an interactive circle of fifths.', 'path' => '/tools/circles/fifths/', 'image' => '/images/tools/chordlink-tool-circle-of-fifths-v1.png', 'width' => 1586, 'height' => 992]); ?>
  <?php chordlink_app_header_styles(); ?>
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
<?php chordlink_app_header('Circle of Fifths'); ?>

<header class="top">
  <div class="brand">
    <h1>INTERACTIVE CIRCLE OF FIFTHS</h1>
    <div class="sub">Shift+click = relative minor.</div>
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
      <div class="sectionTitle">Major / Minor</div>
      <div class="seg" role="tablist" aria-label="Choose major or minor">
        <button type="button" class="segBtn isOn" data-quality="maj">Major</button>
        <button type="button" class="segBtn" data-quality="min">Minor</button>
      </div>
    </div>

    <div class="section grid2">
      <div>
        <div class="label">Octave</div>
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
      <button id="playChordBtn" class="btn primary">Play chord</button>
      <button id="playScaleBtn" class="btn">Play scale</button>
      <button id="panicBtn" title="Stop all sound">⏹︎</button>
    </div>

    <div class="section hint">
      Tip: <strong>Shift+click</strong> plays the relative minor for the selected segment.
    </div>
  </aside>
</main>

<?php rs_updated_help('fifths'); ?>
</body>
</html>
