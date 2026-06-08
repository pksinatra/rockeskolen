<!DOCTYPE html>
<html lang="no">
<head>
<meta charset="UTF-8">
<title>Falling Notes Visualizer v2</title>
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

const keyboardHeight = 120;

// 🎹 Synth
const synth = new Tone.PolySynth(Tone.Synth).toDestination();

// 🎼 Note mapping (1 oktav + litt til)
const noteOrder = [
"C4","C#4","D4","D#4","E4","F4",
"F#4","G4","G#4","A4","A#4","B4","C5"
];

let activeKeys = {};
let notes = [];

// 🎼 Demo sequence
const sequence = [
    { note: "C4", time: 0 },
    { note: "E4", time: 0.4 },
    { note: "G4", time: 0.8 },
    { note: "B4", time: 1.2 },
    { note: "C5", time: 1.6 }
];

// Start Tone
document.body.addEventListener("click", async () => {
    await Tone.start();
    playSequence();
});

// Spill + vis
function playSequence() {
    sequence.forEach(n => {
        setTimeout(() => {
            synth.triggerAttackRelease(n.note, "8n");

            notes.push({
                note: n.note,
                x: noteToX(n.note),
                y: 0,
                speed: 2.5,
                length: 80
            });

            activeKeys[n.note] = true;

            setTimeout(() => {
                activeKeys[n.note] = false;
            }, 200);

        }, n.time * 1000);
    });
}

// Map note → X
function noteToX(note) {
    let index = noteOrder.indexOf(note);
    return index * 50 + 100;
}

// 🎨 Tegn keyboard
function drawKeyboard() {
    noteOrder.forEach((note, i) => {
        let x = noteToX(note);
        let y = canvas.height - keyboardHeight;

        let isSharp = note.includes("#");

        ctx.fillStyle = isSharp ? "#111" : "#fff";

        if (activeKeys[note]) {
            ctx.fillStyle = "cyan";
        }

        ctx.fillRect(x, y, 48, keyboardHeight);

        ctx.strokeStyle = "#000";
        ctx.strokeRect(x, y, 48, keyboardHeight);
    });
}

// 🎨 Tegn noter
function drawNotes() {
    notes.forEach(n => {
        ctx.fillStyle = "cyan";
        ctx.shadowBlur = 25;
        ctx.shadowColor = "cyan";

        ctx.fillRect(n.x, n.y, 30, n.length);

        n.y += n.speed;

        // Trigger når de treffer keyboard
        if (n.y + n.length >= canvas.height - keyboardHeight) {
            activeKeys[n.note] = true;

            setTimeout(() => {
                activeKeys[n.note] = false;
            }, 100);
        }
    });
}

// 🎬 Loop
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawNotes();
    drawKeyboard();

    requestAnimationFrame(draw);
}

draw();
</script>

</body>
</html>