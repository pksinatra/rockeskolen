// piano_chords_ui.js (prod) - UI logic for Piano Chord Finder
// NOTE: This file is a cleaned, consolidated version of the existing logic.
// No new features; fixes UI state bugs (accidental/invert highlights, clear with showAll) and correct chord defs/order.

// ===== Data =====
const N_SHARP = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const N_FLAT  = ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];

const LOCAL_QUAL = {
  maj:{name:"major",iv:[0,4,7]},
  min:{name:"minor",iv:[0,3,7]},
  maj7:{name:"maj7",iv:[0,4,7,11]},
  m7:{name:"m7",iv:[0,3,7,10]},
  "7":{name:"7",iv:[0,4,7,10]},
  sus2:{name:"sus2",iv:[0,2,7]},
  sus4:{name:"sus4",iv:[0,5,7]},
  add9:{name:"add9",iv:[0,4,7,14]},
  "6":{name:"6",iv:[0,4,7,9]},
  m9:{name:"m9",iv:[0,3,7,10,14]},
  maj9:{name:"maj9",iv:[0,4,7,11,14]},
  "9":{name:"9",iv:[0,4,7,10,14]},
  "maj#11":{name:"maj#11",iv:[0,4,7,11,18]},

  // Major 13-family (correct)
  maj7add13:{name:"maj7(add13)",iv:[0,4,7,11,21]},        // 1 3 5 7 13
  maj9add13:{name:"maj9(add13)",iv:[0,4,7,11,14,21]},     // 1 3 5 7 9 13
  maj13:{name:"maj13",iv:[0,4,7,11,14,17,21]},            // 1 3 5 7 9 11 13

  m11:{name:"m11",iv:[0,3,7,10,17]},
  m13:{name:"m13",iv:[0,3,7,10,21]},
  "11":{name:"11",iv:[0,4,7,10,17]},
  "13":{name:"13",iv:[0,4,7,10,21]},
  m7b5:{name:"m7b5",iv:[0,3,6,10]}
};
let QUAL = { ...LOCAL_QUAL };
let dataSourceState = "fallback";

const FREE_CHORD_KEYS = [
  "maj",
  "min",
  "7",
  "maj7",
  "m7",
  "sus2",
  "sus4"
];

// Canonical dropdown order (UI only)
const QUAL_ORDER = [
  // Triads & suspensions
  "maj","min","sus2","sus4",
  // Adds & 6
  "add9","6",
  // 7ths
  "maj7","7","m7","m7b5",
  // 9ths
  "maj9","9","m9",
  // 11ths / #11
  "maj#11","11","m11",
  // 13ths
  "13","m13","maj13",
  // Add-13 variants (major family)
  "maj7add13","maj9add13"
];

const mod = (n,m)=>((n%m)+m)%m;

// ===== DOM refs =====
const sharpBtn = document.getElementById("sharpBtn");
const flatBtn  = document.getElementById("flatBtn");
const invertUpBtn = document.getElementById("invertUp");
const invertDownBtn = document.getElementById("invertDown");
const sustainSlider = document.getElementById("sustain");
const volumeSlider = document.getElementById("volume");
const soundTypeSelect = document.getElementById("soundType");

// ===== State =====
const WHITE_W = 44, BLACK_W = 28;
const MIN_MIDI = 48, MAX_MIDI = 84; // C3..C6
let currentOrder = [];   // pitch classes (bass->diskant)
let voicingMidis = [];   // aktive MIDI-toner
let baseVoicingMidis = null; // grunnposisjon etter «Spill akkord»
let lastMovedNote = null;     // MIDI-verdien til sist flyttede tone (etter clamp)
let lastInvertDir = null;     // 'up' | 'down' | null

// Accidental preference: '#' (default) or 'b'
let accPref = "#";

