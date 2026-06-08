<!DOCTYPE html>
<html lang="no">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Visualizer V4 Hybrid</title>
<script src="https://unpkg.com/tone@14.7.77/build/Tone.js"></script>
<style>
    * { box-sizing: border-box; }

    body {
        margin: 0;
        background: #05070a;
        color: #eaf6ff;
        font-family: Arial, sans-serif;
        overflow: hidden;
    }

    #ui {
        position: absolute;
        top: 12px;
        left: 12px;
        z-index: 10;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        background: rgba(0,0,0,0.35);
        padding: 10px 12px;
        border-radius: 12px;
        backdrop-filter: blur(8px);
    }

    #ui label {
        font-size: 14px;
    }

    #ui button,
    #ui select,
    #ui input {
        font-size: 14px;
        border: 1px solid rgba(255,255,255,0.15);
        background: rgba(255,255,255,0.08);
        color: #fff;
        border-radius: 8px;
        padding: 6px 10px;
    }

    #status {
        position: absolute;
        right: 12px;
        top: 12px;
        z-index: 10;
        background: rgba(0,0,0,0.35);
        padding: 10px 12px;
        border-radius: 12px;
        font-size: 13px;
        line-height: 1.4;
        backdrop-filter: blur(8px);
    }

    canvas {
        display: block;
    }
</style>
</head>
<body>

<div id="ui">
    <label for="mode">Modus</label>
    <select id="mode">
        <option value="learn">LEARN</option>
        <option value="flow">FLOW</option>
    </select>
<label>Root</label>
<select id="rootSelect">
<option>C</option><option>C#</option><option>D</option><option>D#</option>
<option>E</option><option>F</option><option>F#</option>
<option>G</option><option>G#</option><option>A</option><option>A#</option><option>B</option>
</select>

<label>Scale</label>
<select id="scaleSelect">
<option value="major">Dur</option>
<option value="nat_minor">Moll</option>
<option value="dorian">Dorisk</option>
</select>
    <label for="bpm">BPM</label>
    <input id="bpm" type="number" min="40" max="220" value="90" style="width:72px;" />

    <button id="startBtn">Start Audio</button>
    <button id="playBtn">Play Melody</button>
    <button id="loopBtn">Loop: Off</button>
    <button id="stopBtn">Stop</button>
</div>

<div id="status">
    <div><strong>V4 Hybrid Core</strong></div>
    <div id="modeStatus">Mode: LEARN</div>
    <div id="midiStatus">MIDI: checking...</div>
</div>

<canvas id="canvas"></canvas>

<script>
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const modeSelect = document.getElementById("mode");
const bpmInput = document.getElementById("bpm");
const startBtn = document.getElementById("startBtn");
const playBtn = document.getElementById("playBtn");
const loopBtn = document.getElementById("loopBtn");
const stopBtn = document.getElementById("stopBtn");
const modeStatus = document.getElementById("modeStatus");
const midiStatus = document.getElementById("midiStatus");

const rootSelect = document.getElementById("rootSelect");
const scaleSelect = document.getElementById("scaleSelect");

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

/* =========================
   SCALE SYSTEM (RYDDIG!)
========================= */

const noteNames = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

const scalesData = {
    major: {
        intervals: [0,2,4,5,7,9,11],
        name_no: "Dur"
    },
    nat_minor: {
        intervals: [0,2,3,5,7,8,10],
        name_no: "Naturlig moll"
    },
    dorian: {
        intervals: [0,2,3,5,7,9,10],
        name_no: "Dorisk"
    }
};

let currentRoot = "C";
let currentScaleKey = "major";
let activeScaleNotes = [];

function getScaleName(key){
    return scalesData[key]?.name_no || key;
}

function buildScale(root, scaleKey) {
    const rootIndex = noteNames.indexOf(root);
    const intervals = scalesData[scaleKey]?.intervals || [];

    return intervals.map(i => noteNames[(rootIndex + i) % 12]);
}

function updateScale() {
    currentRoot = rootSelect.value;
    currentScaleKey = scaleSelect.value;

    activeScaleNotes = buildScale(currentRoot, currentScaleKey);

    console.log("Aktiv skala:", getScaleName(currentScaleKey), activeScaleNotes);
}

rootSelect.addEventListener("change", updateScale);
scaleSelect.addEventListener("change", updateScale);

/* =========================
   AUDIO
========================= */

