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
  if (!toggleBtn) return;

  if (useKeySignature) {
    toggleBtn.textContent = "Show accidentals only";
  } else {
    toggleBtn.textContent = "Show key signature";
  }
}


if (toggleBtn) {
  toggleBtn.onclick = function() {
    useKeySignature = !useKeySignature;

    const url = new URL(window.location);
    url.searchParams.set("mode", useKeySignature ? "key" : "absolute");
    window.history.replaceState(null, "", url);

    render();
  };
}


function getChordFromUIorURL() {

  const rootSelect = document.getElementById("root");
  const typeSelect = document.getElementById("type");

  if (rootSelect && typeSelect) {
    return {
      root: rootSelect.value,
      type: typeSelect.value
    };
  }

  const params = new URLSearchParams(window.location.search);
  const parsed = parseChordString(params.get("chord") || "C");

  return parsed;
}   



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

  const chordData = getChordFromUIorURL();
  const root = chordData.root;
  const type = chordData.type;

  const notes = spell(root, type);
  const key = getKey(root, type);

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
  
const hasKeySignature = Object.keys(ks).length > 0;

// Hvis tonearten ikke har faste fortegn,
// tving alltid absolute mode
if (!hasKeySignature) {
  useKeySignature = false;
}

// Toggle styres KUN her
if (toggleBtn) {

  if (hasKeySignature) {
    toggleBtn.style.display = "inline-block";
  } else {
    toggleBtn.style.display = "none";
  }

  updateToggleLabel();
}

const { midiNotes, vexKeys } = buildVoicing(notes);

let staveNotes = [];

if (displayMode === "chord") {

const midIndex = Math.floor(midiNotes.length / 2);
const midMidi = midiNotes[midIndex];

const chord = new Vex.Flow.StaveNote({
  clef: "treble",
  keys: vexKeys,
  duration: "h",
  stem_direction: midMidi >= 69
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
        duration: "8"
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

      // 👇 DEN FAKTISKE LOGIKKEN
      const line = single.getKeyProps()[0].line;

      if (line >= 3) {     // 3 = midtlinjen (B4)
        single.setStemDirection(Vex.Flow.Stem.DOWN);
      } else {
        single.setStemDirection(Vex.Flow.Stem.UP);
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

  const chordData = getChordFromUIorURL();
  const notes = spell(chordData.root, chordData.type);
  const { midiNotes } = buildVoicing(notes);

  displayMode = "chord";
  render();

  synth.triggerAttackRelease(
    midiNotes.map(m => Tone.Frequency(m, "midi")),
    "2n"
  );
}
async function playArpeggio() {

  await Tone.start();

  const chordData = getChordFromUIorURL();
  const notes = spell(chordData.root, chordData.type);
  const { midiNotes } = buildVoicing(notes);

  displayMode = "arpeggio";
  render();

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


const embedBtn = document.getElementById("generateEmbed");

if (embedBtn) {

  embedBtn.addEventListener("click", function(){

    const root = document.getElementById("root").value;
    const type = document.getElementById("type").value;

    const mode = new URLSearchParams(window.location.search).get("mode") || "key";

    const chordString =
      root + (
        type === "maj" ? "" :
        type === "min" ? "m" :
        type === "min7" ? "m7" :
        type
      );

    const baseUrl = window.location.origin + "/tools/chords/notes/embed.php";

    const src = baseUrl + "?chord=" + chordString + "&mode=" + mode;

    const iframeCode =
`<iframe 
  src="${src}"
  width="820"
  height="480"
  style="border:none;"
  loading="lazy">
</iframe>`;

    document.getElementById("embedOutput").value = iframeCode;

  });

}
if (rootSelect && typeSelect) {
  rootSelect.onchange = render;
  typeSelect.onchange = render;
}

if (rootSelect && typeSelect) {

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

}

document.addEventListener("DOMContentLoaded", function() {

  const rootSelect = document.getElementById("root");
  const typeSelect = document.getElementById("type");

  // 1️⃣ Koble onchange
  if (rootSelect && typeSelect) {
    rootSelect.onchange = render;
    typeSelect.onchange = render;
  }

  // 2️⃣ Les URL og sett dropdown FØR render
  const params = new URLSearchParams(window.location.search);

  if (params.get("chord")) {
    const parsed = parseChordString(params.get("chord"));
    if (parsed && rootSelect && typeSelect) {
      rootSelect.value = parsed.root;
      typeSelect.value = parsed.type;
    }
  }

  // 3️⃣ Nå kan vi trygt tegne
  updateToggleLabel();
  render();
});

