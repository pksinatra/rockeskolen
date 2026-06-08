<!DOCTYPE html>
<html lang="no">
<head>
<meta charset="UTF-8" />
<title>Notation Mahjong</title>

<style>
  html, body {
    margin: 0;
    padding: 0;
    background: #140b0e; /* dyp rødbrun */
    overflow: hidden;
    font-family: system-ui, serif;
  }

  canvas {
    display: block;
  }

  /* Runde-ferdig overlay */
  #overlay {
    position: fixed;
    inset: 0;
    background: rgba(20,11,14,0.65);
    color: #f3e8d5;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.6s ease;
  }

  #overlay.show {
    opacity: 1;
    pointer-events: auto;
  }

  #panel {
    max-width: 420px;
    text-align: center;
  }

  .praise {
    margin-bottom: 24px;
    font-size: 18px;
    letter-spacing: 0.02em;
  }

  .progress {
    text-align: left;
    margin: 14px 0;
    font-size: 14px;
  }

  .bar {
    font-family: monospace;
    color: #d6b36a;
  }

  .actions {
    margin-top: 28px;
  }

  button {
    background: transparent;
    border: 1px solid #a88a4a;
    color: #f3e8d5;
    padding: 8px 16px;
    margin: 0 6px;
    cursor: pointer;
  }

  button:hover {
    background: rgba(168,138,74,0.15);
  }
</style>
</head>

<body>

<canvas id="game"></canvas>

<div id="overlay">
  <div id="panel">
    <div class="praise" id="praiseText"></div>
    <div id="progressList"></div>
    <div class="actions">
      <button onclick="newGame()">Ny runde</button>
      <button onclick="closeOverlay()">Lukk</button>
    </div>
  </div>
</div>

<script>
/* ---------- Canvas ---------- */
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

/* ---------- Data ---------- */
const PRAISES = [
  "Godt gjennomført.",
  "Fint arbeid.",
  "Supert.",
  "Veldig bra.",
  "Strålende.",
  "Utmerket.",
  "Imponerende."
];

const SYMBOLS = ["𝄞","♩","♪","𝄽","𝄋","𝄆"];

let tiles = [];
let selectedTile = null;
let hoveredTile = null;
let particles = [];
let gameFinished = false;

/* ---------- Audio ---------- */
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playChime(freq) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = "sine";

  gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.15, audioCtx.currentTime + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.6);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.7);
}

/* ---------- Tile ---------- */
class Tile {
  constructor(gx, gy, z, symbol) {
    this.gx = gx;
    this.gy = gy;
    this.z = z;
    this.symbol = symbol;
    this.size = 80;
    this.alpha = 1;
    this.fading = false;
    this.selected = false;
    this.hoverAmount = 0;
    this.updatePos();
  }

  updatePos() {
    this.x = 100 + this.gx * 90 + this.z * 6;
    this.y = 120 + this.gy * 90 - this.z * 6;
  }

  isFree() {
    for (let t of tiles) {
      if (t !== this && !t.fading &&
          t.gx === this.gx && t.gy === this.gy && t.z > this.z) {
        return false;
      }
    }
    let left = false, right = false;
    for (let t of tiles) {
      if (t !== this && !t.fading && t.z === this.z && t.gy === this.gy) {
        if (t.gx === this.gx - 1) left = true;
        if (t.gx === this.gx + 1) right = true;
      }
    }
    return !(left && right);
  }

  draw() {
    if (this.fading) {
      this.alpha -= 0.04;
      if (this.alpha <= 0) return;
    }

    const free = this.isFree();
    const hovered = hoveredTile === this && free;

    this.hoverAmount += ((hovered ? 1 : 0) - this.hoverAmount) * 0.2;
    const lift = -8 * this.hoverAmount;

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y + lift);

    if (hovered) {
      ctx.shadowColor = "#d6b36a";
      ctx.shadowBlur = 16;
    }

    ctx.fillStyle = free ? "#3a1f18" : "#241412";
    ctx.strokeStyle = free ? "#bfa45a" : "#4a382e";
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.roundRect(0, 0, this.size, this.size, 10);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = free ? "#f3e8d5" : "#8a7a6a";
    ctx.font = "46px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.symbol, this.size/2, this.size/2 + 4);

