<?php
// tools/scales/piano/include.php
// Mini-embed: piano + play. Scale chosen via URL: ?root=F&scale=nat_minor
// Loads scale definitions from: /assets/data/scales.json

header('Content-Type: text/html; charset=utf-8');

// --- Inputs (safe defaults) ---
$root  = isset($_GET['root'])  ? trim((string)$_GET['root'])  : 'C';
$scale = isset($_GET['scale']) ? trim((string)$_GET['scale']) : 'major';
$lang  = isset($_GET['lang'])  ? strtolower(trim((string)$_GET['lang'])) : 'en';
$direction = isset($_GET['direction']) ? strtolower(trim((string)$_GET['direction'])) : 'up';

// Normalize root (accept e.g. "bb", "Db", "f#", etc.)
$root = str_replace(' ', '', $root);
$root = str_replace(['♯','♭'], ['#','b'], $root);
$root = preg_replace('/[^A-Ga-g#b]/', '', $root);
$root = strtoupper(substr($root, 0, 1)) . substr($root, 1);

// Whitelist-ish scale key (safe chars)
$scale = preg_replace('/[^a-zA-Z0-9_\-]/', '', $scale);

// English remains the shared/default language. Rockeskolen embeds opt in with ?lang=no.
if (!in_array($lang, ['en', 'no'], true)) $lang = 'en';
if (!in_array($direction, ['up', 'down', 'both'], true)) $direction = 'up';

// Optional params (nice to have)
$acc = isset($_GET['acc']) ? strtolower((string)$_GET['acc']) : 'sharp'; // sharp|flat
if (!in_array($acc, ['sharp','flat'], true)) $acc = 'sharp';

