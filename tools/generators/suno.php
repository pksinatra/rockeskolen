<!DOCTYPE html>
<html lang="no">
<head>
<meta charset="UTF-8">
<title>AI Music Prompt Builder</title>

<style>
body { font-family: Arial; background:#111; color:#eee; padding:20px; }
h1 { color:#ff4444; }
select, textarea, button {
  width:100%; margin:8px 0; padding:10px;
  background:#222; color:#eee; border:1px solid #444;
}
button { background:#ff4444; cursor:pointer; }
textarea { height:200px; }
.section { margin-bottom:20px; }
</style>

</head>
<body>

<h1>🎛️ AI Music Prompt Builder</h1>

<div class="section">
<label>Stil</label>
<select id="style">
  <option>Nordic minimalism</option>
  <option>Ambient electronica</option>
  <option>Progressive rock</option>
  <option>Dub techno</option>
</select>

<label>Ekstra stil</label>
<select id="style2">
  <option>subtle classical phrasing</option>
  <option>organic flow</option>
  <option>hypnotic repetition</option>
</select>
</div>

<div class="section">
<label>Toneart</label>
<select id="key">
  <option>G major → E minor</option>
  <option>C major → A minor</option>
  <option>D minor → F major</option>
</select>
</div>

<div class="section">
<label>Motiv</label>
<select id="motif">
  <option>B4 whole, F#5 halves, D5 whole</option>
  <option>Simple repeating motif</option>
  <option>No defined motif</option>
</select>
</div>

<div class="section">
<label>Struktur</label>
<select id="structure">
  <option>Intro – Verse – Chorus – Break – Final</option>
  <option>A – B – A</option>
</select>
</div>

<div class="section">
<label>Harmonikk</label>
<select id="harmony">
  <option>Em – B7 – Am – D – G</option>
  <option>Circle of fifths</option>
</select>
</div>

<div class="section">
<label>Instrumenter</label>
<select id="instruments">
  <option>Hardanger fiddle, willow flute, synth pads</option>
  <option>Only synths and ambient textures</option>
</select>
</div>

<div class="section">
<label>Atmosfære</label>
<select id="mood">
  <option>spiritual, hypnotic, spacious</option>
  <option>calm, meditative, floating</option>
</select>
</div>

<button onclick="generatePrompt()">Generate Prompt</button>

<textarea id="output"></textarea>

<script>
function generatePrompt() {
  let prompt = 
`Blending ${style.value} and ${style2.value}.
Tonality: ${key.value}.
Motif: ${motif.value}.
Structure: ${structure.value}.
Harmony: ${harmony.value}.
Instruments: ${instruments.value}, no classical orchestra.
Atmosphere: ${mood.value}.`;

  document.getElementById("output").value = prompt;
}
</script>

</body>
</html>