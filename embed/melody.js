/* Rockeskolen – melodi-embed: tegn en melodilinje, hør den og flytt den opp eller ned.
 *
 * Når melodien flyttes, forskyves alle toner med like mange halvtoner, så avstandene bevares.
 * Tegningen festes til tonene i durskalaen for gjeldende toneart.
 *
 * URL-parametere:
 *   widget   (tom) | shapes     shapes = melodiformer (opp, ned, bue)
 *   preset   up | down | arch | jakob   (standard: jakob)
 *   title    egen overskrift
 *   lang     no | en
 */
(function () {
  const { t, h, audio, canvas, glow, params, note, reduced } = RS;
  const app = document.getElementById('app');
  const COLS = 16, LOW = 48, HIGH = 84, STEP = 0.27;
  const MAJOR = [0, 2, 4, 5, 7, 9, 11];
  const KEY = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  const PRESETS = {
    up: [60, 62, 64, 65, 67, 69, 71, 72, null, null, null, null, null, null, null, null],
    down: [72, 71, 69, 67, 65, 64, 62, 60, null, null, null, null, null, null, null, null],
    arch: [60, 62, 64, 67, 69, 72, 74, 76, 74, 72, 69, 67, 64, 62, 60, null],
    jakob: [60, 62, 64, 60, 60, 62, 64, 60, 64, 65, 67, null, 64, 65, 67, null],
  };
  const keyName = shift => KEY[((shift % 12) + 12) % 12] + t('-dur', ' major');

  if (app.dataset.widget === 'shapes') return shapesWidget();

  let base = (PRESETS[params.get('preset')] || PRESETS.jakob).slice(); // toner ved flytting 0
  let shift = 0, disp = 0, playing = null, drawing = false, erase = false, lastCol = -1, lastY = 0, flash = 0;
  const hot = new Array(COLS).fill(0);

  const playBtn = h('button', { type: 'button', class: 'primary', on: { click: () => (playing ? stop() : play()) } }, t('▶ Spill', '▶ Play'));
  const upBtn = h('button', { type: 'button', on: { click: () => move(1) } }, t('▲ Flytt opp', '▲ Move up'));
  const downBtn = h('button', { type: 'button', on: { click: () => move(-1) } }, t('▼ Flytt ned', '▼ Move down'));
  const resetBtn = h('button', { type: 'button', on: { click: () => move(-shift) } }, t('Tilbake', 'Reset'));
  const keyEl = h('strong', { class: 'key' }), shiftEl = h('span', { class: 'muted small' });
  const gapsEl = h('div', { class: 'gaps' });
  const status = h('p', { class: 'status', role: 'status', text: t('Tegn med fingeren eller musa. Trykk Spill – og flytt melodien.', 'Draw with your finger or mouse. Press Play – then move the melody.') });
  const eraseBtn = h('button', { type: 'button', 'aria-pressed': 'false', on: { click: () => { erase = !erase; eraseBtn.setAttribute('aria-pressed', String(erase)); } } }, t('Viskelær', 'Eraser'));
  const stage = h('div', { class: 'stage draw' });
  app.append(
    h('style', { text: `
      .draw canvas { cursor:crosshair; }
      .gaps { display:flex; flex-wrap:wrap; gap:5px; }
      .gaps span { min-width:34px; text-align:center; padding:5px 8px; border-radius:999px; background:#0f0f14; border:1px solid var(--line); font-weight:800; font-size:12.5px; font-variant-numeric:tabular-nums; transition:box-shadow .3s, border-color .3s; }
      .gaps.flash span { border-color:var(--red); box-shadow:0 0 14px var(--glow); }
      .key { font-size:20px; }
    ` }),
    h('header', {}, h('div', {}, h('p', { class: 'eyebrow', text: t('Melodi', 'Melody') }), h('h1', { text: params.get('title') || t('Tegn en melodi', 'Draw a melody') })),
      h('div', { class: 'row' }, playBtn, eraseBtn, h('button', { type: 'button', on: { click: () => { base = new Array(COLS).fill(null); stop(); } } }, t('Tøm', 'Clear')))),
    stage,
    h('div', { class: 'grid2' },
      h('section', { class: 'panel' },
        h('div', { class: 'row spread' }, h('div', {}, h('p', { class: 'eyebrow', text: t('Flytt hele linja', 'Move the whole line') }), keyEl, ' ', shiftEl)),
        h('div', { class: 'row', style: 'margin-top:8px' }, upBtn, downBtn, resetBtn)),
      h('section', { class: 'panel' },
        h('p', { class: 'eyebrow', text: t('Avstander mellom tonene (halvtoner)', 'Distances between notes (semitones)') }), gapsEl,
        h('p', { class: 'small muted', text: t('De endrer seg ikke når du flytter melodien. Derfor er det fortsatt samme melodi.', 'They do not change when you move the melody. That is why it is still the same melody.') }))),
    h('div', { class: 'row' }, h('span', { class: 'small muted', text: t('Prøv:', 'Try:') }),
      ...[['jakob', t('Fader Jakob', 'Frère Jacques')], ['up', t('Opp', 'Up')], ['down', t('Ned', 'Down')], ['arch', t('Bue', 'Arch')]].map(([k, l]) => h('button', { type: 'button', on: { click: () => { base = PRESETS[k].slice(); move(-shift); update(); if (!playing) play(); } } }, l))),
    status);

  const cv = canvas(stage, w => (w < 520 ? 260 : 330));
  stage.prepend(cv.c);
  const geom = () => { const padL = 34, padR = 12, padT = 14, padB = 14; return { padL, padT, cw: (cv.w - padL - padR) / COLS, rh: (cv.h - padT - padB) / (HIGH - LOW) }; };
  const yOf = m => { const g = geom(); return g.padT + (HIGH - m) * g.rh; };
  const xOf = c => { const g = geom(); return g.padL + (c + 0.5) * g.cw; };
  const inKey = m => MAJOR.includes((((m - shift) % 12) + 12) % 12);

  // Tegning: y festes til nærmeste skalatone i gjeldende toneart.
  function snap(y) {
    const g = geom(); let m = Math.round(HIGH - (y - g.padT) / g.rh);
    m = Math.max(LOW, Math.min(HIGH, m));
    for (let d = 0; d < 3; d++) { if (inKey(m - d) && m - d >= LOW) return m - d; if (inKey(m + d) && m + d <= HIGH) return m + d; }
    return m;
  }
  function paint(e) {
    const r = cv.c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, g = geom();
    const col = Math.max(0, Math.min(COLS - 1, Math.floor((x - g.padL) / g.cw)));
    const from = lastCol < 0 ? col : lastCol;
    const dir = col >= from ? 1 : -1;
    for (let c = from; dir > 0 ? c <= col : c >= col; c += dir) {
      const u = col === from ? 1 : (c - from) / (col - from), yy = lastCol < 0 ? y : lastY + (y - lastY) * u;
      if (erase) base[c] = null;
      else {
        const m = snap(yy) - shift;
        if (base[c] !== m && c === col) note(m + shift, { dur: 0.25, vel: 0.35 });
        base[c] = m; hot[c] = 1;
      }
    }
    lastCol = col; lastY = y; update();
  }
  cv.c.addEventListener('pointerdown', e => { audio(); drawing = true; lastCol = -1; cv.c.setPointerCapture(e.pointerId); paint(e); });
  cv.c.addEventListener('pointermove', e => drawing && paint(e));
  const end = () => { drawing = false; lastCol = -1; };
  cv.c.addEventListener('pointerup', end); cv.c.addEventListener('pointercancel', end);

  function move(d) {
    const notes = base.filter(m => m != null);
    if (!notes.length) { shift += d; update(); return; }
    const lo = Math.min(...notes) + shift + d, hi = Math.max(...notes) + shift + d;
    if (lo < LOW || hi > HIGH) { status.textContent = t('Lenger kommer vi ikke på dette brettet.', 'We cannot go further on this board.'); return; }
    shift += d; flash = 1; update();
    if (d && !playing) play();
  }
  function update() {
    keyEl.textContent = keyName(shift);
    shiftEl.textContent = shift === 0 ? t('· utgangspunkt', '· starting point') : t(`· flyttet ${shift > 0 ? '+' : ''}${shift} halvtoner`, `· moved ${shift > 0 ? '+' : ''}${shift} semitones`);
    const notes = base.filter(m => m != null);
    gapsEl.replaceChildren(...notes.slice(1).map((m, i) => { const d = m - notes[i]; return h('span', { text: d > 0 ? '+' + d : d === 0 ? '0' : '−' + -d }); }));
    if (flash) { gapsEl.classList.remove('flash'); void gapsEl.offsetWidth; gapsEl.classList.add('flash'); setTimeout(() => gapsEl.classList.remove('flash'), 700); }
    const lo = notes.length ? Math.min(...notes) + shift : 60, hi = notes.length ? Math.max(...notes) + shift : 60;
    upBtn.disabled = hi + 1 > HIGH; downBtn.disabled = lo - 1 < LOW; resetBtn.disabled = shift === 0;
    if (shift !== 0 && !drawing) status.textContent = t('Alle tonene er flyttet like langt. Hør: det er fortsatt den samme melodien – bare lysere eller dypere.', 'Every note moved the same distance. Listen: it is still the same melody – just higher or lower.');
  }
  // Avspilling i loop med presis timing.
  const lp = RS.loop({
    stepDur: () => STEP,
    onStep: (s, time) => { const m = base[s % COLS]; if (m != null) note(m + shift, { time, dur: STEP * 0.95, vel: s % 4 === 0 ? 0.6 : 0.48 }); },
    onShow: (s, time) => { playing = { col: s % COLS, time }; if (base[s % COLS] != null) hot[s % COLS] = 1; },
  });
  function play() { audio(); playing = { col: -1, time: 0 }; lp.start(); playBtn.textContent = t('■ Stopp', '■ Stop'); playBtn.classList.remove('primary'); }
  function stop() { lp.stop(); playing = null; playBtn.textContent = t('▶ Spill', '▶ Play'); playBtn.classList.add('primary'); }

  let last = performance.now();
  function frame(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000); last = ts;
    disp += (shift - disp) * (reduced ? 1 : Math.min(1, dt * 9));
    const { g, w, h: hh } = cv, gm = geom();
    g.clearRect(0, 0, w, hh);
    // tonelinjer for gjeldende toneart (følger med når melodien flyttes)
    for (let m = LOW; m <= HIGH; m++) {
      const rel = (((m - Math.round(disp)) % 12) + 12) % 12;
      if (!MAJOR.includes(rel)) continue;
      const y = yOf(m + (disp - Math.round(disp)));
      g.strokeStyle = rel === 0 ? 'rgba(255,42,95,.28)' : 'rgba(255,255,255,.06)'; g.lineWidth = rel === 0 ? 1.5 : 1;
      g.beginPath(); g.moveTo(gm.padL, y); g.lineTo(w - 12, y); g.stroke();
    }
    g.fillStyle = 'rgba(255,255,255,.35)'; g.font = '700 11px Inter, system-ui'; g.textAlign = 'left';
    g.fillText(t('lys', 'high'), 4, 22); g.fillText(t('dyp', 'low'), 4, hh - 12);
    for (let c = 0; c <= COLS; c += 4) { g.strokeStyle = 'rgba(255,255,255,' + (c % 16 ? .06 : .1) + ')'; const x = gm.padL + c * gm.cw; g.beginPath(); g.moveTo(x, 8); g.lineTo(x, hh - 8); g.stroke(); }
    // spillehode
    if (playing && playing.col >= 0) {
      const x = gm.padL + playing.col * gm.cw, grad = g.createLinearGradient(x, 0, x + gm.cw, 0);
      grad.addColorStop(0, 'rgba(255,42,95,.0)'); grad.addColorStop(1, 'rgba(255,42,95,.16)');
      g.fillStyle = grad; g.fillRect(x, 0, gm.cw, hh);
    }
    // skygge av utgangspunktet
    const pts = base.map((m, c) => (m == null ? null : [xOf(c), yOf(m + disp), c]));
    if (Math.abs(disp) > 0.05) {
      g.strokeStyle = 'rgba(255,255,255,.14)'; g.setLineDash([4, 6]); g.lineWidth = 2; g.beginPath(); let pen = false;
      base.forEach((m, c) => { if (m == null) { pen = false; return; } const p = [xOf(c), yOf(m)]; pen ? g.lineTo(...p) : g.moveTo(...p); pen = true; });
      g.stroke(); g.setLineDash([]);
    }
    // linja
    g.lineJoin = 'round'; g.lineCap = 'round';
    const stroke = (width, alpha, blur) => {
      g.beginPath(); let pen = false;
      pts.forEach(p => { if (!p) { pen = false; return; } pen ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); pen = true; });
      glow(g, '#ff2a5f', blur); g.strokeStyle = `rgba(255,42,95,${alpha})`; g.lineWidth = width; g.stroke(); g.shadowBlur = 0;
    };
    stroke(9, 0.25, 20); stroke(3, 1, 8);
    pts.forEach(p => {
      if (!p) return; const k = hot[p[2]]; hot[p[2]] = Math.max(0, k - dt * 2.5);
      glow(g, '#ff2a5f', 10 + 30 * k); g.fillStyle = k > 0.05 ? '#fff' : '#ffd3de';
      g.beginPath(); g.arc(p[0], p[1], 4.5 + 5 * k, 0, Math.PI * 2); g.fill(); g.shadowBlur = 0;
    });
    if (!base.some(m => m != null)) { g.fillStyle = 'rgba(255,255,255,.45)'; g.font = '600 15px Inter, system-ui'; g.textAlign = 'center'; g.fillText(t('Tegn en linje her', 'Draw a line here'), w / 2, hh / 2); }
    requestAnimationFrame(frame);
  }
  update(); requestAnimationFrame(frame);

  // ======================================================================
  // Widget: Melodiformer
  function shapesWidget() {
    const SH = {
      up: { label: t('Opp', 'Up'), notes: [60, 62, 64, 65, 67, 69, 71, 72] },
      down: { label: t('Ned', 'Down'), notes: [72, 71, 69, 67, 65, 64, 62, 60] },
      arch: { label: t('Bue', 'Arch'), notes: [60, 64, 67, 72, 76, 72, 67, 64, 60] },
    };
    let cur = 'arch', start = -1;
    const stage = h('div', { class: 'stage' });
    const btns = Object.entries(SH).map(([k, s]) => h('button', { type: 'button', 'aria-pressed': String(k === cur), on: { click: () => { cur = k; btns.forEach((b, i) => b.setAttribute('aria-pressed', String(Object.keys(SH)[i] === k))); go(); } } }, s.label));
    const go = () => { audio(); const t0 = RS.now() + 0.05; start = t0; SH[cur].notes.forEach((m, i) => note(m, { time: t0 + i * 0.22, dur: i === SH[cur].notes.length - 1 ? 0.9 : 0.24, vel: 0.5 })); };
    app.append(
      h('header', {}, h('div', {}, h('p', { class: 'eyebrow', text: t('Melodi', 'Melody') }), h('h1', { text: params.get('title') || t('Melodiformer', 'Melody shapes') }))),
      stage, h('div', { class: 'row' }, btns),
      h('p', { class: 'status', text: t('Følg linja med hånden mens du lytter.', 'Follow the line with your hand while you listen.') }));
    const cv = canvas(stage, 140); stage.prepend(cv.c);
    (function frame() {
      const { g, w, h: hh } = cv, n = SH[cur].notes, lo = 58, hi = 78;
      g.clearRect(0, 0, w, hh);
      const P = n.map((m, i) => [20 + i * (w - 40) / (n.length - 1), hh - 16 - (m - lo) / (hi - lo) * (hh - 32)]);
      const k = start > 0 && RS.ctx ? (RS.ctx.currentTime - start) / 0.22 : -1;
      g.lineJoin = 'round'; glow(g, '#ff2a5f', 14); g.strokeStyle = '#ff2a5f'; g.lineWidth = 3;
      g.beginPath(); P.forEach((p, i) => (i ? g.lineTo(...p) : g.moveTo(...p))); g.stroke(); g.shadowBlur = 0;
      P.forEach((p, i) => { const on = k >= i && k < i + 1; glow(g, '#ff2a5f', on ? 28 : 6); g.fillStyle = on ? '#fff' : '#ffd3de'; g.beginPath(); g.arc(p[0], p[1], on ? 8 : 4.5, 0, Math.PI * 2); g.fill(); g.shadowBlur = 0; });
      requestAnimationFrame(frame);
    })();
  }
})();
