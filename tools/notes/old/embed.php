<!doctype html>
<html lang="no">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>ChordLink – Skala/Akkord (Noter + Pianoroll + Playback)</title>

  <style>
    body { font-family: system-ui, sans-serif; margin: 20px; }
    .wrap { display: grid; gap: 16px; max-width: 1100px; margin:auto; }
    .panel { padding: 16px; border: 1px solid #ddd; border-radius: 10px; }
    h2 { margin: 0 0 10px 0; font-size: 18px; }
    #notation svg { width: 100%; height: auto; display:block; }
    canvas { width: 100%; display:block; border: 1px solid #eee; border-radius: 8px; }
    .controls { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
    button { padding: 10px 14px; border-radius: 10px; border: 1px solid #ccc; background: #fff; font-weight: 700; }
    button:disabled { opacity: 0.5; }
    label { display:flex; gap:8px; align-items:center; }
    select, input[type="number"], input[type="text"]{
      padding: 8px; border-radius: 8px; border: 1px solid #ccc; font-size: 14px;
    }
    input[type="number"]{ width: 92px; }
    input[type="text"]{ width: 140px; }
    .meta { color:#555; font-size: 13px; line-height: 1.4; }
    .row { display:flex; gap: 10px; flex-wrap: wrap; align-items:center; }
    .chip { font-size:12px; background:#f6f6f6; padding:6px 10px; border-radius:999px; }
    pre { white-space: pre-wrap; margin:0; font-size:12px; }
    .hidden { display:none !important; }
    .err { color:#a00; font-weight:700; }
  </style>

  <script src="https://unpkg.com/tone@14.8.49/build/Tone.js"></script>
  <script src="https://unpkg.com/vexflow@4.2.5/build/cjs/vexflow.js"></script>

</head>

<body>
<div class="wrap">

  <div class="panel">
    <h2>Kontroll</h2>

    <div class="controls">
      <label>Mode
        <select id="mode">
          <option value="scale">Skala (API)</option>
          <option value="chord">Akkord (parser)</option>
        </select>
      </label>

      <span id="scaleFields" class="row">
        <label>Root <input id="root" type="text" value="C"></label>
        <label>Type <input id="type" type="text" value="major"></label>
      </span>

      <span id="chordFields" class="row hidden">
        <label>Akkord <input id="chord" type="text" value="Cmaj7"></label>
      </span>

      <label>Oct <input id="oct" type="number" value="4" min="0" max="8"></label>
      <label>Tempo <input id="tempo" type="number" value="90" min="30" max="220"></label>

      <button id="btnApply">Vis</button>
      <button id="btnPlay">Play</button>
      <button id="btnStop" disabled>Stop</button>
    </div>

    <div class="meta" style="margin-top:10px">
      URL-eksempler:
      <span class="chip">?mode=scale&amp;root=C&amp;type=minor&amp;oct=4</span>
      <span class="chip">?mode=scale&amp;root=Eb&amp;type=major&amp;oct=4</span>
      <span class="chip">?mode=chord&amp;chord=Cm7b5&amp;oct=4</span>
    </div>

    <div id="status" class="meta" style="margin-top:8px"></div>
  </div>

  <div class="panel">
    <h2>Noter (SVG) — highlight + avspilling</h2>
    <div id="notation"></div>
  </div>
<button id="export-notation-btn">
  Vis HTML for noter
</button>

<textarea
  id="notation-html-output"
  style="width:100%; height:200px; margin-top:10px; font-family:monospace;"
  readonly
></textarea>

  <div class="panel">
    <h2>Piano roll + keyboard — highlight + avspilling</h2>
    <canvas id="roll"></canvas>
  </div>
<button id="export-roll-btn">
  Vis HTML for piano-roll
</button>

<textarea
  id="roll-html-output"
  style="width:100%; height:200px; margin-top:10px; font-family:monospace;"
  readonly
></textarea>

  <div class="panel">
    <h2>Debug</h2>
    <pre id="debug"></pre>
  </div>

</div>
  <script src="notes-runtime.js"></script>  
  <script src="notes-funtime.js"></script>    
</body>
</html>
