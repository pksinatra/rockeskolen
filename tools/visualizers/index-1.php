<!DOCTYPE html>
<html lang="no">
<head>
<meta charset="UTF-8">
<title>Falling Notes Visualizer</title>
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

let notes = [];

// 🎹 Synth
const synth = new Tone.PolySynth(Tone.Synth).toDestination();

// 🎼 Demo-sekvens
const sequence = [
    { note: "C4", time: 0 },
    { note: "E4", time: 0.5 },
    { note: "G4", time: 1 },
    { note: "B4", time: 1.5 },
    { note: "C5", time: 2 }
];

// Start Tone
document.body.addEventListener("click", async () => {
    await Tone.start();
    playSequence();
});

// Spill noter + lag visuelle blokker
function playSequence() {
    sequence.forEach(n => {
        setTimeout(() => {
            synth.triggerAttackRelease(n.note, "8n");

            notes.push({
                x: noteToX(n.note),
                y: 0,
                speed: 3,
                length: 80
            });

        }, n.time * 1000);
    });
}

// Map note → x-posisjon
function noteToX(note) {
    const notesMap = ["C", "D", "E", "F", "G", "A", "B"];
    let base = note[0];
    let octave = parseInt(note.slice(-1));

    let index = notesMap.indexOf(base);
    return (index + (octave - 3) * 7) * 40 + 100;
}

// 🎨 Tegn
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    notes.forEach(n => {
        ctx.fillStyle = "cyan";
        ctx.shadowBlur = 20;
        ctx.shadowColor = "cyan";

        ctx.fillRect(n.x, n.y, 20, n.length);

        n.y += n.speed;
    });

    requestAnimationFrame(draw);
}

draw();
</script>

</body>
</html>