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

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

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
let currentMode = "learn";
let isLooping = false;
let loopTimeouts = [];
let trailAlpha = 0.12;

let audioStarted = false;
let midiReady = false;

let reverb, delay, synth;

function buildKeyboard() {
    keys = [];
    let xOffset = 80;

    for (let o = startOctave; o < startOctave + octaves; o++) {
        whiteOrder.forEach(note => {
            keys.push({
                note: note + o,
                x: xOffset,
                type: "white"
            });

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

async function initAudio() {
    if (audioStarted) return;

    await Tone.start();

    reverb = new Tone.Reverb({
        decay: 6,
        wet: 0.25
    }).toDestination();

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

function updateMode() {
    currentMode = modeSelect.value;
    modeStatus.textContent = "Mode: " + currentMode.toUpperCase();

    if (!audioStarted || !reverb || !delay) return;

    if (currentMode === "learn") {
        reverb.wet.value = 0.15;
        delay.wet.value = 0.08;
        trailAlpha = 0.20;
    } else {
        reverb.wet.value = 0.42;
        delay.wet.value = 0.22;
        trailAlpha = 0.07;
    }
}
modeSelect.addEventListener("change", updateMode);

function getBpm() {
    return Math.max(40, Math.min(220, parseInt(bpmInput.value, 10) || 90));
}

function beatsToMs(beats) {
    return (60000 / getBpm()) * beats;
}

function triggerVisual(note, durationBeats = 0.5, velocity = 100) {
    const x = noteToX(note);
    const noteLength = Math.max(50, durationBeats * 140);
    const speed = currentMode === "flow" ? 1.8 : 3.0;

    notes.push({
        note,
        x,
        y: -noteLength,
        width: isSharp(note) ? 18 : 24,
        length: noteLength,
        speed,
        hit: false,
        dead: false
    });

    activeKeys[note] = true;

    const activeTime = Math.max(120, durationBeats * 400);
    setTimeout(() => {
        activeKeys[note] = false;
    }, activeTime);

    if (currentMode === "flow") {
        const particleCount = Math.min(14, Math.max(6, Math.floor(velocity / 12)));
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: x + 10 + Math.random() * 12,
                y: canvas.height - keyboardHeight - 10,
                dx: (Math.random() - 0.5) * 1.6,
                dy: -Math.random() * 2.2 - 0.3,
                life: 50 + Math.random() * 30,
                size: 1 + Math.random() * 2.5
            });
        }
    }
}

function triggerNote(note, durationBeats = 0.5, velocity = 100) {
    if (!audioStarted || !synth) return;

    const seconds = beatsToMs(durationBeats) / 1000;
    const vel = Math.max(0.2, Math.min(1, velocity / 127));

    synth.triggerAttackRelease(note, seconds, undefined, vel);
    triggerVisual(note, durationBeats, velocity);
}

function triggerChord(notesArray, durationBeats = 1, velocity = 100) {
    notesArray.forEach(n => triggerNote(n, durationBeats, velocity));
}

const melody = [
    { note: "C4", time: 0,   duration: 0.5 },
    { note: "D4", time: 0.5, duration: 0.5 },
    { note: "E4", time: 1.0, duration: 0.5 },
    { note: "G4", time: 1.5, duration: 0.5 },
    { note: "A4", time: 2.0, duration: 0.5 },
    { note: "G4", time: 2.5, duration: 0.5 },
    { note: "E4", time: 3.0, duration: 0.75 },
    { note: "D4", time: 3.75, duration: 0.25 },
    { note: "C4", time: 4.0, duration: 1.0 }
];

const progression = [
    { notes: ["C4","E4","G4"], time: 0, duration: 2 },
    { notes: ["A3","C4","E4"], time: 2, duration: 2 },
    { notes: ["F3","A3","C4"], time: 4, duration: 2 },
    { notes: ["G3","B3","D4"], time: 6, duration: 2 }
];

function clearScheduled() {
    loopTimeouts.forEach(id => clearTimeout(id));
    loopTimeouts = [];
}

function stopPlayback() {
    clearScheduled();
    isLooping = false;
    loopBtn.textContent = "Loop: Off";
}

function scheduleMelody(items, shouldLoop = false) {
    clearScheduled();

    let totalBeats = 0;

    items.forEach(item => {
        const t = setTimeout(() => {
            triggerNote(item.note, item.duration || 0.5, item.velocity || 100);
        }, beatsToMs(item.time));

        loopTimeouts.push(t);
        totalBeats = Math.max(totalBeats, item.time + (item.duration || 0.5));
    });

    if (shouldLoop) {
        const loopId = setTimeout(() => {
            scheduleMelody(items, true);
        }, beatsToMs(totalBeats + 0.25));
        loopTimeouts.push(loopId);
    }
}

function scheduleProgression(items, shouldLoop = false) {
    clearScheduled();

    let totalBeats = 0;

    items.forEach(item => {
        const t = setTimeout(() => {
            triggerChord(item.notes, item.duration || 1, item.velocity || 100);
        }, beatsToMs(item.time));

        loopTimeouts.push(t);
        totalBeats = Math.max(totalBeats, item.time + (item.duration || 1));
    });

    if (shouldLoop) {
        const loopId = setTimeout(() => {
            scheduleProgression(items, true);
        }, beatsToMs(totalBeats + 0.25));
        loopTimeouts.push(loopId);
    }
}

function drawBackground() {
    if (currentMode === "flow") {
        ctx.fillStyle = `rgba(5, 7, 10, ${trailAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const gradient = ctx.createRadialGradient(
            canvas.width * 0.5, canvas.height * 0.35, 20,
            canvas.width * 0.5, canvas.height * 0.35, canvas.width * 0.6
        );
        gradient.addColorStop(0, "rgba(120, 220, 255, 0.05)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

function drawKeyboard() {
    const y = canvas.height - keyboardHeight;

    keys.filter(k => k.type === "white").forEach(k => {
        ctx.fillStyle = activeKeys[k.note] ? "#7ee7ff" : "#f7fbff";
        ctx.fillRect(k.x, y, whiteWidth, keyboardHeight);

        ctx.strokeStyle = "#111";
        ctx.lineWidth = 1;
        ctx.strokeRect(k.x, y, whiteWidth, keyboardHeight);
    });

    keys.filter(k => k.type === "black").forEach(k => {
        ctx.fillStyle = activeKeys[k.note] ? "#7ee7ff" : "#11151c";
        ctx.fillRect(k.x, y, blackWidth, keyboardHeight * 0.62);
    });
}

function drawNotes() {
    const hitLine = canvas.height - keyboardHeight;

    notes.forEach(n => {
        if (currentMode === "flow") {
            ctx.fillStyle = "rgba(120, 230, 255, 0.92)";
            ctx.shadowBlur = 22;
            ctx.shadowColor = "rgba(120, 230, 255, 0.95)";
        } else {
            ctx.fillStyle = isSharp(n.note) ? "rgba(110, 220, 255, 0.95)" : "rgba(70, 200, 255, 0.95)";
            ctx.shadowBlur = 10;
            ctx.shadowColor = "rgba(100, 220, 255, 0.7)";
        }

        ctx.fillRect(n.x, n.y, n.width, n.length);
        n.y += n.speed;

        if (!n.hit && n.y + n.length >= hitLine) {
            n.hit = true;
        }

        if (n.y > canvas.height + 80) {
            n.dead = true;
        }
    });

    notes = notes.filter(n => !n.dead);
    ctx.shadowBlur = 0;
}

function drawParticles() {
    if (currentMode !== "flow") return;

    particles.forEach(p => {
        ctx.fillStyle = `rgba(160, 235, 255, ${Math.max(0, p.life / 80)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        p.x += p.dx;
        p.y += p.dy;
        p.life -= 1;
    });

    particles = particles.filter(p => p.life > 0);
}

function drawLearnOverlay() {
    if (currentMode !== "learn") return;

    const hitLine = canvas.height - keyboardHeight;
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(0, hitLine);
    ctx.lineTo(canvas.width, hitLine);
    ctx.stroke();
    ctx.setLineDash([]);
}

function animate() {
    drawBackground();
    drawNotes();
    drawParticles();
    drawLearnOverlay();
    drawKeyboard();
    requestAnimationFrame(animate);
}
animate();

startBtn.addEventListener("click", async () => {
    await initAudio();
    updateMode();
});

playBtn.addEventListener("click", async () => {
    await initAudio();
    updateMode();

    if (currentMode === "learn") {
        scheduleMelody(melody, isLooping);
    } else {
        scheduleProgression(progression, isLooping);
    }
});

loopBtn.addEventListener("click", () => {
    isLooping = !isLooping;
    loopBtn.textContent = isLooping ? "Loop: On" : "Loop: Off";
});

stopBtn.addEventListener("click", stopPlayback);

document.addEventListener("keydown", async (e) => {
    await initAudio();

    const map = {
        "a":"C4", "w":"C#4", "s":"D4", "e":"D#4", "d":"E4",
        "f":"F4", "t":"F#4", "g":"G4", "y":"G#4", "h":"A4",
        "u":"A#4", "j":"B4", "k":"C5"
    };

    const note = map[e.key.toLowerCase()];
    if (note) triggerNote(note, 0.5, 110);

    if (e.key === " ") {
        e.preventDefault();
        if (currentMode === "learn") {
            scheduleMelody(melody, isLooping);
        } else {
            scheduleProgression(progression, isLooping);
        }
    }
});

if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess()
        .then(midi => {
            midiReady = true;
            midiStatus.textContent = "MIDI: ready";

            for (let input of midi.inputs.values()) {
                input.onmidimessage = async (msg) => {
                    await initAudio();

                    const [status, noteNumber, velocity] = msg.data;
                    const type = status & 0xf0;

                    if (type === 0x90 && velocity > 0) {
                        const noteName = midiToNote(noteNumber);
                        triggerNote(noteName, 0.5, velocity);
                    }
                };
            }
        })
        .catch(() => {
            midiStatus.textContent = "MIDI: unavailable";
        });
} else {
    midiStatus.textContent = "MIDI: not supported";
}

function midiToNote(num) {
    const names = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
    const octave = Math.floor(num / 12) - 1;
    return names[num % 12] + octave;
}

updateMode();
</script>
</body>
</html>