console.log("🎹 pianoroll.js loaded");

let baseMidi = 60;
let rows = 13;

(() => {
function renderGrid(state, layout) {
  const { gridX, gridY, cellH, beatW, totalBeats, w } = layout;

  const blackNotes = [1, 3, 6, 8, 10];

  for (let r = 0; r < rows; r++) {
    const midi = baseMidi + r;
    const pc = midi % 12;
    const isBlack = blackNotes.includes(pc);

    ctx.fillStyle = isBlack
      ? "rgba(0,0,0,0.08)"
      : "rgba(0,0,0,0.04)";

    const y = gridY + (rows - 1 - r) * cellH;
    ctx.fillRect(gridX, y, w - gridX - 10, cellH);
  }
}
function renderEvents(state, layout) {
  const { gridX, gridY, cellH, beatW } = layout;

  state.events.forEach((ev, i) => {
    ev.midis.forEach(midi => {
      const row = midi - baseMidi;
      if (row < 0 || row >= rows) return;

      const x = gridX + ev.beatStart * beatW + 4;
      const y = gridY + (rows - 1 - row) * cellH + 4;
      const wBlock = ev.beatLen * beatW - 8;
      const hBlock = cellH - 8;

      ctx.fillStyle = i === state.activeIdx ? "#1f9" : "#2b7";
      ctx.fillRect(x, y, wBlock, hBlock);
    });
  });
}

  const canvas = document.getElementById("roll");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  function setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    const h = 320;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w, h };
  }
function renderKeyboard(layout) {
  const { gridY, cellH } = layout;

// =======================
// KEYBOARD (KORREKT MODELL)
// =======================

const keyboardX = 10;
const keyboardW = 150;

// 7 hvite tangenter per oktav – ALLE LIKE STORE
// ETTER (legg til øverste C)
const WHITE_ORDER = [0, 2, 4, 5, 7, 9, 11, 12];
const whiteKeyH = (rows * cellH) / WHITE_ORDER.length;

// tegn hvite (bunn → topp)
ctx.fillStyle = "#fff";
ctx.strokeStyle = "#999";

WHITE_ORDER.forEach((pc, i) => {
  const y =
    gridY +
    (WHITE_ORDER.length - 1 - i) * whiteKeyH;

  ctx.fillRect(keyboardX, y, keyboardW, whiteKeyH);
  ctx.strokeRect(keyboardX, y, keyboardW, whiteKeyH);
});

// sorte tangenter (overlay)
const BLACK_KEYS = [
  { pc: 1,  pos: 0.40 },
  { pc: 3,  pos: 1.60 },
  { pc: 6,  pos: 3.35 },
  { pc: 8,  pos: 4.50 },
  { pc: 10, pos: 5.65 }
];
const blackW = keyboardW * 0.6;
const blackH = whiteKeyH * 0.65;
const KEYBOARD_Y_OFFSET = whiteKeyH * 0.5; // juster 0.3–0.6 etter smak,

ctx.fillStyle = "#111";

BLACK_KEYS.forEach(bk => {
const y =
  gridY +
  (WHITE_ORDER.length - bk.pos - 1) * whiteKeyH
  + KEYBOARD_Y_OFFSET
  - blackH / 2;
     
  ctx.fillRect(keyboardX, y, blackW, blackH);
});
}

function render() {
  const state = window.RK_PIANOROLL_STATE;
  if (!state || !state.events || !state.events.length) return;

  const { w, h } = setupCanvas();

  const totalBeats = Math.max(
    1,
    Math.max(...state.events.map(e => e.beatStart + e.beatLen))
  );

  const keyboardW = 150;
  const gridX = keyboardW + 20;
  const gridY = 20;
  const cellH = Math.floor((h - 40) / rows);
  const beatW = (w - gridX - 10) / totalBeats;

  const layout = {
    w, h,
    gridX,
    gridY,
    cellH,
    beatW,
    totalBeats
  };

  ctx.clearRect(0, 0, w, h);

  renderGrid(state, layout);
  renderKeyboard(layout);
  renderEvents(state, layout);
}


  function safeRender() {
    console.log("🎹 safeRender() called", window.RK_PIANOROLL_STATE);
    const state = window.RK_PIANOROLL_STATE;
    if (!state || !state.events || !state.events.length) return;

    baseMidi = state.baseMidi ?? 60;
    rows = state.rows ?? 13;

    render();
  }

  window.addEventListener("rk-pianoroll-ready", safeRender);

  if (window.RK_PIANOROLL_STATE) {
    safeRender();
  }

  window.addEventListener("load", safeRender);
  window.addEventListener("resize", safeRender);

})();