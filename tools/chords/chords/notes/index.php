<?php
$pageTitle = "Chord Notes";
$pageDescription = "Explore the notes inside chords, see them on the staff and piano keyboard, and listen to the chord or arpeggio.";
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?= htmlspecialchars($pageTitle) ?> | ChordLink</title>
  <meta name="description" content="<?= htmlspecialchars($pageDescription) ?>">
  <script src="https://cdn.jsdelivr.net/npm/vexflow@4.1.0/build/cjs/vexflow.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/tone@14.7.77/build/Tone.js"></script>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main class="cl-page chord-notes-page">
    <section class="cl-app-panel chord-notes-app" aria-label="Chord Notes tool">
      <div class="app-head">
        <div>
          <h2>Explore a chord</h2>
          <p>Choose a root and chord type, or open the page with a chord in the URL.</p>
        </div>
        <span class="app-status beta">Beta</span>
      </div>
      <div class="controls" aria-label="Chord controls">
        <label><span>Root</span><select id="root"><option>C</option><option>C#</option><option>Db</option><option>D</option><option>Eb</option><option>E</option><option>F</option><option>F#</option><option>Gb</option><option>G</option><option>Ab</option><option>A</option><option>Bb</option><option>B</option></select></label>
        <label><span>Chord type</span><select id="type"><option value="maj">Major</option><option value="min">Minor</option><option value="dim">Dim</option><option value="aug">Aug</option><option value="7">7</option><option value="maj7">Maj7</option><option value="min7">m7</option><option value="m7b5">m7b5</option><option value="dim7">dim7</option><option value="sus2">sus2</option><option value="sus4">sus4</option><option value="6">6</option><option value="min6">m6</option><option value="add9">add9</option><option value="13">13</option></select></label>
      </div>

      <div class="visual-grid">
        <div class="notation-row"><div class="notation-wrapper">

          <div class="notation-header"><button id="toggleNotation" type="button"></button></div><div id="notation"></div></div></div>

          
        <div class="piano-row"><div id="piano"></div></div>
      </div>

      <div class="button-row"><div class="chord-buttons"><button type="button" onclick="playChord()">Play chord</button><button type="button" onclick="playArpeggio()">Arpeggio</button></div></div>
    </section>

    <section class="cl-info-panel">
      <h2>What this tool does</h2>
      <p>Chord Notes breaks down chord symbols into actual notes. </p>
    </section>
  </main>
  <script src="ui.js"></script>
</body>
</html>