const AC = new (window.AudioContext||window.webkitAudioContext)();
let reverb, delay, synth;
let audioStarted = false;

async function initAudio() {
    if (audioStarted) return;

    await Tone.start();

    reverb = new Tone.Reverb({ decay: 6, wet: 0.25 }).toDestination();
    delay = new Tone.FeedbackDelay("8n", 0.25);
    delay.wet.value = 0.15;

    synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sine" },
        envelope: {
            attack: 0.01,
            decay: 0.15,
            sustain: 0.2,
            release: 1.2
        }
    });

    synth.connect(delay);
    delay.connect(reverb);

    audioStarted = true;
}

/* =========================
   VISUAL / KEYBOARD
========================= */

const keyboardHeight = 150;
const whiteWidth = 44;
const blackWidth = 28;
const whiteOrder = ["C","D","E","F","G","A","B"];
const blackMap = { "C":"C#", "D":"D#", "F":"F#", "G":"G#", "A":"A#" };

const startOctave = 3;
const octaves = 3;

let keys = [];
let notes = [];
let particles = [];
let activeKeys = {};

function buildKeyboard() {
    keys = [];
    let xOffset = 80;

    for (let o = startOctave; o < startOctave + octaves; o++) {
        whiteOrder.forEach(note => {
            keys.push({ note: note + o, x: xOffset, type: "white" });

            if (blackMap[note]) {
                keys.push({
                    note: blackMap[note] + o,
                    x: xOffset + whiteWidth * 0.68,
                    type: "black"
                });
            }

            xOffset += whiteWidth;
        });
    }

    keys.push({
        note: "C" + (startOctave + octaves),
        x: xOffset,
        type: "white"
    });
}
buildKeyboard();

function noteToX(note) {
    const key = keys.find(k => k.note === note);
    return key ? key.x : 0;
}

function isSharp(note) {
    return note.includes("#");
}

/* =========================
   PLAY NOTE (med skala-filter!)
========================= */

function isNoteInScale(note){
    const base = note.replace(/[0-9]/g, "");
    return activeScaleNotes.includes(base);
}

function triggerNote(note, duration = 0.5, velocity = 100) {

    if (!audioStarted || !synth) return;

    const inScale = isNoteInScale(note);

    // 🔊 Spill ALLTID lyd
    synth.triggerAttackRelease(note, duration);

    // 🎨 Men vis forskjell visuelt
    activeKeys[note] = true;
    setTimeout(() => activeKeys[note] = false, 200);

    notes.push({
        note,
        x: noteToX(note),
        y: -80,
        length: 80,
        speed: 3,
        inScale // 👈 ny
    });
}


/* =========================
   DRAW
========================= */

function drawKeyboard() {
    const y = canvas.height - keyboardHeight;

    keys.filter(k => k.type === "white").forEach(k => {
        ctx.fillStyle = activeKeys[k.note] ? "#7ee7ff" : "#f7fbff";
        ctx.fillRect(k.x, y, whiteWidth, keyboardHeight);
        ctx.strokeRect(k.x, y, whiteWidth, keyboardHeight);
    });

    keys.filter(k => k.type === "black").forEach(k => {
        ctx.fillStyle = activeKeys[k.note] ? "#7ee7ff" : "#111";
        ctx.fillRect(k.x, y, blackWidth, keyboardHeight * 0.6);
    });
}

function drawNotes() {
    notes.forEach(n => {

        // 🎯 Riktig vs feil tone
        ctx.fillStyle = n.inScale ? "#66ccff" : "#ff5577";

        ctx.fillRect(n.x, n.y, 20, n.length);
        n.y += n.speed;
    });

    notes = notes.filter(n => n.y < canvas.height);
}

function animate() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawNotes();
    drawKeyboard();
    requestAnimationFrame(animate);
}
animate();

/* =========================
   UI EVENTS
========================= */

startBtn.addEventListener("click", async () => {
    await initAudio();
    console.log("Audio started ✅");
});
document.addEventListener("keydown", (e) => {
    if (!audioStarted) return; // 👈 VIKTIG

    const map = {
        "a":"C4","w":"C#4","s":"D4","e":"D#4","d":"E4",
        "f":"F4","t":"F#4","g":"G4","y":"G#4","h":"A4",
        "u":"A#4","j":"B4","k":"C5"
    };

    const note = map[e.key.toLowerCase()];
    if (note) triggerNote(note);
});

/* =========================
   INIT
========================= */

updateScale();
</script>
</body>
</html>