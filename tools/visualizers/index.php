<!DOCTYPE html>
<html lang="no">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Visualizer V4.3 scales.json</title>
<script src="https://unpkg.com/tone@14.7.77/build/Tone.js"></script>
<style>
    * { box-sizing: border-box; }

    html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: #05070a;
        color: #eaf6ff;
        font-family: Arial, sans-serif;
    }

    body {
        user-select: none;
        -webkit-user-select: none;
        touch-action: manipulation;
    }

    #ui {
        position: absolute;
        top: 12px;
        left: 12px;
        right: 12px;
        z-index: 20;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        background: rgba(0,0,0,0.38);
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
        background: rgba(20,24,32,0.92);
        color: #fff;
        border-radius: 8px;
        padding: 6px 10px;
    }

    #ui button {
        cursor: pointer;
    }

    select option {
        background: #ffffff;
        color: #111111;
    }

    #status {
        position: absolute;
        right: 12px;
        top: 84px;
        z-index: 20;
        background: rgba(0,0,0,0.38);
        padding: 10px 12px;
        border-radius: 12px;
        font-size: 13px;
        line-height: 1.45;
        backdrop-filter: blur(8px);
        min-width: 270px;
    }

    #hint {
        position: absolute;
        left: 12px;
        bottom: 12px;
        z-index: 20;
        background: rgba(0,0,0,0.35);
        padding: 8px 10px;
        border-radius: 10px;
        font-size: 12px;
        color: rgba(255,255,255,0.82);
        backdrop-filter: blur(8px);
    }

    canvas {
        display: block;
        width: 100vw;
        height: 100vh;
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

    <label for="playMode">Playback</label>
    <select id="playMode">
        <option value="sync">Sync</option>
        <option value="prepare">Prepare</option>
        <option value="immediate">Immediate</option>
    </select>

    <label for="rootSelect">Root</label>
    <select id="rootSelect">
        <option>C</option><option>C#</option><option>D</option><option>D#</option>
        <option>E</option><option>F</option><option>F#</option><option>G</option>
        <option>G#</option><option>A</option><option>A#</option><option>B</option>
    </select>

    <label for="scaleSelect">Scale</label>
    <select id="scaleSelect"></select>

    <label for="presetType">Preset-type</label>
    <select id="presetType">
        <option value="melody">Melodi</option>
        <option value="scale">Skala</option>
    </select>

    <label for="presetSelect">Preset</label>
    <select id="presetSelect"></select>

    <label for="bpm">BPM</label>
    <input id="bpm" type="number" min="40" max="220" value="90" style="width:72px;" />

    <button id="startBtn">Start Audio</button>
    <button id="playBtn">Play</button>
    <button id="loopBtn">Loop: Off</button>
    <button id="stopBtn">Stop</button>
</div>

<div id="status">
    <div><strong>V4.3 scales.json</strong></div>
    <div id="modeStatus">Mode: LEARN</div>
    <div id="scaleStatus">Scale: laster...</div>
    <div id="presetStatus">Preset: Melodi / Enkel melodi</div>
    <div id="audioStatus">Audio: idle</div>
    <div id="syncStatus">Playback: Sync</div>
    <div id="dataStatus">Data: laster /data/scales.json ...</div>
</div>

<div id="hint">
    Trykk på tangentene nederst, eller bruk A W S E D F T G Y H U J K
</div>

<canvas id="canvas"></canvas>

<script>
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const modeSelect = document.getElementById("mode");
const playModeSelect = document.getElementById("playMode");
const rootSelect = document.getElementById("rootSelect");
const scaleSelect = document.getElementById("scaleSelect");
const presetTypeSelect = document.getElementById("presetType");
const presetSelect = document.getElementById("presetSelect");
const bpmInput = document.getElementById("bpm");
const startBtn = document.getElementById("startBtn");
const playBtn = document.getElementById("playBtn");
const loopBtn = document.getElementById("loopBtn");
const stopBtn = document.getElementById("stopBtn");

const modeStatus = document.getElementById("modeStatus");
const scaleStatus = document.getElementById("scaleStatus");
const presetStatus = document.getElementById("presetStatus");
const audioStatus = document.getElementById("audioStatus");
const syncStatus = document.getElementById("syncStatus");
const dataStatus = document.getElementById("dataStatus");

/* =========================
   CANVAS / VIEWPORT
========================= */
function resizeCanvas() {
    const vv = window.visualViewport;
    canvas.width = Math.round(window.innerWidth);
    canvas.height = Math.round(vv ? vv.height : window.innerHeight);
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);
if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", resizeCanvas);
}