// ===== Audio =====
const AC = new (window.AudioContext||window.webkitAudioContext)();
const midiToFreq = m => 440*Math.pow(2,(m-69)/12);
function ping(m){
  const t=AC.currentTime, o=AC.createOscillator(), g=AC.createGain();
  const sustainValue = sustainSlider ? (Number(sustainSlider.value) / 100) : 0.5;
  const volumeValue = volumeSlider ? (Number(volumeSlider.value) / 100) : 0.75;
  const selectedSound = soundTypeSelect ? soundTypeSelect.value : "warm";
  o.type = selectedSound === "warm" ? "triangle" : selectedSound;
  o.frequency.value=midiToFreq(m);
  o.connect(g); g.connect(AC.destination);
  const attack = 0.01;
  const holdTime = 0.18 + (sustainValue * 0.9);
  const releaseTime = 0.25 + (sustainValue * 0.9);
  const peakGain = Math.max(0.02, volumeValue * 0.32);
  const sustainGain = peakGain * (0.55 + sustainValue * 0.25);
  g.gain.setValueAtTime(0,t);
  g.gain.linearRampToValueAtTime(peakGain,t+attack);
  g.gain.linearRampToValueAtTime(sustainGain,t+holdTime);
  g.gain.exponentialRampToValueAtTime(0.0008,t+holdTime+releaseTime);
  o.start(t); o.stop(t+holdTime+releaseTime+0.02);
}
function playVoicing(){ voicingMidis.forEach(ping); }

// ===== Names =====
const pcName = pc => (accPref === "b" ? N_FLAT[pc] : N_SHARP[pc]);
const noteName = m => pcName(mod(m,12)) + (Math.floor(m/12)-1);

// ===== Buttons UI =====
function updateAccidentalButtons(){
  if(!sharpBtn || !flatBtn) return;
  const isSharp = (accPref === "#");
  sharpBtn.classList.toggle("acc-active", isSharp);
  flatBtn.classList.toggle("acc-active", !isSharp);
}
function updateInvertButtons(){
  if(!invertUpBtn || !invertDownBtn) return;
  invertUpBtn.classList.toggle("inv-active", lastInvertDir === "up");
  invertDownBtn.classList.toggle("inv-active", lastInvertDir === "down");
}
function arraysEqual(a,b){
  if(!a || !b) return false;
  if(a.length !== b.length) return false;
  for(let i=0;i<a.length;i++) if(a[i]!==b[i]) return false;
  return true;
}
function updateInvertState(dir){
  // If we're back at base, clear highlight; otherwise keep the last direction.
  if(baseVoicingMidis && arraysEqual(baseVoicingMidis, voicingMidis)){
    lastInvertDir = null;
  } else {
    lastInvertDir = dir; // 'up' or 'down'
  }
  updateInvertButtons();
}


// ===== Chat helper =====

function isChordAllowed(qualKey){
  return window.CL_IS_PRO || FREE_CHORD_KEYS.includes(qualKey);
}

let lastAllowedQual = "";

function showProNotice(qualKey){
  const el   = document.getElementById("proBox");
  const card = document.getElementById("proCard");
  if(!el || !card) return;

  const v = QUAL[qualKey];
  const name = v ? v.name : qualKey;

  el.innerHTML = `
    <a class="pro-cta pro-cta--promo" href="/members/upgrade.php" target="_top">The chord <strong>${name}</strong> is available in the Pro version. You can choose another chord, or <span class="pro-cta-sub">upgrade to Pro to unlock all features</span>.    </a>
  `;

  card.style.display = "block";
}

function setDataSourceBadge(state){
  dataSourceState = state;
  const el = document.getElementById("dataSourceBadge");
  if(!el) return;
  if(state === "live"){
    el.textContent = "Live data";
  } else if(state === "fallback"){
    el.textContent = "Local fallback";
  } else {
    el.textContent = "Local fallback";
  }
}

function normalizeApiRows(rows){
  if(!Array.isArray(rows)) return [];
  return rows
    .map((row)=>{
      const slug = (row?.slug || "").toString().trim();
      const name = (row?.name || "").toString().trim();
      const intervals =
        row?.data?.iv ??
        row?.data?.intervals ??
        row?.data?.formula ??
        row?.formula ??
        row?.intervals;
      if(!slug || !name || !Array.isArray(intervals) || !intervals.length) return null;
      const iv = intervals.map(v => Number(v)).filter(v => Number.isFinite(v));
      if(!iv.length) return null;
      return { slug, name, iv };
    })
    .filter(Boolean);
}