// Visual sizing (optional): ?w=34&h=180 etc.
$whiteW = isset($_GET['w']) ? (int)$_GET['w'] : 34;
$whiteH = isset($_GET['h']) ? (int)$_GET['h'] : 132;
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

      --ink:#162036;
      --muted:#68738e;
      --line:rgba(48,61,91,.14);
      --violet:#665cf6;
      --cyan:#4cc9f0;
      --gradA:#665cf6;
      --gradB:#8a6ff2;
      --gradC:#4cc9f0;
    }

    *{ box-sizing:border-box; }
    html,body{ margin:0; min-height:100%; background:#080c14; color:var(--ink); font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif; }

    .cl-mini{
      display:flex;
      flex-direction:column;
      gap:10px;
      width:max-content;
      min-width:min(100%, 360px);
      padding:10px 10px 14px;
      border:1px solid var(--line);
      border-radius:16px;
      background:linear-gradient(145deg,#fff 0%,#fbfdff 58%,#f7f4ff 100%);
      box-shadow:0 8px 28px rgba(42,53,81,.08);
      max-width:100%;
    }

    .cl-mini-top{
      display:flex;
      justify-content:space-between;
      gap:12px;
      align-items:center;
      flex-wrap:wrap;
    }

    .cl-mini-title{
      font-size:12px;
      color:#3e4965;
      font-weight:750;
      user-select:none;
    }

    .cl-mini button{
      cursor:pointer;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      min-height:32px;
      border-radius:999px;
      padding:6px 12px;
      border:1px solid var(--line);
      background:rgba(255,255,255,.92);
      color:#26314a;
      box-shadow:0 3px 10px rgba(42,53,81,.06);
      font:inherit;
      font-weight:650;
      font-size:13px;
      transition:border-color .18s ease,background .18s ease,box-shadow .18s ease,transform .18s ease;
    }
    .cl-mini button:hover{
      border-color:rgba(102,92,246,.35);
      background:#fff;
      box-shadow:0 5px 16px rgba(74,83,132,.12);
      transform:translateY(-1px);
    }
    .cl-mini button:focus-visible{ outline:3px solid rgba(76,201,240,.35); outline-offset:2px; }

    .piano-viewport{ max-width:100%; overflow-x:auto; padding:2px 2px 12px; scrollbar-width:thin; }

    .piano{ display:flex; width:max-content; justify-content:center; }
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

    .white.in-scale{
      background:linear-gradient(180deg,#fff 0%,#f1f8ff 58%,#e8e3ff 100%);
      box-shadow:0 0 0 1px rgba(102,92,246,.16) inset,0 8px 16px rgba(44,56,92,.13);
    }
    .black.in-scale{
      background:linear-gradient(180deg,#34354f 0%,#15172b 70%,#665cf6 145%);
      box-shadow:0 0 0 1px rgba(76,201,240,.18) inset,0 10px 18px rgba(0,0,0,.25);
    }
    .white.playing{
      background:linear-gradient(145deg,#8de8ff 0%,#a99afc 100%);
      box-shadow:0 0 9px rgba(76,201,240,.95),0 0 24px rgba(102,92,246,.7),0 10px 18px rgba(44,56,92,.18);
      transform:translateY(2px);
    }
    .black.playing{
      background:linear-gradient(145deg,#7868ee,#4cc9f0);
      box-shadow:0 0 9px rgba(76,201,240,.95),0 0 22px rgba(102,92,246,.72),0 10px 18px rgba(0,0,0,.3);
      transform:translateY(2px);
    }

    .mark{
      position:absolute;
      bottom:7px;
      left:50%;
      transform:translateX(-50%);
      width:var(--black-w);
      padding:2px 0;
      text-align:center;
      background:linear-gradient(135deg,var(--gradA),var(--gradC));
      color:#fff;
      font-size:10px;
      font-weight:800;
      line-height:14px;
      z-index:20;
      box-shadow:0 2px 10px rgba(0,0,0,.25);
    }

    .white,.black{ transition:background .18s ease,box-shadow .18s ease,transform .12s ease; }
    .black .mark{ top:7px; bottom:auto; }

    .controls{ display:flex; align-items:center; gap:7px; }
    .direction-controls{ display:inline-flex; gap:4px; margin-left:2px; padding-left:9px; border-left:1px solid var(--line); }
    .cl-mini .direction-button{ min-width:34px; padding:6px 9px; color:#59647c; font-size:16px; line-height:1; }
    .cl-mini .direction-button[aria-pressed="true"]{
      border-color:rgba(102,92,246,.45);
      background:linear-gradient(135deg,rgba(76,201,240,.16),rgba(134,92,246,.16));
      color:var(--violet);
      box-shadow:inset 0 0 0 1px rgba(102,92,246,.08),0 4px 14px rgba(102,92,246,.12);
    }
    .sr-only{ position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0; }

    @media (prefers-reduced-motion:reduce){ .white,.black,.cl-mini button{ transition:none; } }

  </style>
</head>
<body>

<div class="cl-mini" data-root="<?= htmlspecialchars($root, ENT_QUOTES) ?>"
     data-scale="<?= htmlspecialchars($scale, ENT_QUOTES) ?>"
     data-lang="<?= htmlspecialchars($lang, ENT_QUOTES) ?>"
     data-direction="<?= htmlspecialchars($direction, ENT_QUOTES) ?>"
     data-acc="<?= htmlspecialchars($acc, ENT_QUOTES) ?>">

  <div class="cl-mini-top">
    <div class="cl-mini-title" id="miniTitle">Laster…</div>
  </div>

  <div class="piano-viewport"><div class="piano" id="piano"></div></div>

  <div class="controls" aria-label="<?= $lang === 'no' ? 'Avspilling' : 'Playback' ?>">
    <button id="btnPlay" type="button"><span aria-hidden="true">▶</span>&nbsp;<?= $lang === 'no' ? 'Spill' : 'Play' ?></button>
    <button id="btnStop" type="button"><span aria-hidden="true">■</span>&nbsp;<?= $lang === 'no' ? 'Stopp' : 'Stop' ?></button>
    <div class="direction-controls" role="group" aria-label="<?= $lang === 'no' ? 'Velg retning' : 'Choose direction' ?>">
      <button type="button" class="direction-button" data-direction="up" aria-label="<?= $lang === 'no' ? 'Spill oppover' : 'Play ascending' ?>" aria-pressed="false" title="<?= $lang === 'no' ? 'Oppover' : 'Ascending' ?>">↑</button>
      <button type="button" class="direction-button" data-direction="down" aria-label="<?= $lang === 'no' ? 'Spill nedover' : 'Play descending' ?>" aria-pressed="false" title="<?= $lang === 'no' ? 'Nedover' : 'Descending' ?>">↓</button>
      <button type="button" class="direction-button" data-direction="both" aria-label="<?= $lang === 'no' ? 'Spill opp og ned' : 'Play up and down' ?>" aria-pressed="false" title="<?= $lang === 'no' ? 'Opp og ned' : 'Up and down' ?>">↕</button>
    </div>
    <span id="playbackStatus" class="sr-only" role="status" aria-live="polite"></span>
  </div>
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
  const langWanted = document.querySelector('.cl-mini').dataset.lang || "en";
  let directionWanted = document.querySelector('.cl-mini').dataset.direction || "up";
  const accPref = document.querySelector('.cl-mini').dataset.acc || "sharp";
  const pcName = pc => (accPref === "flat" ? N_FLAT[pc] : N_SHARP[pc]);
  const noteName = m => pcName(mod(m,12)) + (Math.floor(m/12)-1);
  const tempoParam = new URLSearchParams(window.location.search).get("tempo");
  const tempo = Math.min(240, Math.max(30, tempoParam ? parseInt(tempoParam, 10) || 120 : 120));
  let playTimers=[];

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
  const activeVoices = new Set();
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

    activeVoices.add(o);
    o.addEventListener('ended',()=>activeVoices.delete(o),{once:true});
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
      makeKeyInteractive(white,midi);
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
        makeKeyInteractive(black,bm);
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
    makeKeyInteractive(white,midi);
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

  // Two octaves: C4..B4 and C5..B5 + top C6
  row.appendChild(renderOctave(4));
  row.appendChild(renderOctave(5));
  row.appendChild(renderTailC(6));

  piano.appendChild(row);
}

  function makeKeyInteractive(key,midi){
    key.setAttribute('role','button');
    key.tabIndex=0;
    key.setAttribute('aria-label',noteName(midi));
    const play=()=>{
      try{ if(AC.state!=='running') AC.resume(); }catch(_){}
      ping(midi,0);
      key.classList.add('playing');
      setTimeout(()=>key.classList.remove('playing'),420);
    };
    key.addEventListener('click',play);
    key.addEventListener('keydown',(event)=>{
      if(event.key==='Enter'||event.key===' '){ event.preventDefault(); play(); }
    });
  }

  function clearHighlights(){
    document.querySelectorAll('.white,.black').forEach(el=>{
      el.classList.remove('in-scale','playing');
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
        el.classList.add('in-scale');
        let tag=el.querySelector('.mark');
        if(!tag){ tag=document.createElement('div'); tag.className='mark'; el.appendChild(tag); }
        tag.textContent = noteName(midi);
      }
    });

  return midis.filter(m => m >= 60 && m <= 84); // C4..C6 (2 octaves + top C)

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

  function normalizeDirection(direction){
    return ['up','down','both'].includes(direction) ? direction : 'up';
  }

  function directionSequence(ascending,direction){
    if(direction==='down') return [...ascending].reverse();
    if(direction==='both') return [...ascending,...ascending.slice(0,-1).reverse()];
    return [...ascending];
  }

  function updateDirectionButtons(){
    document.querySelectorAll('.direction-button').forEach(button=>{
      button.setAttribute('aria-pressed',String(button.dataset.direction===directionWanted));
    });
  }

  function clearPlayback(){
    playTimers.forEach(clearTimeout);
    playTimers=[];
    activeVoices.forEach(voice=>{ try{ voice.stop(); }catch(_){} });
    activeVoices.clear();
    document.querySelectorAll('.white.playing,.black.playing').forEach(key=>key.classList.remove('playing'));
    document.body.classList.remove('is-playing');
  }

  // ---------- Boot ----------
  (async () => {
    renderPiano();

    const titleEl = document.getElementById('miniTitle');
    const playBtn = document.getElementById('btnPlay');
    const stopBtn = document.getElementById('btnStop');
    const statusEl = document.getElementById('playbackStatus');

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
    const scaleName = langWanted === "no" && scaleObj?.name_no
      ? scaleObj.name_no
      : (scaleObj?.name || scaleKeyWanted);
    titleEl.textContent = `${rootName} ${scaleName}`;

    const ascendingSeq = highlightScale(rootPc, scaleObj) || [];
    directionWanted=normalizeDirection(directionWanted);
    updateDirectionButtons();

    playBtn.addEventListener('click',async()=>{
      clearPlayback();
      try{ if(AC.state!=='running') await AC.resume(); }catch(_){}
      if(!ascendingSeq.length) return;

      const sequence=directionSequence(ascendingSeq,directionWanted);
      const stepMs=60000/tempo;
      document.body.classList.add('is-playing');
      if(statusEl) statusEl.textContent=langWanted==='no'?'Spiller skala':'Playing scale';

      sequence.forEach((m,index)=>{
        const startMs=index*stepMs;
        playTimers.push(setTimeout(()=>{
          ping(m,0);
          const key=document.querySelector(`[data-m="${m}"]`);
          if(key) key.classList.add('playing');
        },startMs));
        playTimers.push(setTimeout(()=>{
          const key=document.querySelector(`[data-m="${m}"]`);
          if(key) key.classList.remove('playing');
        },startMs+Math.min(stepMs*.9,650)));
      });

      playTimers.push(setTimeout(()=>{
        clearPlayback();
        if(statusEl) statusEl.textContent=langWanted==='no'?'Avspilling ferdig':'Playback finished';
      },sequence.length*stepMs+120));
    });

    stopBtn.addEventListener('click',()=>{
      clearPlayback();
      if(statusEl) statusEl.textContent=langWanted==='no'?'Avspilling stoppet':'Playback stopped';
    });

    document.querySelectorAll('.direction-button').forEach(button=>{
      button.addEventListener('click',()=>{
        clearPlayback();
        directionWanted=normalizeDirection(button.dataset.direction);
        updateDirectionButtons();
        if(statusEl) statusEl.textContent=button.getAttribute('title')||'';
      });
    });



  })();
})();
</script>

</body>
</html>
