<!DOCTYPE html>
<html lang="no">
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

select {
  margin-right: 10px;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.15);
  background: #1f2937;
  color: #e5e7eb;
}

#notation {
  background: white;
  padding: 20px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.4);
}

#piano {
  position: relative;
  padding: 20px;
  border-radius: 20px;
  background: rgba(255,255,255,0.04);
  backdrop-filter: blur(12px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.6);
}


/* HVITE */
.white-key {
  width: 48px;
  height: 140px;
  background: linear-gradient(to bottom, #ffffff 0%, #e5e7eb 100%);
  border-radius: 0 0 8px 8px;
  border: 1px solid #d1d5db;
  float: left;
  position: relative;
}

/* SORTE */
.black-key {
  width: 32px;
  height: 90px;
  background: linear-gradient(to bottom, #111 0%, #000 100%);
  position: absolute;
  top: 0px;
  z-index: 5;
  border-radius: 0 0 6px 6px;
  box-shadow: 0 6px 10px rgba(0,0,0,0.8);
}

/* AKTIV */
.active-white {
  background: linear-gradient(to bottom, #f43f5e, #be123c);
  box-shadow: 0 0 20px rgba(244,63,94,0.6);
}

.active-black {
  background: linear-gradient(to bottom, #f43f5e, #9f1239);
  box-shadow: 0 0 20px rgba(244,63,94,0.7);
}

.controls {
  margin-top: 20px;
  margin-bottom: 10px;
  display: flex;
  gap: 12px;
}
.display-row {
  display: flex;
  gap: 40px;
  margin-top: 30px;
  flex-wrap: wrap;
}

.display-row > div {
  flex: 1 1 420px;   /* bryt tidligere */
  max-width: 650px;  /* stopp dem fra å bli enorme */
}
.display-row {
  justify-content: center;
}

.display-row > div {
  flex: 1 1 420px;
  max-width: 650px;

  display: flex;
  justify-content: center;   /* horisontalt */
  align-items: center;       /* vertikalt */
}

#notation svg {
  display: block;
}

#piano {
  display: flex;
  justify-content: center;
  align-items: center;
}
.keyboard {
  position: relative;
  display: inline-block;
}


</style>
</head>

<body>

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

<div class="display-row">  
<div id="notation"></div>
<div id="piano"></div>
<br>
<button onclick="playChord()">Spill akkord</button>
<button onclick="playArpeggio()">Arpeggio</button>

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
  const p=parse(n);
  return (NATURAL_PC[p.l]+(p.a=="#"?1:p.a=="b"?-1:0)+12)%12;
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

    if(diff == 0) return letter;
    if(diff == 1) return letter + "#";
    if(diff == -1) return letter + "b";
    return letter;
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


function getKey(root,type){
  if(type=="min") return MINOR_REL[root]||"C";
  return MAJOR_KEYS[root]||"C";
}


function buildVoicing(notes, minMidi = 43, maxMidi = 79) {

  const midiNotes = [];
  let prevMidi = -9999;

  for (const n of notes) {

    const notePC = pc(n);

    // Start så lavt som mulig innenfor register
    let octave = Math.floor(minMidi / 12);
    let midi = octave * 12 + notePC;

    // Flytt opp til vi er over minMidi
    while (midi < minMidi) midi += 12;

    // Sørg for stacking oppover (grunnposisjon)
    while (midi <= prevMidi) midi += 12;

    prevMidi = midi;
    midiNotes.push(midi);
  }

  // Hvis øverste tone havner over maxMidi → flytt hele akkorden ned
  while (midiNotes.length && midiNotes[midiNotes.length - 1] > maxMidi) {
    for (let i = 0; i < midiNotes.length; i++) {
      midiNotes[i] -= 12;
    }
  }

  // Lag VexFlow keys
  const vexKeys = midiNotes.map((m, i) => {
    const octave = Math.floor(m / 12);
    return notes[i][0].toLowerCase() + "/" + octave;
  });

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

const newUrl = `?chord=${chordString}`;
window.history.replaceState(null, "", newUrl);


  document.getElementById("notation").innerHTML="";
  const renderer=new Vex.Flow.Renderer(
    document.getElementById("notation"),
    Vex.Flow.Renderer.Backends.SVG
  );
  renderer.resize(360,160);
  const ctx=renderer.getContext();
  const stave=new Vex.Flow.Stave(10,30,320);
  stave.addClef("treble").addKeySignature(key);
  stave.setContext(ctx).draw();

  const ks=keySigMap(key);

const { midiNotes, vexKeys } = buildVoicing(notes, 43, 79);
const chord=new Vex.Flow.StaveNote({
  clef:"treble",
  keys: vexKeys,
  duration:"h"
});

chord.setXShift(80);
  notes.forEach((n,i)=>{
    const p=parse(n);
    const inKey=ks[p.l]||"";
    if(p.a!==inKey){
      if(p.a=="") chord.addModifier(new Vex.Flow.Accidental("n"),i);
      else chord.addModifier(new Vex.Flow.Accidental(p.a),i);
    }
  });

  const voice=new Vex.Flow.Voice({num_beats:2,beat_value:4});
  voice.addTickables([chord]);
  new Vex.Flow.Formatter().joinVoices([voice]).format([voice],420);
  voice.draw(ctx,stave);

  // Piano
// Piano
const piano = document.getElementById("piano");
piano.innerHTML = "";

const keyboard = document.createElement("div");
keyboard.className = "keyboard";
piano.appendChild(keyboard);


const whiteOrder=["C","D","E","F","G","A","B","C"];

// Tegn hvite tangenter
whiteOrder.forEach((note, i) => {
  const white = document.createElement("div");
  white.className = "white-key";

const whitePC = NATURAL_PC[note];

if (i !== whiteOrder.length - 1 && 
    notes.some(n => pc(n) === whitePC)) {
  white.classList.add("active-white");
}

keyboard.appendChild(white);

  // Tegn svarte tangenter (ikke etter E og B)
  if(note !== "E" && note !== "B") {
    const black = document.createElement("div");
    black.className = "black-key";

// forskyvning for hver svart tangent
const blackOffsets = {
  "C": 50,  // C#
  "D": 60,  // D#
  "F": 56,  // F#
  "G": 60,  // G#
  "A": 66   // A#
};

black.style.left = (i * 48 + blackOffsets[note] - 20) + "px";


// Hvis dette er siste hvite (øverste C)
if (i === whiteOrder.length - 1) {
  const currentLeft = parseInt(black.style.left);
  black.style.left = (currentLeft + 14) + "px"; // flytt litt til høyre
  black.style.width = "20px"; // halv bredde (venstre halvdel beholdes)
}

    // Finn hva svart tangent heter i denne sammenhengen
    const sharpName = note + "#";
    const flatMap = {
      "C":"Db","D":"Eb","F":"Gb","G":"Ab","A":"Bb"
    };
    const flatName = flatMap[note];

const sharpPC = (NATURAL_PC[note] + 1) % 12;
const flatPC  = (NATURAL_PC[note] + 1) % 12;

if (
  i !== whiteOrder.length - 1 &&   // ikke siste C
  notes.some(n => pc(n) === sharpPC)
) {
  black.classList.add("active-black");
}

keyboard.appendChild(black);

  }
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
  const notes = spell(rootSelect.value, typeSelect.value);
  const { midiNotes } = buildVoicing(notes, 43, 3);
  synth.triggerAttackRelease(
    midiNotes.map(m => Tone.Frequency(m, "midi")),
    "2n"
  );
}

async function playArpeggio() {
  await Tone.start();
  const notes = spell(rootSelect.value, typeSelect.value);
  const { midiNotes } = buildVoicing(notes, 43, 3);

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

render();

</script>

</body>
</html>