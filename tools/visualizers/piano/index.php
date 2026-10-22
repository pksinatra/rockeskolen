<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/members/config.php';
require_once $_SERVER['DOCUMENT_ROOT'] . '/includes/meta.php';
refresh_user_from_db();
header('Cache-Control: private, no-store, max-age=0');
header('Pragma: no-cache');
$visualizerIsPro = is_vip_user();
$visualizerIsLoggedIn = is_logged_in();
$visualizerProUrl = $visualizerIsLoggedIn
  ? '/members/upgrade.php?reason=vip'
  : '/members/login.php?reason=vip&redirect=' . rawurlencode('/tools/visualizers/piano/');
?>
<!doctype html>
<html lang="no">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#05070a">
  <?php rs_render_meta(
      'Pianovisualisering | Rockeskolen',
      'Spill melodier og skalaer, åpne MIDI-filer og følg tonene visuelt på pianoet.',
      'https://rockeskolen.com/tools/visualizers/piano/',
      'https://rockeskolen.com/images/share/rockeskolen-2026.jpg',
      'Pianovisualisering – Rockeskolen'
  ); ?>
  <script src="https://unpkg.com/tone@14.7.77/build/Tone.js"></script>
  <script>
    window.CL_IS_PRO = <?= $visualizerIsPro ? 'true' : 'false' ?>;
    window.CL_PRO_URL = <?= json_encode($visualizerProUrl, JSON_UNESCAPED_SLASHES) ?>;
  </script>
  <link rel="stylesheet" href="visualizer.css?v=27">
