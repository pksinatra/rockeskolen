<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="UTF-8">
  <title>Skala-visning – ChordLink</title>
  <link rel="stylesheet" href="/tools/scales/piano/app.css">
  <style>
    #piano-container {
      max-width: 720px;
      margin: 2em auto;
    }
    #piano {
      width: 100%;
    }
    .play-button {
      margin-top: 1em;
      padding: 8px 16px;
      font-size: 16px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <h1>Skala-visning: C-dur</h1>
  <div id="piano-container">
    <div id="piano"></div>
    <button class="play-button" onclick="playScale()">▶ Spill av skala</button>
  </div>

  <script>
    const apiUrl = "https://www.chordlink.net/api/scales/piano.php?root=C&scale=major&oct=4";
    let scaleNotes = [];

    function renderPiano(notes) {
      const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const container = document.getElementById("piano");
      container.innerHTML = '';

      for (let i = 0; i < 12; i++) {
        const note = keys[i];
        const key = document.createElement('div');
        key.className = note.includes('#') ? 'black-key' : 'white-key';
        if (notes.includes(note)) key.classList.add('active');
        key.innerText = note;
        container.appendChild(key);
      }
    }

    function playScale() {
      if (!window.AudioContext) return;
      const ctx = new AudioContext();
      let time = ctx.currentTime;

      scaleNotes.forEach((note, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(midiToFreq(note.midi), time);
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.2, time);
        osc.start(time);
        osc.stop(time + 0.4);
        time += 0.4;
      });
    }

    function midiToFreq(midiNote) {
      return 440 * Math.pow(2, (midiNote - 69) / 12);
    }

    async function loadScale() {
      try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        scaleNotes = data;
        const names = data.map(n => n.note);
        renderPiano(names);
      } catch (e) {
        console.error("Feil ved lasting av skala:", e);
      }
    }

    loadScale();
  </script>
</body>
</html>
