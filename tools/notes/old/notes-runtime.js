(() => {
  const VF = Vex.Flow;

  // ===== API (Skala) =====
  const SCALE_API_URL = "https://www.rockeskolen.com/api/scales/piano.php";

  // ===== DOM =====
  const modeEl = document.getElementById("mode");
  const scaleFields = document.getElementById("scaleFields");
  const chordFields = document.getElementById("chordFields");

  const rootEl = document.getElementById("root");
  const typeEl = document.getElementById("type");
  const chordEl = document.getElementById("chord");
  const octEl = document.getElementById("oct");
  const tempoEl = document.getElementById("tempo");

  const btnApply = document.getElementById("btnApply");
  const btnPlay = document.getElementById("btnPlay");
  const btnStop = document.getElementById("btnStop");

  const notationHost = document.getElementById("notation");
  const debugEl = document.getElementById("debug");
  const statusEl = document.getElementById("status");

  const canvas = document.getElementById("roll");
  const ctx = canvas.getContext("2d");

  // ===== Render area (fixed lanes) =====
  const baseMidi = 60; // C4
  const rows = 13;     // C4..C5

  // ===== State =====
  const state = {
    events: [],        // [{beatStart, beatLen, midis:[...], label}]
    activeIdx: -1,
    isPlaying: false,
    part: null,
    synth: null,
    lastLoaded: null,
    lastApiRaw: null
  };

  init();

  async function init() {
    state.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" }
    }).toDestination();

    modeEl.addEventListener("change", syncModeUI);

    btnApply.addEventListener("click", async () => {
      await stopPlayback();
      applyUIToURL();
      await loadFromURLAndRender();
    });

    btnPlay.addEventListener("click", async () => {
      await Tone.start();
      await startPlayback();
    });

    btnStop.addEventListener("click", async () => stopPlayback());

    window.addEventListener("resize", () => renderAll());

    syncModeUI();
    await loadFromURLAndRender();
  }

  function syncModeUI() {
    const m = modeEl.value;
    scaleFields.classList.toggle("hidden", m !== "scale");
    chordFields.classList.toggle("hidden", m !== "chord");
  }

  // ===== URL <-> UI =====
  function getParams() {
    const p = new URLSearchParams(location.search);
    return {
      mode: (p.get("mode") || "scale").toLowerCase(),
      root: (p.get("root") || "C").trim(),
      type: (p.get("type") || "major").trim(),
      chord: (p.get("chord") || "Cmaj7").trim(),
      oct: Number(p.get("oct") || "4"),
      tempo: Number(p.get("tempo") || "90")
    };
  }

  function applyParamsToUI(params) {
    modeEl.value = (params.mode === "chord") ? "chord" : "scale";
    syncModeUI();

    rootEl.value = params.root;
    typeEl.value = params.type;
    chordEl.value = params.chord;
    octEl.value = String(params.oct);
    tempoEl.value = String(params.tempo);
  }

  function applyUIToURL() {
    const mode = modeEl.value;
    const oct = Number(octEl.value) || 4;
    const tempo = Number(tempoEl.value) || 90;

    const p = new URLSearchParams();
    p.set("mode", mode);
    p.set("oct", String(oct));
    p.set("tempo", String(tempo));

    if (mode === "scale") {
      p.set("root", (rootEl.value || "C").trim());
      p.set("type", (typeEl.value || "major").trim());
    } else {
      p.set("chord", (chordEl.value || "Cmaj7").trim());
    }

    history.replaceState(null, "", "?" + p.toString());
  }

  // ===== Load logic =====
  async function loadFromURLAndRender() {
    const params = getParams();
    applyParamsToUI(params);

    let events = [];
    const debugObj = { params, apiUrl: null, apiRaw: null };

    statusEl.textContent = "";

    if (params.mode === "chord") {
      const parsed = parseChordSymbol(params.chord, params.oct);

      // Fold into C4..C5 display range (for this view)
      const folded = parsed.midis.map(m => foldMidiIntoRange(m, baseMidi, baseMidi + 12));
      events = [{
        beatStart: 0,
        beatLen: 4,
        midis: folded.sort((a,b)=>a-b),
        label: params.chord
      }];

      debugObj.chordParsed = parsed;
    } else {
      const root = String(params.root || "C").trim();
      const type = String(params.type || "major").trim();
      const oct = params.oct;

      const { notes, apiRaw, apiUrl } = await fetchScaleFromAPI(root, type, oct);
      debugObj.apiUrl = apiUrl;
      debugObj.apiRaw = apiRaw;

      if (!notes.length) {
        statusEl.innerHTML = `<span class="err">API returnerte ingen noter for root=${escapeHtml(root)} type=${escapeHtml(type)} oct=${oct}. Fiks kilden/parametrene.</span>`;
      }

      // Convert to events (one note per beat). Use API MIDI as source of truth for playback & roll.
      events = notes.map((n, i) => ({
        beatStart: i,
        beatLen: 1,
        midis: [foldMidiIntoRange(n.midi, baseMidi, baseMidi + 12)],
        label: n.name // label is API name; notation uses API name, not local conversion.
      }));
    }

    state.events = events;
    state.activeIdx = -1;
    state.lastLoaded = params;
    state.lastApiRaw = debugObj.apiRaw;

    debugEl.textContent = JSON.stringify(debugObj, null, 2);

    renderAll();
  }

  async function fetchScaleFromAPI(root, type, oct) {
    // Send several possible param names. API can ignore unknown.
    const url = new URL(SCALE_API_URL);
    url.searchParams.set("root", root);
    url.searchParams.set("type", type);
    url.searchParams.set("scale", type);
    url.searchParams.set("scaleKey", type);
    url.searchParams.set("mode", type);
    url.searchParams.set("oct", String(oct));
    url.searchParams.set("octave", String(oct));

    const apiUrl = url.toString();

    try {
      const apiRaw = await fetch(apiUrl).then(r => r.json());
      const notes = (apiRaw?.notes || []).map(n => ({
        midi: Number(n.midi),
        // IMPORTANT: Do not invent names here. Use API name as-is.
        name: String(n.name ?? "")
      })).filter(n => Number.isFinite(n.midi));

      // If API doesn't provide name, we'll still render roll & audio (from midi),
      // but notation needs a key. We'll refuse to invent and show a clear status.
      const missingNames = notes.some(n => !n.name);
      if (missingNames) {
        statusEl.innerHTML = `<span class="err">API-noter mangler name-felt. Vi spiller/tegner via midi, men notasjon krever name. Fiks API-formatet.</span>`;
      }

      return { notes, apiRaw, apiUrl };
    } catch (e) {
      statusEl.innerHTML = `<span class="err">Kunne ikke hente fra API (${escapeHtml(String(e))}). Fiks kilden/tilgang.</span>`;
      return { notes: [], apiRaw: { error: String(e) }, apiUrl };
    }
  }

  // ===== Playback =====
  async function startPlayback() {
    if (state.isPlaying || !state.events.length) return;

    const bpm = Number(tempoEl.value) || 90;
    Tone.Transport.bpm.value = bpm;

    // cleanup
    if (state.part) {
      try { state.part.stop(); } catch {}
      try { state.part.dispose(); } catch {}
      state.part = null;
    }
    Tone.Transport.stop();
    Tone.Transport.cancel(0);

    state.activeIdx = -1;
    renderAll();

    const beatToSeconds = (beat) => (60 / bpm) * beat;
    const partEvents = state.events.map((ev, idx) => ({
      time: beatToSeconds(ev.beatStart),
      ev, idx
    }));

    state.part = new Tone.Part((time, value) => {
      const { ev, idx } = value;
      state.activeIdx = idx;
      renderAll();

      const dur = beatToSeconds(ev.beatLen);
      const freqs = ev.midis.map(m => Tone.Frequency(m, "midi"));
      state.synth.triggerAttackRelease(freqs, dur, time);
    }, partEvents).start(0);

    state.isPlaying = true;
    btnPlay.disabled = true;
    btnStop.disabled = false;

    Tone.Transport.start("+0.05");

    // auto-stop
    const totalBeats = getTotalBeats(state.events);
    const totalSec = beatToSeconds(totalBeats) + 0.1;
    setTimeout(() => {
      if (state.isPlaying) stopPlayback();
    }, totalSec * 1000);
  }

  async function stopPlayback() {
    if (state.part) {
      try { state.part.stop(); } catch {}
      try { state.part.dispose(); } catch {}
      state.part = null;
    }
    Tone.Transport.stop();
    Tone.Transport.cancel(0);

    state.isPlaying = false;
    btnPlay.disabled = false;
    btnStop.disabled = true;

    state.activeIdx = -1;
    renderAll();
  }

  function getTotalBeats(events) {
    let end = 0;
    for (const ev of events) end = Math.max(end, ev.beatStart + ev.beatLen);
    return end || 1;
  }

  // ===== Rendering =====
  function renderAll() {
    renderNotation();
    renderPianoRoll();
  }

  function renderNotation() {
    notationHost.innerHTML = "";
    const width = Math.min(1040, notationHost.clientWidth || 1040);

    const renderer = new VF.Renderer(notationHost, VF.Renderer.Backends.SVG);
    renderer.resize(width, 240);
    const rctx = renderer.getContext();

    const stave = new VF.Stave(10, 40, width - 20);
    stave.addClef("treble").addTimeSignature("4/4");
    stave.setContext(rctx).draw();

    const params = state.lastLoaded || getParams();
    const isChordMode = params.mode === "chord";

    if (!state.events.length) return;

    if (isChordMode) {
      const ev = state.events[0];
      const keys = ev.midis.slice().sort((a,b)=>a-b).map(m => midiToVexKey(m));
      const sn = new VF.StaveNote({ clef:"treble", keys, duration:"w" });

      const topMidi = ev.midis.reduce((a,b)=>Math.max(a,b), -999);
      sn.setStemDirection(topMidi < 71 ? 1 : -1);

      const isActive = (state.activeIdx === 0);
      sn.setStyle({
        fillStyle: isActive ? "#00b060" : "#111",
        strokeStyle: isActive ? "#00b060" : "#111"
      });

      const voice = new VF.Voice({ num_beats: 4, beat_value: 4 }).setStrict(false);
      voice.addTickables([sn]);
      new VF.Formatter().joinVoices([voice]).format([voice], width - 80);
      voice.draw(rctx, stave);
      return;
    }

    // Scale mode: use API name -> Vex key. If name missing, refuse to invent (status already shown).
    const vnotes = state.events.map((ev, idx) => {
      const apiName = String(ev.label ?? "").trim();
      const key = apiName ? apiNameToVexKey(apiName) : null;

      // If missing name, draw a rest so layout stays stable, and we avoid inventing.
      const sn = key
        ? new VF.StaveNote({ clef:"treble", keys:[key], duration:"q" })
        : new VF.StaveNote({ clef:"treble", keys:["b/4"], duration:"qr" });

      // Stem-lås: B4 (71) og oppover = ned.
      const midi = ev.midis[0];
      sn.setStemDirection(midi < 71 ? 1 : -1);

      const isActive = (idx === state.activeIdx);
      sn.setStyle({
        fillStyle: isActive ? "#00b060" : "#111",
        strokeStyle: isActive ? "#00b060" : "#111"
      });

      return sn;
    });

    const voice = new VF.Voice({ num_beats: Math.max(1, vnotes.length), beat_value: 4 }).setStrict(false);
    voice.addTickables(vnotes);
    new VF.Formatter().joinVoices([voice]).format([voice], width - 60);
    voice.draw(rctx, stave);
  }

  // Robust conversion: handles Eb4, E♭4, D#4, D♯4, "Eb 4", "E-4"
  function apiNameToVexKey(name) {
    let s = String(name ?? "").trim();
    s = s.replace(/\s+/g, "");
    s = s.replace(/♭/g, "b").replace(/♯/g, "#");
    s = s.replace(/([A-Ga-g])-/g, "$1b"); // E-4 -> Eb4

    const m = s.match(/^([A-Ga-g])([#b]?)(-?\d+)$/);
    if (!m) return "c/4";

    const step = m[1].toLowerCase();
    const acc = m[2] || "";
    const oct = m[3];
    return `${step}${acc}/${oct}`;
  }

  function midiToVexKey(midi) {
    const name = midiToName(midi); // C#4, etc. (for chord-mode, local)
    const m = name.match(/^([A-G])([#b]?)(-?\d+)$/);
    if (!m) return "c/4";
    return `${m[1].toLowerCase()}${m[2]}/${m[3]}`;
  }

  function renderPianoRoll() {
    const { cssW, cssH } = setupCanvasResponsive(canvas, ctx);

    const keyW = 160;
    const pad = 10;

    const gridX = keyW + pad;
    const gridW = cssW - gridX - pad;

    const gridY = 20;
    const gridH = cssH - 40;

    const cellH = Math.floor(gridH / rows);
    const usedH = cellH * rows;
    const offsetY = gridY + Math.floor((gridH - usedH) / 2);

    const totalBeats = Math.max(1, getTotalBeats(state.events));
    const beatW = gridW / totalBeats;

    ctx.clearRect(0, 0, cssW, cssH);

    drawPianoRollGrid(ctx, { x: gridX, y: offsetY, w: gridW, rows, cellH, baseMidi });
    drawBeatGrid(ctx, { x: gridX, y: offsetY, w: gridW, h: usedH, totalBeats, beatW });

    drawEventBlocks(ctx, {
      events: state.events,
      activeIdx: state.activeIdx,
      x: gridX,
      y: offsetY,
      cellH,
      beatW,
      baseMidi,
      rows
    });

    const activeMidis = (state.activeIdx >= 0) ? state.events[state.activeIdx].midis : [];
    drawKeyboardWithLaneLogic(ctx, {
      x: 8,
      y: offsetY,
      w: keyW - 8,
      h: usedH,
      baseMidi,
      rows,
      cellH,
      activeMidis
    });

    // Bottom labels in grid (optional, light)
    ctx.globalAlpha = 0.9;
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillStyle = "#111";
    ctx.fillText("Keyboard", 12, offsetY - 6);
    ctx.fillText("Time →", gridX + gridW - 52, offsetY + usedH + 20);
    ctx.globalAlpha = 1;
  }

  function drawPianoRollGrid(ctx, { x, y, w, rows, cellH, baseMidi }) {
    const blackPC = new Set([1,3,6,8,10]);
    for (let i = 0; i < rows; i++) {
      const midi = baseMidi + i;
      const pc = midi % 12;
      const isBlack = blackPC.has(pc);
      const rowTop = y + (rows - 1 - i) * cellH;

      ctx.globalAlpha = isBlack ? 0.12 : 0.06;
      ctx.fillStyle = "#000";
      ctx.fillRect(x, rowTop, w, cellH);
    }

    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = "#111";
    for (let r = 0; r <= rows; r++) {
      const yy = y + r * cellH;
      ctx.beginPath();
      ctx.moveTo(x, yy + 0.5);
      ctx.lineTo(x + w, yy + 0.5);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function drawBeatGrid(ctx, { x, y, w, h, totalBeats, beatW }) {
    ctx.strokeStyle = "#111";
    for (let i = 0; i <= totalBeats; i++) {
      const xx = x + i * beatW;
      ctx.globalAlpha = (i % 4 === 0) ? 0.22 : 0.12;
      ctx.beginPath();
      ctx.moveTo(xx + 0.5, y);
      ctx.lineTo(xx + 0.5, y + h);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // Supports chords (multiple midis per event)
  function drawEventBlocks(ctx, { events, activeIdx, x, y, cellH, beatW, baseMidi, rows }) {
    for (let i = 0; i < events.length; i++) {
      const ev = events[i];
      const isActive = (i === activeIdx);

      const xx = x + ev.beatStart * beatW + 6;
      const ww = ev.beatLen * beatW - 12;

      // Draw blocks (one per midi)
      for (const midi of ev.midis) {
        const rowIndex = midi - baseMidi;
        if (rowIndex < 0 || rowIndex >= rows) continue;

        const rowTop = y + (rows - 1 - rowIndex) * cellH;
        const hh = Math.max(12, cellH - 6);
        const yy = rowTop + Math.floor((cellH - hh) / 2);

        ctx.globalAlpha = isActive ? 0.95 : 0.88;
        ctx.fillStyle = isActive ? "#1f9" : "#2b7";
        ctx.fillRect(xx, yy, ww, hh);
      }

      // Label inside the first block area (so we don't draw outside the grid)
      ctx.globalAlpha = 1;
      ctx.fillStyle = isActive ? "#063" : "#0b2";
      ctx.font = "12px system-ui, sans-serif";
      ctx.fillText(String(ev.label ?? ""), xx + 6, y + rows * cellH - 6);
    }
    ctx.globalAlpha = 1;
  }

  function drawKeyboardWithLaneLogic(ctx, { x, y, w, h, baseMidi, rows, cellH, activeMidis = [] }) {
    const keySpans = [
      { name: "C4", from: 60, to: 61 },
      { name: "D4", from: 62, to: 63 },
      { name: "E4", from: 64, to: 64 },
      { name: "F4", from: 65, to: 66 },
      { name: "G4", from: 67, to: 68 },
      { name: "A4", from: 69, to: 70 },
      { name: "B4", from: 71, to: 71 },
      { name: "C5", from: 72, to: 72 },
    ];
    const blackMidis = [61, 63, 66, 68, 70];

    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#111";
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = "#fff";
    ctx.fillRect(x, y, w, h);

    // semitone overlay
    ctx.globalAlpha = 0.10;
    ctx.strokeStyle = "#111";
    for (let i = 0; i <= rows; i++) {
      const yy = y + i * cellH;
      ctx.beginPath();
      ctx.moveTo(x, yy + 0.5);
      ctx.lineTo(x + w, yy + 0.5);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // white separators
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = "#111";
    for (const k of keySpans) {
      const topLane = k.to - baseMidi;
      const yTop = y + (rows - 1 - topLane) * cellH;
      ctx.beginPath();
      ctx.moveTo(x, yTop + 0.5);
      ctx.lineTo(x + w, yTop + 0.5);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(x, y + h + 0.5);
    ctx.lineTo(x + w, y + h + 0.5);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // labels + white highlight
    ctx.font = "12px system-ui, sans-serif";
    for (const k of keySpans) {
      const topLane = k.to - baseMidi;
      const botLane = k.from - baseMidi;
      const yTop = y + (rows - 1 - topLane) * cellH;
      const yBot = y + (rows - 1 - botLane) * cellH + cellH;
      const yMid = (yTop + yBot) / 2;

      const activeWhite = activeMidis.some(m =>
        m >= k.from && m <= k.to && !blackMidis.includes(m)
      );
      if (activeWhite) {
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = "#1f9";
        ctx.fillRect(x, yTop, w, (yBot - yTop));
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = "#111";
      ctx.fillText(k.name, x + w - 34, yMid + 4);
    }

    // black keys + highlight
    const blackW = Math.floor(w * 0.62);
    const blackH = Math.max(12, Math.floor(cellH * 1.2));
    for (const m of blackMidis) {
      const lane = m - baseMidi;
      const yCenter = y + (rows - 1 - lane) * cellH + cellH / 2;
      const top = yCenter - blackH / 2;

      const activeBlack = activeMidis.includes(m);

      ctx.fillStyle = activeBlack ? "#1f9" : "#222";
      ctx.globalAlpha = activeBlack ? 0.95 : 1;
      ctx.fillRect(x, top, blackW, blackH);
      ctx.globalAlpha = 1;

      ctx.fillStyle = activeBlack ? "#063" : "#fff";
      ctx.fillText(midiToName(m), x + 8, yCenter + 4);
    }
  }

  // ===== IMPORTANT: canvas must NOT grow on each render =====
  // We do NOT set canvas.style.width here. CSS controls width:100%.
  function setupCanvasResponsive(canvas, ctx) {
    const dpr = window.devicePixelRatio || 1;

    // Measure actual rendered width
    const rect = canvas.getBoundingClientRect();
    const cssW = Math.max(320, Math.floor(rect.width || canvas.parentElement.clientWidth));
    const cssH = 320;

    canvas.style.height = cssH + "px";
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { cssW, cssH };
  }

  // ===== Chord parser (local). No scale library here. =====
  function parseChordSymbol(symbol, octave) {
    const raw = (symbol || "").trim();
    if (!raw) throw new Error("Empty chord symbol");

    const [main, slashBass] = raw.split("/").map(s => s.trim());

    const rootMatch = main.match(/^([A-Ga-g])([#b♯♭]?)(.*)$/);
    if (!rootMatch) throw new Error("Invalid chord root: " + raw);

    let rootLetter = rootMatch[1].toUpperCase();
    let acc = rootMatch[2] || "";
    let rest = (rootMatch[3] || "").trim();

    acc = acc.replace("♯", "#").replace("♭", "b");
    const rootName = rootLetter + acc;

    rest = rest.replace(/Δ/gi, "maj").replace(/M(?!a)/g, "maj");
    const r = rest.toLowerCase();

    let intervals = null;

    if (r.includes("m7b5") || r.includes("ø7") || r.includes("ø")) intervals = [0,3,6,10];
    else if (r.includes("dim7") || r.includes("o7") || r.includes("°7")) intervals = [0,3,6,9];
    else if (r.includes("dim") || r.includes("o") || r.includes("°")) intervals = [0,3,6];
    else if (r.includes("aug") || r.includes("+")) {
      intervals = [0,4,8];
      if (r.includes("7")) intervals = [0,4,8,10];
    }
    else if (r.includes("sus2")) intervals = [0,2,7];
    else if (r.includes("sus4") || r.includes("sus")) intervals = [0,5,7];
    else if (r.includes("maj7") || r.includes("ma7") || r.includes("maj")) intervals = [0,4,7,11];
    else if (r.includes("7")) intervals = [0,4,7,10];
    else if (r.startsWith("m") || r.includes("min") || r.includes("-")) intervals = [0,3,7];
    else if (r.includes("5")) intervals = [0,7];
    else intervals = [0,4,7];

    const rootMidi = noteToMidi(rootName, octave);
    let midis = intervals.map(semi => rootMidi + semi);

    if (slashBass) {
      const bassMidi0 = noteToMidi(String(slashBass).replace("♭","b").replace("♯","#"), octave);
      let bassMidi = bassMidi0;
      while (bassMidi >= rootMidi) bassMidi -= 12;
      midis = [bassMidi, ...midis];
    }

    return { root: rootName, octave, intervals, midis, symbol: raw };
  }

  // ===== Utility: fold any midi into display range [lo..hi] by octaves =====
  function foldMidiIntoRange(midi, lo, hi) {
    let m = midi;
    while (m < lo) m += 12;
    while (m > hi) m -= 12;
    return m;
  }

  // ===== Note helpers (for chord parser only) =====
  function noteToMidi(noteName, octave) {
    let n = String(noteName || "").trim();
    n = n.replace(/♭/g, "b").replace(/♯/g, "#");
    n = n.replace(/\s+/g, "");
    n = n.replace(/^([A-Ga-g])/, (m) => m.toUpperCase());

    // accept "Db"
    const m = n.match(/^([A-G])([#b]?)$/);
    if (!m) return 60;

    const letter = m[1];
    const acc = m[2] || "";

    const map = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };
    let semi = map[letter] ?? 0;
    if (acc === "#") semi += 1;
    if (acc === "b") semi -= 1;

    return (octave + 1) * 12 + semi;
  }

  function midiToName(midi) {
    const names = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
    const pc = ((midi % 12) + 12) % 12;
    const oct = Math.floor(midi / 12) - 1;
    return names[pc] + oct;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[c]));
  }
})();