function getKeyboardHeight() {
    const isTouchLike = window.matchMedia("(pointer: coarse)").matches;
    return isTouchLike ? Math.max(190, Math.round(canvas.height * 0.24)) : 160;
}

/* =========================
   SCALE DATA
========================= */
const noteNames = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

let scalesData = {};
let currentRoot = "C";
let currentScaleKey = "major";
let activeScaleNotes = [];

const fallbackScalesData = {
    major:      { group:"common", name:"Major", name_no:"Dur", intervals:[0,2,4,5,7,9,11], tones:7 },
    nat_minor:  { group:"common", name:"Natural minor", name_no:"Naturlig moll", intervals:[0,2,3,5,7,8,10], tones:7 },
    harm_minor: { group:"common", name:"Harmonic minor", name_no:"Harmonisk moll", intervals:[0,2,3,5,7,8,11], tones:7 },
    mel_minor:  { group:"common", name:"Melodic minor", name_no:"Melodisk moll", intervals:[0,2,3,5,7,9,11], tones:7 },
    dorian:     { group:"modes", name:"Dorian", name_no:"Dorisk", intervals:[0,2,3,5,7,9,10], tones:7 },
    phrygian:   { group:"modes", name:"Phrygian", name_no:"Frygisk", intervals:[0,1,3,5,7,8,10], tones:7 },
    lydian:     { group:"modes", name:"Lydian", name_no:"Lydisk", intervals:[0,2,4,6,7,9,11], tones:7 },
    mixolydian: { group:"modes", name:"Mixolydian", name_no:"Miksolydisk", intervals:[0,2,4,5,7,9,10], tones:7 },
    locrian:    { group:"modes", name:"Locrian", name_no:"Lokrisk", intervals:[0,1,3,5,6,8,10], tones:7 },
    major_pent: { group:"pent", name:"Major pentatonic", name_no:"Dur pentaton", intervals:[0,2,4,7,9], tones:5 },
    minor_pent: { group:"pent", name:"Minor pentatonic", name_no:"Moll pentaton", intervals:[0,3,5,7,10], tones:5 },
    pent_blues: { group:"pent", name:"Blues pentatonic", name_no:"Bluesskala", intervals:[0,3,5,6,7,10], tones:6 },
    chromatic:  { group:"chrom", name:"Chromatic", name_no:"Kromatisk", intervals:[0,1,2,3,4,5,6,7,8,9,10,11], tones:12 }
};

function getScaleLabel(scaleKey) {
    const scale = scalesData[scaleKey];
    if (!scale) return scaleKey;
    return scale.name_no || scale.name || scaleKey;
}

function buildScale(root, scaleKey) {
    const scale = scalesData[scaleKey];
    if (!scale || !Array.isArray(scale.intervals)) return [];

    const rootIndex = noteNames.indexOf(root);
    if (rootIndex < 0) return [];

    return scale.intervals.map(i => noteNames[(rootIndex + i) % 12]);
}

function buildScaleSequence(root, scaleKey, octave = 4) {
    const scale = scalesData[scaleKey];
    if (!scale || !Array.isArray(scale.intervals)) return [];

    const rootIndex = noteNames.indexOf(root);
    const seq = [];

    scale.intervals.forEach((interval, idx) => {
        const absolute = rootIndex + interval;
        const noteIndex = absolute % 12;
        const wrappedOctave = Math.floor(absolute / 12);

        seq.push({
            note: noteNames[noteIndex] + (octave + wrappedOctave),
            time: idx * 0.5,
            duration: 0.45,
            velocity: 108
        });
    });

    if (scale.intervals.length > 0 && scaleKey !== "chromatic") {
        seq.push({
            note: root + (octave + 1),
            time: scale.intervals.length * 0.5,
            duration: 0.75,
            velocity: 112
        });
    }

    return seq;
}

function updateScale() {
    currentRoot = rootSelect.value;
    currentScaleKey = scaleSelect.value;
    activeScaleNotes = buildScale(currentRoot, currentScaleKey);
    scaleStatus.textContent = `Scale: ${currentRoot} ${getScaleLabel(currentScaleKey)}`;
    if (presetTypeSelect.value === "scale") updatePresetStatus();
}

function isNoteInScale(note) {
    const base = note.replace(/[0-9]/g, "");
    return activeScaleNotes.includes(base);
}

