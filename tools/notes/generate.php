<?php
// -------------------------
// Defaults (kun til preview)
// -------------------------
$mode   = $_GET['mode']   ?? 'scale';
$root   = $_GET['root']   ?? 'C';
$type   = $_GET['type']   ?? 'major';
$oct    = $_GET['oct']    ?? 4;
$tempo  = $_GET['tempo']  ?? 90;
$output = $_GET['output'] ?? 'notation';

// Embed-URL til preview
$embedUrl = "/tools/notes/embed.php"
  . "?mode=$mode"
  . "&root=$root"
  . "&type=$type"
  . "&oct=$oct"
  . "&tempo=$tempo"
  . "&output=$output";

// Preview-høyde
$height = match ($output) {
  'notation' => 260,
  'piano'    => 200,
  'both'     => 380,
  default    => 260
};
?>
<!doctype html>
<html lang="no">
<head>
<meta charset="utf-8">
<title>Notes Embed Generator</title>
<meta name="viewport" content="width=device-width, initial-scale=1">

<style>
body {
  font-family: system-ui, -apple-system, sans-serif;
  padding: 20px;
  max-width: 720px;
}
label {
  display: block;
  margin: 12px 0 4px;
  font-weight: 600;
}
select, input, textarea {
  width: 100%;
  padding: 8px;
  font-size: 14px;
}
button {
  margin-top: 16px;
  padding: 10px 16px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}
textarea {
  font-family: monospace;
  height: 140px;
}
iframe {
  margin-top: 12px;
  border: 1px solid #ccc;
}
</style>
</head>

<body>

<h1>Notes Embed Generator</h1>

<form id="genForm" onsubmit="return false;">

  <label for="output">Visning</label>
  <select id="output">
    <option value="notation">Noter</option>
    <option value="piano">Piano-roll</option>
    <option value="both">Noter + piano</option>
  </select>

  <label for="root">Root</label>
  <select id="root">
    <?php
    $roots = ['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
    foreach ($roots as $r) {
      echo "<option value=\"$r\">$r</option>";
    }
    ?>
  </select>

  <label for="type">Type</label>
  <select id="type">
    <option>Loading…</option>
  </select>

  <label for="oct">Octave</label>
  <select id="oct">
  <?php
  for ($i=1; $i<=6; $i++) {
    $selected = ($i == 4) ? "selected" : "";
    echo "<option value=\"$i\" $selected>$i</option>";
  }
  ?>
  </select>

  <button id="generate">Generate</button>

  <h3>Embed-kode</h3>
  <textarea id="embedCode" readonly></textarea>

</form>

<h3>Forhåndsvisning</h3>
<iframe
  id="preview"
  src="<?= $embedUrl ?>"
  width="100%"
  height="<?= $height ?>">
</iframe>
<div id="pianoroll-wrapper">
  <canvas id="pianoRoll" width="1000" height="180"></canvas>
</div>
<script>
// -------------------------
// DOM
// -------------------------
const rootEl   = document.getElementById("root");
const typeEl   = document.getElementById("type");
const octEl    = document.getElementById("oct");
const outputEl = document.getElementById("output");
const embedEl  = document.getElementById("embedCode");
const preview  = document.getElementById("preview");

// -------------------------
// Last skala-typer
// -------------------------
async function loadTypes() {
  try {
    const res = await fetch("/data/scales.json");
    const json = await res.json();
    typeEl.innerHTML = "";
    Object.entries(json).forEach(([key, data]) => {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = data.name;
      typeEl.appendChild(opt);
    });
  } catch {
    typeEl.innerHTML = "<option value='major'>Major</option>";
  }
}

// -------------------------
// Generer embed + preview
// -------------------------
function generate() {
  const root   = encodeURIComponent(rootEl.value);
  const type   = typeEl.value;
  const oct    = octEl.value;
  const output = outputEl.value;

  const height =
    output === "notation" ? 260 :
    output === "piano"    ? 200 :
    380;

  const src =
    `https://www.rockeskolen.com/tools/notes/embed.php`
    + `?mode=scale`
    + `&root=${root}`
    + `&type=${type}`
    + `&oct=${oct}`
    + `&tempo=90`
    + `&output=${output}`;

  embedEl.value =
`<iframe
  src="${src}"
  width="100%"
  height="${height}"
  frameborder="0"
  loading="lazy">
</iframe>`;

  preview.src = src;
  preview.height = height;
}

// -------------------------
// Init
// -------------------------
document.getElementById("generate").onclick = generate;
loadTypes().then(generate);
</script>

</body>
</html>
