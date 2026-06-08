<?php
// tools/scales/piano/include.php
// Mini-embed: piano + play. Scale chosen via URL: ?root=F&scale=nat_minor
// Loads scale definitions from: /assets/data/scales.json

header('Content-Type: text/html; charset=utf-8');

// --- Inputs (safe defaults) ---
$root  = isset($_GET['root'])  ? trim((string)$_GET['root'])  : 'C';
$scale = isset($_GET['scale']) ? trim((string)$_GET['scale']) : 'major';

// Normalize root (accept e.g. "bb", "Db", "f#", etc.)
$root = str_replace(' ', '', $root);
$root = str_replace(['♯','♭'], ['#','b'], $root);
$root = preg_replace('/[^A-Ga-g#b]/', '', $root);
$root = strtoupper(substr($root, 0, 1)) . substr($root, 1);

// Whitelist-ish scale key (safe chars)
$scale = preg_replace('/[^a-zA-Z0-9_\-]/', '', $scale);

// Optional params (nice to have)
$acc = isset($_GET['acc']) ? strtolower((string)$_GET['acc']) : 'sharp'; // sharp|flat
if (!in_array($acc, ['sharp','flat'], true)) $acc = 'sharp';

// Visual sizing (optional): ?w=34&h=180 etc.
$whiteW = isset($_GET['w']) ? (int)$_GET['w'] : 34;
$whiteH = isset($_GET['h']) ? (int)$_GET['h'] : 160;
$whiteW = max(18, min(70, $whiteW));
$whiteH = max(90, min(320, $whiteH));
$blackW = (int)round($whiteW * 0.62);
$blackH = (int)round($whiteH * 0.62);
?>
<!doctype html>
<html lang="nb">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Scale embed</title>
  <style>
    :root{
      --white-w: <?= (int)$whiteW ?>px;
      --white-h: <?= (int)$whiteH ?>px;
      --black-w: <?= (int)$blackW ?>px;
      --black-h: <?= (int)$blackH ?>px;

      --bg: transparent;
      --text:#e8eeff;
      --muted:#9fb1cf;
      --gradA:#ff5c7a;
      --gradB:#b28bff;
      --gradC:#54d2f2;
    }

    *{ box-sizing:border-box; }
    html,body{ margin:0; background:var(--bg); font-family:system-ui,Segoe UI,Roboto,Inter,Arial,sans-serif; }

    .cl-mini{
      display:inline-flex;
      flex-direction:column;
      gap:8px;
      align-items:flex-start;
      padding:8px;
      border-radius:12px;
      border:1px solid rgba(255,255,255,.10);
      background:rgba(16,23,53,.22);
      max-width:100%;
    }

    .cl-mini-top{
      display:flex;
      gap:8px;
      align-items:center;
      flex-wrap:wrap;
    }

    .cl-mini-title{
      font-size:12px;
      color:var(--muted);
      user-select:none;
    }

    .cl-mini button{
      cursor:pointer;
      border-radius:10px;
      padding:8px 10px;
      border:1px solid rgba(255,255,255,.14);
      background:#101735;
      color:var(--text);
      font-weight:700;
      font-size:13px;
    }
    .cl-mini button.primary{
      border:0;
      color:#061020;
      background:linear-gradient(135deg,var(--gradA),var(--gradB),var(--gradC));
    }

    .piano{ display:flex; justify-content:center; }
    .oct{ position:relative; width:calc(7 * var(--white-w)); height:var(--white-h); overflow:visible; }
    .oct.tail{ width:var(--white-w); }

    .whites{ display:flex; height:var(--white-h); }
    .white{
      position:relative;
      width:var(--white-w);
      height:var(--white-h);
      background:linear-gradient(180deg,#ffffff 0%, #f6f8ff 62%, #eef2ff 100%);
      border:1px solid rgba(20,28,55,.35);
      border-bottom-left-radius:8px;
      border-bottom-right-radius:8px;
      box-shadow: 0 8px 16px rgba(0,0,0,.18);
      user-select:none;
    }
    .white .lab{
      position:absolute; bottom:6px; left:0; right:0;
      color:#0b0f1a; font-size:11px; text-align:center; opacity:.85;
    }

    .blacks{ position:absolute; inset:0; pointer-events:none; }
    .black{
      position:absolute; top:0;
      width:var(--black-w); height:var(--black-h);
      background:linear-gradient(180deg,#3a3f52 0%, #0e1220 75%, #090c14 100%);
      border:1px solid rgba(0,0,0,.65);
      border-bottom-left-radius:7px;
      border-bottom-right-radius:7px;
      box-shadow: 0 10px 18px rgba(0,0,0,.25);
      z-index:3;
      pointer-events:auto;
      user-select:none;
    }

    .white.active{
      background:linear-gradient(135deg,var(--gradA),var(--gradB),var(--gradC));
      box-shadow: 0 0 16px rgba(178,139,255,.35), 0 10px 18px rgba(0,0,0,.22);
    }
    .black.active{
      background:linear-gradient(135deg,var(--gradB),var(--gradC));
      box-shadow: 0 0 14px rgba(84,210,242,.30) inset, 0 10px 18px rgba(0,0,0,.30);
    }

    .mark{
      position:absolute;
      top:6px;
      left:50%;
      transform:translateX(-50%);
      width:var(--black-w);
      padding:2px 0;
      text-align:center;
      background:linear-gradient(135deg,var(--gradA),var(--gradB),var(--gradC));
      color:#061020;
      font-size:10px;
      font-weight:800;
      line-height:14px;
      z-index:20;
      box-shadow:0 2px 10px rgba(0,0,0,.25);
    }
  </style>
</head>
<body>

<div class="cl-mini" data-root="<?= htmlspecialchars($root, ENT_QUOTES) ?>"
     data-scale="<?= htmlspecialchars($scale, ENT_QUOTES) ?>"
     data-acc="<?= htmlspecialchars($acc, ENT_QUOTES) ?>">

  <div class="cl-mini-top">
    <div class="cl-mini-title" id="miniTitle">Laster…</div>
    <button class="primary" id="btnPlay" type="button">Play</button>
  </div>

  <div class="piano" id="piano"></div>
</div>

<script>
(() => {
  // ---------- Config ----------
  const SCALES_JSON_URL = "/assets/data/scales.json";

  // ---------- Note helpers ----------
  const N_SHARP = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  const N_FLAT  = ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];
  const mod = (n,m)=>((n%m)+m)%m;

  const rootStr = document.querySelector('.cl-mini').dataset.root || "C";
  const scaleKeyWanted = document.querySelector('.cl-mini').dataset.scale || "major";
  const accPref = document.querySelector('.cl-mini').dataset.acc || "sharp";
  const pcName = pc => (accPref === "flat" ? N_FLAT[pc] : N_SHARP[pc]);
  const noteName = m => pcName(mod(m,12)) + (Math.floor(m/12)-1);

  function rootToPc(r){
    const s = (r || "C").replace("♯","#").replace("♭","b");
    const map = {
      "C":0,"B#":0,
      "C#":1,"DB":1,
      "D":2,
      "D#":3,"EB":3,
      "E":4,"FB":4,
      "F":5,"E#":5,
      "F#":6,"GB":6,
      "G":7,
      "G#":8,"AB":8,
      "A":9,
      "A#":10,"BB":10,
      "B":11,"CB":11
    };
    const key = s.length >= 2 ? (s[0].toUpperCase() + s[1].toUpperCase()) : s[0].toUpperCase();
    return (key in map) ? map[key] : 0;
  }

  // ---------- Audio ----------
  const AC = new (window.AudioContext||window.webkitAudioContext)();
  const midiToFreq = m => 440*Math.pow(2,(m-69)/12);
  function ping(m, offset=0){
    const t = AC.currentTime + offset;
    const o = AC.createOscillator();
    const g = AC.createGain();
    o.type = 'triangle';
    o.frequency.value = midiToFreq(m);
    o.connect(g); g.connect(AC.destination);

    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.22, t+0.01);
    g.gain.linearRampToValueAtTime(0.12, t+0.18);
    g.gain.exponentialRampToValueAtTime(0.0008, t+0.70);

    o.start(t); o.stop(t+0.72);
  }

  // ---------- Mini piano (1 octave + top C) ----------
  const WHITE_PCS=[0,2,4,5,7,9,11];
  const BLACK_AFTER={0:1,2:3,4:null,5:6,7:8,9:10,11:null};

  function renderOctave(oct){
    const octWrap=document.createElement('div'); octWrap.className='oct';
    const whites=document.createElement('div'); whites.className='whites';
    const blacks=document.createElement('div'); blacks.className='blacks';

    const whiteW = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--white-w')) || 34;
    const blackW = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--black-w')) || 21;

    for(let wi=0; wi<WHITE_PCS.length; wi++){
      const pc=WHITE_PCS[wi];
      const white=document.createElement('div');
      white.className='white';
      white.dataset.pc=pc;
      white.dataset.oct=oct;
      const midi=(oct+1)*12+pc;
      white.dataset.m=midi;

      if(pc===0){
        const lab=document.createElement('div');
        lab.className='lab';
        lab.textContent='C'+oct;
        white.appendChild(lab);
      }
      white.addEventListener('click',()=> ping(midi,0));
      whites.appendChild(white);

      const bpc=BLACK_AFTER[pc];
      if(bpc!=null){
        const black=document.createElement('div');
        black.className='black';
        black.dataset.pc=bpc;
        black.dataset.oct=oct;
        const bm=(oct+1)*12+bpc;
        black.dataset.m=bm;
        black.style.left=((wi+1)*whiteW - (blackW/2))+'px';
        black.addEventListener('click',()=> ping(bm,0));
        blacks.appendChild(black);
      }
    }
    octWrap.appendChild(whites); octWrap.appendChild(blacks);
    return octWrap;
  }

  function renderTailC(oct){
    const octWrap=document.createElement('div'); octWrap.className='oct tail';
    const whites=document.createElement('div'); whites.className='whites';
    const white=document.createElement('div'); white.className='white';
    white.dataset.pc=0; white.dataset.oct=oct;
    const midi=(oct+1)*12; // C of this octave
    white.dataset.m=midi;

    const lab=document.createElement('div'); lab.className='lab'; lab.textContent='C'+oct;
    white.appendChild(lab);
    white.addEventListener('click',()=> ping(midi,0));
    whites.appendChild(white);

    octWrap.appendChild(whites);
    return octWrap;
  }

  function renderPiano(){
    const piano=document.getElementById('piano');
    piano.innerHTML='';
    const row=document.createElement('div');
    row.style.display='flex';
    row.style.gap='0px';
    row.style.justifyContent='center';

    // One octave: C4..B4 + top C5
    row.appendChild(renderOctave(4));
    row.appendChild(renderTailC(5));

    piano.appendChild(row);
  }

  function clearHighlights(){
    document.querySelectorAll('.white,.black').forEach(el=>{
      el.classList.remove('active');
      const mark=el.querySelector('.mark');
      if(mark) mark.remove();
    });
  }

  function highlightScale(rootPc, scaleObj){
    clearHighlights();
    if(!scaleObj) return;

    // Highlight within the rendered octave range (C4..C5)
    const rootMidi = 60; // C4 is 60
    // Find nearest root midi around C4 within [C4..B4]
    const below = rootMidi - mod(rootMidi - rootPc, 12);
    const rootMidiNear = (below < rootMidi ? below + 12 : below); // keep in/above C4 area

    const midis = [];
    (scaleObj.intervals || []).forEach(iv => midis.push(rootMidiNear + iv));
    midis.push(rootMidiNear + 12);

    const midisSet = new Set(midis);

    document.querySelectorAll('.white,.black').forEach(el=>{
      const midi = parseInt(el.dataset.m,10);
      if(midisSet.has(midi)){
        el.classList.add('active');
        let tag=el.querySelector('.mark');
        if(!tag){ tag=document.createElement('div'); tag.className='mark'; el.appendChild(tag); }
        tag.textContent = noteName(midi);
      }
    });

    return midis.filter(m => m >= 60 && m <= 72); // play inside the embed range
  }

  async function loadScales(){
    const res = await fetch(SCALES_JSON_URL, {cache:"no-store"});
    if(!res.ok) throw new Error("Failed to load scales.json");
    const data = await res.json();

    // Accept either:
    // 1) { "major": {..}, "nat_minor": {..} }
    // 2) { "scales": { "major": {..}, ... } }
    // 3) array forms (fallback best-effort)
    if(data && typeof data === 'object'){
      if(data.scales && typeof data.scales === 'object') return data.scales;
      return data;
    }
    return {};
  }

  // ---------- Boot ----------
  (async () => {
    renderPiano();

    const titleEl = document.getElementById('miniTitle');
    const playBtn = document.getElementById('btnPlay');

    const rootPc = rootToPc(rootStr);
    let scales = {};
    try{
      scales = await loadScales();
    }catch(e){
      console.error(e);
    }

    // Fallback if missing
    const scaleObj = scales[scaleKeyWanted] || scales["major"] || null;

    const rootName = pcName(rootPc);
    const scaleName = (scaleObj && scaleObj.name) ? scaleObj.name : scaleKeyWanted;
    titleEl.textContent = `${rootName} ${scaleName}`;

    const playSeq = highlightScale(rootPc, scaleObj) || [];

    playBtn.addEventListener('click', async () => {
      // Ensure audio is resumed (mobile / autoplay policies)
      try { if(AC.state !== 'running') await AC.resume(); } catch(_){}
      if(!playSeq.length) return;
      let t = 0;
      const step = 0.25;
      playSeq.forEach(m => { ping(m, t); t += step; });
    });
  })();
})();
</script>

</body>
</html>