function preferredScaleOrder(entries) {
    const priority = [
        "major","nat_minor","harm_minor","mel_minor",
        "dorian","phrygian","lydian","mixolydian","locrian",
        "major_pent","minor_pent","pent_blues","chromatic"
    ];

    return entries.sort((a, b) => {
        const ai = priority.indexOf(a[0]);
        const bi = priority.indexOf(b[0]);

        if (ai !== -1 && bi !== -1) return ai - bi;
        if (ai !== -1) return -1;
        if (bi !== -1) return 1;

        return getScaleLabel(a[0]).localeCompare(getScaleLabel(b[0]), "no");
    });
}

function populateScaleSelect() {
    scaleSelect.innerHTML = "";

    const entries = preferredScaleOrder(Object.entries(scalesData));
    entries.forEach(([key, scale]) => {
        const opt = document.createElement("option");
        opt.value = key;
        opt.textContent = getScaleLabel(key);
        scaleSelect.appendChild(opt);
    });

    if (!scalesData[currentScaleKey]) {
        currentScaleKey = entries.length ? entries[0][0] : "major";
    }

    scaleSelect.value = currentScaleKey;
    updateScale();
}

async function loadScalesData() {
    try {
        const response = await fetch("/data/scales.json", { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!data || typeof data !== "object") {
            throw new Error("Ugyldig JSON-format");
        }

        scalesData = data;
        dataStatus.textContent = "Data: scales.json lastet";
    } catch (error) {
        console.error("Kunne ikke laste /data/scales.json:", error);
        scalesData = fallbackScalesData;
        dataStatus.textContent = "Data: fallback-skalaer i bruk";
    }

    populateScaleSelect();
}

/* =========================
   AUDIO
========================= */
let audioStarted = false;
let synth, reverb, delay;

async function initAudio() {
    if (audioStarted) return;

    await Tone.start();

    reverb = new Tone.Reverb({ decay: 5.5, wet: 0.15 }).toDestination();
    delay = new Tone.FeedbackDelay("8n", 0.16);
    delay.wet.value = 0.06;

    synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sine" },
        envelope: {
            attack: 0.01,
            decay: 0.12,
            sustain: 0.2,
            release: 1.0
        }
    });

    synth.connect(delay);
    delay.connect(reverb);

    audioStarted = true;
    audioStatus.textContent = "Audio: started";
    updateModeSound();
}

function updateModeSound() {
    modeStatus.textContent = `Mode: ${modeSelect.value.toUpperCase()}`;
    syncStatus.textContent = `Playback: ${playModeSelect.value}`;

    if (!audioStarted || !reverb || !delay) return;

    if (modeSelect.value === "learn") {
        reverb.wet.value = 0.10;
        delay.wet.value = 0.04;
    } else {
        reverb.wet.value = 0.24;
        delay.wet.value = 0.14;
    }
}

function getBpm() {
    return Math.max(40, Math.min(220, parseInt(bpmInput.value, 10) || 90));
}

function beatsToMs(beats) {
    return (60000 / getBpm()) * beats;
}

function beatsToSeconds(beats) {
    return beatsToMs(beats) / 1000;
}

/* =========================
   KEYBOARD / VISUAL STATE
========================= */
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
let scheduledTimeouts = [];
let loopEnabled = false;

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

function setKeyActive(note, ms = 180) {
    activeKeys[note] = true;
    setTimeout(() => { activeKeys[note] = false; }, ms);
}

function spawnParticles(x, y, count = 10) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x, y,
            dx: (Math.random() - 0.5) * 1.8,
            dy: -Math.random() * 2.4 - 0.2,
            size: 1 + Math.random() * 2.4,
            life: 32 + Math.random() * 24
        });
    }
}

function triggerSynth(note, durationBeats = 0.5, velocity = 100) {
    if (!audioStarted || !synth) return;
    const durationSeconds = beatsToSeconds(durationBeats);
    const vel = Math.max(0.15, Math.min(1, velocity / 127));
    synth.triggerAttackRelease(note, durationSeconds, undefined, vel);
}

function addScheduledNote(note, durationBeats, velocity, hitTime, leadMs) {
    const hitY = canvas.height - getKeyboardHeight();
    const length = Math.max(56, durationBeats * 115);

    notes.push({
        note,
        x: noteToX(note),
        width: isSharp(note) ? 18 : 24,
        length,
        inScale: isNoteInScale(note),
        hitY,
        spawnTime: hitTime - leadMs,
        hitTime,
        sounded: false,
        dead: false,
        live: false,
        prepare: playModeSelect.value === "prepare"
    });
}

