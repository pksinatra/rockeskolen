<?php
$defaults = [
  'mode' => 'scale',
  'root' => $_GET['root'] ?? 'C',
  'type' => $_GET['type'] ?? 'major',
  'oct' => $_GET['oct'] ?? '4',
  'tempo' => $_GET['tempo'] ?? '90',
  'output' => $_GET['output'] ?? 'notation',
  'direction' => $_GET['direction'] ?? 'up',
];
$embedUrl = '/tools/notes/embed.php?' . http_build_query($defaults);
?>
<!doctype html>
<html lang="no">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Generator for noter og pianorull | Rockeskolen</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #172039;
      --muted: #68738e;
      --line: rgba(48, 61, 91, .14);
      --violet: #665cf6;
      --cyan: #4cc9f0;
      --panel: rgba(255,255,255,.86);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      padding: clamp(18px, 4vw, 48px);
      background:
        radial-gradient(circle at 12% 4%, rgba(76,201,240,.16), transparent 30rem),
        radial-gradient(circle at 88% 15%, rgba(134,92,246,.13), transparent 30rem),
        #f6f8fc;
      color: var(--ink);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .shell { width: min(1100px, 100%); margin: 0 auto; }
    header { margin-bottom: 24px; }
    .eyebrow { margin: 0 0 7px; color: var(--violet); font-size: 12px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
    h1 { margin: 0; font-size: clamp(28px, 4vw, 44px); letter-spacing: -.035em; }
    .intro { max-width: 680px; margin: 10px 0 0; color: var(--muted); line-height: 1.55; }
    .workspace { display: grid; grid-template-columns: minmax(280px, 360px) minmax(0, 1fr); gap: 20px; align-items: start; }
    .panel {
      border: 1px solid var(--line);
      border-radius: 20px;
      background: var(--panel);
      box-shadow: 0 18px 55px rgba(36, 48, 82, .09);
      backdrop-filter: blur(14px);
    }
    .settings { padding: 20px; }
    .preview-panel { padding: 14px; overflow: hidden; }
    .panel-title { margin: 0 0 16px; font-size: 16px; }
    .field { margin-top: 14px; }
    label, legend { display: block; margin: 0 0 6px; color: #3e4965; font-size: 12px; font-weight: 750; }
    select, input {
      width: 100%;
      min-height: 42px;
      padding: 8px 11px;
      border: 1px solid var(--line);
      border-radius: 11px;
      background: #fff;
      color: var(--ink);
      font: inherit;
    }
    select:focus-visible, input:focus-visible, button:focus-visible, textarea:focus-visible { outline: 3px solid rgba(76,201,240,.28); outline-offset: 2px; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    fieldset { margin: 16px 0 0; padding: 0; border: 0; }
    .segments { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
    .segment { position: relative; }
    .segment input { position: absolute; opacity: 0; pointer-events: none; }
    .segment span {
      display: flex;
      min-height: 42px;
      align-items: center;
      justify-content: center;
      gap: 6px;
      border: 1px solid var(--line);
      border-radius: 11px;
      background: #fff;
      color: #4c5872;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    }
    .segment input:checked + span { border-color: rgba(102,92,246,.45); background: linear-gradient(135deg, rgba(76,201,240,.12), rgba(134,92,246,.12)); color: #5148ce; box-shadow: inset 0 0 0 1px rgba(102,92,246,.08); }
    .generate {
      width: 100%;
      margin-top: 18px;
      min-height: 44px;
      border: 0;
      border-radius: 12px;
      background: linear-gradient(135deg, #4cc9f0, #7565f5 60%, #a76cf2);
      color: #fff;
      box-shadow: 0 10px 24px rgba(102,92,246,.22);
      font: inherit;
      font-weight: 800;
      cursor: pointer;
    }
    .preview-head, .code-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .preview-head { padding: 4px 5px 12px; }
    .preview-head h2, .code-head h2 { margin: 0; font-size: 15px; }
    .preview-head span { color: var(--muted); font-size: 12px; }
    iframe { display: block; width: 100%; border: 0; border-radius: 16px; background: #fff; }
    .code-panel { margin-top: 20px; padding: 18px; }
    .copy {
      min-height: 34px;
      padding: 6px 11px;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: #fff;
      color: #3d4862;
      font: inherit;
      font-size: 12px;
      font-weight: 750;
      cursor: pointer;
    }
    textarea { width: 100%; min-height: 150px; margin-top: 12px; padding: 14px; resize: vertical; border: 1px solid var(--line); border-radius: 13px; background: #101626; color: #dce7ff; font: 13px/1.55 ui-monospace, SFMono-Regular, Menlo, monospace; }
    @media (max-width: 800px) { .workspace { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <main class="shell">
    <header>
      <p class="eyebrow">Rockeskolen · verktøybygger</p>
      <h1>Noter og pianorull</h1>
      <p class="intro">Sett opp en spillbar skalaillustrasjon, forhåndsvis resultatet og kopier iframe-koden til teoriartikkelen.</p>
    </header>

    <div class="workspace">
      <form class="panel settings" id="genForm">
        <h2 class="panel-title">Innstillinger</h2>

        <div class="field">
          <label for="output">Visning</label>
          <select id="output">
            <option value="notation">Bare noter</option>
            <option value="piano">Bare pianorull</option>
            <option value="both">Noter og pianorull</option>
          </select>
        </div>

        <div class="two-col">
          <div class="field"><label for="root">Grunntone</label><select id="root"><?php foreach (['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'] as $note) echo '<option value="' . $note . '">' . $note . '</option>'; ?></select></div>
          <div class="field"><label for="oct">Oktav</label><select id="oct"><?php for ($i=1; $i<=6; $i++) echo '<option value="' . $i . '">' . $i . '</option>'; ?></select></div>
        </div>

        <div class="field"><label for="type">Skala</label><select id="type"><option value="major">Laster skalaer …</option></select></div>

        <div class="field"><label for="tempo">Tempo (BPM)</label><input id="tempo" type="number" min="30" max="240" step="1" value="90"></div>

        <fieldset>
          <legend>Avspillingsretning</legend>
          <div class="segments">
            <label class="segment"><input type="radio" name="direction" value="up" checked><span><b>↑</b> Opp</span></label>
            <label class="segment"><input type="radio" name="direction" value="down"><span><b>↓</b> Ned</span></label>
            <label class="segment"><input type="radio" name="direction" value="both"><span><b>↕</b> Begge</span></label>
          </div>
        </fieldset>

        <button class="generate" type="submit">Oppdater forhåndsvisning</button>
      </form>

      <section class="panel preview-panel">
        <div class="preview-head"><h2>Forhåndsvisning</h2><span id="previewMeta">C · Dur · 90 BPM · ↑</span></div>
        <iframe id="preview" src="<?= htmlspecialchars($embedUrl, ENT_QUOTES) ?>" title="Forhåndsvisning av noter og pianorull"></iframe>
      </section>
    </div>

    <section class="panel code-panel">
      <div class="code-head"><h2>Embed-kode</h2><button class="copy" id="copyCode" type="button">Kopier kode</button></div>
      <textarea id="embedCode" readonly spellcheck="false"></textarea>
    </section>
  </main>

  <script>
    const form = document.getElementById("genForm");
    const rootEl = document.getElementById("root");
    const typeEl = document.getElementById("type");
    const octEl = document.getElementById("oct");
    const tempoEl = document.getElementById("tempo");
    const outputEl = document.getElementById("output");
    const embedEl = document.getElementById("embedCode");
    const preview = document.getElementById("preview");
    const previewMeta = document.getElementById("previewMeta");
    const initial = <?= json_encode($defaults, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?>;

    function selectedDirection() { return form.elements.direction.value || "up"; }
    function frameHeight(output) { return output === "notation" ? 210 : output === "piano" ? 360 : 520; }
    function directionIcon(direction) { return direction === "down" ? "↓" : direction === "both" ? "↕" : "↑"; }

    async function loadTypes() {
      try {
        const response = await fetch("/assets/data/scales.json");
        const scales = await response.json();
        typeEl.innerHTML = "";
        Object.entries(scales).forEach(([key, scale]) => {
          const option = document.createElement("option");
          option.value = key;
          option.textContent = scale.name_no || scale.name || key;
          typeEl.appendChild(option);
        });
      } catch (_) {
        typeEl.innerHTML = '<option value="major">Dur</option>';
      }
      typeEl.value = initial.type;
    }

    function generate() {
      const direction = selectedDirection();
      const params = new URLSearchParams({
        mode: "scale",
        root: rootEl.value,
        type: typeEl.value,
        oct: octEl.value,
        tempo: String(Math.min(240, Math.max(30, Number(tempoEl.value) || 90))),
        output: outputEl.value,
        direction
      });
      const src = `https://www.rockeskolen.com/tools/notes/embed.php?${params}`;
      const height = frameHeight(outputEl.value);
      embedEl.value = `<iframe\n  src="${src}"\n  width="100%"\n  height="${height}"\n  frameborder="0"\n  loading="lazy"\n  title="Spillbar skalaillustrasjon">\n</iframe>`;
      // Preview the current host (including localhost); generated embed code stays canonical.
      preview.src = `/tools/notes/embed.php?${params}`;
      preview.height = height;
      const scaleLabel = typeEl.options[typeEl.selectedIndex]?.textContent || typeEl.value;
      previewMeta.textContent = `${rootEl.value} · ${scaleLabel} · ${params.get("tempo")} BPM · ${directionIcon(direction)}`;
    }

    form.addEventListener("submit", (event) => { event.preventDefault(); generate(); });
    document.getElementById("copyCode").addEventListener("click", async (event) => {
      await navigator.clipboard.writeText(embedEl.value);
      event.currentTarget.textContent = "Kopiert!";
      setTimeout(() => { event.currentTarget.textContent = "Kopier kode"; }, 1400);
    });

    outputEl.value = initial.output;
    rootEl.value = initial.root;
    octEl.value = initial.oct;
    tempoEl.value = initial.tempo;
    const initialDirection = ["up", "down", "both"].includes(initial.direction) ? initial.direction : "up";
    form.querySelector(`[name="direction"][value="${initialDirection}"]`).checked = true;
    loadTypes().then(generate);
  </script>
</body>
</html>
