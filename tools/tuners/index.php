<?php require_once dirname(__DIR__) . '/shared/bootstrap.php'; ?>
<!doctype html>
<html lang="<?= rs_updated_lang() ?>">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="robots" content="index,follow" />
  <?php chordlink_share_meta(['title' => 'Rockeskolen Tuner', 'description' => 'Tuning fork, instrument tuners, microphone pitch detection, and reference tones.', 'path' => '/tools/tuners/', 'image' => '/images/tools/chordlink-tool-chordlink-tuner-v1.png', 'width' => 1635, 'height' => 962]); ?>
  <meta name="theme-color" content="#0b0b10" />
  <?php chordlink_app_header_styles(); ?>
  <link rel="stylesheet" href="app.css?v=20260927-1" />
</head>
<body>
  <?php chordlink_app_header('Rockeskolen Tuner'); ?>
  <main class="cl-tuner-shell">
    <section class="cl-hero">
      <p class="eyebrow">Rockeskolen Tools</p>
      <h1>Rockeskolen Tuner</h1>
      <p>Tuning fork, instrument tuners, microphone pitch detection, and reference tones.</p>
    </section>

    <nav class="tuner-tabs" aria-label="Tuner selection">
      <button class="tab-btn active" type="button" data-mode="fork">Tuning Fork</button>
      <button class="tab-btn" type="button" data-mode="guitar">Guitar</button>
      <button class="tab-btn" type="button" data-mode="bass">Bass</button>
      <button class="tab-btn" type="button" data-mode="ukulele">Ukulele</button>
      <button class="tab-btn" type="button" data-mode="banjo">Banjo</button>
      <button class="tab-btn" type="button" data-mode="violin">Violin</button>
      <button class="tab-btn" type="button" data-mode="viola">Viola</button>
      <button class="tab-btn" type="button" data-mode="cello">Cello</button>
    </nav>


    <div class="app-grid">
      <section class="card tuner-card">
        <header>
          <div>
            <div id="modeTitle" class="title">Tuning Fork</div>
            <div id="modeSubtitle" class="subtitle">Pure reference tone · A4 = 440 Hz</div>
          </div>
          <div class="subtitle" id="sourceStatus">Sinus</div>
        </header>

        <div class="content">
          <div class="readout top-readout">
            <div>
              <div id="hzText" class="hz">440.00 Hz</div>
              <div id="noteText" class="note">A4 (concert pitch)</div>
            </div>
            <div class="note" id="statusText">Ready</div>
          </div>

          <div class="controls main-controls top-controls">
            <input id="freq" type="range" min="27.5" max="2093" step="0.1" value="440" />
            <div class="transport-controls" role="group" aria-label="Playback controls">
              <button id="play" class="btn primary" type="button">▶ Play</button>
              <button id="stop" class="btn stop-btn" type="button">■ Stop</button>
            </div>
            <button id="listenMic" class="btn mic-btn" type="button">Listen with microphone</button>
          </div>

          <div id="pitchCard" class="pitch-card" aria-label="Microphone tuner">
            <div class="pitch-top">
              <div>
                <div class="pitch-label">Microphone tuner</div>
                <div id="micStatus" class="subtitle">Choose Listen / mic or press Play</div>
              </div>
              <div id="micHz" class="pitch-hz">– Hz</div>
            </div>
            <div class="pitch-readout">
              <div id="detectedNote" class="detected-note">–</div>
              <div id="centsText" class="cents-text">0 cents</div>
            </div>
            <div class="tune-meter" aria-hidden="true">
              <span class="meter-label left">flat</span>
              <div class="meter-track">
                <span class="meter-center"></span>
                <span id="tuneNeedle" class="tune-needle"></span>
              </div>
              <span class="meter-label right">sharp</span>
            </div>
          </div>

          <div class="controls octave-controls">
            <button id="octDown" class="btn" type="button">– Octave</button>
            <button id="set440" class="btn" type="button">A4 = 440</button>
            <button id="octUp" class="btn" type="button">+ Octave</button>
          </div>

          <div class="signal-card" aria-label="Audio signal visualization">
            <div class="signal-head">
              <span>Signal</span>
              <span id="signalLabel">Spectrum / waveform</span>
            </div>
            <canvas id="signalCanvas" width="900" height="180"></canvas>
          </div>

          <div id="forkPanel" class="mode-panel active">
            <div id="forkWrap" class="fork-wrap" data-playing="false" style="--forkScale:1;">
              <svg class="fork" viewBox="0 0 420 240" xmlns="http://www.w3.org/2000/svg" aria-label="Tuning fork">
                <g stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none">
                  <line x1="180" y1="20" x2="180" y2="150" />
                  <line x1="240" y1="20" x2="240" y2="150" />
                  <path d="M180 150 C180 190, 240 190, 240 150" />
                  <line x1="210" y1="190" x2="210" y2="215" />
                  <circle cx="210" cy="228" r="8" fill="currentColor" stroke="none" />
                </g>
                <g class="fork-waves" stroke="currentColor" stroke-width="4" fill="none">
                  <path d="M150 50 Q120 100 150 150" />
                  <path d="M135 40 Q95 100 135 160" />
                  <path d="M270 50 Q300 100 270 150" />
                  <path d="M285 40 Q325 100 285 160" />
                </g>
              </svg>
            </div>

            <div class="fork-options" aria-label="Tuning fork choices">
              <div class="option-group">
                <div class="option-label">Playback</div>
                <div class="segmented" role="group" aria-label="Playback mode">
                  <button class="mode-choice active" type="button" data-playback="hold">Hold sine</button>
                  <button class="mode-choice" type="button" data-playback="loop">Loop</button>
                  <button class="mode-choice" type="button" data-playback="onehit">One-hit</button>
                  <button class="mode-choice listen-choice" type="button" data-playback="listen">Listen / mic</button>
                </div>
              </div>
              <div class="option-group">
                <div class="option-label">Notes C–C</div>
                <div id="forkNotes" class="fork-notes"></div>
              </div>
            </div>
          </div>

          <div id="instrumentPanel" class="mode-panel">
            <div class="instrument-stage">
              <div class="instrument-name" id="instrumentName">Guitar</div>
              <div class="string-buttons" id="stringButtons"></div>
            </div>
          </div>


        </div>
      </section>

      <aside class="card tip-card">
        <header>
          <div class="title">Tips & trivia</div>
          <div class="subtitle">Nice to know</div>
        </header>
        <div class="content">
          <div class="badge"><span class="dot"></span><span id="tipBadge">A4 – 440 Hz</span></div>
          <p id="tipText">A4 (440 Hz) is the standard reference pitch. Tune by ear: listen for beating between your instrument and the tone, then adjust until the beating disappears.</p>
          <p class="subtitle">Hint: If low notes are hard to hear, press + Octave to hear the same pitch class one octave higher. You are still tuning the same string.</p>
          <div class="note octave-status" id="octaveStatus">Octave: 0</div>
        </div>
      </aside>
    </div>
  </main>

  <?php rs_updated_help('tuner'); ?>
  <script src="tuner.js?v=20260927-1"></script>
</body>
</html>
