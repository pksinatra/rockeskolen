<?php
// tools/instruments/piano_playable.php
// (adjust include paths to match how you do it in the other tools)

?><!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ChordLink – Playable Piano</title>

  <link rel="stylesheet" href="/assets/css/piano_playable.css">

  <!-- Tone.js for audio -->
  <script src="https://unpkg.com/tone@14.7.77/build/Tone.js"></script>

  <!-- Our piano script -->
  <script src="/assets/js/piano_playable.js" defer></script>
</head>
<body>

  <h1>ChordLink – Playable Piano</h1>

  <div id="piano-wrapper">
    <div id="piano"></div>
  </div>

  <section id="tone-controls">
    <h2>Sound</h2>

    <label>
      Waveform:
      <select id="waveform">
        <option value="sine">Sine</option>
        <option value="triangle">Triangle</option>
        <option value="square">Square</option>
        <option value="sawtooth">Saw</option>
      </select>
    </label>

    <label>
      Volume:
      <input type="range" id="volume" min="-30" max="0" value="-12">
    </label>

    <label>
      Attack:
      <input type="range" id="attack" min="0" max="1" step="0.01" value="0.02">
    </label>

    <label>
      Release:
      <input type="range" id="release" min="0" max="2" step="0.05" value="0.3">
    </label>

    <label>
      Transpose:
      <select id="transpose">
        <option value="-24">-2 oct</option>
        <option value="-12">-1 oct</option>
        <option value="0" selected>0</option>
        <option value="12">+1 oct</option>
        <option value="24">+2 oct</option>
      </select>
    </label>
  </section>

  <section id="sequencer">
    <h2>Mini Step Sequencer</h2>

    <div id="seq-grid"></div>

    <div id="seq-controls">
      <label>
        Tempo:
        <input type="number" id="tempo" value="100" min="40" max="220">
      </label>
   <!-- NY: gate length -->
    <label>
      Gate length:
      <select id="gate-length">
        <option value="32n">32-note</option>
        <option value="16n" selected>16-note (standard)</option>
        <option value="8n">8-note</option>
        <option value="tie">Tie (hold)</option>
      </select>
    </label>
      <button id="seq-play">Play</button>
      <button id="seq-stop">Stop</button>
      <button id="seq-clear">Clear</button>
    </div>

    <p class="hint">
      Tip: choose a step, click keys on the piano to add notes to that step,
      then hit Play.
    </p>
  </section>

</body>
</html>
