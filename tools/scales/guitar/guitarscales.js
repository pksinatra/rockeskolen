console.log("ChordLink Guitar Scales loaded");

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
let NOTE_STYLE = "#";

let viewMode = "full";
const TUNING_MIDI = [40, 45, 50, 55, 59, 64]; // E2 A2 D3 G3 B3 E4
const SAMPLE_ROOT = "/audio/guitars/acoustic/";
const SAMPLE_NOTE_NAMES = ["c","c#","d","d#","e","f","f#","g","g#","a","a#","b"];
let audioCtx = null;
const sampleBufferCache = new Map();
const activeAudioSources = new Set();
let playbackTimers = [];
let playbackRunId = 0;

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
  const url = "/tools/shared/music.php?type=scale";
  const res = await fetch(url, { cache: "no-store", credentials: "same-origin" });

  if (!res.ok) {
    throw new Error(`Failed to load ${url} (${res.status})`);
  }

  const payload = await res.json();
  if (!payload?.success || !Array.isArray(payload.results)) {
    throw new Error("API returned an invalid scale payload.");
  }

  SCALE_DATA = {};
  for (const row of payload.results) {
    const key = row.slug || row.name;
    if (!key || !row.data) continue;
    SCALE_DATA[key] = {
      name: row.name,
      name_no: row.name,
      intervals: row.data.intervals || row.data.steps || [],
      ...row.data
    };
  }

  if (!Object.keys(SCALE_DATA).length) {
    throw new Error("No scales found in music API.");
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

function midiToFreq(midi){
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function midiToSampleName(midi){
  const note = SAMPLE_NOTE_NAMES[(midi + 1200) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${note}${octave}.mp3`;
}

async function ensureAudioContext(){
  if(!audioCtx){
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if(audioCtx.state === "suspended"){
    await audioCtx.resume();
  }
  return audioCtx;
}

function getGuitarSampleUrl(midi){
  return SAMPLE_ROOT + encodeURIComponent(midiToSampleName(midi));
}

function loadGuitarSample(midi){
  const url = getGuitarSampleUrl(midi);
  if(!sampleBufferCache.has(url)){
    const loading = fetch(url, { cache: "force-cache" })
      .then(response => {
        if(!response.ok){
          throw new Error(`Could not load guitar sample (${response.status}): ${url}`);
        }
        return response.arrayBuffer();
      })
      .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
      .catch(error => {
        sampleBufferCache.delete(url);
        throw error;
      });
    sampleBufferCache.set(url, loading);
  }
  return sampleBufferCache.get(url);
}

function clearPlayback(){
  playbackRunId += 1;
  playbackTimers.forEach(timer => window.clearTimeout(timer));
  playbackTimers = [];
  activeAudioSources.forEach(source => {
    try {
      source.stop();
    } catch (error) {}
  });
  activeAudioSources.clear();
  document.querySelectorAll(".gs-note-group.is-playing").forEach(el => {
    el.classList.remove("is-playing");
  });
  document.querySelectorAll('.gs-string[data-playing="true"]').forEach(el => {
    el.dataset.playing = "false";
  });
  return playbackRunId;
}

function scheduleGuitarSample(buffer, time, volume){
  const source = audioCtx.createBufferSource();
  const gain = audioCtx.createGain();
  source.buffer = buffer;
  gain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), time);
  source.connect(gain).connect(audioCtx.destination);
  activeAudioSources.add(source);
  source.addEventListener("ended", () => activeAudioSources.delete(source), { once: true });
  source.start(time);
}

function scheduleSynthTone(midi, time, toneSeconds, cfg){
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = cfg.wave === "acoustic_guitar" ? "triangle" : cfg.wave;
  osc.frequency.value = midiToFreq(midi);
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(0.2 * cfg.volume, time + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0008, time + toneSeconds);
  osc.connect(gain).connect(audioCtx.destination);
  activeAudioSources.add(osc);
  osc.addEventListener("ended", () => activeAudioSources.delete(osc), { once: true });
  osc.start(time);
  osc.stop(time + toneSeconds + 0.03);
}

function getAudioCfg(){
  return {
    wave: $("soundType")?.value || "acoustic_guitar",
    sustain: 0.85,
    volume: 0.82,
    drive: 0
  };
}

function getOctaveCount(){
  return Math.max(1, Math.min(2, Number($("octaveCount")?.value || 1)));
}

function getScaleTempo(){
  return Math.max(50, Math.min(220, Number($("scaleTempo")?.value || 120)));
}

function getScaleStepSeconds(){
  return 60 / getScaleTempo() / 2;
}

function updateTempoLabel(){
  const el = $("tempoValue");
  if(el){
    el.textContent = `${getScaleTempo()} BPM`;
  }
}

function rootMidiCandidates(root){
  const rootIdx = noteIndex(root);
  const out = [];
  TUNING_MIDI.forEach((base, stringIndex) => {
    for(let fret = 0; fret <= FRETS; fret++){
      if((base + fret) % 12 === rootIdx){
        out.push({ midi: base + fret, stringIndex, fret });
      }
    }
  });
  return out.sort((a, b) => (a.midi - b.midi) || (a.fret - b.fret) || (b.stringIndex - a.stringIndex));
}

function positionsForMidi(midi){
  const out = [];
  TUNING_MIDI.forEach((base, stringIndex) => {
    const fret = midi - base;
    if(fret >= 0 && fret <= FRETS){
      out.push({ midi, stringIndex, fret });
    }
  });
  return out;
}

function positionScore(pos, previous){
  let score = pos.fret * 2;
  if(pos.fret === 0) score -= 5;
  if(previous){
    score += Math.abs(pos.fret - previous.fret) * 3;
    score += Math.abs(pos.stringIndex - previous.stringIndex) * 1.4;
    if(pos.stringIndex < previous.stringIndex) score += 5;
  }
  return score;
}

function choosePosition(midi, previous){
  return positionsForMidi(midi).sort((a, b) => positionScore(a, previous) - positionScore(b, previous))[0] || null;
}

function buildScaleRun(root, scaleKey, octaveCount = 1){
  const scale = SCALE_DATA[scaleKey];
  if(!scale || !Array.isArray(scale.intervals)) return [];

  const starts = rootMidiCandidates(root);
  const start = starts.find(p => p.fret <= 5) || starts[0];
  if(!start) return [];

  const intervals = scale.intervals.slice().sort((a, b) => a - b);
  const targets = [];
  for(let octave = 0; octave < octaveCount; octave++){
    intervals.forEach(interval => targets.push(start.midi + octave * 12 + interval));
  }
  targets.push(start.midi + octaveCount * 12);

  const run = [];
  let previous = null;
  targets.forEach((midi, idx) => {
    const pos = idx === 0 ? start : choosePosition(midi, previous);
    if(pos){
      run.push({ ...pos, note: NOTES[(midi + 1200) % 12] });
      previous = pos;
    }
  });
  return run;
}

function highlightScalePosition(pos, durationMs = 170){
  const selector = `.gs-note-group[data-string="${pos.stringIndex}"][data-fret="${pos.fret}"]`;
  const el = document.querySelector(selector);
  if(!el) return;
  const stringEl = document.querySelector(`.gs-string[data-string="${pos.stringIndex}"]`);
  el.classList.add("is-playing");
  if(stringEl) stringEl.dataset.playing = "true";
  window.setTimeout(() => {
    el.classList.remove("is-playing");
    if(stringEl) stringEl.dataset.playing = "false";
  }, durationMs);
}

async function playScale(){
  const root = $("rootSelect")?.value || "C";
  const scaleKey = $("scaleSelect")?.value || "major";
  const run = buildScaleRun(root, scaleKey, getOctaveCount());
  if(!run.length) return;

  const cfg = getAudioCfg();
  const runId = clearPlayback();

  try {
    await ensureAudioContext();
    const sampleBuffers = cfg.wave === "acoustic_guitar"
      ? await Promise.all(run.map(pos => loadGuitarSample(pos.midi)))
      : [];

    if(runId !== playbackRunId) return;
    await ensureAudioContext();

    const t0 = audioCtx.currentTime + 0.08;
    const stepSeconds = getScaleStepSeconds();
    const toneSeconds = Math.max(0.08, Math.min(cfg.sustain, stepSeconds * 1.6));
    run.forEach((pos, i) => {
      const time = t0 + i * stepSeconds;
      const delayMs = Math.max(0, (time - audioCtx.currentTime) * 1000);
      const timer = window.setTimeout(() => {
        if(runId === playbackRunId){
          highlightScalePosition(pos, Math.min(220, stepSeconds * 800));
        }
      }, delayMs);
      playbackTimers.push(timer);

      if(cfg.wave === "acoustic_guitar"){
        scheduleGuitarSample(sampleBuffers[i], time, cfg.volume);
      } else {
        scheduleSynthTone(pos.midi, time, toneSeconds, cfg);
      }
    });
  } catch (error) {
    if(runId !== playbackRunId) return;
    console.error("Could not play guitar scale:", error);
    setStatus("Could not load the guitar sound. Try another sound type.", true);
  }
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
    return an.localeCompare(bn, "en");
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
      opt.disabled = false;
      opt.classList.add("pro-option");
    } else {
      opt.textContent = name;
    }
    select.appendChild(opt);
  });


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

  const scale = SCALE_DATA[scaleKey];

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
    Notes: ${notesStr}
  `;
}

function toggleNoteStyle(){

  NOTE_STYLE = NOTE_STYLE === "#" ? "b" : "#";

  const btn = $("noteStyleBtn");
  if(btn){
    btn.textContent = NOTE_STYLE === "#" ? "Show ♭" : "Show ♯";
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
  🔒 The ${formatNote(root)} ${scaleName} scale is available for Pro members<br>
  <a href="/members/upgrade.php" target="_top" style="color:#4dc3ff; font-weight:600;">
    Upgrade to Pro
  </a>
  `);

wrap.innerHTML = `
  <div class="msg">
    🔒 The <strong>${formatNote(root)} ${scaleName}</strong> scale
    is only available for Pro members<br><br>
    <a href="/members/upgrade.php" target="_top" class="pro-cta pro-cta--promo">
      Upgrade to Pro
    </a>
  </div>
`;

  return;
}


if(viewMode === "root"){
  const rootFret = findRootFret(root);
  fretStart = rootFret;
  fretEnd = rootFret + 4;
}

if(viewMode === "open"){
  fretStart = 0;
  fretEnd = 4;
}

  if (!wrap) return;


  if (!scale) {
    wrap.innerHTML = `<div class="msg error">Could not find scale: ${scaleKey}</div>`;
    return;
  }

  const scaleNotes = buildScale(root, scaleKey);
  // renderScaleNotes(root, scale, scaleNotes);

  const degreeMap = {};


  scaleNotes.forEach((note, i) => {
    degreeMap[note] = Array.isArray(scale.degrees) ? (scale.degrees[i] || "") : "";
  });

  const width = 960;
  const height = 270;
  const marginX = 64;
  const marginY = 46;
  const boardW = width - marginX - 34;
  const boardH = 166;
  const nutWidth = 10;

  const visibleFrets = fretEnd - fretStart + 1;
  const fretGap = boardW / visibleFrets;
  const stringGap = boardH / 5;

  const svg = createSvgEl("svg", {
    viewBox: `0 0 ${width} ${height}`,
    class: "gscale-svg",
    "aria-label": "Guitar neck with scale view"
  });

  const defs = createSvgEl("defs");
  const boardGradient = createSvgEl("linearGradient", {
    id: "clScaleBoardGradient",
    x1: "0",
    x2: "1",
    y1: "0",
    y2: "1"
  });
  [
    ["0%", "#1b2a42"],
    ["42%", "#111b2b"],
    ["100%", "#080d16"]
  ].forEach(([offset, color]) => {
    boardGradient.appendChild(createSvgEl("stop", {
      offset,
      "stop-color": color
    }));
  });
  defs.appendChild(boardGradient);

  const noteGradient = createSvgEl("linearGradient", {
    id: "clScaleNoteGradient",
    x1: "0", y1: "0", x2: "1", y2: "1"
  });
  [["0%", "#dffaff"], ["32%", "#59e0ff"], ["100%", "#1667d8"]].forEach(([offset, color]) => {
    noteGradient.appendChild(createSvgEl("stop", { offset, "stop-color": color }));
  });
  defs.appendChild(noteGradient);

  const rootGradient = createSvgEl("linearGradient", {
    id: "clScaleRootGradient",
    x1: "0", y1: "0", x2: "1", y2: "1"
  });
  [["0%", "#ffe8f2"], ["30%", "#ff6b86"], ["100%", "#a347ff"]].forEach(([offset, color]) => {
    rootGradient.appendChild(createSvgEl("stop", { offset, "stop-color": color }));
  });
  defs.appendChild(rootGradient);
  svg.appendChild(defs);

  // Board
  svg.appendChild(createSvgEl("rect", {
    x: marginX,
    y: marginY,
    width: boardW,
    height: boardH,
    rx: 18,
    class: "gs-board wood",
    fill: "url(#clScaleBoardGradient)"
  }));

const STRING_WIDTH = [1.15, 1.55, 2.05, 2.6, 3.1, 3.6];

// nut
svg.appendChild(createSvgEl("rect",{
  x: marginX - nutWidth,
  y: marginY,
  width: nutWidth,
  height: boardH,
  rx: 4,
  fill: "#9ca3af",
  class: "gs-nut"
}));

// Frets
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
  // Strings and string names



TUNING.slice().reverse().forEach((stringNote, s) => {

  const y = marginY + s * stringGap;
  const stringIndex = 5 - s;

  svg.appendChild(createSvgEl("line", {
    x1: marginX - nutWidth,
    x2: marginX + boardW,
    y1: y,
    y2: y,
    stroke:"#6b7280",
    "stroke-width": STRING_WIDTH[s],
    class: "gs-string",
    "data-string": stringIndex
  }));

  svg.appendChild(createSvgEl("text", {
    x: marginX - 36,
    y: y + 4,
    "text-anchor": "middle",
    class: "gs-string-label"
  }, stringNote));

});

  // Inlays
  addInlays(svg, marginX, marginY, boardH, fretGap, fretStart, fretEnd);

  // Notes
TUNING.slice().reverse().forEach((stringNote, s) => {

  const y = marginY + s * stringGap;
  const stringIndex = 5 - s;
  let notesOnString = 0;

  for (let fret = fretStart; fret <= fretEnd; fret++) {

    const note = noteAt(stringNote, fret);
    if (!scaleNotes.includes(note)) continue;

    if(viewMode === "position"){
      if(notesOnString >= 2) continue;
      notesOnString++;
    }

    const x = fret === 0
      ? marginX - 36
      : marginX + (fret - fretStart - 0.5) * fretGap;

    const isRoot = note === root;
    const displayNote = formatNote(note);
    const label = SHOW_DEGREES ? (degreeMap[note] || displayNote) : displayNote;

    const g = createSvgEl("g", {
      class: "gs-note-group",
      "data-string": stringIndex,
      "data-fret": fret
    });

    const noteRadius = fret === 0 ? 8.5 : 11.5;
    g.appendChild(createSvgEl("circle", {
      cx: x,
      cy: y,
      r: noteRadius,
      class: isRoot ? "gs-note root" : "gs-note"
    }));

    g.appendChild(createSvgEl("ellipse", {
      cx: x - noteRadius * 0.2,
      cy: y - noteRadius * 0.34,
      rx: noteRadius * 0.45,
      ry: Math.max(1.6, noteRadius * 0.16),
      class: "gs-note-gloss"
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
    btn.textContent = SHOW_DEGREES ? "Notes" : "Intervals";
  }
  updateScaleView();
}

/* ----------------------------
   INIT
---------------------------- */

async function init() {
  try {
    setStatus("Loading scales...");
    await loadScales();
    fillScaleSelect();
$("noteStyleBtn")?.addEventListener("click", toggleNoteStyle);
    $("rootSelect")?.addEventListener("change", updateScaleView);
    $("scaleSelect")?.addEventListener("change", updateScaleView);
    $("octaveCount")?.addEventListener("change", updateScaleView);
    $("scaleTempo")?.addEventListener("input", updateTempoLabel);
    $("toggleLabelsBtn")?.addEventListener("click", toggleLabels);
    $("playScaleBtn")?.addEventListener("click", playScale);

    updateTempoLabel();
    updateScaleView();
  } catch (err) {
    console.error(err);
    const wrap = $("guitarboard");
    if (wrap) {
      wrap.innerHTML = `<div class="msg error">Could not load scales. ${err.message}</div>`;
    }
    setStatus("Could not load scales.", true);
  }
}

window.toggleLabels = toggleLabels;
window.addEventListener("DOMContentLoaded", init);
