<?php require_once $_SERVER['DOCUMENT_ROOT'] . '/tools/includes/app-header.php'; ?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>ChordProg – 250 Chord Progressions | ChordLink</title>
  <style>
    .scaleNotation{background:#fff;color:#111;border-radius:10px;overflow-x:auto;margin:12px 0;padding:6px;min-width:0}
    .scaleNotation svg{display:block}
    .melodyInstrument{max-width:320px;margin-top:12px}
    :root { --panel:#12141a; --panel2:#171a22; --text:#e8e8ea; --muted:#b3b7c2; --line:#2a2f3a; --accent:#ff375f; --ok:#b7ffcf; --warn:#ffd79a; --bad:#ff9aa9; }
    body{ margin:0; font-family: system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif; background:linear-gradient(180deg,#08090d, #0b0c10 35%, #0b0c10); color:var(--text); }
    .explorer-header{ padding:18px 16px; border-bottom:1px solid var(--line); background:rgba(18,20,26,.9); position:sticky; top:0; backdrop-filter: blur(8px); z-index:3; }
    .explorer-header h1{ margin:0; font-size:16px; letter-spacing:.2px; }
    .explorer-header .sub{ margin-top:4px; color:var(--muted); font-size:12px; }
    .explorer-header{padding-right:76px}
    #languageToggle{position:absolute;right:16px;top:14px;width:44px;height:44px;border-radius:50%;padding:6px;display:grid;place-items:center;background:#171a22;cursor:pointer}
    #languageToggle svg{width:30px;height:30px;border-radius:50%;display:block}
    #languageToggle[aria-pressed="true"]{border-color:var(--accent);box-shadow:0 0 0 2px rgba(255,55,95,.2)}
    #languageToggle:focus-visible{outline:3px solid #fff;outline-offset:3px}
    .wrap{ max-width:1280px; margin:0 auto; padding:16px; display:grid; grid-template-columns: 420px 1fr; gap:14px; }
    @media (max-width: 1020px){ .wrap{ grid-template-columns: 1fr; } }
    .card{ background:var(--panel); border:1px solid var(--line); border-radius:14px; overflow:hidden; }
    .card h2{ margin:0; padding:12px 14px; font-size:13px; border-bottom:1px solid var(--line); background:var(--panel2); }
    .controls{ padding:12px 14px; display:grid; gap:10px; }
    .row{ display:grid; grid-template-columns: 1fr 1fr; gap:10px; }
    label{ display:block; font-size:11px; color:var(--muted); margin-bottom:6px; }
    select, input, button, textarea{
      width:100%; box-sizing:border-box;
      background:#0e1016; color:var(--text);
      border:1px solid var(--line);
      border-radius:10px;
      padding:10px 10px; font-size:13px;
      outline:none;
    }
    button{ cursor:pointer; background:linear-gradient(180deg,#151826,#0e1016); }
    button.primary{ border-color: rgba(255,55,95,.6); box-shadow: 0 0 0 1px rgba(255,55,95,.15) inset; }
    button.primary:hover{ filter:brightness(1.05); }
    .list{ padding:10px; display:grid; gap:8px; }
    .item{ padding:10px; border:1px solid var(--line); border-radius:12px; background:#0e1016; display:grid; gap:6px; }
    .item .top{ display:flex; gap:8px; align-items:center; justify-content:space-between; }
    .badge{ font-size:10px; color:#ffd7df; background:rgba(255,55,95,.14); border:1px solid rgba(255,55,95,.25);
            padding:3px 7px; border-radius:999px; white-space:nowrap; }
    .name{ font-size:13px; margin:0; }
    .roman{ font-size:12px; color:var(--muted); }
    .btns{ display:flex; gap:8px; }
    .btns button{ padding:8px 10px; font-size:12px; }
    .detail{ padding:12px 14px; display:grid; gap:12px; }
    .mono{ font-family: ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace; }
    .grid2{ display:grid; grid-template-columns: 1fr 1fr; gap:10px; }
    .bigline{ border:1px dashed rgba(255,55,95,.35); border-radius:12px; padding:10px; background:rgba(255,55,95,.06); }
    .bigline .k{ font-size:11px; color:var(--muted); }
    .bigline .v{ font-size:14px; margin-top:6px; }
    .help{ font-size:12px; color:var(--muted); line-height:1.35; }
    textarea{ min-height:140px; resize:vertical; }
    .pillrow{ display:flex; flex-wrap:wrap; gap:8px; }
    .pill{ padding:6px 10px; border-radius:999px; border:1px solid var(--line); background:#0e1016; font-size:12px; color:var(--muted); }
    .split{ display:grid; grid-template-columns: 1fr 1fr; gap:10px; }
    @media (max-width: 860px){ .split{ grid-template-columns: 1fr; } }
    .scaleList{ display:grid; gap:8px; }
    .scaleItem{ border:1px solid var(--line); border-radius:12px; background:#0e1016; padding:10px; display:grid; gap:6px; }
    .scaleItem .head{ display:flex; align-items:center; justify-content:space-between; gap:8px; }
    .scaleName{ font-size:13px; }
    .score{ font-size:11px; color:var(--muted); }
    .tagrow{ display:flex; flex-wrap:wrap; gap:6px; }
    .tag{ font-size:11px; padding:3px 8px; border-radius:999px; border:1px solid var(--line); background:#0c0e14; color:var(--muted); }
    .tag.ok{ border-color: rgba(183,255,207,.35); color: var(--ok); }
    .tag.warn{ border-color: rgba(255,215,154,.35); color: var(--warn); }
    .tag.bad{ border-color: rgba(255,154,169,.35); color: var(--bad); }
    .btnInline{ display:flex; gap:8px; }
    .btnInline button{ padding:8px 10px; font-size:12px; }
    .table{ width:100%; border-collapse:collapse; }
    .table th, .table td{ border-bottom:1px solid var(--line); padding:8px 6px; font-size:12px; text-align:left; vertical-align:top; }
    .table th{ color:var(--muted); font-weight:600; }
    .notegrid{ display:grid; gap:8px; }
    .noteRow{ display:flex; flex-wrap:wrap; gap:6px; }
    .notePill{ font-size:12px; padding:4px 8px; border-radius:999px; border:1px solid var(--line); background:#0c0e14; }
    .notePill.in{ border-color: rgba(183,255,207,.25); }
    .notePill.out{ border-color: rgba(255,154,169,.25); opacity:.9; }
    .libraryIntro{padding:14px;border:1px solid rgba(255,55,95,.28);border-radius:14px;background:rgba(255,55,95,.07);line-height:1.45}
    .libraryIntro strong{display:block;font-size:16px;margin-bottom:4px}
    .resultCount{font-size:12px;color:var(--muted);padding:0 2px}
    .journey{padding:18px 16px;border-bottom:1px solid var(--line);background:linear-gradient(135deg,rgba(255,55,95,.12),rgba(99,102,241,.08))}
    .journey h2{padding:0;border:0;background:none;font-size:22px;margin:0 0 5px}.journey p{margin:0 0 16px;color:var(--muted);line-height:1.45}
    .question{margin-top:14px}.question>span{display:block;font-size:12px;font-weight:700;margin-bottom:8px}
    .choiceRow{display:flex;flex-wrap:wrap;gap:7px}.choice{width:auto;padding:8px 12px;border-radius:999px}.choice.active{background:var(--accent);border-color:var(--accent);color:white}
    .findBtn{margin-top:16px;max-width:260px;background:var(--accent);border-color:var(--accent);font-weight:800}
    .simpleTools{padding:12px 14px;display:grid;grid-template-columns:1fr 1fr;gap:10px;border-bottom:1px solid var(--line)}
    .resultLead{padding:12px 14px 0;font-size:13px;color:var(--muted)}
    .item{transition:border-color .15s,transform .15s}.item:hover{transform:translateY(-1px)}
    .item .why{font-size:12px;color:var(--muted);line-height:1.4}
    .mainActions{display:grid;grid-template-columns:2fr 1fr 1fr;gap:8px}.mainActions button{font-weight:700}
    .variantGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.variantCard{padding:11px;border:1px solid var(--line);border-radius:12px;background:#0e1016;display:grid;gap:7px}.variantCard strong{font-size:13px}.variantCard p{font-size:11px;color:var(--muted);margin:0;line-height:1.4}
    .melodyBox{padding:13px;border:1px solid rgba(183,255,207,.25);border-radius:12px;background:rgba(183,255,207,.05);display:grid;gap:8px}.melodyBox h3{margin:0;font-size:15px}
    .tempoControl{padding:12px;border:1px solid var(--line);border-radius:12px;background:#0e1016;display:grid;gap:8px}.tempoHead{display:flex;align-items:center;justify-content:space-between;gap:10px}.tempoValue{font-size:18px;font-weight:800;color:#ffd7df}.tempoControl input[type=range]{padding:0;border:0;accent-color:var(--accent)}
    .tempoSuggestions{display:flex;flex-wrap:wrap;gap:6px;margin-top:5px}.tempoButton{width:auto;padding:6px 10px;border-radius:999px;font-weight:700}.tempoButton.active{background:var(--accent);border-color:var(--accent);color:#fff}
    .keyQuickMenu{display:none;padding:12px;border:1px solid rgba(255,55,95,.45);border-radius:12px;background:#0e1016}.keyQuickMenu.open{display:block}.keyQuickMenu .choiceRow{margin-top:8px}.keyButton{width:auto;min-width:54px}.keyButton.active{background:var(--accent);border-color:var(--accent);color:#fff}
    .companion{display:grid;gap:10px;padding:12px;border:1px solid rgba(255,55,95,.28);border-radius:14px;background:rgba(255,55,95,.06)}
    .companion h3{margin:0;font-size:18px}.companion p{margin:0;line-height:1.5}
    .metaGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.metaBox{padding:10px;border:1px solid var(--line);border-radius:10px;background:#0e1016}
    .metaBox .k{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}.metaBox .v{margin-top:5px;font-size:13px;line-height:1.4}
    details.advanced{border-top:1px solid var(--line);padding-top:12px}details.advanced>summary{cursor:pointer;font-weight:700;margin-bottom:12px}
    @media(max-width:700px){.metaGrid,.variantGrid,.mainActions,.simpleTools{grid-template-columns:1fr}.desktopAdvanced{display:none}.findBtn{max-width:none}}
  
.panic-button{position:fixed;right:18px;bottom:calc(18px + env(safe-area-inset-bottom));z-index:1000;width:44px;height:44px;min-height:44px;padding:0;display:grid;place-items:center;border:1px solid #ff7b87;border-radius:50%;background:#631d2a;color:#fff;font:700 15px system-ui;cursor:pointer;box-shadow:0 4px 20px #0008}.panic-button:focus-visible{outline:3px solid #fff;outline-offset:3px}
</style>
<?php chordlink_app_header_styles(); chordlink_share_meta(['title'=>'ChordProg | ChordLink','description'=>'Explore 250 chord progressions, find melody scales and export MIDI.','path'=>'/tools/chordprog/','image'=>'/images/chordlink-home-share-v1.jpg']); ?>
</head>
<body>
<?php chordlink_app_header('ChordProg'); ?>
<header class="explorer-header">
  <button id="languageToggle" type="button" aria-label="Oversett til norsk" title="Oversett til norsk" aria-pressed="false"><svg viewBox="0 0 30 30" aria-hidden="true"><defs><clipPath id="flagCircle"><circle cx="15" cy="15" r="15"/></clipPath></defs><g clip-path="url(#flagCircle)"><path fill="#ba0c2f" d="M0 0h30v30H0z"/><path fill="#fff" d="M8 0h6v30H8zM0 12h30v6H0z"/><path fill="#00205b" d="M9.5 0h3v30h-3zM0 13.5h30v3H0z"/></g></svg></button>
  <h1>ChordProg <span style="color:var(--muted);font-weight:500">by ChordLink</span></h1>
  <div class="sub">Find a progression. Hear it in any key. Understand why it works. Make it yours.</div>
</header>

<div class="wrap">
  <section class="card">
    <div class="journey">
      <h2>What are you writing?</h2>
      <p>Tell ChordProg what you need. You will get a small set of progressions you can hear immediately.</p>
      <div class="question"><span>SONG SECTION</span><div id="sectionChoices" class="choiceRow">
        <button class="choice active" data-value="">Anything</button><button class="choice" data-value="Verse">Verse</button><button class="choice" data-value="Chorus">Chorus</button><button class="choice" data-value="Bridge">Bridge</button><button class="choice" data-value="Intro">Intro</button><button class="choice" data-value="Underscore">Underscore</button>
      </div></div>
      <div class="question"><span>FEEL</span><div id="feelChoices" class="choiceRow">
        <button class="choice active" data-value="">Surprise me</button><button class="choice" data-value="bright">Bright</button><button class="choice" data-value="dark">Dark</button><button class="choice" data-value="emotional">Emotional</button><button class="choice" data-value="driving">Driving</button><button class="choice" data-value="dreamy">Dreamy</button><button class="choice" data-value="sophisticated">Sophisticated</button>
      </div></div>
      <button id="findProgressions" class="findBtn">Find progressions →</button>
      <div id="resultCount" class="resultCount" role="status" aria-live="polite" style="margin-top:10px"></div>
    </div>
    <div class="simpleTools">
      <div><label for="searchProg">Or search the complete library</label><input id="searchProg" type="search" placeholder="Name, mood or Roman numerals…"></div>
      <div><label for="categoryFilter">Style</label><select id="categoryFilter"><option value="">All styles</option></select></div>
      <select id="useFilter" hidden><option value="">Any use</option></select>
    </div>
    <div class="resultLead">Listen to a few. Open the one that makes you curious.</div>
    <div id="list" class="list"></div>
    <div class="controls">
      <details id="keySettings" class="advanced"><summary>Change key, timing and notation</summary>
      <div class="row">
        <div>
          <label for="keySel">Key (root)</label>
          <select id="keySel"></select>
        </div>
        <div>
          <label for="preferAcc">Notation</label>
          <select id="preferAcc">
            <option value="auto" selected>Auto</option>
            <option value="sharp">♯</option>
            <option value="flat">♭</option>
          </select>
        </div>
      </div>
      <div class="row">
        <div>
          <label for="timeSig">Time signature</label>
          <select id="timeSig">
            <option value="4/4" selected>4/4</option>
            <option value="3/4">3/4</option>
            <option value="6/8">6/8</option>
            <option value="2/4">2/4</option>
          </select>
        </div>
        <div>
          <label for="subdiv">Subdivision (units)</label>
          <select id="subdiv">
            <option value="1/4" selected>1/4</option>
            <option value="1/8">1/8</option>
            <option value="1/16">1/16</option>
          </select>
        </div>
      </div>
      <div class="row">
        <div>
          <label for="bars">Number of bars</label>
          <input id="bars" type="number" min="4" max="64" value="8"/>
        </div>
        <div>
          <label for="chordsPerBar">Chords per bar</label>
          <select id="chordsPerBar">
            <option value="1" selected>1</option>
            <option value="2">2</option>
            <option value="4">4</option>
          </select>
        </div>
      </div>

      <div class="pillrow">
        <span class="pill">Scale match = chord tones contained in scale</span>
        <span class="pill">Creative = 1 outside note</span>
        <span class="pill">English note names (B, not H)</span>
      </div>
      </details>

      
      <details class="advanced desktopAdvanced"><summary>Advanced: sequence and export</summary><div class="card" style="border-radius:14px; border:1px solid var(--line); background:#0e1016; padding:10px; margin-bottom:10px;">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
          <div>
            <div style="font-size:12px; font-weight:700;">Step-sequencer</div>
            <div class="help" style="margin-top:4px;">1–4 slots. Enter progression IDs (P1 J1 …) or Roman numerals (I V vi IV). Play them in order and export JAMS + Sequence JSON.</div>
          </div>
          <div class="mono" style="font-size:11px; color:var(--muted);">V3.0</div>
        </div>

        <div style="margin-top:10px; display:grid; gap:8px;">
          <div class="row">
            <div>
              <label for="slot1">Slot 1</label>
              <input id="slot1" placeholder="P1 P5 M1  |  or: I V vi IV" />
            </div>
            <div>
              <label for="slot2">Slot 2</label>
              <input id="slot2" placeholder="J1  |  or: ii V I" />
            </div>
          </div>
          <div class="row">
            <div>
              <label for="slot3">Slot 3</label>
              <input id="slot3" placeholder="optional" />
            </div>
            <div>
              <label for="slot4">Slot 4</label>
              <input id="slot4" placeholder="optional" />
            </div>
          </div>
          <div class="row">
            <div>
              <label for="slotBeats">Step length</label>
              <select id="slotBeats">
                <option value="1" selected>1 beat per chord (4n)</option>
                <option value="2">2 beats per chord (2n)</option>
                <option value="4">1 bar per chord (1n)</option>
              </select>
            </div>
            <div>
              <label for="loopSeq">Loop</label>
              <select id="loopSeq">
                <option value="off" selected>Off</option>
                <option value="on">On (play twice)</option>
              </select>
            </div>
          </div>
          <div class="row">
            <button id="addSelToSlot">➕ Add selected → slot</button>
            <button id="midiSlots" type="button">Download slots MIDI</button>
            <button id="playSlots" class="primary">▶ Play slots</button>
          </div>
          <div class="row">
            <button id="exportSeq">📦 Export JSON</button>
            <button id="clearSlots">🧹 Clear</button>
          </div>
          <div>
            <label for="exportOut">Export</label>
            <textarea id="exportOut" class="mono" spellcheck="false" placeholder="JAMS / Sequence JSON will appear here…"></textarea>
          </div>
        </div>
      </div></details>

<div class="row">
        <div>
          <label for="soundSel">Sound</label>
          <select id="soundSel">
            <option value="piano" selected>Piano</option>
            <option value="pad">Pad</option>
            <option value="pluck">Pluck</option>
          </select>
        </div>
        <div>
          <label>&nbsp;</label>
          <button id="audioBtn" class="primary">🔈 Enable sound</button>
        </div>
      </div>
      <div class="tempoControl">
        <div class="tempoHead"><label for="tempoControl" style="margin:0">Playback tempo</label><output id="tempoValue" class="tempoValue" for="tempoControl">100 BPM</output></div>
        <input id="tempoControl" type="range" min="40" max="220" step="1" value="100" aria-label="Playback tempo">
        <div class="help">Drag to choose the pace. All progression and variant playback uses this tempo.</div>
      </div>
      <div class="row">
        <button id="playBtnTop">▶ Play selected</button>
        <button id="midiSelected" type="button">Download MIDI</button>
        <button id="randomBtn">🎲 Random</button>
      </div>
    </div>

  </section>

  <section class="card">
    <h2>Hear, understand and explore</h2>
    <div id="detail" class="detail">
      <div class="help">Choose a progression on the left.</div>
    </div>
  </section>
</div>
<button id="panicButton" class="panic-button" type="button" title="Stop all sound (Esc)" aria-label="Stop all sound (Esc)"><span aria-hidden="true">■</span></button>
<script src="https://cdn.jsdelivr.net/npm/vexflow@4.2.5/build/cjs/vexflow.js"></script>
<script src="/tools/noted/music.js"></script>
<script src="scale-notation.js?v=20260918-2"></script>
<script src="midi.js?v=20260921-1"></script>
<script src="chordlink_scale_explorer_v3_1_ux.js?v=20260921-midi"></script>
<script src="language.js?v=20260918-2"></script>
<section id="how-to-use" style="max-width:1000px;margin:24px auto;padding:20px 24px 80px;line-height:1.6"><h2>How to use</h2><p>Choose a key and progression, then press Play to listen. Set your tempo and sound before exporting MIDI to your music software. The MIDI file contains notes and tempo; choose an instrument in your DAW.</p><p>The round stop button silences all playback. You can also press Esc. Press Play to start again.</p><p>Explore suggestions or search the full library. Open a progression to see chord tones, notation and possible melody scales. Download MIDI exports the selected progression. In Advanced, fill the sequence slots and use Download slots MIDI to export that sequence.</p></section>
</body>
</html>
