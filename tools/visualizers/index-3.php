<!DOCTYPE html>
<html lang="no">
<head>
<meta charset="UTF-8">
<title>Visualizer v3 - Piano + MIDI</title>
<script src="https://unpkg.com/tone@14.7.77/build/Tone.js"></script>
<style>
    body {
        margin: 0;
        background: black;
        overflow: hidden;
    }
    canvas {
        display: block;
    }
</style>
</head>
<body>

<canvas id="canvas"></canvas>

<script>
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const keyboardHeight = 140;

// 🎹 Synth
const synth = new Tone.PolySynth(Tone.Synth).toDestination();

let notes = [];
let activeKeys = {};

// 🎼 Piano mapping
const keys = [];
const startOctave = 3;
const octaves = 3;

const whiteOrder = ["C","D","E","F","G","A","B"];
const blackMap = {
    "C": "C#",
    "D": "D#",
    "F": "F#",
    "G": "G#",
    "A": "A#"
};

// Bygg tangenter
let xOffset = 100;
const whiteWidth = 40;
const blackWidth = 25;

for (let o = startOctave; o < startOctave + octaves; o++) {
    whiteOrder.forEach(note => {
        keys.push({
            note: note + o,
            x: xOffset,
            type: "white"
        });

        // svarte tangenter
        if (blackMap[note]) {
            keys.push({
                note: blackMap[note] + o,
                x: xOffset + whiteWidth * 0.7,
                type: "black"
            });
        }

        xOffset += whiteWidth;
    });
}

// 🎼 Note → X
function noteToX(note) {
    let key = keys.find(k => k.note === note);
    return key ? key.x : 0;
}

// 🎨 Keyboard
function drawKeyboard() {
    let y = canvas.height - keyboardHeight;

    // hvite
    keys.filter(k => k.type === "white").forEach(k => {
        ctx.fillStyle = activeKeys[k.note] ? "cyan" : "#fff";
        ctx.fillRect(k.x, y, whiteWidth, keyboardHeight);

        ctx.strokeStyle = "#000";
        ctx.strokeRect(k.x, y, whiteWidth, keyboardHeight);
    });

    // svarte
    keys.filter(k => k.type === "black").forEach(k => {
        ctx.fillStyle = activeKeys[k.note] ? "cyan" : "#111";
        ctx.fillRect(k.x, y, blackWidth, keyboardHeight * 0.6);
    });
}

// 🎨 Noter
function drawNotes() {
    notes.forEach(n => {
        ctx.fillStyle = "cyan";
        ctx.shadowBlur = 20;
        ctx.shadowColor = "cyan";

        ctx.fillRect(n.x, n.y, 20, n.length);

        n.y += n.speed;

        if (n.y > canvas.height) {
            n.dead = true;
        }
    });

    notes = notes.filter(n => !n.dead);
}

// 🎬 Loop
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawNotes();
    drawKeyboard();

    requestAnimationFrame(draw);
}
draw();

const melody = [
    { note: "C4", time: 0 },
    { note: "D4", time: 0.4 },
    { note: "E4", time: 0.8 },
    { note: "G4", time: 1.2 },
    { note: "C5", time: 1.6 }
];

playMelody(melody);
function playMelody(melody) {
    melody.forEach(n => {
        setTimeout(() => {
            triggerNote(n.note);
        }, n.time * 1000);
    });
}


// 🎹 Spill note
function triggerNote(note) {
    synth.triggerAttackRelease(note, "8n");

    notes.push({
        note: note,
        x: noteToX(note),
        y: 0,
        speed: 3,
        length: 90
    });

    activeKeys[note] = true;

    setTimeout(() => {
        activeKeys[note] = false;
    }, 200);
}

// 🖱️ Klikk = test
document.body.addEventListener("click", async () => {
    await Tone.start();
    triggerNote("C4");
});

// 🎛️ MIDI
if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess().then(midi => {
        const inputs = midi.inputs.values();

        for (let input of inputs) {
            input.onmidimessage = msg => {
                let [status, note, velocity] = msg.data;

                if (status === 144 && velocity > 0) {
                    let noteName = midiToNote(note);
                    triggerNote(noteName);
                }
            };
        }
    });
}

// MIDI → note
function midiToNote(num) {
    const notes = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
    let octave = Math.floor(num / 12) - 1;
    return notes[num % 12] + octave;
}
</script>

</body>
</html>