function triggerLiveNote(note, durationBeats = 0.5, velocity = 110) {
    const hitY = canvas.height - getKeyboardHeight();
    const length = Math.max(56, durationBeats * 115);

    triggerSynth(note, durationBeats, velocity);
    setKeyActive(note, 180);

    notes.push({
        note,
        x: noteToX(note),
        width: isSharp(note) ? 18 : 24,
        length,
        inScale: isNoteInScale(note),
        hitY,
        y: hitY - length,
        sounded: true,
        dead: false,
        live: true,
        liveSpeed: 2.0
    });

    if (modeSelect.value === "flow") {
        spawnParticles(noteToX(note) + 10, hitY - 8, 10);
    }
}

/* =========================
   PRESETS
========================= */
const melodyPresets = {
    simple: {
        label: "Enkel melodi",
        items: [
            { note: "C4", time: 0.0, duration: 0.5, velocity: 105 },
            { note: "D4", time: 0.5, duration: 0.5, velocity: 105 },
            { note: "E4", time: 1.0, duration: 0.5, velocity: 108 },
            { note: "G4", time: 1.5, duration: 0.5, velocity: 112 },
            { note: "A4", time: 2.0, duration: 0.5, velocity: 115 },
            { note: "G4", time: 2.5, duration: 0.5, velocity: 108 },
            { note: "E4", time: 3.0, duration: 0.75, velocity: 104 },
            { note: "D4", time: 3.75, duration: 0.25, velocity: 100 },
            { note: "C4", time: 4.0, duration: 1.0, velocity: 110 }
        ]
    },
    triad: {
        label: "Treklangsfigur",
        items: [
            { note: "C4", time: 0.0, duration: 0.4, velocity: 110 },
            { note: "E4", time: 0.5, duration: 0.4, velocity: 110 },
            { note: "G4", time: 1.0, duration: 0.4, velocity: 110 },
            { note: "C5", time: 1.5, duration: 0.8, velocity: 115 },
            { note: "G4", time: 2.5, duration: 0.4, velocity: 108 },
            { note: "E4", time: 3.0, duration: 0.4, velocity: 108 },
            { note: "C4", time: 3.5, duration: 0.8, velocity: 112 }
        ]
    }
};

function populatePresetSelect() {
    presetSelect.innerHTML = "";

    if (presetTypeSelect.value === "melody") {
        Object.entries(melodyPresets).forEach(([key, preset]) => {
            const opt = document.createElement("option");
            opt.value = key;
            opt.textContent = preset.label;
            presetSelect.appendChild(opt);
        });
    } else {
        const opt = document.createElement("option");
        opt.value = "selectedScale";
        opt.textContent = "Spill valgt skala";
        presetSelect.appendChild(opt);
    }

    updatePresetStatus();
}

function updatePresetStatus() {
    const typeLabel = presetTypeSelect.value === "melody" ? "Melodi" : "Skala";

    let presetLabel = "";
    if (presetTypeSelect.value === "melody") {
        presetLabel = presetSelect.options[presetSelect.selectedIndex]?.textContent || "";
    } else {
        presetLabel = `${currentRoot} ${getScaleLabel(currentScaleKey)}`;
    }

    presetStatus.textContent = `Preset: ${typeLabel} / ${presetLabel}`;
}

function getCurrentPlayableItems() {
    if (presetTypeSelect.value === "melody") {
        const preset = melodyPresets[presetSelect.value] || melodyPresets.simple;
        return preset.items;
    }

    return buildScaleSequence(currentRoot, currentScaleKey, 4);
}

/* =========================
   PLAYBACK
========================= */
function clearScheduled() {
    scheduledTimeouts.forEach(id => clearTimeout(id));
    scheduledTimeouts = [];
}

function stopPlayback() {
    clearScheduled();
    loopEnabled = false;
    loopBtn.textContent = "Loop: Off";
    notes = [];
    particles = [];
}

function getSequenceLength(items) {
    let end = 0;
    items.forEach(item => {
        end = Math.max(end, item.time + (item.duration || 0.5));
    });
    return end;
}