async function loadChordData(){
  setDataSourceBadge("fallback");
  const candidates = [
    "/api/music.php?type=chord_formula&instrument=general"
  ];
  try {
    let rows = [];
    for(const url of candidates){
      const resp = await fetch(url, { credentials: "same-origin" });
      if(!resp.ok) continue;
      const payload = await resp.json();
      rows = normalizeApiRows(payload?.results);
      if(rows.length) break;
    }
    if(!rows.length) throw new Error("No valid rows from API");
    const nextQual = {};
    rows.forEach((row)=>{
      nextQual[row.slug] = { name: row.name, iv: row.iv };
    });
    QUAL = nextQual;
    setDataSourceBadge("live");
  } catch (_err){
    QUAL = { ...LOCAL_QUAL };
    setDataSourceBadge("fallback");
  }
}


// ===== UI builders =====
function buildSelectors(){
  const rootSel = document.getElementById("root");
  const qualSel = document.getElementById("qual");

  const ALL = [
    {n:"C",pc:0},{n:"C#/Db",pc:1},{n:"D",pc:2},{n:"D#/Eb",pc:3},
    {n:"E",pc:4},{n:"F",pc:5},{n:"F#/Gb",pc:6},{n:"G",pc:7},
    {n:"G#/Ab",pc:8},{n:"A",pc:9},{n:"A#/Bb",pc:10},{n:"B",pc:11}
  ];

  rootSel.innerHTML = "";
  ALL.forEach(it=>{
    const o=document.createElement("option");
    o.value=it.pc;
    o.textContent=it.n;
    rootSel.appendChild(o);
  });

  qualSel.innerHTML = "";
const ph = document.createElement("option");
ph.value = "";
ph.textContent = "— Select chord quality —";
ph.selected = true;
qualSel.appendChild(ph);


  QUAL_ORDER.forEach(k=>{
    const v = QUAL[k];
    if(!v) return;

    const allowed = isChordAllowed(k);
    const o = document.createElement("option");
    o.value = k;
    o.textContent = allowed ? v.name : `${v.name} (Pro)`;

    if(!allowed) o.classList.add("pro-option");

    qualSel.appendChild(o);
  });
}

// ===== Piano render =====
const WHITE_PCS=[0,2,4,5,7,9,11];
const BLACK_AFTER={0:1,2:3,4:null,5:6,7:8,9:10,11:null};

function renderOctave(oct){
  const octWrap=document.createElement("div");
  octWrap.className="oct";
  const whites=document.createElement("div");
  whites.className="whites";
  const blacks=document.createElement("div");
  blacks.className="blacks";

  for(let wi=0; wi<WHITE_PCS.length; wi++){
    const pc=WHITE_PCS[wi];
    const white=document.createElement("div");
    white.className="white";
    white.dataset.pc=pc; white.dataset.oct=oct;
    const midi=(oct+1)*12+pc; white.dataset.m=midi;

    if(pc===0){
      const lab=document.createElement("div");
      lab.className="lab";
      lab.textContent="C"+oct;
      white.appendChild(lab);
    }
    white.addEventListener("click",()=> onKey(midi));
    whites.appendChild(white);

    const bpc=BLACK_AFTER[pc];
    if(bpc!=null){
      const black=document.createElement("div");
      black.className="black";
      black.dataset.pc=bpc; black.dataset.oct=oct;
      const bm=(oct+1)*12+bpc; black.dataset.m=bm;
      black.style.left=((wi+1)*WHITE_W - (BLACK_W/2))+"px";
      black.addEventListener("click",()=> onKey(bm));
      blacks.appendChild(black);
    }
  }
  octWrap.appendChild(whites);
  octWrap.appendChild(blacks);
  return octWrap;
}

function renderTailC(oct){
  const octWrap=document.createElement("div");
  octWrap.className="oct tail";
  const whites=document.createElement("div");
  whites.className="whites";

  const white=document.createElement("div");
  white.className="white";
  white.dataset.pc=0; white.dataset.oct=oct;
  const midi=(oct+1)*12; // C of this octave
  white.dataset.m=midi;

  const lab=document.createElement("div");
  lab.className="lab";
  lab.textContent="C"+oct;
  white.appendChild(lab);

  white.addEventListener("click",()=> onKey(midi));
  whites.appendChild(white);
  octWrap.appendChild(whites);
  return octWrap;
}

