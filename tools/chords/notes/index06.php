<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Akkordvisning</title>
<script src="https://cdn.jsdelivr.net/npm/vexflow@4.1.0/build/cjs/vexflow.js"></script>
<script src="https://cdn.jsdelivr.net/npm/tone@14.7.77/build/Tone.js"></script>
<style>
body {
  font-family: system-ui, -apple-system, sans-serif;
  padding: 40px;
  background: linear-gradient(135deg, #0c1220, #111827);
  color: #e5e7eb;
}
.white-key {
  width: 48px;
  height: 140px;
  background: linear-gradient(to bottom, #ffffff 0%, #e5e7eb 100%);
  border: 1px solid #d1d5db;
  border-radius: 0 0 8px 8px;
  position: relative;
}

.black-key {
  position: absolute;
  top: 0;
  width: 32px;
  height: 90px;
  background: linear-gradient(to bottom, #111 0%, #000 100%);
  border-radius: 0 0 6px 6px;
  box-shadow: 0 6px 10px rgba(0,0,0,0.8);
  z-index: 5;
}

.active-white {
  background: linear-gradient(to bottom, #f43f5e, #be123c);
  box-shadow: 0 0 20px rgba(244,63,94,0.6);
}

.active-black {
  background: linear-gradient(to bottom, #f43f5e, #9f1239);
  box-shadow: 0 0 20px rgba(244,63,94,0.7);
}

.keyboard {
  position: relative;
  width: 720px; /* 48 * 15 */
  height: 140px;
}
.app {
  max-width: 1100px;
  margin: 0 auto;
  padding-top: 40px;
}

h2 {
  margin-bottom: 20px;
}

.controls {
  display: flex;
  gap: 12px;
  margin-bottom: 30px;
}

.notation-row {
  margin-bottom: 40px;
}

.notation-wrapper {
  width: 320px;
  background: white;
  border-radius: 20px;
  padding: 18px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
}

.notation-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}

.piano-row {
  margin-bottom: 40px;
}

#piano {
  width: 100%;
  max-width: 900px;
  padding: 20px 0;
  border-radius: 20px;
  background: rgba(255,255,255,0.05);
  backdrop-filter: blur(10px);
}

.button-row {
  margin-top: 20px;
}

.chord-buttons {
  display: flex;
  gap: 20px;
}
</style>
</head>

<body>
<div class="app">
  <h2>Akkordvisning</h2>

  <div class="controls">
<select id="root">
  <option>C</option><option>C#</option><option>Db</option>
  <option>D</option><option>Eb</option><option>E</option>
  <option>F</option><option>F#</option><option>Gb</option>
  <option>G</option><option>Ab</option><option>A</option>
  <option>Bb</option><option>B</option>
</select>

<select id="type">
  <option value="maj">Dur</option>
  <option value="min">Moll</option>
  <option value="dim">Dim</option>
  <option value="aug">Aug</option>
  <option value="7">7</option>
  <option value="maj7">Maj7</option>
  <option value="min7">m7</option>
  <option value="m7b5">m7b5</option>
  <option value="dim7">dim7</option>
  <option value="sus2">sus2</option>
  <option value="sus4">sus4</option>
  <option value="6">6</option>
  <option value="min6">m6</option>
  <option value="add9">add9</option>
  <option value="13">13</option>
</select>
  </div>

  <div class="notation-row">
    <div class="notation-wrapper">
      <div class="notation-header">
        <button id="toggleNotation"></button>
      </div>
      <div id="notation"></div>
    </div>
  </div>

  <div class="piano-row">
    <div id="piano"></div>
  </div>

  <div class="button-row">
    <div class="chord-buttons">
      <button onclick="playChord()">Spill akkord</button>
      <button onclick="playArpeggio()">Arpeggio</button>
    </div>
  </div>
</div>

<script>

const rootSelect = document.getElementById("root");
const typeSelect = document.getElementById("type");

const LETTERS = ["C","D","E","F","G","A","B"];
const NATURAL_PC = { C:0,D:2,E:4,F:5,G:7,A:9,B:11 };

const MAJOR_KEYS = {
  "C":"C","G":"G","D":"D","A":"A","E":"E","B":"B","F#":"F#","C#":"C#",
  "F":"F","Bb":"Bb","Eb":"Eb","Ab":"Ab","Db":"Db","Gb":"Gb","Cb":"Cb"
};

const MINOR_REL = {
  "A":"C","E":"G","B":"D","F#":"A","C#":"E",
  "D":"F","G":"Bb","C":"Eb","F":"Ab","Bb":"Db","Eb":"Gb","Ab":"Cb"
};

const whiteOrder = [
  "C","D","E","F","G","A","B",
  "C","D","E","F","G","A","B",
  "C"
];

const SHARP_ORDER = ["F","C","G","D","A","E","B"];
const FLAT_ORDER  = ["B","E","A","D","G","C","F"];

const synth = new Tone.PolySynth(Tone.Synth).toDestination();

const CHORD_TYPES = {
  "maj":  { intervals:[0,4,7],        degrees:[0,2,4] },
  "min":  { intervals:[0,3,7],        degrees:[0,2,4] },
  "dim":  { intervals:[0,3,6],        degrees:[0,2,4] },
  "aug":  { intervals:[0,4,8],        degrees:[0,2,4] },
  "7":    { intervals:[0,4,7,10],     degrees:[0,2,4,6] },
  "maj7": { intervals:[0,4,7,11],     degrees:[0,2,4,6] },
  "min7": { intervals:[0,3,7,10],     degrees:[0,2,4,6] },
  "m7b5": { intervals:[0,3,6,10],     degrees:[0,2,4,6] },
  "dim7": { intervals:[0,3,6,9],      degrees:[0,2,4,6] },
  "sus2": { intervals:[0,2,7],        degrees:[0,1,4] },
  "sus4": { intervals:[0,5,7],        degrees:[0,3,4] },
  "6":    { intervals:[0,4,7,9],      degrees:[0,2,4,5] },
  "min6": { intervals:[0,3,7,9],      degrees:[0,2,4,5] },
"13":   { intervals:[0,4,7,10,14,17,21], degrees:[0,2,4,6,1,3,5] },
"add9": { intervals:[0,4,7,14], degrees:[0,2,4,1] }  
};

let octave = 4;

let displayMode = "chord"; // "chord" eller "arpeggio"

const urlParams = new URLSearchParams(window.location.search);

let useKeySignature = urlParams.get("mode") !== "absolute";

const toggleBtn = document.getElementById("toggleNotation");

function updateToggleLabel() {
  toggleBtn.textContent = useKeySignature
    ? "Vis kun løse fortegn"
    : "Vis faste fortegn";
}

toggleBtn.onclick = function() {

  useKeySignature = !useKeySignature;

  const url = new URL(window.location);
  url.searchParams.set("mode", useKeySignature ? "key" : "absolute");
  window.history.replaceState(null, "", url);

  updateToggleLabel();
  render();
};


function keySigMap(key){
  const sharps = ["C","G","D","A","E","B","F#","C#"];
  const flats  = ["C","F","Bb","Eb","Ab","Db","Gb","Cb"];
  const map = {};
  const si = sharps.indexOf(key);
  if(si>=0){ for(let i=0;i<si;i++) map[SHARP_ORDER[i]]="#"; return map; }
  const fi = flats.indexOf(key);
  if(fi>=0){ for(let i=0;i<fi;i++) map[FLAT_ORDER[i]]="b"; return map; }
  return map;
}

function parse(n){ return {l:n[0], a:n.slice(1)}; }

function pc(n){
  const p = parse(n);
  let delta = 0;

  // støtt bb / ## og blandede strenger
  for (const ch of p.a) {
    if (ch === "#") delta += 1;
    if (ch === "b") delta -= 1;
    if (ch === "n") delta += 0; // (n) brukes ikke her, men ok å ha
  }

  return (NATURAL_PC[p.l] + delta + 120) % 12;
}

function spell(root,type){

  const rootPC = pc(root);
  const rootLetter = root[0];
  const rootIndex = LETTERS.indexOf(rootLetter);

  const chordData = CHORD_TYPES[type] || CHORD_TYPES["maj"];
  const intervals = chordData.intervals;
  const letters   = chordData.degrees;

  return intervals.map((interval, i)=>{
    const target = (rootPC + interval) % 12;
    const letter = LETTERS[(rootIndex + letters[i]) % 7];
    const base = NATURAL_PC[letter];

    let diff = (target - base + 12) % 12;
    if(diff > 6) diff -= 12;

    if (diff === 0) return letter;
    if (diff === 1) return letter + "#";
    if (diff === 2) return letter + "##";
    if (diff === -1) return letter + "b";
    if (diff === -2) return letter + "bb";
    return letter; // fallback (burde sjelden skje nå)
  });
}

function getParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    root: params.get("root"),
    type: params.get("type")
  };
}
function parseChordString(chordStr) {

  if (!chordStr) return null;

  const match = chordStr.match(/^([A-G][b#]?)(.*)$/);
  if (!match) return null;

  const root = match[1];
  let rawType = match[2] || "";

  rawType = rawType.toLowerCase();

  const typeMap = {
    "": "maj",
    "m": "min",
    "min": "min",
    "maj": "maj",
    "maj7": "maj7",
    "m7": "min7",
    "min7": "min7",
    "7": "7",
    "dim": "dim",
    "dim7": "dim7",
    "m7b5": "m7b5",
    "aug": "aug",
    "sus2": "sus2",
    "sus4": "sus4",
    "6": "6",
    "m6": "min6",
    "13": "13",
    "add9": "add9",
    "min6": "min6"
  };

  const type = typeMap[rawType];

  if (!type) return null;

  return { root, type };
}

function getKey(root, type) {
  return root;
}

function buildVoicing(notes) {

  const midiNotes = [];
  const vexKeys = [];
  let prevMidi = -9999;

  const baseOctave = 4;

  for (const n of notes) {

    const notePC = pc(n);
    let midi = (baseOctave * 12) + notePC;

    while (midi <= prevMidi) midi += 12;

    prevMidi = midi;
    midiNotes.push(midi);
  }

  for (let i = 0; i < midiNotes.length; i++) {
    vexKeys.push(
      notes[i][0].toLowerCase() + "/" + Math.floor(midiNotes[i] / 12)
    );
  }

  return { midiNotes, vexKeys };
}


function render(){
  const root=rootSelect.value;
  const type=typeSelect.value;
  const notes=spell(root,type);
  const key=getKey(root,type);

const chordString = root + (
  type === "maj" ? "" :
  type === "min" ? "m" :
  type === "min7" ? "m7" :
  type
);

const url = new URL(window.location);
url.searchParams.set("chord", chordString);
window.history.replaceState(null, "", url);

  document.getElementById("notation").innerHTML="";
  const renderer=new Vex.Flow.Renderer(
    document.getElementById("notation"),
    Vex.Flow.Renderer.Backends.SVG
  );
  renderer.resize(260,150);
  const ctx=renderer.getContext();
  const staveWidth = useKeySignature ? 180 : 220;
const stave = new Vex.Flow.Stave(10, 20, staveWidth);
stave.addClef("treble");

if (useKeySignature) {
  stave.addKeySignature(key);
}

stave.setContext(ctx).draw();

  const ks=keySigMap(key);
// Sjekk om tonearten faktisk har faste fortegn
const hasKeySignature = Object.keys(ks).length > 0;

if (!hasKeySignature) {
  useKeySignature = false;            // Tving absolutt modus
  toggleBtn.style.display = "none";   // Skjul knapp
} else {
  toggleBtn.style.display = "inline-block";
}

updateToggleLabel();

const { midiNotes, vexKeys } = buildVoicing(notes, 48, 72);


let staveNotes = [];

if (displayMode === "chord") {

const midIndex = Math.floor(midiNotes.length / 2);
const midMidi = midiNotes[midIndex];

const chord = new Vex.Flow.StaveNote({
  clef: "treble",
  keys: vexKeys,
  duration: "h",
  stem_direction: midMidi >= 71
    ? Vex.Flow.Stem.DOWN
    : Vex.Flow.Stem.UP
});

  notes.forEach((n,i)=>{
    const p = parse(n);

    if (useKeySignature) {
      const inKey = ks[p.l] || "";

      if (p.a !== inKey) {
        chord.addModifier(
          new Vex.Flow.Accidental(p.a === "" ? "n" : p.a),
          i
        );
      }
    } else {
      if (p.a !== "") {
        chord.addModifier(new Vex.Flow.Accidental(p.a), i);
      }
    }
  });

  staveNotes.push(chord);

} else {

  notes.forEach((n, i) => {

const single = new Vex.Flow.StaveNote({
  clef: "treble",
  keys: [vexKeys[i]],
  duration: "8",
  stem_direction: midiNotes[i] >= 71
    ? Vex.Flow.Stem.DOWN
    : Vex.Flow.Stem.UP
});
    const p = parse(n);

    if (useKeySignature) {
      const inKey = ks[p.l] || "";
      if (p.a !== inKey) {
        single.addModifier(
          new Vex.Flow.Accidental(p.a === "" ? "n" : p.a),
          0
        );
      }
    } else {
      if (p.a !== "") {
        single.addModifier(new Vex.Flow.Accidental(p.a), 0);
      }
    }

    staveNotes.push(single);
  });
}

const voice = new Vex.Flow.Voice({
  num_beats: displayMode === "chord" ? 2 : staveNotes.length,
  beat_value: displayMode === "chord" ? 4 : 8
});

voice.addTickables(staveNotes);

const formatter = new Vex.Flow.Formatter();

formatter.joinVoices([voice]);

formatter.formatToStave([voice], stave, {
  align_rests: false
});
  voice.draw(ctx,stave);

  // Piano
// ============================
// Piano FAST: C4 -> C6
// ============================

const piano = document.getElementById("piano");
piano.innerHTML = "";

const keyboard = document.createElement("div");
keyboard.className = "keyboard";
piano.appendChild(keyboard);

// Hvite tangenter C4 til C6
const whiteOrder = [
  "C","D","E","F","G","A","B",  // C4–B4
  "C","D","E","F","G","A","B",  // C5–B5
  "C"                           // C6
];

let octave = 4;
let whiteIndex = 0;

whiteOrder.forEach((note) => {

  if (note === "C" && whiteIndex !== 0) octave++;

  const white = document.createElement("div");
  white.className = "white-key";

  white.style.position = "absolute";
  white.style.left = (whiteIndex * 48) + "px";

  const whiteMidi = (octave * 12) + NATURAL_PC[note];

  if (midiNotes.includes(whiteMidi)) {
    white.classList.add("active-white");
  }

  keyboard.appendChild(white);

  // Sorte tangenter
  if (note !== "E" && note !== "B") {

    const black = document.createElement("div");
    black.className = "black-key";

    const sharpMidi = whiteMidi + 1;

    if (midiNotes.includes(sharpMidi)) {
      black.classList.add("active-black");
    }

    black.style.left = (whiteIndex * 48 + 32) + "px";

    keyboard.appendChild(black);
  }

  whiteIndex++;
});
}
// ============================
// Generer MIDI-noter (samme stacking som notasjon)
// ============================




// RENDER FERDIG?

// ============================
// Generer MIDI-noter (samme stacking som notasjon)
// ============================
function getMidiNotes() {

  const root = rootSelect.value;
  const type = typeSelect.value;
  const notes = spell(root, type);

  let prevMidi = -9999;
  const midiNotes = [];

  for (const n of notes) {
    const notePC = pc(n);
    let octave = 4;
    let midi = (octave * 12) + notePC;

    if (midi <= prevMidi) {
      octave += 1;
      midi = (octave * 12) + notePC;
    }

    prevMidi = midi;
    midiNotes.push(midi);
  }

  return midiNotes;
}

// ============================
// Spill akkord
// ============================


async function playChord() {
  await Tone.start();
  displayMode = "chord";
  render();

  const notes = spell(rootSelect.value, typeSelect.value);
  const { midiNotes } = buildVoicing(notes);

  synth.triggerAttackRelease(
    midiNotes.map(m => Tone.Frequency(m, "midi")),
    "2n"
  );
}


async function playArpeggio() {
  await Tone.start();
  displayMode = "arpeggio";
  render();

  const notes = spell(rootSelect.value, typeSelect.value);
  const { midiNotes } = buildVoicing(notes);

  const now = Tone.now();
  midiNotes.forEach((m, i) => {
    synth.triggerAttackRelease(
      Tone.Frequency(m, "midi"),
      "8n",
      now + i * 0.18
    );
  });
}

window.playChord = playChord;
window.playArpeggio = playArpeggio;





rootSelect.onchange = render;
typeSelect.onchange = render;

const params = new URLSearchParams(window.location.search);

if (params.get("chord")) {

  const parsed = parseChordString(params.get("chord"));

  if (parsed) {
    rootSelect.value = parsed.root;
    typeSelect.value = parsed.type;
  }

} else {

  if (params.get("root")) rootSelect.value = params.get("root");
  if (params.get("type")) typeSelect.value = params.get("type");
}

updateToggleLabel();
render();

</script>

</body>
</html>