function scheduleMelody(items, shouldLoop = false) {
    clearScheduled();

    const playMode = playModeSelect.value;
    const totalBeats = getSequenceLength(items);
    const leadMs = playMode === "prepare" ? 2200 : playMode === "sync" ? 1600 : 0;
    const songStartTime = performance.now() + (playMode === "immediate" ? 0 : leadMs + 80);

    items.forEach(item => {
        const duration = item.duration || 0.5;
        const velocity = item.velocity || 100;
        const noteOffsetMs = beatsToMs(item.time);
        const hitTime = songStartTime + noteOffsetMs;

        if (playMode === "immediate") {
            const id = setTimeout(() => {
                triggerLiveNote(item.note, duration, velocity);
            }, noteOffsetMs);
            scheduledTimeouts.push(id);
            return;
        }

        addScheduledNote(item.note, duration, velocity, hitTime, leadMs);

        const soundDelay = Math.max(0, hitTime - performance.now());
        const soundId = setTimeout(() => {
            triggerSynth(item.note, duration, velocity);
        }, soundDelay);

        scheduledTimeouts.push(soundId);
    });

    if (shouldLoop) {
        const loopDelay = (playMode === "immediate" ? 0 : leadMs + 80) + beatsToMs(totalBeats + 0.5);
        const loopId = setTimeout(() => {
            scheduleMelody(items, true);
        }, loopDelay);
        scheduledTimeouts.push(loopId);
    }
}