function renderPiano(){
  const piano=document.getElementById("piano");
  piano.innerHTML="";
  const row=document.createElement("div");
  row.style.display="flex";
  row.style.gap="0px";
  row.style.justifyContent="center";

  [3,4,5].forEach(o=> row.appendChild(renderOctave(o)));
  // Tail key: top C (C6) without a full 4th octave
  row.appendChild(renderTailC(6));

  piano.appendChild(row);
}

// ===== Voicing helpers =====
function computeVoicing(order, anchorOct){
  if(!order.length) return [];
  const REF=(anchorOct+1)*12; // C_anchor (MIDI)
  const out=[]; const pc0=order[0];

  const below=REF - mod(REF - pc0, 12);
  const above=below + 12;
  const first=(Math.abs(REF-above) < Math.abs(REF-below)) ? above : below;
  out.push(first);

  for(let i=1;i<order.length;i++){
    const pc=order[i];
    const start=out[out.length-1]+1;
    const step=mod(pc-(start%12),12);
    out.push(start+step);
  }
  return out;
}

function clampRegister(){
  if(!voicingMidis.length) return 0;
  let shift=0;
  while(true){
    const low=voicingMidis[0], hi=voicingMidis[voicingMidis.length-1];
    let adjusted=false;
    if(low<MIN_MIDI){ voicingMidis=voicingMidis.map(m=>m+12); shift+=12; adjusted=true; }
    if(hi>MAX_MIDI){ voicingMidis=voicingMidis.map(m=>m-12); shift-=12; adjusted=true; }
    if(!adjusted) break;
  }
  return shift;
}

function recenterAroundAnchor(){
  if(!voicingMidis.length) return;
  const a=parseInt(document.getElementById("anchor").value,10)||4;
  const target=(a+1)*12;
  const med=voicingMidis[Math.floor(voicingMidis.length/2)];
  const delta=(med-target)/12;
  const oct=(delta>=0?Math.floor(delta):Math.ceil(delta));
  const shift=-12*oct;
  if(shift!==0) voicingMidis=voicingMidis.map(m=>m+shift);
}

// ===== Recognition =====
function candidateLabel(rootPc, qualKey){
  const suf = ({
    maj:"",
    min:"m",
    maj7:"maj7",
    m7:"m7",
    "7":"7",
    sus2:"sus2",
    sus4:"sus4",
    add9:"add9",
    "6":"6",
    m9:"m9",
    maj9:"maj9",
    "9":"9",
    "maj#11":"maj#11",
    maj13:"maj13",
    maj7add13:"maj7(add13)",
    maj9add13:"maj9(add13)",
    m11:"m11",
    m13:"m13",
    "11":"11",
    "13":"13",
    m7b5:"m7♭5"
  })[qualKey] || "";
  return pcName(rootPc)+suf;
}

function detectCandidates(pcs){
  const out=[];
  for(const [qKey, q] of Object.entries(QUAL)){
    for(let root=0; root<12; root++){
      const tmpl = new Set(q.iv.map(iv=> mod(root+iv,12)));
      let ok=true;
      for(const t of tmpl){
        if(!pcs.includes(t)) { ok=false; break; }
      }
      if(ok){
        out.push({rootPc:root, quality:qKey, size:tmpl.size, label:candidateLabel(root,qKey)});
      }
    }
  }
  return out;
}

function detectBestAndAlternates(pcs){
  const cands = detectCandidates(pcs);
  if(!cands.length) return null;
  const bassPc = voicingMidis.length ? mod(voicingMidis[0],12) : null;

  function rank(c){
    let r = c.size;
    if(bassPc!=null && c.rootPc===bassPc) r += 0.6;
    if(c.quality==="6" && bassPc!=null && c.rootPc!==bassPc) r -= 0.6;
    return r;
  }

  cands.sort((a,b)=> rank(b)-rank(a));
  return {best:cands[0], alts:cands.slice(1,6)};
}

