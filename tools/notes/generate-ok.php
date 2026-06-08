<?php
// ---- Defaults fra URL ----
$root = $_GET['root'] ?? 'C';
$type = $_GET['type'] ?? 'major';
$oct  = $_GET['oct']  ?? '4';
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
  max-width: 640px;
}
label {
  display: block;
  margin: 12px 0 4px;
  font-weight: 600;
}
select, input {
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
  width: 100%;
  margin-top: 12px;
  font-family: monospace;
  font-size: 13px;
  height: 80px;
}
</style>
</head>

<body>

<h1>Notes Embed Generator</h1>

<form id="genForm" onsubmit="return false;">
  <label for="root">Root</label>
  <select id="root">
    <?php
    $roots = ['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
    foreach ($roots as $r) {
      $sel = ($r === $root) ? 'selected' : '';
      echo "<option value=\"$r\" $sel>$r</option>";
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
      $sel = ((string)$i === (string)$oct) ? 'selected' : '';
      echo "<option value=\"$i\" $sel>$i</option>";
    }
    ?>
  </select>

  <button id="generate">Generate</button>

  <label>Embed-kode</label>
  <textarea id="output" readonly></textarea>
</form>

<script>
const API = "/api/scales/piano.php";

const rootEl = document.getElementById("root");
const typeEl = document.getElementById("type");
const octEl  = document.getElementById("oct");
const outEl  = document.getElementById("output");

// --- Hent skala-typer fra API ---
async function loadTypes() {
  const current = "<?php echo htmlspecialchars($type); ?>";

  try {
    const res = await fetch("/data/scales.json");
    const json = await res.json();

    typeEl.innerHTML = "";

    Object.entries(json).forEach(([key, data]) => {
      const opt = document.createElement("option");
      opt.value = key;                 // brukes i embed-URL
      opt.textContent = data.name;     // pen visning
      if (key === current) opt.selected = true;
      typeEl.appendChild(opt);
    });

  } catch (e) {
    // trygg fallback
    typeEl.innerHTML = "<option value='major'>Major</option>";
  }
}


// --- Generer embed-kode ---
function generate() {
  const root = rootEl.value;
  const type = typeEl.value;
  const oct  = octEl.value;

const url =
`<iframe
  src="https://www.rockeskolen.com/tools/notes/embed.php?mode=scale&oct=${oct}&tempo=90&root=${root}&type=${type}&output=notation"
  style="width:100%; height:360px; border:0;"
></iframe>`;


  outEl.value = url;
}

// --- Events ---
document.getElementById("generate").onclick = generate;
loadTypes();
generate();
</script>

</body>
</html>