/* =========================
   DRAW
========================= */
function drawBackground() {
    if (modeSelect.value === "flow") {
        ctx.fillStyle = "rgba(5,7,10,0.10)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const gradient = ctx.createRadialGradient(
            canvas.width * 0.5, canvas.height * 0.35, 30,
            canvas.width * 0.5, canvas.height * 0.35, canvas.width * 0.55
        );
        gradient.addColorStop(0, "rgba(120,220,255,0.05)");
        gradient.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

function drawKeyboard() {
    const keyboardHeight = getKeyboardHeight();
    const y = canvas.height - keyboardHeight;

    keys.filter(k => k.type === "white").forEach(k => {
        const base = k.note.replace(/[0-9]/g, "");
        const inScale = activeScaleNotes.includes(base);

        ctx.fillStyle = activeKeys[k.note] ? "#7ee7ff" : "#f7fbff";
        ctx.fillRect(k.x, y, whiteWidth, keyboardHeight);

        ctx.strokeStyle = "#111";
        ctx.lineWidth = 1;
        ctx.strokeRect(k.x, y, whiteWidth, keyboardHeight);

        if (modeSelect.value === "learn" && inScale && !activeKeys[k.note]) {
            ctx.fillStyle = "rgba(80,255,140,0.08)";
            ctx.fillRect(k.x, y, whiteWidth, keyboardHeight);
        }
    });

    keys.filter(k => k.type === "black").forEach(k => {
        const base = k.note.replace(/[0-9]/g, "");
        const inScale = activeScaleNotes.includes(base);

        if (activeKeys[k.note]) {
            ctx.fillStyle = "#7ee7ff";
        } else if (modeSelect.value === "learn" && inScale) {
            ctx.fillStyle = "#1d2c35";
        } else {
            ctx.fillStyle = "#11151c";
        }

        ctx.fillRect(k.x, y, blackWidth, keyboardHeight * 0.62);

        if (modeSelect.value === "learn" && inScale && !activeKeys[k.note]) {
            ctx.fillStyle = "rgba(80,255,140,0.08)";
            ctx.fillRect(k.x, y, blackWidth, keyboardHeight * 0.62);
        }
    });
}

function drawLearnOverlay() {
    if (modeSelect.value !== "learn") return;

    const hitLine = canvas.height - getKeyboardHeight();
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.setLineDash([7, 6]);
    ctx.beginPath();
    ctx.moveTo(0, hitLine);
    ctx.lineTo(canvas.width, hitLine);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawNotes() {
    const now = performance.now();

    notes.forEach(n => {
        if (n.live) {
            n.y += n.liveSpeed;
        } else {
            const totalDistance = n.hitY + n.length;
            const totalTime = Math.max(1, n.hitTime - n.spawnTime);
            const progress = Math.max(0, Math.min(1.25, (now - n.spawnTime) / totalTime));
            n.y = -n.length + totalDistance * progress;

            if (!n.sounded && now >= n.hitTime) {
                n.sounded = true;
                setKeyActive(n.note, 180);

                if (modeSelect.value === "flow") {
                    spawnParticles(noteToX(n.note) + 10, n.hitY - 8, 10);
                }
            }
        }

        if (modeSelect.value === "learn") {
            ctx.fillStyle = n.inScale ? "rgba(80,255,140,0.95)" : "rgba(255,80,110,0.96)";
            ctx.shadowBlur = 10;
            ctx.shadowColor = n.inScale ? "rgba(80,255,140,0.45)" : "rgba(255,80,110,0.45)";
        } else {
            ctx.fillStyle = "rgba(120,230,255,0.94)";
            ctx.shadowBlur = 18;
            ctx.shadowColor = "rgba(120,230,255,0.65)";
        }

        if (!n.live && n.prepare) {
            const distanceToHit = n.hitY - (n.y + n.length);
            if (distanceToHit < 55 && distanceToHit > 0) {
                ctx.fillStyle = "rgba(255,230,120,0.95)";
            }
        }

        ctx.fillRect(n.x, n.y, n.width, n.length);

        if (n.y > canvas.height + 100) {
            n.dead = true;
        }
    });

    notes = notes.filter(n => !n.dead);
    ctx.shadowBlur = 0;
}

function drawParticles() {
    if (modeSelect.value !== "flow") return;

    particles.forEach(p => {
        ctx.fillStyle = `rgba(160,235,255,${Math.max(0, p.life / 56)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        p.x += p.dx;
        p.y += p.dy;
        p.life -= 1;
    });

    particles = particles.filter(p => p.life > 0);
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

/* =========================
   INPUT
========================= */
function getPointerPos(evt) {
    const rect = canvas.getBoundingClientRect();
    const clientX = evt.clientX ?? (evt.touches && evt.touches[0] ? evt.touches[0].clientX : 0);
    const clientY = evt.clientY ?? (evt.touches && evt.touches[0] ? evt.touches[0].clientY : 0);
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
}

function getKeyAtPosition(x, y) {
    const keyboardHeight = getKeyboardHeight();
    const keyboardY = canvas.height - keyboardHeight;

    if (y < keyboardY) return null;

    const blackKeys = keys.filter(k => k.type === "black");
    for (const k of blackKeys) {
        const keyTop = keyboardY;
        const keyHeight = keyboardHeight * 0.62;
        if (x >= k.x && x <= k.x + blackWidth && y >= keyTop && y <= keyTop + keyHeight) {
            return k;
        }
    }

    const whiteKeys = keys.filter(k => k.type === "white");
    for (const k of whiteKeys) {
        if (x >= k.x && x <= k.x + whiteWidth && y >= keyboardY && y <= keyboardY + keyboardHeight) {
            return k;
        }
    }

    return null;
}

async function playPointerNote(evt) {
    evt.preventDefault();
    await initAudio();

    const pos = getPointerPos(evt);
    const key = getKeyAtPosition(pos.x, pos.y);

    if (key) {
        triggerLiveNote(key.note, 0.5, 112);
    }
}

/* =========================
   EVENTS
========================= */
startBtn.addEventListener("click", async () => {
    await initAudio();
});

playBtn.addEventListener("click", async () => {
    await initAudio();
    const items = getCurrentPlayableItems();
    scheduleMelody(items, loopEnabled);
});

loopBtn.addEventListener("click", () => {
    loopEnabled = !loopEnabled;
    loopBtn.textContent = loopEnabled ? "Loop: On" : "Loop: Off";
});

stopBtn.addEventListener("click", stopPlayback);

modeSelect.addEventListener("change", updateModeSound);
playModeSelect.addEventListener("change", updateModeSound);

rootSelect.addEventListener("change", updateScale);
scaleSelect.addEventListener("change", updateScale);

presetTypeSelect.addEventListener("change", () => {
    populatePresetSelect();
});

presetSelect.addEventListener("change", updatePresetStatus);

canvas.addEventListener("pointerdown", playPointerNote);
canvas.addEventListener("touchstart", playPointerNote, { passive: false });

document.addEventListener("keydown", async (e) => {
    const map = {
        "a":"C4", "w":"C#4", "s":"D4", "e":"D#4", "d":"E4",
        "f":"F4", "t":"F#4", "g":"G4", "y":"G#4", "h":"A4",
        "u":"A#4", "j":"B4", "k":"C5"
    };

    if (e.key === " ") {
        e.preventDefault();
        await initAudio();
        const items = getCurrentPlayableItems();
        scheduleMelody(items, loopEnabled);
        return;
    }

    const note = map[e.key.toLowerCase()];
    if (!note) return;

    await initAudio();
    triggerLiveNote(note, 0.5, 112);
});

/* =========================
   INIT
========================= */
populatePresetSelect();
updateModeSound();
audioStatus.textContent = "Audio: klikk Start Audio eller spill direkte";
loadScalesData();
</script>
</body>
</html>