// ===== Draw/update =====
function drawHighlights(active){
  const showB=document.getElementById("showBass").checked;
  const bass=voicingMidis.length? voicingMidis[0]: null;

  document.querySelectorAll(".white,.black").forEach(el=>{
    const pc=parseInt(el.dataset.pc,10);
    const oct=parseInt(el.dataset.oct,10);
    const midi=(oct+1)*12+pc;

    const on=active.has(midi);
    const isBass=showB && on && midi===bass;

    el.classList.toggle("active", on);
    el.classList.toggle("bass", isBass);

    let tag=el.querySelector(".mark");
    if(on){
      if(!tag){
        tag=document.createElement("div");
        tag.className="mark";
        el.appendChild(tag);
      }
      tag.textContent = pcName(pc)+oct;
    } else if(tag){
      tag.remove();
    }
  });
}

function drawBadges(active){
  const wrap=document.getElementById("voicingBadges");
  const list=[...active].sort((a,b)=>a-b);
  wrap.innerHTML=list.map(m=>`<span class='badge'>${noteName(m)}</span>`).join("");
}

function drawChordName(){
  const el=document.getElementById("chordName");
  if(!el) return;

  if(voicingMidis.length){
    const pcs=[...new Set(voicingMidis.map(m=> mod(m,12)))].sort((a,b)=>a-b);
    const bassPc=mod(voicingMidis[0],12);
    const cand = detectBestAndAlternates(pcs);

    if(cand && cand.best){
      let label = cand.best.label;
      if(bassPc!==cand.best.rootPc) label += "/"+pcName(bassPc);
      const alts = cand.alts && cand.alts.length
        ? "  ·  Alternatives: " + cand.alts.slice(0,3).map(x => (bassPc!==x.rootPc ? x.label + "/" + pcName(bassPc) : x.label)).join(", ")
        : "";
      el.textContent = `Detected: ${label}${alts}`;
      return;
    }
  }

  const r=parseInt(document.getElementById("root").value,10)||0;
  const q=document.getElementById("qual").value||"maj";
  const suf = ({
    maj:"",
    min:"m",
    maj7:"maj7",
    m7:"m7",
    "7":"7",
    sus2:"sus2",
    sus4:"sus4",
    add9:"add9",
    "6":"6",
    m9:"m9",
    maj9:"maj9",
    "9":"9",
    "maj#11":"maj#11",
    maj13:"maj13",
    maj7add13:"maj7(add13)",
    maj9add13:"maj9(add13)",
    m11:"m11",
    m13:"m13",
    "11":"11",
    "13":"13",
    m7b5:"m7♭5"
  })[q] || "";

  let label=pcName(r)+suf;
  if(voicingMidis.length){
    const bp=mod(voicingMidis[0],12);
    if(bp!==r) label += "/"+pcName(bp);
  }
  el.textContent=label;
}

function clampAndShow(){
  const showAll=document.getElementById("showAll").checked;
  const active=new Set();

  if(showAll){
    const pcs = new Set(voicingMidis.map(m=>mod(m,12)).concat(currentOrder));
    document.querySelectorAll(".white,.black").forEach(el=>{
      const pc=parseInt(el.dataset.pc,10);
      const oct=parseInt(el.dataset.oct,10);
      const m=(oct+1)*12+pc;
      if(pcs.has(pc)) active.add(m);
    });
  } else {
    voicingMidis.forEach(m=>active.add(m));
  }

  drawHighlights(active);
  drawBadges(active);
  drawChordName();
}

// ===== Interaction =====
function onKey(m){
  ping(m);
  const s=new Set(voicingMidis);
  if(s.has(m)) s.delete(m); else s.add(m);
  voicingMidis=[...s].sort((a,b)=>a-b);

  // Manual edits: no "invert base" concept
  baseVoicingMidis = null;
  lastInvertDir = null;
  lastMovedNote = null;
  updateInvertButtons();

  clampAndShow();
}

function invertUpArray(a){
  if(!a.length) return [];
  const b=[...a]; b[0]+=12; b.sort((x,y)=>x-y); return b;
}
function invertDownArray(a){
  if(!a.length) return [];
  const b=[...a]; b[b.length-1]-=12; b.sort((x,y)=>x-y); return b;
}

