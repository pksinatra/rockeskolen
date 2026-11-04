/* Rockeskolen – toneart-embed: grunntonen som hjem.
 *
 * En frase i C-dur stopper uten å lande. Brukeren klikker for å komme hjem – eller prøver å lande på en annen tone.
 *
 * URL-parametere:
 *   widget   (tom) | quiz     quiz = «Kom den hjem?»
 *   title    egen overskrift
 *   lang     no | en
 */
(function () {
  const { t, h, audio, canvas, glow, params, note, rand, reduced } = RS;
  const app = document.getElementById('app');
  const BEAT = 0.6; // 100 BPM
  const CH = { C: [48, [60, 64, 67]], F: [41, [60, 65, 69]], G: [43, [59, 62, 67]], Am: [45, [60, 64, 69]], Dm: [38, [62, 65, 69]] };
  const NAMES = { 57: 'A', 59: 'B', 60: 'C', 62: 'D', 64: 'E', 65: 'F', 67: 'G', 69: 'A', 71: 'B', 72: 'C' };
  function playChord(name, time, dur, vel = 0.5) {
    const [bass, tones] = CH[name];
    note(bass, { time, dur, vel: vel * 1.1, kind: 'bass' });
    tones.forEach(m => note(m - 12 + (m < 62 ? 12 : 0), { time, dur, vel: vel * 0.8, kind: 'pad' }));
  }

  if (app.dataset.widget === 'quiz') return quizWidget();

  // Fraser: [tone, slag]; siste tone holdes og venter på hjemkomst.
  const PHRASES = [
    { chords: ['C', 'F', 'G'], mel: [[64, 1], [67, 1], [69, 1], [67, 1], [65, 1], [69, 1], [67, 1], [65, 1], [64, 1], [62, 3]] },
    { chords: ['C', 'Am', 'Dm', 'G'], mel: [[67, 1], [64, 1], [60, 1], [64, 1], [69, 1], [67, 1], [64, 1], [60, 1], [65, 1], [64, 1], [62, 1], [65, 1], [62, 1], [59, 3]] },
  ];
  let pi = 0, state = 'idle', t0 = 0, trail = [], ball = null, fall = null, burst = -9, landed = null;
  const TOP = 7.6, BOTTOM = -2.6; // skalatrinn øverst og nederst i bildet
  const playBtn = h('button', { type: 'button', class: 'primary', on: { click: play } }, t('▶ Spill frasen', '▶ Play the phrase'));
  const homeBtn = h('button', { type: 'button', class: 'home-btn', disabled: true, on: { click: () => land(60, true) } }, t('⌂ Kom hjem', '⌂ Come home'));
  const other = h('div', { class: 'row' }, h('span', { class: 'small muted', text: t('Eller land på:', 'Or land on:') }),
    ...[62, 64, 65, 67, 69, 71].map(m => h('button', { type: 'button', class: 'landing', disabled: true, on: { click: () => land(m, false) } }, NAMES[m])));
  const status = h('p', { class: 'status', role: 'status', text: t('Spill frasen. Den stopper før den er ferdig – du bestemmer slutten.', 'Play the phrase. It stops before it is finished – you choose the ending.') });
  const chordEl = h('div', { class: 'chords' });
  const stage = h('div', { class: 'stage home-stage' });
  app.append(
    h('style', { text: `
      .home-btn:not(:disabled) { background:linear-gradient(135deg,var(--red),var(--red2)); border-color:transparent; animation:homepulse 1.2s ease-in-out infinite; }
      @keyframes homepulse { 50% { box-shadow:0 0 30px rgba(255,42,95,.8); } }
      .chords { display:flex; gap:6px; flex-wrap:wrap; }
      .chords span { padding:5px 11px; border-radius:999px; border:1px solid var(--line); font-weight:800; font-size:13px; color:var(--muted); }
      .chords span.now { color:#fff; border-color:var(--red); box-shadow:0 0 14px var(--glow); }
      .home-stage canvas { cursor:pointer; }
      @media (prefers-reduced-motion:reduce){ .home-btn:not(:disabled){animation:none} }
    ` }),
    h('header', {}, h('div', {}, h('p', { class: 'eyebrow', text: t('Toneart', 'Key') }), h('h1', { text: params.get('title') || t('Musikken har et hjem', 'Music has a home') })),
      h('div', { class: 'row' }, playBtn, h('button', { type: 'button', on: { click: () => { pi = (pi + 1) % PHRASES.length; play(); } } }, t('Ny frase', 'New phrase')))),
    stage,
    h('div', { class: 'row spread' }, chordEl, homeBtn),
    other, status);
  const cv = canvas(stage, w => (w < 520 ? 270 : 320));
  stage.prepend(cv.c);
  cv.c.addEventListener('pointerdown', () => state === 'waiting' && land(60, true));
  // Høyden følger skalatrinnene, så alle toner i C-dur får like stor plass.
  const DI = { 57: -2, 59: -1, 60: 0, 62: 1, 64: 2, 65: 3, 67: 4, 69: 5, 71: 6, 72: 7 };
  const geo = () => { const { w, h: hh } = cv, padL = 50, padR = 70; return { x0: padL, x1: w - padR, y: m => 16 + (TOP - DI[m]) / (TOP - BOTTOM) * (hh - 32) }; };
  const totalBeats = () => PHRASES[pi].mel.reduce((a, [, b]) => a + b, 0);

  function renderChords(active) {
    const ch = PHRASES[pi].chords.concat(state === 'home' ? ['C'] : ['?']);
    chordEl.replaceChildren(...ch.map((c, i) => h('span', { class: i === active ? 'now' : '', text: c })));
  }
  function play() {
    audio(); state = 'playing'; trail = []; fall = null; landed = null; t0 = RS.now() + 0.08;
    const p = PHRASES[pi];
    p.chords.forEach((c, i) => playChord(c, t0 + i * 4 * BEAT, i === p.chords.length - 1 ? 4 * BEAT + 1.5 : 4 * BEAT));
    let b = 0; p.mel.forEach(([m, d]) => { note(m + 12, { time: t0 + b * BEAT, dur: d * BEAT * 0.95 + (b + d === totalBeats() ? 1 : 0), vel: 0.6, kind: 'pluck' }); b += d; });
    homeBtn.disabled = true; other.querySelectorAll('button').forEach(x => (x.disabled = true));
    status.textContent = t('Lytt …', 'Listen …'); renderChords(0);
    setTimeout(() => {
      if (state !== 'playing') return; state = 'waiting';
      homeBtn.disabled = false; other.querySelectorAll('button').forEach(x => (x.disabled = false));
      status.textContent = t('Frasen henger i lufta. Kjenner du draget mot grunntonen? Trykk «Kom hjem».', 'The phrase hangs in the air. Feel the pull towards the home note? Press “Come home”.');
    }, (totalBeats() - 2) * BEAT * 1000);
  }
  function land(m, home) {
    if (state !== 'waiting' && state !== 'landed') return;
    audio(); const time = RS.now() + 0.03;
    if (home) { playChord('C', time, 3, 0.6); note(72, { time, dur: 2.6, vel: 0.7, kind: 'pluck' }); note(48, { time, dur: 2.5, vel: 0.6, kind: 'bass' }); state = 'home'; renderChords(PHRASES[pi].chords.length); }
    else { note(m + 12, { time, dur: 1.4, vel: 0.65, kind: 'pluck' }); state = 'landed'; }
    const last = trail[trail.length - 1] || [0.9, 62];
    fall = { from: last, to: m, start: performance.now(), home };
    landed = m;
    status.textContent = home
      ? t('Hjemme! Grunntonen C gir ro – frasen er ferdig. C er sentrum: tonearten heter C-dur.', 'Home! The home note C brings rest – the phrase is finished. C is the centre: the key is C major.')
      : t(`Du landet på ${NAMES[m]}. Føles det ferdig? De fleste kjenner at musikken fortsatt vil videre – prøv «Kom hjem».`, `You landed on ${NAMES[m]}. Does it feel finished? Most people feel the music still wants to move on – try “Come home”.`);
    if (home) { homeBtn.disabled = true; other.querySelectorAll('button').forEach(x => (x.disabled = true)); }
  }

  let last = performance.now();
  function frame(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000); last = ts;
    const { g, w, h: hh } = cv, G = geo(), p = PHRASES[pi], tb = totalBeats();
    g.clearRect(0, 0, w, hh);
    const homeY = G.y(60);
    // tyngdefelt: svake linjer som trekkes mot hjem-linja
    for (let i = 0; i < 9; i++) {
      const x = G.x0 + (i + 0.5) / 9 * (G.x1 - G.x0), ph = ((ts / 1600 + i * 0.37) % 1);
      const y = 20 + ph * (homeY - 26);
      if (!reduced) { g.fillStyle = `rgba(255,42,95,${0.25 * ph})`; g.fillRect(x, y, 1.5, 8); }
    }
    // tonelinjer
    for (const m of [57, 59, 62, 64, 65, 67, 69, 71, 72]) {
      const y = G.y(m); g.strokeStyle = m === 72 ? 'rgba(255,42,95,.25)' : 'rgba(255,255,255,.06)'; g.lineWidth = 1; g.setLineDash(m === 72 ? [4, 6] : []);
      g.beginPath(); g.moveTo(G.x0, y); g.lineTo(w - 12, y); g.stroke(); g.setLineDash([]);
      g.fillStyle = 'rgba(255,255,255,.35)'; g.font = '700 11px Inter, system-ui'; g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillText(NAMES[m], G.x0 - 10, y);
    }
    // hjem-linja
    const homeGlow = state === 'home' ? Math.max(0.4, Math.exp(-(performance.now() - burst) / 900)) : 0.25 + 0.15 * Math.sin(ts / 300) * (state === 'waiting' ? 1 : 0);
    glow(g, '#ff2a5f', 10 + 40 * homeGlow); g.strokeStyle = '#ff2a5f'; g.lineWidth = 4 + 4 * homeGlow;
    g.beginPath(); g.moveTo(G.x0, homeY); g.lineTo(w - 12, homeY); g.stroke(); g.shadowBlur = 0;
    g.fillStyle = '#fff'; g.font = '800 13px Inter, system-ui'; g.textAlign = 'right'; g.fillText('C', G.x0 - 10, homeY);
    g.fillStyle = '#ff8aa6'; g.textAlign = 'left'; g.font = '800 11px Inter, system-ui'; g.fillText(t('HJEM', 'HOME'), G.x0 + 6, homeY + 14);
    // frasen
    const nowS = RS.ctx ? RS.ctx.currentTime : 0;
    if (state !== 'idle') {
      let b = 0; const pts = [];
      const beatNow = (nowS - t0) / BEAT;
      p.mel.forEach(([m, d], i) => {
        if (beatNow >= b) { pts.push([G.x0 + (b / (tb + 2)) * (G.x1 - G.x0), G.y(m), m, b]); if (i === p.mel.length - 1 || beatNow < b + d) pts.push([G.x0 + (Math.min(beatNow, b + d) / (tb + 2)) * (G.x1 - G.x0), G.y(m), m]); }
        b += d;
      });
      if (state === 'playing') { const bar = Math.min(p.chords.length - 1, Math.floor(beatNow / 4)); if (bar >= 0 && chordEl.children[bar] && !chordEl.children[bar].classList.contains('now')) renderChords(bar); }
      trail = pts.map(q => [(q[0] - G.x0) / (G.x1 - G.x0), q[2]]);
      g.lineJoin = 'round';
      glow(g, '#ff2a5f', 12); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 2.5;
      g.beginPath(); pts.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.stroke(); g.shadowBlur = 0;
      // ballen
      let bx, by;
      if (fall) {
        const k = Math.min(1, (performance.now() - fall.start) / (reduced ? 1 : 650));
        const sx = G.x0 + fall.from[0] * (G.x1 - G.x0), sy = G.y(fall.from[1]), ex = G.x0 + ((tb + 1.2) / (tb + 2)) * (G.x1 - G.x0), ey = G.y(fall.to);
        const e = fall.home ? (k < 1 ? k * k : 1) : 1 - Math.pow(1 - k, 3);
        bx = sx + (ex - sx) * k; by = sy + (ey - sy) * e;
        g.strokeStyle = fall.home ? 'rgba(255,42,95,.9)' : 'rgba(255,255,255,.5)'; g.setLineDash(fall.home ? [] : [3, 5]); g.lineWidth = 2.5;
        g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(ex, sy, bx, by); g.stroke(); g.setLineDash([]);
        if (k >= 1 && fall.home && burst < fall.start) burst = performance.now();
      } else if (pts.length) {
        const q = pts[pts.length - 1]; bx = q[0]; by = q[1];
        if (state === 'waiting' && !reduced) by += Math.sin(ts / 140) * 3;
      }
      if (bx != null) {
        glow(g, '#ff2a5f', 30); g.fillStyle = '#fff'; g.beginPath(); g.arc(bx, by, 8, 0, Math.PI * 2); g.fill(); g.shadowBlur = 0;
        if (state === 'waiting') {
          // pil mot hjem
          g.strokeStyle = 'rgba(255,42,95,.7)'; g.setLineDash([3, 5]); g.lineWidth = 2;
          const dir = by < homeY ? 1 : -1; // ned mot hjem, eller opp når frasen står under
          g.beginPath(); g.moveTo(bx, by + 12 * dir); g.lineTo(bx, homeY - 8 * dir); g.stroke(); g.setLineDash([]);
          g.fillStyle = 'rgba(255,42,95,.9)'; g.beginPath(); g.moveTo(bx - 6, homeY - 14 * dir); g.lineTo(bx + 6, homeY - 14 * dir); g.lineTo(bx, homeY - 5 * dir); g.fill();
        }
      }
      // sjokkbølge ved hjemkomst
      const age = (performance.now() - burst) / 1000;
      if (state === 'home' && age < 1.2 && bx != null) {
        for (let i = 0; i < 3; i++) { const a = age - i * 0.12; if (a < 0) continue; g.strokeStyle = `rgba(255,42,95,${Math.max(0, 0.8 - a)})`; g.lineWidth = 3; g.beginPath(); g.ellipse(bx, homeY, 20 + a * 220, 6 + a * 40, 0, 0, Math.PI * 2); g.stroke(); }
      }
    } else {
      g.fillStyle = 'rgba(255,255,255,.45)'; g.font = '600 15px Inter, system-ui'; g.textAlign = 'center'; g.fillText(t('Trykk «Spill frasen»', 'Press “Play the phrase”'), w / 2, G.y(67));
    }
    requestAnimationFrame(frame);
  }
  renderChords(-1); requestAnimationFrame(frame);

  // ======================================================================
  // Widget: Kom den hjem? Frasene flyttes til en tilfeldig toneart.
  function quizWidget() {
    const ENDINGS = [
      { home: true, chord: 'C', mel: 72 },
      { home: false, chord: 'G', mel: 71 },
      { home: false, chord: 'G', mel: 74 },
      { home: false, chord: 'F', mel: 69 },
    ];
    const BAR3 = [[71, 67, 74, 71], [74, 71, 67, 74], [67, 71, 74, 71]];
    let q = null, score = [0, 0];
    const orb = h('div', { class: 'qorb' });
    const fb = h('p', { class: 'status', role: 'status', text: t('Hør frasen. Lander den hjemme på grunntonen?', 'Listen to the phrase. Does it land at home on the home note?') });
    const playQ = () => {
      if (!q) return; audio(); const t0 = RS.now() + 0.05, k = q.shift, B = 0.42;
      const bars = [['C', [64, 67, 64, 60]], ['F', [65, 69, 72, 69]], ['G', q.bar3]];
      bars.forEach(([c, mel], i) => { const [bass, tones] = CH[c]; note(bass + k, { time: t0 + i * 4 * B, dur: 4 * B, vel: 0.5, kind: 'bass' }); tones.forEach(m => note(m + k - 12, { time: t0 + i * 4 * B, dur: 4 * B, vel: 0.35, kind: 'pad' })); mel.forEach((m, j) => note(m + k, { time: t0 + (i * 4 + j) * B, dur: B * 0.9, vel: 0.55, kind: 'pluck' })); });
      const end = t0 + 12 * B, [bass, tones] = CH[q.end.chord];
      note(bass + k, { time: end, dur: 2, vel: 0.55, kind: 'bass' }); tones.forEach(m => note(m + k - 12, { time: end, dur: 2, vel: 0.4, kind: 'pad' })); note(q.end.mel + k, { time: end, dur: 1.8, vel: 0.6, kind: 'pluck' });
      orb.className = 'qorb'; setTimeout(() => orb.classList.add('end'), 12 * B * 1000);
    };
    const ask = () => { q = { end: rand(ENDINGS), bar3: rand(BAR3), shift: Math.floor(Math.random() * 12) - 5, done: false }; if (Math.random() < 0.45) q.end = ENDINGS[0]; playQ(); fb.textContent = t('Kom den hjem?', 'Did it come home?'); };
    const answer = yes => {
      if (!q || q.done) return; q.done = true;
      const ok = yes === q.end.home; score[0] += ok ? 1 : 0; score[1]++;
      orb.className = 'qorb end ' + (q.end.home ? 'home' : 'away');
      fb.replaceChildren(h('span', { class: 'feedback ' + (ok ? 'good' : 'bad'), text: ok ? t('Riktig! ', 'Right! ') : t('Ikke denne gangen. ', 'Not this time. ') }),
        (q.end.home ? t('Frasen landet på grunntonen.', 'The phrase landed on the home note.') : t('Frasen stoppet uten å lande – den vil videre.', 'The phrase stopped without landing – it wants to move on.')) + ` (${score[0]}/${score[1]})`);
    };
    app.append(
      h('style', { text: `
        .qorb { position:relative; height:90px; border-radius:14px; border:1px solid var(--line); background:linear-gradient(180deg,#121218,#0c0c10); overflow:hidden; }
        .qorb::before { content:''; position:absolute; left:10%; right:10%; bottom:18px; height:3px; border-radius:3px; background:var(--red); box-shadow:0 0 16px var(--glow); }
        .qorb::after { content:''; position:absolute; left:50%; top:16px; width:16px; height:16px; margin-left:-8px; border-radius:50%; background:#fff; box-shadow:0 0 18px var(--red); transition:top .5s cubic-bezier(.5,0,1,1); }
        .qorb.end.home::after { top:58px; } .qorb.end.away::after { top:24px; animation:hover 1s ease-in-out infinite; }
        @keyframes hover { 50% { transform:translateY(-4px); } }
      ` }),
      h('header', {}, h('div', {}, h('p', { class: 'eyebrow', text: 'Quiz' }), h('h1', { text: params.get('title') || t('Kom den hjem?', 'Did it come home?') }))),
      orb,
      h('div', { class: 'row' }, h('button', { type: 'button', class: 'primary', on: { click: ask } }, t('▶ Ny frase', '▶ New phrase')), h('button', { type: 'button', on: { click: playQ } }, t('Igjen', 'Again'))),
      h('div', { class: 'row' }, h('button', { type: 'button', on: { click: () => answer(true) } }, t('⌂ Ja, hjemme', '⌂ Yes, home')), h('button', { type: 'button', on: { click: () => answer(false) } }, t('… Nei, ikke ennå', '… No, not yet'))),
      fb);
  }
})();
