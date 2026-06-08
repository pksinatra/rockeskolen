console.log("Rockeskolen Guitar Scales loaded");

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const TUNING = ["E", "A", "D", "G", "B", "E"];
const FRETS = 12;

const CL_IS_PRO = window.CL_IS_PRO === true;

const FREE_SCALE_KEYS = [
  "major",
  "nat_minor",
  "minor_pent",
  "major_pent",
  "pent_blues"
];

function isScaleAllowed(scaleKey){
  return CL_IS_PRO || FREE_SCALE_KEYS.includes(scaleKey);
}

const ENHARMONIC = {
  "Db": "C#",
  "Eb": "D#",
  "Gb": "F#",
  "Ab": "G#",
  "Bb": "A#"
};

const CAGED_MAP = {
  C: [0,3],
  A: [2,5],
  G: [5,7],
  E: [7,10],
  D: [9,12]
};
const CAGED_POSITIONS = {
  C: [-2, 2],
  A: [0, 4],
  G: [2, 6],
  E: [0, 4],
  D: [3, 7]
};
const CAGED_ORDER = ["C","A","G","E","D"];
const NOTE_NAMES_SHARP = {
  "C":"C","C#":"C#","D":"D","D#":"D#","E":"E","F":"F",
  "F#":"F#","G":"G","G#":"G#","A":"A","A#":"A#","B":"B"
};

const NOTE_NAMES_FLAT = {
  "C":"C","C#":"Db","D":"D","D#":"Eb","E":"E","F":"F",
  "F#":"Gb","G":"G","G#":"Ab","A":"A","A#":"Bb","B":"B"
};

let SCALE_DATA = {};
let SHOW_DEGREES = false;
let NOTE_STYLE = "#"; // "#" eller "b"

let viewMode = "full";

document.getElementById("viewMode").addEventListener("change", e=>{
  viewMode = e.target.value;
  updateScaleView();
});


/* ----------------------------
   DOM HELPERS
---------------------------- */

function $(id) {
  return document.getElementById(id);
}

function setStatus(message, isError = false) {
  console.log("STATUS HTML:", message);
  const el = $("statusText");
  if (!el) return;
  el.innerHTML = message;
  el.className = isError ? "error" : "";
}

/* ----------------------------
   LOAD SCALE DATABASE
---------------------------- */

