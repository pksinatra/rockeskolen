<?php require_once dirname(__DIR__, 2) . '/shared/bootstrap.php'; ?>
<!doctype html>
<html lang="<?= rs_updated_lang() ?>">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<?php chordlink_share_meta(['title' => 'Piano Chords | ChordLink', 'description' => 'Explore piano chords, inversions, notes, intervals, and playback.', 'path' => '/tools/chords/piano/', 'image' => '/images/tools/chordlink-tool-piano-chords-v1.png']); ?>
<?php chordlink_app_header_styles(); ?>
<script>
  window.CL_IS_PRO = <?= $isPro ? 'true' : 'false' ?>;
</script>
<link rel="stylesheet" href="./app.css?v=20260927-1">
</head>
<body>
  <?php chordlink_app_header('Piano Chords'); ?>
  <div class="wrap">
    <h1>🎹 Piano Chords</h1>
    <div class="card">
      <div class="row controls-row">
        <label><span>Root</span><select id="root"></select></label>
        <label><span>Quality</span><select id="qual"></select></label>
        <label><span>Octave anchor <small title="Places the first generated voicing near this C octave.">?</small></span>
          <select id="anchor">
            <option value="3">C3</option>
            <option value="4" selected>C4</option>
            <option value="5">C5</option>
          </select>
        </label>
        <button id="play">Play chord</button>
        <button id="invertUp">Invert ↑</button>
        <button id="invertDown">Invert ↓</button>
            <button type="button" id="sharpBtn" class="acc-btn acc-active">♯</button>
            <button type="button" id="flatBtn" class="acc-btn">♭</button>
        <button id="clear">Clear</button>
      </div>
      <div class="row sound-row">
        <label><span>Sound</span>
          <select id="soundType">
            <option value="warm" selected>Warm</option>
            <option value="triangle">Triangle</option>
            <option value="sine">Sine</option>
            <option value="square">Square</option>
            <option value="sawtooth">Sawtooth</option>
          </select>
        </label>
        <label><span>Sustain</span>
          <input type="range" id="sustain" min="0" max="100" value="50" />
        </label>
        <label><span>Volume</span>
          <input type="range" id="volume" min="0" max="100" value="75" />
        </label>
        <label><input type="checkbox" id="showAll"> Show across the whole keyboard</label>
        <label><input type="checkbox" id="showBass"> Highlight bass</label>
      </div>
<!-- badges / detected chord -->
<div class="card">
	  <div class="badges" id="voicingBadges"></div>
	  <div class="badges">
	    <span id="dataSourceBadge" class="badge">Local chord formulas</span>
	    <span id="chordName" class="badge" style="font-weight:600"></span>
	  </div>
	  <div class="chordFacts" aria-live="polite">
	    <div><strong>Notes</strong><span id="chordNotes">-</span></div>
	    <div><strong>Intervals</strong><span id="chordIntervals">-</span></div>
	  </div>
	</div>
<!-- NY: Pro card -->
<div class="card" id="proCard" style="display:none">
  <div id="proBox"></div>
</div>

<!-- piano -->
<div class="card">
  <div id="piano" class="piano" tabindex="0" role="region"></div>
</div>
  </div>
<?php rs_updated_help('piano-chords'); ?>
<script src="ui.js?v=20261022-1" defer></script>
</body>
</html>
