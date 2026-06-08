<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Rockeskolen – Digital Tuning Fork</title>
    <style>
    :root{
      --bg: #0b0b10;
      --panel: rgba(255,255,255,0.06);
      --panel2: rgba(255,255,255,0.10);
      --text: rgba(255,255,255,0.92);
      --muted: rgba(255,255,255,0.65);
      --accent: #ff2a5f; /* varm rød vibe */
      --accent2: #a855f7; /* litt lilla */
      --gold: #f5c542;
      --radius: 18px;
      --shadow: 0 18px 50px rgba(0,0,0,0.55);
    }
    body{
      margin:0;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      background:
        radial-gradient(1200px 600px at 20% 10%, rgba(255,42,95,0.18), transparent 60%),
        radial-gradient(900px 500px at 80% 30%, rgba(168,85,247,0.14), transparent 55%),
        radial-gradient(900px 700px at 50% 90%, rgba(245,197,66,0.09), transparent 55%),
        var(--bg);
      color: var(--text);
      min-height:100vh;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:18px;
    }
    .app{
      width:min(980px, 100%);
      display:grid;
      grid-template-columns: 1.25fr 0.75fr;
      gap:16px;
    }
    .card{
      background: linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.05));
      border: 1px solid rgba(255,255,255,0.10);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      overflow:hidden;
    }
    .card header{
      padding:14px 16px;
      display:flex;
      align-items:baseline;
      justify-content:space-between;
      gap:12px;
      border-bottom: 1px solid rgba(255,255,255,0.10);
      background: rgba(0,0,0,0.18);
    }
    .title{
      font-size: 16px;
      letter-spacing: 0.3px;
      font-weight: 650;
    }
    .subtitle{
      font-size: 12px;
      color: var(--muted);
    }
    .content{
      padding:16px;
    }

    /* Fork stage */
    .stage{
      display:grid;
      grid-template-columns: 1fr;
      gap:14px;
      align-items:center;
      justify-items:center;
      padding:18px 10px 10px;
    }

    .fork-wrap{
      width: min(560px, 100%);
      aspect-ratio: 16/9;
      display:flex;
      align-items:center;
      justify-content:center;
      position:relative;
      background: radial-gradient(500px 220px at 50% 40%, rgba(255,42,95,0.10), transparent 60%);
      border-radius: 16px;
      border: 1px solid rgba(255,255,255,0.08);
    }
    .fork{
      width: 320px;
      max-width: 85%;
      transform-origin: 50% 60%;
      transform: scale(var(--forkScale, 1));
      filter: drop-shadow(0 18px 30px rgba(0,0,0,0.5));
      transition: transform 0.25s ease;
    }

    /* “Størrelse etter Hz” + subtil vibbe */
    .fork-wrap[data-playing="true"] .fork{
      animation: vibrate 120ms infinite linear;
    }
    @keyframes vibrate {
      0% { transform: scale(var(--forkScale, 1)) translateX(0); }
      50% { transform: scale(var(--forkScale, 1)) translateX(0.6px); }
      100% { transform: scale(var(--forkScale, 1)) translateX(0); }
    }

    .readout{
      width:min(560px, 100%);
      display:flex;
      gap:12px;
      align-items:center;
      justify-content:space-between;
      flex-wrap:wrap;
      padding:10px 12px;
      border-radius: 14px;
      background: rgba(0,0,0,0.22);
      border: 1px solid rgba(255,255,255,0.08);
    }
    .hz{
      font-size: 22px;
      font-weight: 750;
      letter-spacing: 0.2px;
    }
    .note{
      font-size: 13px;
      color: var(--muted);
    }
    .controls{
      width:min(560px, 100%);
      display:grid;
      grid-template-columns: 1fr auto auto;
      gap:10px;
      align-items:center;
    }
    input[type="range"]{
      width:100%;
      accent-color: var(--accent);
    }
    .btn{
      border:1px solid rgba(255,255,255,0.16);
      background: rgba(255,255,255,0.08);
      color: var(--text);
      padding:10px 12px;
      border-radius: 14px;
      cursor:pointer;
      font-weight: 650;
      letter-spacing:0.2px;
      transition: transform .06s ease, background .18s ease, border-color .18s ease;
      user-select:none;
    }
    .btn:hover{ background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.24); }
    .btn:active{ transform: translateY(1px); }

    /* Primær knappen er "visuelt aktiv" KUN når den spiller */
    .btn.primary{
      background: rgba(255,255,255,0.08);
      border-color: rgba(255,255,255,0.16);
    }
    .btn.primary.active{
      background: linear-gradient(135deg, rgba(255,42,95,0.55), rgba(168,85,247,0.38));
      border-color: rgba(255,255,255,0.45);
    }

    /* Tips box */
    .tip p{ margin:0 0 10px; color: var(--muted); line-height:1.45; }
    .tip .badge{
      display:inline-flex;
      align-items:center;
      gap:8px;
      padding:8px 10px;
      border-radius: 999px;
      border:1px solid rgba(255,255,255,0.14);
      background: rgba(0,0,0,0.18);
      color: rgba(255,255,255,0.85);
      font-size: 12px;
      margin-bottom:10px;
    }
    .dot{
      width:9px;height:9px;border-radius:99px;
      background: var(--accent);
      box-shadow: 0 0 14px rgba(255,42,95,0.55);
    }

    @media (max-width: 860px){
      .app{ grid-template-columns: 1fr; }
    }

    /* ---------- SOUND STATE ---------- */
    .fork-waves path {
      stroke: currentColor;
      stroke-width: 4;
      fill: none;
    }
    #forkWrap[data-playing="false"] .fork-waves { opacity: 0; }
    #forkWrap[data-playing="true"] .fork-waves  { opacity: 0.5; transition: opacity 0.5s ease; }

    /* Markering for aktive valg */
    .instrument-btn.active,
    .string-btn.active,
    #set440.active {
      background: linear-gradient(135deg,
        rgba(255,42,95,0.45),
        rgba(168,85,247,0.28)
      );
      border-color: rgba(255,255,255,0.35);
    }

    .btn.oct-active {
      background: linear-gradient(135deg, #ff9f1c, #ff6a00);
      border-color: rgba(255,255,255,0.4);
    }
    .btn.oct-active.level-2 {
      background: linear-gradient(135deg, #ff6a00, #cc4a00);
    }

    /* Én rolig puls for lav frekvens */
    .card.tip.attention {
      animation: hintPulse 1.2s ease-out 1;
      border-color: rgba(255, 42, 95, 0.9);
    }
    @keyframes hintPulse {
      0%   { box-shadow: 0 0 0 rgba(255,42,95,0); transform: scale(1); }
      30%  { box-shadow: 0 0 30px rgba(255,42,95,0.6); transform: scale(1.012); }
      100% { box-shadow: 0 0 0 rgba(255,42,95,0); transform: scale(1); }
    }
  </style>
</head>

<body>
  <div class="app">

    <section class="card">
      <header>
        <div>
          <div class="title">Rockeskolen Digital Tuning Fork</div>
          <div class="subtitle">Pure reference tone (sine) · Tune by ear</div>
        </div>
        <div class="subtitle">A4 = 440 Hz</div>
      </header>

      <div class="content">
        <div class="stage">
          <div id="forkWrap" class="fork-wrap" data-playing="false" style="--forkScale: 1;">
            <svg class="fork" viewBox="0 0 420 240" xmlns="http://www.w3.org/2000/svg" aria-label="Stemmegaffel">
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

          <div class="readout">
            <div>
              <div id="hzText" class="hz">440.00 Hz</div>
              <div id="noteText" class="note">A4 (concert pitch)</div>
            </div>
            <div class="note" id="statusText">Ready</div>
          </div>

          <!-- Instrument chooser -->
          <div class="controls" style="grid-template-columns: repeat(auto-fit, minmax(90px,1fr));">
            <button class="btn instrument-btn" data-instrument="guitar">🎸 Guitar</button>
            <button class="btn instrument-btn" data-instrument="bass">🎸 Bass</button>
            <button class="btn instrument-btn" data-instrument="banjo">🪕 Banjo</button>
            <button class="btn instrument-btn" data-instrument="violin">🎻 Violin</button>
            <button class="btn instrument-btn" data-instrument="ukulele">🪕 Ukulele</button>
          </div>

          <!-- String buttons -->
          <div class="controls" id="stringButtons"
               style="grid-template-columns: repeat(auto-fit, minmax(60px,1fr));"></div>

          <div class="controls">
            <input id="freq" type="range" min="27.5" max="1046.5" step="0.1" value="440" />
            <button id="play" class="btn primary">▶ Play</button>
            <button id="stop" class="btn">⏹ Stop</button>
          </div>

          <div class="controls" style="grid-template-columns: 1fr 1fr 1fr;">
            <button id="octDown" class="btn" title="Same note one octave lower">– Octave</button>
            <button id="set440" class="btn" title="Reset to A4 (440 Hz)">A4 = 440</button>
            <button id="octUp" class="btn" title="Same note one octave higher">+ Octave</button>
          </div>
        </div>
      </div>
    </section>

    <aside class="card tip">
      <header>
        <div class="title">Tips & trivia</div>
        <div class="subtitle">Nice to know</div>
      </header>
      <div class="content">
        <div class="badge">
          <span class="dot"></span>
          <span id="tipBadge">A4 – 440 Hz</span>
        </div>
        <p id="tipText">
          A4 (440 Hz) is the standard reference pitch. Tune by ear: listen for “beats”
          between your instrument and the reference tone, and adjust until they disappear.
        </p>
        <p class="subtitle">
          Tip: If low notes are hard to hear, press + Octave to hear the same pitch one octave higher.
          You are still tuning the same string.
        </p>
      </div>
      <div class="note" id="octaveStatus">Octave: 0</div>
    </aside>

  </div>
<script>
(() => {
  // ---------- UI elements ----------
  const freqEl = document.getElementById('freq');
  const playBtn = document.getElementById('play');
  const stopBtn = document.getElementById('stop');
  const octDownBtn = document.getElementById('octDown');
  const octUpBtn = document.getElementById('octUp');
  const set440Btn = document.getElementById('set440');

  const hzText = document.getElementById('hzText');
  const noteText = document.getElementById('noteText');
  const statusText = document.getElementById('statusText');

  const forkWrap = document.getElementById('forkWrap');
  const tipBadge = document.getElementById('tipBadge');
  const tipText = document.getElementById('tipText');
  const tipBox = document.querySelector('.card.tip');

  // ---------- Data ----------
  const INSTRUMENTS = {
    guitar: {
      label: "Gitar (standard)",
      strings: [
        { note: "E2", hz: 82.41 },
        { note: "A2", hz: 110.00 },
        { note: "D3", hz: 146.83 },
        { note: "G3", hz: 196.00 },
        { note: "B3", hz: 246.94 },
        { note: "E4", hz: 329.63 }
      ]
    },
    bass: {
      label: "Bass (4-streng)",
      strings: [
        { note: "E1", hz: 41.20 },
        { note: "A1", hz: 55.00 },
        { note: "D2", hz: 73.42 },
        { note: "G2", hz: 98.00 }
      ]
    },
    banjo: {
      label: "Banjo (5-streng)",
      strings: [
        { note: "G4", hz: 392.00 },
        { note: "D3", hz: 146.83 },
        { note: "G3", hz: 196.00 },
        { note: "B3", hz: 246.94 },
        { note: "D4", hz: 293.66 }
      ]
    },
    violin: {
      label: "Fiolin",
      strings: [
        { note: "G3", hz: 196.00 },
        { note: "D4", hz: 293.66 },
        { note: "A4", hz: 440.00 },
        { note: "E5", hz: 659.25 }
      ]
    },
    ukulele: {
      label: "Ukulele (standard)",
      strings: [
        { note: "G4", hz: 392.00 },
        { note: "C4", hz: 261.63 },
        { note: "E4", hz: 329.63 },
        { note: "A4", hz: 440.00 }
      ]
    }
  };

  let currentInstrument = "guitar";
  let octaveOffset = 0;
  const MAX_OCT = 2;

  // ---------- Audio (Web Audio API) ----------
  let audioCtx = null;
  let osc = null;
  let gain = null;
  let isPlaying = false;

  const ATTACK = 0.02;   // seconds
  const RELEASE = 0.06;  // seconds
  const MAX_GAIN = 0.18; // comfortable

  const MIN_HZ = 27.5;
  const MAX_HZ = 1046.5;

  // Low-freq attention pulse once per "below threshold" entry
  let lowFreqHintShown = false;
  const LOW_FREQ_THRESHOLD = 220;

  // ---------- Helpers ----------
  function clampHz(v){
    return Math.min(MAX_HZ, Math.max(MIN_HZ, v));
  }

  function getBaseHz(){
    return clampHz(parseFloat(freqEl.value));
  }

  function getEffectiveHz(){
    return clampHz(getBaseHz() * Math.pow(2, octaveOffset));
  }

// Tips
function tipFor(freq, label){
  if (Math.abs(freq - 440) < 0.05) {
    return {
      badge: "A4 – 440 Hz",
      text: "A4 (440 Hz) is the standard reference pitch. Tune by ear: listen for the beating between your instrument and the reference tone, and adjust until the beating disappears."
    };
  }
  if (Math.abs(freq - 27.5) < 0.2) {
    return {
      badge: "A0 – 27.5 Hz",
      text: "A0 (27.5 Hz) is the lowest note on an 88-key piano. Low frequencies can be difficult to hear – try using + Octave to hear the same pitch one octave higher."
    };
  }
  if (Math.abs(freq - 1046.5) < 0.2) {
    return {
      badge: "C6 – 1046.5 Hz",
      text: "C6 (1046.5 Hz) is often referred to as “high C” in the vocal world. High frequencies can feel sharp – keep the volume low."
    };
  }
  return {
    badge: `${label} – ${freq.toFixed(2)} Hz`,
    text: "Tune by ear: as the pitch matches, the beating between the reference tone and your instrument slows down – and eventually disappears."
  };
}

  // Fork size scaling (low Hz => larger)
  function forkScaleFromHz(hz){
    const t = (hz - MIN_HZ) / (MAX_HZ - MIN_HZ);
    const inv = 1 - Math.min(1, Math.max(0, t));
    const curved = Math.pow(inv, 0.55);
    return 0.82 + (curved * 0.40);
  }

  // Note labeling (12-TET, A4=440)
  const NOTE_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  function noteFromHz(hz){
    const A4 = 440;
    const semitonesFromA4 = 12 * Math.log2(hz / A4);
    const midi = Math.round(semitonesFromA4 + 69);
    const name = NOTE_NAMES[(midi + 1200) % 12];
    const octave = Math.floor(midi / 12) - 1;
    return { name, octave, midi };
  }

  function clearStringActive(){
    document.querySelectorAll(".string-btn").forEach(b => b.classList.remove("active"));
  }

  function clearInstrumentActive(){
    document.querySelectorAll(".instrument-btn").forEach(b => b.classList.remove("active"));
  }

  function clearSet440Active(){
    set440Btn.classList.remove("active");
  }

  function renderStrings(instrKey){
    const wrap = document.getElementById("stringButtons");
    wrap.innerHTML = "";

    INSTRUMENTS[instrKey].strings.forEach((s) => {
      const btn = document.createElement("button");
      btn.className = "btn string-btn";
      // knappetekst: bare tonenavn uten oktav (E, A, D...)
      btn.textContent = s.note.replace(/[0-9]/g, "");
      btn.title = `${s.note} – ${s.hz} Hz`;

      btn.addEventListener("click", () => {
        clearSet440Active();
        clearStringActive();
        btn.classList.add("active");

        setFreq(s.hz); // setter base
        if (!isPlaying) start();
        else updateUI(); // oppdater oscillator
      });

      wrap.appendChild(btn);
    });
  }

  function updateOctaveUI(){
    const status = document.getElementById("octaveStatus");

    octDownBtn.classList.remove("oct-active", "level-2");
    octUpBtn.classList.remove("oct-active", "level-2");

    if (octaveOffset < 0) {
      octDownBtn.classList.add("oct-active");
      if (octaveOffset <= -2) octDownBtn.classList.add("level-2");
    }
    if (octaveOffset > 0) {
      octUpBtn.classList.add("oct-active");
      if (octaveOffset >= 2) octUpBtn.classList.add("level-2");
    }

    status.textContent =
      octaveOffset === 0
        ? "Oktav: 0"
        : `Oktav: ${octaveOffset > 0 ? "+" : ""}${octaveOffset}`;
  }

  function maybeLowFreqPulse(hz){
    if (hz < LOW_FREQ_THRESHOLD && !lowFreqHintShown) {
      lowFreqHintShown = true;
      // restart animasjonen deterministisk
      tipBox.classList.remove("attention");
      void tipBox.offsetWidth;
      tipBox.classList.add("attention");
      tipBox.addEventListener("animationend", () => {
        tipBox.classList.remove("attention");
      }, { once: true });
    }
    if (hz >= LOW_FREQ_THRESHOLD) {
      lowFreqHintShown = false;
    }
  }

  function updateUI(){
    const hz = getEffectiveHz();

    const n = noteFromHz(hz);
    hzText.textContent = `${hz.toFixed(2)} Hz`;
    noteText.textContent = `${n.name}${n.octave}${Math.abs(hz-440)<0.05 ? " (concert pitch)" : ""}`;

    // fork scale
    const s = forkScaleFromHz(hz);
    forkWrap.style.setProperty('--forkScale', s.toFixed(3));

    // tips
    const label = `${n.name}${n.octave}`;
    const tip = tipFor(hz, label);
    tipBadge.textContent = tip.badge;
    tipText.textContent = tip.text;

    // low freq pulse
    maybeLowFreqPulse(hz);

    // update oscillator
    if (isPlaying && osc && audioCtx) {
      osc.frequency.setValueAtTime(hz, audioCtx.currentTime);
    }
  }

  async function ensureAudio(){
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") await audioCtx.resume();
  }

  async function start(){
    if (isPlaying) return;
    await ensureAudio();

    const hz = getEffectiveHz();

    osc = audioCtx.createOscillator();
    gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(hz, audioCtx.currentTime);

    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(MAX_GAIN, audioCtx.currentTime + ATTACK);

    osc.connect(gain).connect(audioCtx.destination);
    osc.start();

    isPlaying = true;
    forkWrap.dataset.playing = "true";
    statusText.textContent = "Spiller…";

    playBtn.classList.add("active"); // viktig: markér kun når aktiv
  }

  function stop(){
    if (!isPlaying || !audioCtx || !gain || !osc) return;
    const now = audioCtx.currentTime;

    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + RELEASE);

    setTimeout(() => {
      try { osc.stop(); } catch {}
      try { osc.disconnect(); } catch {}
      try { gain.disconnect(); } catch {}
      osc = null; gain = null;
    }, Math.ceil((RELEASE + 0.02) * 1000));

    isPlaying = false;
    forkWrap.dataset.playing = "false";
    statusText.textContent = "Stoppet";

    playBtn.classList.remove("active");
  }

  function setFreq(hz){
    freqEl.value = clampHz(hz).toFixed(1); // base freq
    updateUI();
  }

  // ---------- Events (kun én gang!) ----------
  freqEl.addEventListener("input", () => {
    clearSet440Active();
    updateUI();
  });

  playBtn.addEventListener("click", () => start());
  stopBtn.addEventListener("click", () => stop());

  octDownBtn.addEventListener("click", () => {
    if (octaveOffset > -MAX_OCT) octaveOffset--;
    clearSet440Active();
    updateOctaveUI();
    updateUI();
  });

  octUpBtn.addEventListener("click", () => {
    if (octaveOffset < MAX_OCT) octaveOffset++;
    clearSet440Active();
    updateOctaveUI();
    updateUI();
  });

  set440Btn.addEventListener("click", () => {
    // reset alt valg
    clearInstrumentActive();
    clearStringActive();
    set440Btn.classList.add("active");

    octaveOffset = 0;
    updateOctaveUI();

    setFreq(440);

    if (!isPlaying) start();
    else updateUI();
  });

  // Instrument switching
  document.querySelectorAll(".instrument-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      clearSet440Active();
      clearInstrumentActive();
      btn.classList.add("active");

      currentInstrument = btn.dataset.instrument;
      renderStrings(currentInstrument);

      // fjern streng-active ved instrumentbytte
      clearStringActive();
    });
  });

  // Safety: stop on tab hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
  });

  // ---------- init ----------
  // sett default aktiv instrumentknapp
  document.querySelector(`.instrument-btn[data-instrument="${currentInstrument}"]`)?.classList.add("active");
  renderStrings(currentInstrument);
  updateOctaveUI();
  updateUI();
})();
</script>
</body>
</html>