</head>
<body>
  <header class="toolbar" aria-label="Kontroller">
    <a class="brand" href="/" aria-label="Rockeskolen">
      <span class="brand-mark" aria-hidden="true">RS</span>
      <span>Pianovisualisering <small>NY</small></span>
    </a>

    <div class="control">
      <label for="mode">Modus</label>
      <select id="mode">
        <option value="learn">LEARN</option>
        <option value="flow">FLOW</option>
      </select>
    </div>

    <div class="control">
      <label for="colorMode">Farger</label>
      <select id="colorMode">
        <option value="cyan">Cyan</option>
        <option value="violetPink">Fiolett / rosa</option>
        <option value="variation">Variasjon</option>
      </select>
    </div>

    <div class="control">
      <label for="playMode">Avspilling</label>
      <select id="playMode">
        <option value="sync">Synkron</option>
        <option value="prepare">Forbered</option>
        <option value="immediate">Direkte</option>
      </select>
    </div>

    <div class="scale-control">
      <div class="control scale-field root-field">
        <label for="rootSelect">Grunntone</label>
        <select id="rootSelect" aria-label="Grunntone">
          <option>C</option><option>C#</option><option>D</option><option>D#</option>
          <option>E</option><option>F</option><option>F#</option><option>G</option>
          <option>G#</option><option>A</option><option>A#</option><option>B</option>
        </select>
      </div>
      <div class="control scale-field tonality-field">
        <label for="scaleSelect">Toneart</label>
        <select id="scaleSelect" aria-label="Toneart"></select>
      </div>
    </div>

    <div class="control">
      <label for="sourceSelect">Innhold</label>
      <select id="sourceSelect">
        <option value="melody">Melodi</option>
        <option value="scale">Skala</option>
        <option value="midi">MIDI</option>
      </select>
    </div>

    <div class="control preset-control">
      <label for="presetSelect">Valg</label>
      <select id="presetSelect"></select>
    </div>

    <div class="control bpm-control">
      <label for="bpm">BPM</label>
      <div class="bpm-stepper">
        <button id="bpmDown" type="button" aria-label="Senk tempo med 1 BPM">−</button>
        <input id="bpm" type="number" inputmode="numeric" min="40" max="220" step="1" value="90" aria-label="Tempo i BPM">
        <button id="bpmUp" type="button" aria-label="Øk tempo med 1 BPM">+</button>
      </div>
    </div>

    <div class="transport" aria-label="Transport">
      <button id="playBtn" class="primary" type="button"><span aria-hidden="true">▶</span> Spill</button>
      <button id="loopBtn" type="button" aria-pressed="false"><span aria-hidden="true">↻</span> Loop</button>
      <button id="stopBtn" type="button"><span aria-hidden="true">■</span> Stopp</button>
      <label id="midiFileButton" class="file-button" for="midiFile"><span aria-hidden="true">＋</span> Last inn MIDI <small class="pro-badge">VIP</small></label>
      <input id="midiFile" type="file" accept=".mid,.midi,audio/midi,audio/x-midi">
    </div>
  </header>

  <details class="sound-panel">
    <summary><span aria-hidden="true">♫</span> Lyd</summary>
    <div class="sound-grid">
      <div id="soundProNotice" class="sound-pro-notice sound-wide" hidden>
        <strong>Flere lyder og lydkontroller er med i VIP</strong>
        <span>Oppgrader for samples, sustain, klang, EQ og flere instrumenter.</span>
        <a id="soundProLink" href="<?= htmlspecialchars($visualizerProUrl, ENT_QUOTES, 'UTF-8') ?>"><?= $visualizerIsLoggedIn ? 'Bli VIP' : 'Logg inn med FEIDE' ?></a>
      </div>
      <label class="sound-wide">
        <span>Klang <small class="pro-badge">VIP</small></span>
        <select id="soundPreset">
          <option value="original">Original</option>
          <option value="samplePiano">Piano · samples</option>
          <option value="sampleGuitar">Akustisk gitar · samples</option>
          <option value="softPiano">Mykt piano</option>
          <option value="electric">El-piano</option>
          <option value="pad">Synth pad</option>
          <option value="pluck">Pluck</option>
          <option value="organ">Organ</option>
        </select>
        <small id="sampleStatus" class="sample-status">Klar</small>
      </label>

      <button id="sustainPedal" class="sound-wide pedal" type="button" aria-pressed="false">
        Sustain-pedal
      </button>

      <label><span>Volum <output data-value-for="volume">0 dB</output></span><input id="volume" type="range" min="-24" max="3" step="1" value="0"></label>
      <label><span>Attack <output data-value-for="attack">0.01 s</output></span><input id="attack" type="range" min="0.005" max="2" step="0.005" value="0.01"></label>
      <label><span>Sustain <output data-value-for="sustain">20 %</output></span><input id="sustain" type="range" min="0" max="1" step="0.01" value="0.2"></label>
      <label><span>Release <output data-value-for="release">1.0 s</output></span><input id="release" type="range" min="0.05" max="8" step="0.05" value="1"></label>
      <label><span>Brightness <output data-value-for="cutoff">10 kHz</output></span><input id="cutoff" type="range" min="400" max="16000" step="100" value="10000"></label>
      <label><span>Romklang <output data-value-for="reverb">10 %</output></span><input id="reverb" type="range" min="0" max="0.7" step="0.01" value="0.1"></label>
      <label><span>Delay <output data-value-for="delay">4 %</output></span><input id="delay" type="range" min="0" max="0.6" step="0.01" value="0.04"></label>
      <label><span>Bass <output data-value-for="lowEq">0 dB</output></span><input id="lowEq" type="range" min="-12" max="12" step="1" value="0"></label>
      <label><span>Mellomtone <output data-value-for="midEq">0 dB</output></span><input id="midEq" type="range" min="-12" max="12" step="1" value="0"></label>
      <label><span>Diskant <output data-value-for="highEq">0 dB</output></span><input id="highEq" type="range" min="-12" max="12" step="1" value="0"></label>
    </div>
  </details>

  <aside class="status-card" aria-live="polite">
    <div class="status-top">
      <strong id="pieceStatus">Enkel melodi</strong>
      <span id="timeStatus">0:00 / 0:00</span>
    </div>
    <div class="progress"><span id="progressBar"></span></div>
    <div id="detailStatus">C dur · 90 BPM · Klar</div>
  </aside>

  <div id="dropZone" class="drop-zone" hidden>
    <div><strong>Slipp MIDI-filen her</strong><span>.mid eller .midi</span></div>
  </div>

  <canvas id="canvas" aria-label="Piano-visualisering"></canvas>

  <div class="hint">Spill med pianoet eller tastene A W S E D F T G Y H U J K</div>
  <div id="toast" class="toast" role="status" aria-live="polite"></div>

  <script src="visualizer.js?v=28"></script>
</body>
</html>