    ctx.restore();
  }
}

/* ---------- Particles ---------- */
class Particle {
  constructor(x, y, sym) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random()-0.5)*2;
    this.vy = (Math.random()-0.5)*2;
    this.life = 1;
    this.sym = sym;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.03;
    this.life -= 0.03;
  }
  draw() {
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.fillStyle = "#d6b36a";
    ctx.font = "20px serif";
    ctx.textAlign = "center";
    ctx.fillText(this.sym, this.x, this.y);
    ctx.restore();
  }
}

/* ---------- Game ---------- */
function newGame() {
  tiles = [];
  particles = [];
  selectedTile = null;
  hoveredTile = null;
  gameFinished = false;
  closeOverlay();

  const layout = [
    {x:0,y:0,z:0},{x:1,y:0,z:0},{x:2,y:0,z:0},{x:3,y:0,z:0},
    {x:0,y:1,z:0},{x:1,y:1,z:1},{x:2,y:1,z:1},{x:3,y:1,z:0},
    {x:1,y:2,z:0},{x:2,y:2,z:0},{x:1,y:2,z:1},{x:2,y:2,z:1}
  ];

  const pool = [...SYMBOLS, ...SYMBOLS].sort(()=>Math.random()-0.5);

  layout.forEach((p,i)=>{
    tiles.push(new Tile(p.x,p.y,p.z,pool[i]));
  });
}

canvas.addEventListener("mousemove", e => {
  const r = canvas.getBoundingClientRect();
  const mx = e.clientX - r.left;
  const my = e.clientY - r.top;
  hoveredTile = null;

  tiles.slice().sort((a,b)=>b.z-a.z).forEach(t=>{
    if (!hoveredTile &&
        t.isFree() &&
        mx>=t.x && mx<=t.x+t.size &&
        my>=t.y && my<=t.y+t.size) {
      hoveredTile = t;
    }
  });
});

canvas.addEventListener("click", e => {
  if (gameFinished) return;
  if (!hoveredTile) return;

  if (!selectedTile) {
    selectedTile = hoveredTile;
    selectedTile.selected = true;
    return;
  }

  if (hoveredTile === selectedTile) {
    selectedTile.selected = false;
    selectedTile = null;
    return;
  }

  if (hoveredTile.symbol === selectedTile.symbol) {
    [hoveredTile, selectedTile].forEach(t=>{
      t.fading = true;
      playChime(600 + Math.random()*300);
      for (let i=0;i<8;i++) {
        particles.push(new Particle(
          t.x + t.size/2,
          t.y + t.size/2,
          t.symbol
        ));
      }
    });
  }

  selectedTile.selected = false;
  selectedTile = null;
});

/* ---------- Overlay ---------- */
function showOverlay() {
  const praise = PRAISES[Math.floor(Math.random()*PRAISES.length)];
  document.getElementById("praiseText").textContent = praise;

  const list = document.getElementById("progressList");
  list.innerHTML = "";

  SYMBOLS.forEach(sym=>{
    const blocks = Math.floor(Math.random()*6)+2;
    const bar = "█".repeat(blocks) + "░".repeat(10-blocks);
    const div = document.createElement("div");
    div.className = "progress";
    div.innerHTML = sym + "<br><span class='bar'>" + bar + "</span>";
    list.appendChild(div);
  });

  document.getElementById("overlay").classList.add("show");
}

function closeOverlay() {
  document.getElementById("overlay").classList.remove("show");
}

/* ---------- Loop ---------- */
function loop() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  tiles
    .slice()
    .sort((a,b)=>a.z-b.z)
    .forEach(t=>t.draw());

  particles = particles.filter(p=>p.life>0);
  particles.forEach(p=>{p.update();p.draw();});

  if (!gameFinished && tiles.every(t=>t.alpha<=0)) {
    gameFinished = true;
    setTimeout(showOverlay, 400);
    playChime(440);
  }

  requestAnimationFrame(loop);
}

newGame();
loop();
</script>
</body>
</html>
