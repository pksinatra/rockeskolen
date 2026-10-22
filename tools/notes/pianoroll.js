(() => {
  const canvas = document.getElementById("roll");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const blackPitchClasses = new Set([1, 3, 6, 8, 10]);

  function roundedRect(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, Math.min(radius, width / 2, height / 2));
  }

  function setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth || canvas.parentElement.clientWidth || 640;
    const height = Math.max(240, Math.min(320, Math.round(width * .42)));
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { width, height };
  }

  function renderBackground(layout) {
    const wash = ctx.createLinearGradient(0, 0, layout.width, layout.height);
    wash.addColorStop(0, "#fbfdff");
    wash.addColorStop(1, "#f3f0ff");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, layout.width, layout.height);

    roundedRect(layout.gridX, layout.gridY, layout.gridW, layout.gridH, 12);
    ctx.fillStyle = "rgba(255,255,255,.72)";
    ctx.fill();

    for (let row = 0; row < layout.rows; row += 1) {
      const midi = layout.baseMidi + row;
      const y = layout.gridY + (layout.rows - 1 - row) * layout.cellH;
      ctx.fillStyle = blackPitchClasses.has(midi % 12) ? "rgba(27,35,57,.055)" : "rgba(255,255,255,.2)";
      ctx.fillRect(layout.gridX, y, layout.gridW, layout.cellH);
      ctx.strokeStyle = "rgba(67,80,112,.08)";
      ctx.beginPath();
      ctx.moveTo(layout.gridX, y);
      ctx.lineTo(layout.gridX + layout.gridW, y);
      ctx.stroke();
    }

    for (let beat = 1; beat < layout.totalBeats; beat += 1) {
      const x = layout.gridX + beat * layout.beatW;
      ctx.strokeStyle = beat % 4 === 0 ? "rgba(102,92,246,.2)" : "rgba(67,80,112,.07)";
      ctx.beginPath();
      ctx.moveTo(x, layout.gridY);
      ctx.lineTo(x, layout.gridY + layout.gridH);
      ctx.stroke();
    }
  }

  function renderKeyboard(layout) {
    roundedRect(layout.keyboardX, layout.gridY, layout.keyboardW, layout.gridH, 12);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.strokeStyle = "rgba(34,45,70,.18)";
    ctx.stroke();

    const whiteMidis = [];
    const blackMidis = [];
    for (let midi = layout.baseMidi; midi < layout.baseMidi + layout.rows; midi += 1) {
      (blackPitchClasses.has(midi % 12) ? blackMidis : whiteMidis).push(midi);
    }
    const whiteKeyH = layout.gridH / whiteMidis.length;

    whiteMidis.forEach((midi, index) => {
      const key = {
        x: layout.keyboardX,
        y: layout.gridY + (whiteMidis.length - 1 - index) * whiteKeyH,
        width: layout.keyboardW,
        height: whiteKeyH
      };
      const active = layout.activeMidis.has(midi);
      ctx.save();
      if (active) {
        ctx.shadowColor = "rgba(75,201,240,.9)";
        ctx.shadowBlur = 18;
      }
      roundedRect(key.x + 1, key.y + 1, key.width - 2, key.height - 2, 4);
      ctx.fillStyle = active ? "#8de8ff" : "#fff";
      ctx.fill();
      ctx.strokeStyle = active ? "#3bc6ea" : "rgba(34,45,70,.18)";
      ctx.stroke();
      if (midi % 12 === 0 && whiteKeyH >= 16) {
        ctx.fillStyle = active ? "#17485a" : "#778097";
        ctx.font = "600 10px Inter, system-ui, sans-serif";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(`C${Math.floor(midi / 12) - 1}`, key.x + key.width - 7, key.y + key.height / 2);
      }
      ctx.restore();
    });

    blackMidis.forEach((midi) => {
      const row = midi - layout.baseMidi;
      const centerY = layout.gridY + (layout.rows - row - .5) * layout.cellH;
      const blackKeyH = Math.max(8, whiteKeyH * .62);
      const key = {
        x: layout.keyboardX,
        y: centerY - blackKeyH / 2,
        width: layout.keyboardW * .64,
        height: blackKeyH
      };
      const active = layout.activeMidis.has(midi);
      ctx.save();
      if (active) {
        ctx.shadowColor = "rgba(135,92,255,.95)";
        ctx.shadowBlur = 18;
      }
      roundedRect(key.x + 1, key.y, key.width - 2, key.height, 4);
      const fill = ctx.createLinearGradient(key.x, key.y, key.x + key.width, key.y);
      fill.addColorStop(0, active ? "#7b6cf6" : "#11182a");
      fill.addColorStop(1, active ? "#b18cff" : "#28324b");
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.restore();
    });
  }

  function renderEvents(state, layout) {
    state.events.forEach((event, index) => {
      event.midis.forEach((midi) => {
        const row = midi - layout.baseMidi;
        if (row < 0 || row >= layout.rows) return;
        const x = layout.gridX + event.beatStart * layout.beatW + Math.max(3, layout.beatW * .08);
        const y = layout.gridY + (layout.rows - 1 - row) * layout.cellH + Math.max(2, layout.cellH * .16);
        const width = Math.max(8, event.beatLen * layout.beatW - Math.max(6, layout.beatW * .16));
        const height = Math.max(6, layout.cellH * .68);
        const active = index === state.activeIdx;

        ctx.save();
        if (active) {
          ctx.shadowColor = "rgba(85,208,244,.95)";
          ctx.shadowBlur = 20;
        }
        roundedRect(x, y, width, height, Math.min(7, height / 2));
        const fill = ctx.createLinearGradient(x, y, x + width, y + height);
        fill.addColorStop(0, active ? "#4cc9f0" : "#7868ee");
        fill.addColorStop(1, active ? "#a78bfa" : "#49bfe2");
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.restore();
      });
    });
  }

  function render() {
    const state = window.RK_PIANOROLL_STATE;
    if (!state?.events?.length) return;
    const size = setupCanvas();
    const allMidis = state.events.flatMap((event) => event.midis);
    const minMidi = Math.min(...allMidis);
    const maxMidi = Math.max(...allMidis);
    const baseMidi = Math.min(state.baseMidi ?? minMidi, minMidi);
    const rows = Math.max(state.rows ?? 13, maxMidi - baseMidi + 1);
    const totalBeats = Math.max(1, ...state.events.map((event) => event.beatStart + event.beatLen));
    const keyboardX = 12;
    const keyboardW = Math.max(88, Math.min(132, size.width * .15));
    const gridX = keyboardX + keyboardW + 12;
    const gridY = 14;
    const gridW = Math.max(80, size.width - gridX - 12);
    const gridH = size.height - gridY - 14;
    const cellH = gridH / rows;
    const beatW = gridW / totalBeats;
    const activeMidis = new Set(state.events[state.activeIdx]?.midis || []);
    const layout = { ...size, gridX, gridY, gridW, gridH, keyboardX, keyboardW, baseMidi, rows, cellH, beatW, totalBeats, activeMidis };

    ctx.clearRect(0, 0, size.width, size.height);
    renderBackground(layout);
    renderKeyboard(layout);
    renderEvents(state, layout);
  }

  window.addEventListener("rk-pianoroll-ready", render);
  window.addEventListener("load", render);
  window.addEventListener("resize", render);
  if (window.RK_PIANOROLL_STATE) render();
})();