async function loadScales() {
  // Fra /tools/scales/guitar/ til /data/scales.json = ../../../data/scales.json
  const url = "../../../data/scales.json";
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Klarte ikke å laste ${url} (${res.status})`);
  }

  const text = await res.text();

  try {
    SCALE_DATA = JSON.parse(text);
  } catch (err) {
    console.error("Ugyldig JSON i scales.json", err);
    console.log(text);
    throw new Error("scales.json er ikke gyldig JSON.");
  }

  if (!SCALE_DATA || typeof SCALE_DATA !== "object") {
    throw new Error("scales.json inneholder ikke et gyldig objekt.");
  }
}

/* ----------------------------
   NOTE HELPERS
---------------------------- */

function noteIndex(note) {
  return NOTES.indexOf(note);
}

function noteAt(stringNote, fret) {
  const idx = noteIndex(stringNote);
  return NOTES[(idx + fret) % 12];
}

function formatNote(note){
  if(NOTE_STYLE === "b"){
    return NOTE_NAMES_FLAT[note] || note;
  }
  return NOTE_NAMES_SHARP[note] || note;
}






function findRootOnString(root, stringNote){
  const idxRoot = noteIndex(root);
  const idxString = noteIndex(stringNote);

  for(let fret=0; fret<=12; fret++){
    const note = NOTES[(idxString + fret) % 12];
    if(note === root) return fret;
  }

  return 5;
}


/* ----------------------------
   SCALE HELPERS
---------------------------- */

function getScaleKeysSorted() {
  return Object.keys(SCALE_DATA).sort((a, b) => {
    const an = SCALE_DATA[a]?.name_no || SCALE_DATA[a]?.name || a;
    const bn = SCALE_DATA[b]?.name_no || SCALE_DATA[b]?.name || b;
    return an.localeCompare(bn, "no");
  });
}

function fillScaleSelect() {
  const select = $("scaleSelect");
  if (!select) return;

  select.innerHTML = "";

  const keys = getScaleKeysSorted();

  keys.forEach((key) => {
    const sc = SCALE_DATA[key];
    const opt = document.createElement("option");
    opt.value = key;
const name = sc.name_no || sc.name || key;

if (!isScaleAllowed(key)) {
  opt.textContent = name + " (PRO)";
  opt.disabled = false; // viktig: IKKE disable
  opt.classList.add("pro-option");
} else {
  opt.textContent = name;
}
    select.appendChild(opt);
  });


  // Foretrukket standardvalg
  if (SCALE_DATA.major) {
    select.value = "major";
  }
}

function getCagedForm(root){

  const rootFret = findRootFret(root);

  if(rootFret <= 1) return "E";
  if(rootFret <= 3) return "D";
  if(rootFret <= 5) return "C";
  if(rootFret <= 8) return "A";
  return "G";

}


function buildScale(root, scaleKey) {

  const scale = SCALE_DATA[scaleKey]; // ← DENNE MANGLER

  if (!scale || !Array.isArray(scale.intervals)) {
    return [];
  }

  const rootIdx = noteIndex(root);
  if (rootIdx < 0) return [];

  return scale.intervals.map((i) => NOTES[(rootIdx + i) % 12]);
}

function getCagedPosition(root){

  const rootFret = findRootFret(root);

  if(rootFret <= 1) return "E";
  if(rootFret <= 3) return "D";
  if(rootFret <= 5) return "C";
  if(rootFret <= 8) return "A";
  return "G";

}

/* ----------------------------
   SVG HELPERS
---------------------------- */

function createSvgEl(tag, attrs = {}, text = "") {
  const svgNS = "http://www.w3.org/2000/svg";
  const el = document.createElementNS(svgNS, tag);

  Object.entries(attrs).forEach(([k, v]) => {
    el.setAttribute(k, String(v));
  });

  if (text) el.textContent = text;
  return el;
}

function addInlays(svg, marginX, marginY, boardH, fretGap, fretStart, fretEnd) {

  const singleFrets = [3, 5, 7, 9, 15, 17, 19, 21];
  const doubleFrets = [12, 24];

  singleFrets.forEach((fret) => {

    if (fret < fretStart || fret > fretEnd) return;

    const cx = marginX + (fret - fretStart - 0.5) * fretGap;
    const cy = marginY + boardH / 2;

    svg.appendChild(createSvgEl("circle", {
      cx,
      cy,
      r: 7,
      class: "gs-inlay"
    }));
  });

  doubleFrets.forEach((fret) => {

    if (fret < fretStart || fret > fretEnd) return;

    const cx = marginX + (fret - fretStart - 0.5) * fretGap;

    svg.appendChild(createSvgEl("circle", {
      cx,
      cy: marginY + boardH * 0.33,
      r: 7,
      class: "gs-inlay"
    }));

    svg.appendChild(createSvgEl("circle", {
      cx,
      cy: marginY + boardH * 0.67,
      r: 7,
      class: "gs-inlay"
    }));
  });
}


function findRootFret(root){

  const lowE = "E";
  const idxRoot = noteIndex(root);
  const idxE = noteIndex(lowE);

  for(let fret=0; fret<=12; fret++){
    const note = NOTES[(idxE + fret) % 12];
    if(note === root) return fret;
  }

  return 0;
}
function renderScaleNotes(root, scale, scaleNotes){

  const el = $("scaleNotes");
  if(!el) return;

  if(!scaleNotes || !scaleNotes.length){
    el.innerHTML = "";
    return;
  }

  const notesStr = scaleNotes.map(n => formatNote(n)).join(" ");

  const displayRoot = formatNote(root);

el.innerHTML = `
  <strong>${displayRoot} ${scale.name_no || scale.name}</strong><br>
  Toner: ${notesStr}
`;
}

function toggleNoteStyle(){

  NOTE_STYLE = NOTE_STYLE === "#" ? "b" : "#";

  const btn = $("noteStyleBtn");
  if(btn){
    btn.textContent = NOTE_STYLE === "#" ? "Vis ♭" : "Vis ♯";
  }

  updateScaleView();
}


/* ----------------------------
   RENDER
---------------------------- */

function renderGuitar(root, scaleKey) {
  const wrap = $("guitarboard");
const scale = SCALE_DATA[scaleKey] || {};
let fretStart = 0;
let fretEnd = FRETS;
if(viewMode === "position"){
  fretStart = 3;
  fretEnd = 7;
}
if(!isScaleAllowed(scaleKey)){
  const scaleName = scale.name_no || scale.name;

  setStatus(`
  🔒 Skalaen ${formatNote(root)} ${scaleName} er tilgjengelig for VIP-medlemmer<br>
  <a href="/members/upgrade.php" style="color:#4dc3ff; font-weight:600;">
    Oppgrader til VIP
  </a>
  `);

wrap.innerHTML = `
  <div class="msg">
    🔒 Skalaen <strong>${formatNote(root)} ${scaleName}</strong> 
    er kun tilgjengelig for VIP-medlemmer<br><br>
    <a href="/members/upgrade.php" class="pro-cta pro-cta--promo">
      Bli VIP-medlem
    </a>
  </div>
`;

  return;
}


if(viewMode === "root"){
  // fra grunntone (lav E)
  const rootFret = findRootFret(root);
  fretStart = rootFret;
  fretEnd = rootFret + 4;
}

if(viewMode === "open"){
  // åpen posisjon
  fretStart = 0;
  fretEnd = 4;
}


  if (!wrap) return;


  if (!scale) {
    wrap.innerHTML = `<div class="msg error">Fant ikke skalaen: ${scaleKey}</div>`;
    return;
  }

  const scaleNotes = buildScale(root, scaleKey);
  // renderScaleNotes(root, scale, scaleNotes);

  const degreeMap = {};


  scaleNotes.forEach((note, i) => {
    degreeMap[note] = Array.isArray(scale.degrees) ? (scale.degrees[i] || "") : "";
  });

  const width = 1040;
  const height = 300;

  const marginX = 110;
  const marginY = 70;

  const boardW = 860;
  const boardH = 150;

  const visibleFrets = fretEnd - fretStart + 1;
  const fretGap = boardW / visibleFrets;
  const stringGap = boardH / 5;

  const svg = createSvgEl("svg", {
    viewBox: `-180 0 ${width + 180} ${height}`,
    class: "gscale-svg",
    "aria-label": "Gitarhals med skalavisning"
  });

  // Brett
  svg.appendChild(createSvgEl("rect", {
    x: marginX,
    y: marginY,
    width: boardW,
    height: boardH,
    rx: 16,
    class: "gs-board wood"
  }));

/* ----------------------------
   HEADSTOCK (real guitar style)
---------------------------- */

const hsX = marginX - 250;

const hsW = 270;
const hsH = boardH + 46;
const hsY = marginY - (hsH - boardH) / 2 + 10;
const STRING_WIDTH = [1.2,1.6,2,2.6,3.2,4];

// headstock shape
svg.appendChild(createSvgEl("path", {
  d: `
    M ${hsX+10} ${hsY}
    L ${hsX+hsW-20} ${hsY}
    Q ${hsX+hsW} ${hsY+20} ${hsX+hsW-20} ${hsY+20}
    L ${hsX+hsW-20} ${hsY+hsH-20}
    Q ${hsX+hsW-40} ${hsY+hsH} ${hsX+20} ${hsY+hsH-10}
    Q ${hsX-10} ${hsY+hsH/2} ${hsX+40} ${hsY}
    Z
  `,
  fill: "#5a2d12"
}));


/* ----------------------------
   TUNERS (3 top / 3 bottom)
---------------------------- */

const tunerSpacing = 45;

const tunerTop = [
  {x: hsX + 180, y: hsY + 14},
  {x: hsX + 120, y: hsY + 14},
  {x: hsX + 60,  y: hsY + 14}
];

const tunerBottom = [
  {x: hsX + 180, y: hsY + hsH - 30},
  {x: hsX + 120, y: hsY + hsH - 30},
  {x: hsX + 60,  y: hsY + hsH - 30}
];

[...tunerTop, ...tunerBottom].forEach((t)=>{
  svg.appendChild(createSvgEl("circle",{
    cx:t.x,
    cy:t.y,
    r:8,
    fill:"#ddd",
    stroke:"#333",
    "stroke-width":2.4
  }));
});



/* strings */

TUNING.slice().reverse().forEach((note,s)=>{

  const yNut = marginY + s * stringGap;

const tuner = s < 3
  ? tunerTop[s]
  : tunerBottom[2 - (s - 3)];

  svg.appendChild(createSvgEl("line",{
    x1:marginX,
    y1:yNut,
    x2:tuner.x,
    y2:tuner.y,
    stroke:"#cfcfcf",
    "stroke-width": STRING_WIDTH[s]
  }));

});

// nut
svg.appendChild(createSvgEl("rect",{
  x: marginX,
  y: marginY,
  width: 8,
  height: boardH,
  fill: "#eee"
}));

// Bånd
for (let f = fretStart; f <= fretEnd; f++) {
  const x = marginX + (f - fretStart) * fretGap;

  if (f > fretStart) {
    svg.appendChild(createSvgEl("line", {
      x1: x,
      x2: x,
      y1: marginY,
      y2: marginY + boardH,
      class: "gs-fret"
    }));
  }

  svg.appendChild(createSvgEl("text", {
    x: marginX + (f - fretStart + 0.5) * fretGap,
    y: marginY - 12,
    "text-anchor": "middle",
    class: "gs-fret-label"
  }, String(f)));
}
  // Strenger + strengnavn



TUNING.slice().reverse().forEach((stringNote, s) => {

  const y = marginY + s * stringGap;

  svg.appendChild(createSvgEl("line", {
    x1: marginX-5,
    x2: marginX + boardW,
    y1: y,
    y2: y,
    stroke:"#888",
    "stroke-width": STRING_WIDTH[s]
  }));

  svg.appendChild(createSvgEl("text", {
    x: marginX - 28,
    y: y + 4,
    "text-anchor": "middle",
    class: "gs-string-label"
  }, stringNote));

});

  // Inlays
  addInlays(svg, marginX, marginY, boardH, fretGap, fretStart, fretEnd);

  // Noter
TUNING.slice().reverse().forEach((stringNote, s) => {

  const y = marginY + s * stringGap;
  let notesOnString = 0;

  for (let fret = fretStart; fret <= fretEnd; fret++) {

    const note = noteAt(stringNote, fret);
    if (!scaleNotes.includes(note)) continue;

    if(viewMode === "position"){
      if(notesOnString >= 2) continue;
      notesOnString++;
    }

    const x = fret === 0
      ? marginX - 28
      : marginX + (fret - fretStart - 0.5) * fretGap;

    const isRoot = note === root;
    const displayNote = formatNote(note);
    const label = SHOW_DEGREES ? (degreeMap[note] || displayNote) : displayNote;

    const g = createSvgEl("g", {
      class: "gs-note-group"
    });

    g.appendChild(createSvgEl("circle", {
      cx: x,
      cy: y,
      r: fret === 0 ? 10 : 14,
      class: isRoot ? "gs-note root" : "gs-note"
    }));

    g.appendChild(createSvgEl("text", {
      x,
      y: y + 4,
      "text-anchor": "middle",
      class: "gs-note-text"
    }, label));

    svg.appendChild(g);
  }

});
  wrap.innerHTML = "";

const title = document.createElement("div");
title.className = "board-title";

const displayRoot = formatNote(root);

title.textContent = `${displayRoot} ${scale.name_no || scale.name}`;

wrap.appendChild(title);
wrap.appendChild(svg);

const notesStr = scaleNotes.map(n => formatNote(n)).join(" ");

setStatus(`🎸 ${displayRoot} ${scale.name_no || scale.name}  •  ${notesStr}`);

}

/* ----------------------------
   EVENTS
---------------------------- */



function updateScaleView() {
  const root = $("rootSelect")?.value || "C";
  const scaleKey = $("scaleSelect")?.value || "major";
  renderGuitar(root, scaleKey);
}

function toggleLabels() {
  SHOW_DEGREES = !SHOW_DEGREES;
  const btn = $("toggleLabelsBtn");
  if (btn) {
    btn.textContent = SHOW_DEGREES ? "Toner" : "Intervaller";
  }
  updateScaleView();
}

/* ----------------------------
   INIT
---------------------------- */

async function init() {
  try {
    setStatus("Laster skalaer...");
    await loadScales();
    fillScaleSelect();
$("noteStyleBtn")?.addEventListener("click", toggleNoteStyle);
    $("rootSelect")?.addEventListener("change", updateScaleView);
    $("scaleSelect")?.addEventListener("change", updateScaleView);
    $("toggleLabelsBtn")?.addEventListener("click", toggleLabels);

    updateScaleView();
  } catch (err) {
    console.error(err);
    const wrap = $("guitarboard");
    if (wrap) {
      wrap.innerHTML = `<div class="msg error">Kunne ikke laste skalaer. ${err.message}</div>`;
    }
    setStatus("Feil ved lasting av skalaer.", true);
  }
}

window.toggleLabels = toggleLabels;
window.addEventListener("DOMContentLoaded", init);