function invertUpAction(){
  if(!currentOrder.length) return;

  const pc=currentOrder.shift(); currentOrder.push(pc);

  if(voicingMidis.length){
    const movedBefore=voicingMidis[0];
    voicingMidis=invertUpArray(voicingMidis);
    const d=clampRegister();
    lastMovedNote=movedBefore+12+d;
  }

  updateInvertState("up");
  clampAndShow();
  playVoicing();
}

function invertDownAction(){
  if(!currentOrder.length) return;

  const pc=currentOrder.pop(); currentOrder.unshift(pc);

  if(voicingMidis.length){
    const movedBefore=voicingMidis[voicingMidis.length-1];
    voicingMidis=invertDownArray(voicingMidis);
    const d=clampRegister();
    lastMovedNote=movedBefore-12+d;
  }

  updateInvertState("down");
  clampAndShow();
  playVoicing();
}

function applyChord(shouldPlay=true){
  const r = parseInt(document.getElementById("root").value,10)||0;
  const q = document.getElementById("qual").value||"maj";
  const a = parseInt(document.getElementById("anchor").value,10)||4;
const proCard = document.getElementById("proCard");
if (proCard) proCard.style.display = "none";
if (!isChordAllowed(q)) {
  showProNotice(q);
  return;
}

  currentOrder = QUAL[q].iv.map(x=> mod(r+x,12));
  voicingMidis = computeVoicing(currentOrder,a);

  recenterAroundAnchor();
  clampRegister();

  // Set base voicing for "invert highlight logic"
  baseVoicingMidis = voicingMidis.slice();
  lastInvertDir = null;
  lastMovedNote = null;
  updateInvertButtons();

  clampAndShow();
  if(shouldPlay) playVoicing();
}

function clearAll(){
  voicingMidis=[];
  currentOrder=[];
  baseVoicingMidis=null;
  lastInvertDir=null;
  lastMovedNote=null;
  updateInvertButtons();
  clampAndShow();
}

// ===== Init =====
document.addEventListener("DOMContentLoaded",()=>{
  loadChordData().finally(buildSelectors);
  renderPiano();

  // Defaults – ingen auto-visning før «Spill»
  const rootSel=document.getElementById("root");
  const qualSel=document.getElementById("qual");
  const anchorSel=document.getElementById("anchor");
  if(rootSel) rootSel.value="0";
if(qualSel) qualSel.value="";
  if(anchorSel) anchorSel.value="4";

  // Bind UI
  if(sharpBtn && flatBtn){
    sharpBtn.addEventListener("click",()=>{ accPref="#"; updateAccidentalButtons(); clampAndShow(); });
    flatBtn.addEventListener("click",()=>{ accPref="b"; updateAccidentalButtons(); clampAndShow(); });
  }
  updateAccidentalButtons();
  updateInvertButtons();

  const playBtn=document.getElementById("play");
if(playBtn) playBtn.addEventListener("click", ()=>{
  const q = (document.getElementById("qual")?.value) || "maj";
  if(!isChordAllowed(q)) { showProNotice(q); return; }

  if(!voicingMidis.length) applyChord(false);
  playVoicing();
});

  if(invertUpBtn) invertUpBtn.addEventListener("click", invertUpAction);
  if(invertDownBtn) invertDownBtn.addEventListener("click", invertDownAction);

  const clearBtn=document.getElementById("clear");
  if(clearBtn) clearBtn.addEventListener("click", clearAll);

  const showAll=document.getElementById("showAll");
  if(showAll) showAll.addEventListener("change", clampAndShow);

  const showBass=document.getElementById("showBass");
  if(showBass) showBass.addEventListener("change", clampAndShow);

if(rootSel) rootSel.addEventListener("change", ()=>{
  const q = (qualSel && qualSel.value) || "";
  if(q) applyChord(false);
});

if(qualSel) qualSel.addEventListener("change", ()=>{
  const q = qualSel.value || "maj";

  if(!isChordAllowed(q)){
    showProNotice(q);
    qualSel.value = lastAllowedQual; // revert to last allowed
    return;
  }

  lastAllowedQual = q;
  applyChord(false);
});
if(anchorSel) anchorSel.addEventListener("change", ()=>{
  const q = (qualSel && qualSel.value) || "";
  if(q) applyChord(false);
});

  clampAndShow();
});
