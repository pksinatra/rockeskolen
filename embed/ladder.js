/* Rockeskolen – tonestigen: skalaer og akkorder som trinn på en stige med 12 halvtoner per oktav.
 *
 * URL-parametere:
 *   mode     scale | chord               (standard: scale)
 *   scale    major | minor | penta      (standard: major)
 *   root     C D E F G A B              (standard: C)
 *   widget   (tom) | step | quiz         step = lite eller stort steg, quiz = lys eller mørk (dur/moll)
 *   title    egen overskrift
 *   lang     no | en
 */
(function () {
  const { t, h, audio, seg, canvas, glow, params, spell, triad, rand, note, chord } = RS;
  const app = document.getElementById('app');
  const widget = app.dataset.widget;
  const mode = params.get('mode') === 'chord' ? 'chord' : 'scale';
  const ROOTS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const NEUTRAL = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
  const SCALES = {
    major: { label: t('Dur', 'Major'), steps: [0, 2, 4, 5, 7, 9, 11, 12], letters: [0, 1, 2, 3, 4, 5, 6, 7] },
    minor: { label: t('Moll', 'Minor'), steps: [0, 2, 3, 5, 7, 8, 10, 12], letters: [0, 1, 2, 3, 4, 5, 6, 7] },
    penta: { label: t('Pentaton', 'Pentatonic'), steps: [0, 2, 4, 7, 9, 12], letters: [0, 1, 2, 4, 5, 7] },
  };
  const STEP_WORD = { 1: t('kort', 'short'), 2: t('langt', 'long'), 3: t('sprang', 'leap') };
  const WARM = ['#ff2a5f', '#ff8a3d'], COOL = ['#5b8cff', '#8b5cf6'];

  // ---------- tegning av stigen ----------
  // rungs: [{label, on, color, glow(0–1)}], nederst først. steps: [{from, to, text, color}]
  function drawLadder(cv, rungs, steps, opts = {}) {
    const { g, w, h: hh } = cv, n = rungs.length, top = 22, bottom = hh - 22;
    const gap = (bottom - top) / (n - 1);
    const left = opts.left ?? Math.max(54, w * 0.16), right = opts.right ?? Math.min(w - 104, left + 300);
    const yOf = i => bottom - i * gap;
    g.clearRect(0, 0, w, hh);
    // sidevanger
    g.save();
    const rail = g.createLinearGradient(0, bottom, 0, top); rail.addColorStop(0, 'rgba(255,255,255,.28)'); rail.addColorStop(1, 'rgba(255,255,255,.08)');
    g.strokeStyle = rail; g.lineWidth = 3; g.lineCap = 'round';
    [left, right].forEach(x => { g.beginPath(); g.moveTo(x, top - 10); g.lineTo(x, bottom + 10); g.stroke(); });
    rungs.forEach((r, i) => {
      const y = yOf(i);
      if (r.on) {
        const c = r.color || '#ff2a5f';
        glow(g, c, 14 + 26 * (r.glow || 0)); g.strokeStyle = c; g.lineWidth = 5 + 4 * (r.glow || 0);
        g.beginPath(); g.moveTo(left, y); g.lineTo(right, y); g.stroke();
        g.shadowBlur = 0; g.strokeStyle = 'rgba(255,255,255,' + (0.35 + 0.65 * (r.glow || 0)) + ')'; g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(left + 4, y); g.lineTo(right - 4, y); g.stroke();
      } else {
        g.strokeStyle = r.glow ? 'rgba(255,255,255,' + (0.15 + 0.6 * r.glow) + ')' : 'rgba(255,255,255,.13)'; g.lineWidth = 2;
        g.setLineDash([3, 5]); g.beginPath(); g.moveTo(left, y); g.lineTo(right, y); g.stroke(); g.setLineDash([]);
      }
      if (r.label) {
        g.fillStyle = r.on ? '#fff' : 'rgba(255,255,255,.35)'; g.font = (r.on ? '800 ' : '600 ') + (gap > 26 ? 14 : 12) + 'px Inter, system-ui';
        g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillText(r.label, left - 12, y);
      }
      if (r.badge) { g.fillStyle = 'rgba(255,255,255,.5)'; g.font = '700 11px Inter, system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(r.badge, (left + right) / 2, y - Math.min(11, gap / 2.4)); }
    });
    // steg-buer til høyre
    steps.forEach(s => {
      const y1 = yOf(s.from), y2 = yOf(s.to), x = right + 10, bulge = 14 + (s.to - s.from) * 4;
      g.strokeStyle = s.color; g.lineWidth = 2; glow(g, s.color, s.hot ? 16 : 0);
      g.beginPath(); g.moveTo(right + 2, y1); g.bezierCurveTo(x + bulge, y1, x + bulge, y2, right + 2, y2); g.stroke(); g.shadowBlur = 0;
      g.fillStyle = s.color; g.font = '800 12px Inter, system-ui'; g.textAlign = 'left'; g.textBaseline = 'middle';
      g.fillText(s.text, x + bulge * 0.75 + 6, (y1 + y2) / 2);
    });
    if (opts.ball) {
      const y = yOf(opts.ball.pos), x = (left + right) / 2;
      glow(g, opts.ball.color, 30); g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, 7, 0, Math.PI * 2); g.fill(); g.shadowBlur = 0;
    }
    g.restore();
    return { yOf, gap, left, right };
  }
  function rungAt(cv, geo, n, clientY, clientX) {
    const r = cv.c.getBoundingClientRect(), y = clientY - r.top, x = clientX - r.left;
    if (x < geo.left - 60 || x > geo.right + 10) return -1;
    let best = -1, d = Infinity;
    for (let i = 0; i < n; i++) { const dd = Math.abs(geo.yOf(i) - y); if (dd < d) { d = dd; best = i; } }
    return d < geo.gap * 0.6 ? best : -1;
  }
  const decay = arr => arr.forEach(r => (r.glow = Math.max(0, (r.glow || 0) - 0.035)));

  if (widget === 'step') return stepWidget();
  if (widget === 'quiz') return quizWidget();
  if (mode === 'chord') return chordView();
  return scaleView();

  // ======================================================================
  function scaleView() {
    let scaleId = SCALES[params.get('scale')] ? params.get('scale') : 'major';
    let rootName = ROOTS[params.get('root')] !== undefined ? params.get('root') : 'C';
    let names = true, playing = null, ball = null;
    const rungs = Array.from({ length: 13 }, () => ({ glow: 0 }));
    const patternEl = h('div', { class: 'pattern' }), toneEl = h('div', { class: 'tones' }), status = h('p', { class: 'status', role: 'status' });
    const playBtn = h('button', { type: 'button', class: 'primary', on: { click: play } }, t('▶ Spill skalaen', '▶ Play the scale'));
    const scaleSeg = seg(t('Skala', 'Scale'), Object.entries(SCALES).map(([k, s]) => [k, s.label]), scaleId, v => { scaleId = v; update(); play(); });
    const rootSeg = seg(t('Starttone', 'Starting note'), Object.keys(ROOTS).map(k => [k, k]), rootName, v => { rootName = v; update(); play(); });
    const nameBtn = h('button', { type: 'button', 'aria-pressed': 'true', on: { click: () => { names = !names; nameBtn.setAttribute('aria-pressed', String(names)); update(); } } }, t('Tonenavn', 'Note names'));
    const stage = h('div', { class: 'stage ladder-stage' });
    app.append(
      h('style', { text: `
        .ladder-layout { display:grid; grid-template-columns:minmax(0,1.1fr) minmax(240px,1fr); gap:14px; align-items:start; }
        .side { display:grid; gap:12px; }
        .pattern { display:flex; flex-wrap:wrap; gap:6px; }
        .pattern span { padding:6px 10px; border-radius:999px; font-weight:800; font-size:13px; border:1px solid var(--line); background:#0f0f14; transition:.15s; }
        .pattern span.s1 { color:#ffd0dc; border-color:rgba(255,42,95,.5); }
        .pattern span.s2 { color:#fff; }
        .pattern span.s3 { color:#ffc98f; border-color:rgba(255,138,61,.6); }
        .pattern span.hot { background:var(--red); color:#fff; box-shadow:0 0 18px var(--glow); }
        .tones { font-size:20px; font-weight:800; letter-spacing:.02em; word-spacing:.15em; }
        .seg.wrap { flex-wrap:wrap; border-radius:16px; }
        @media (max-width:700px){ .ladder-layout{grid-template-columns:1fr} }
      ` }),
      h('header', {}, h('div', {}, h('p', { class: 'eyebrow', text: t('Tonestigen', 'The tone ladder') }), h('h1', { text: params.get('title') || t('Hva er en skala?', 'What is a scale?') })), playBtn),
      h('div', { class: 'ladder-layout' }, stage,
        h('div', { class: 'side' },
          h('section', { class: 'panel' }, h('p', { class: 'eyebrow', text: t('Velg skala', 'Choose scale') }), scaleSeg),
          h('section', { class: 'panel' }, h('p', { class: 'eyebrow', text: t('Mønster av steg', 'Pattern of steps') }), patternEl,
            h('p', { class: 'small muted', text: t('Kort = ett trinn på stigen (halvt tonetrinn). Langt = to trinn (helt tonetrinn).', 'Short = one rung (half step). Long = two rungs (whole step).') })),
          h('section', { class: 'panel' }, h('div', { class: 'row spread' }, h('p', { class: 'eyebrow', text: t('Starttone', 'Starting note') }), nameBtn), h('div', { class: 'seg wrap' }, rootSeg), toneEl),
          status)));
    // seg med mange knapper får bryte linje
    rootSeg.classList.add('wrap');
    const cv = canvas(stage, w => Math.min(470, Math.max(380, w * 0.75)));
    stage.prepend(cv.c);
    let geo = null;
    cv.c.addEventListener('pointerdown', e => {
      if (!geo) return; const i = rungAt(cv, geo, 13, e.clientY, e.clientX); if (i < 0) return;
      note(base() + i, { dur: 0.7, vel: SCALES[scaleId].steps.includes(i) ? 0.6 : 0.35 }); rungs[i].glow = 1;
      const pos = SCALES[scaleId].steps.indexOf(i);
      status.textContent = pos >= 0 ? t(`Trinn ${pos + 1} i skalaen.`, `Degree ${pos + 1} of the scale.`) : t('Dette trinnet er ikke med i skalaen.', 'This rung is not part of the scale.');
    });
    const base = () => 60 + ROOTS[rootName];
    const nameOf = (i) => {
      const s = SCALES[scaleId], k = s.steps.indexOf(i);
      return k >= 0 ? spell(rootName, ROOTS[rootName], s.letters[k], i) : '';
    };
    function update() {
      const s = SCALES[scaleId];
      rungs.forEach((r, i) => { r.on = s.steps.includes(i); const k = s.steps.indexOf(i); r.label = names ? nameOf(i) : (r.on ? String(k === s.steps.length - 1 ? 1 : k + 1) : ''); });
      const gaps = s.steps.slice(1).map((v, i) => v - s.steps[i]);
      patternEl.replaceChildren(...gaps.map(d => h('span', { class: 's' + d, text: STEP_WORD[d] })));
      toneEl.textContent = s.steps.map(nameOf).join('  ');
      status.textContent = scaleId === 'penta'
        ? t('Pentatonisk skala: fem toner. Hoppene over de korte stegene gjør at nesten alle toner passer sammen.', 'Pentatonic scale: five notes. Skipping the short steps makes almost every note fit together.')
        : t(`${s.label}: sju toner før du er tilbake på starttonen, en oktav høyere.`, `${s.label}: seven notes before you are back on the starting note, an octave higher.`);
    }
    function play() {
      audio();
      const s = SCALES[scaleId], seq = s.steps.concat(s.steps.slice(0, -1).reverse()), t0 = RS.now() + 0.08, dt = 0.3;
      playing = { t0, dt, seq };
      seq.forEach((i, k) => note(base() + i, { time: t0 + k * dt, dur: k === seq.length - 1 ? 1.2 : 0.38, vel: 0.55 }));
    }
    function frame() {
      decay(rungs);
      let steps = [], s = SCALES[scaleId];
      let hotStep = -1;
      if (playing && RS.ctx) {
        const k = Math.floor((RS.ctx.currentTime - playing.t0) / playing.dt);
        if (k >= 0 && k < playing.seq.length) {
          const i = playing.seq[k]; rungs[i].glow = 1;
          const frac = (RS.ctx.currentTime - playing.t0) / playing.dt - k, nxt = playing.seq[k + 1] ?? i;
          ball = { pos: i + (nxt - i) * Math.min(1, frac * 1.6) * (frac > 0.4 ? 1 : 0), color: '#ff2a5f' };
          const up = k < s.steps.length - 1 ? k : -1, down = k >= s.steps.length - 1 ? playing.seq.length - 2 - k : -1;
          hotStep = up >= 0 ? up : down;
        } else if (k >= playing.seq.length) { playing = null; ball = null; }
      }
      steps = s.steps.slice(1).map((v, k) => ({ from: s.steps[k], to: v, text: STEP_WORD[v - s.steps[k]], color: v - s.steps[k] === 1 ? '#ff7a9a' : v - s.steps[k] === 3 ? '#ffb070' : 'rgba(255,255,255,.7)', hot: k === hotStep }));
      [...patternEl.children].forEach((el, k) => el.classList.toggle('hot', k === hotStep));
      geo = drawLadder(cv, rungs, steps, { ball });
      requestAnimationFrame(frame);
    }
    update(); requestAnimationFrame(frame);
  }

  // ======================================================================
  function chordView() {
    const N = 20, BASE = 60; // C4 til G5
    let sel = [0, 4, 7];
    const rungs = Array.from({ length: N }, () => ({ glow: 0 }));
    const nameEl = h('div', { class: 'big chord-name' }), typeEl = h('div', { class: 'chord-type' }), tonesEl = h('div', { class: 'small muted' }), gapsEl = h('div', { class: 'gaps' });
    const status = h('p', { class: 'status', role: 'status' });
    const quality = seg(t('Dur eller moll', 'Major or minor'), [['major', t('Dur', 'Major')], ['minor', t('Moll', 'Minor')]], 'major', v => setQuality(v));
    const stage = h('div', { class: 'stage' });
    app.append(
      h('style', { text: `
        .ladder-layout { display:grid; grid-template-columns:minmax(0,1.1fr) minmax(240px,1fr); gap:14px; align-items:start; }
        .side { display:grid; gap:12px; }
        .chord-card { display:grid; gap:6px; transition:box-shadow .4s, border-color .4s; }
        .chord-card.major { border-color:rgba(255,138,61,.55); box-shadow:0 0 40px rgba(255,90,60,.18) inset; }
        .chord-card.minor { border-color:rgba(91,140,255,.55); box-shadow:0 0 40px rgba(91,140,255,.18) inset; }
        .chord-name { transition:color .3s; } .major .chord-name { color:#ffb070; } .minor .chord-name { color:#9db8ff; }
        .chord-type { font-weight:800; }
        .gaps { display:flex; gap:6px; flex-wrap:wrap; } .gaps span { padding:5px 10px; border-radius:999px; background:#0f0f14; border:1px solid var(--line); font-weight:800; font-size:13px; }
        .stage { transition:background .5s; }
        .stage.major { background:radial-gradient(120% 90% at 50% 0%,#2a140f 0%,#0e0e13 60%,#0a0a0e 100%); }
        .stage.minor { background:radial-gradient(120% 90% at 50% 0%,#101a33 0%,#0e0e13 60%,#0a0a0e 100%); }
        @media (max-width:700px){ .ladder-layout{grid-template-columns:1fr} }
      ` }),
      h('header', {}, h('div', {}, h('p', { class: 'eyebrow', text: t('Akkord', 'Chord') }), h('h1', { text: params.get('title') || t('Tre trinn som klinger sammen', 'Three rungs sounding together') })),
        h('div', { class: 'row' }, h('button', { type: 'button', class: 'primary', on: { click: () => strum(0) } }, t('▶ Spill samtidig', '▶ Play together')), h('button', { type: 'button', on: { click: () => strum(0.22) } }, t('Etter hverandre', 'One by one')))),
      h('div', { class: 'ladder-layout' }, stage,
        h('div', { class: 'side' },
          h('section', { class: 'panel chord-card', id: 'card' }, h('p', { class: 'eyebrow', text: t('Du har valgt', 'You have chosen') }), nameEl, typeEl, tonesEl, gapsEl),
          h('section', { class: 'panel' }, h('p', { class: 'eyebrow', text: t('Flytt den midterste tonen', 'Move the middle note') }), quality,
            h('p', { class: 'small muted', text: t('Dur: 4 + 3 trinn. Moll: 3 + 4 trinn. Bare én tone flytter seg ett trinn.', 'Major: 4 + 3 rungs. Minor: 3 + 4 rungs. Only one note moves one rung.') })),
          h('p', { class: 'small muted', text: t('Trykk på trinnene for å velge tre toner selv.', 'Tap the rungs to pick three notes yourself.') }),
          status)));
    const card = app.querySelector('#card');
    const cv = canvas(stage, w => Math.min(500, Math.max(420, w * 0.8)));
    stage.prepend(cv.c);
    let geo = null;
    cv.c.addEventListener('pointerdown', e => {
      if (!geo) return; const i = rungAt(cv, geo, N, e.clientY, e.clientX); if (i < 0) return;
      if (sel.includes(i)) sel = sel.filter(x => x !== i);
      else { sel.push(i); if (sel.length > 3) sel.shift(); }
      note(BASE + i, { dur: 0.6, vel: 0.5 }); rungs[i].glow = 1;
      update(); if (sel.length === 3) setTimeout(() => strum(0), 380);
    });
    // Finn grunntone og type uansett rekkefølge (også omvendinger).
    function analyse() {
      if (sel.length !== 3) return null;
      const s = sel.slice().sort((a, b) => a - b), pcs = s.map(x => x % 12);
      for (const r of s) for (const [q, third] of [['major', 4], ['minor', 3]]) {
        const want = [0, third, 7].map(d => (r + d) % 12);
        if (want.every(p => pcs.includes(p)) && new Set(pcs).size === 3) return { root: r, q, third, inv: s[0] % 12 !== r % 12 };
      }
      return null;
    }
    function setQuality(q) {
      const a = analyse();
      if (a && a.q !== q) {
        // flytt tersen ett trinn, de to andre tonene står stille
        const thirdPc = (a.root + a.third) % 12, idx = sel.findIndex(x => x % 12 === thirdPc);
        sel[idx] += q === 'minor' ? -1 : 1;
      } else if (!a) {
        const r = Math.min(...sel.length ? sel : [0]), root = r > N - 8 ? r - 12 : r;
        sel = [root, root + (q === 'minor' ? 3 : 4), root + 7];
      }
      update(); strum(0);
    }
    function update() {
      const a = analyse(), s = sel.slice().sort((x, y) => x - y);
      let labels = {};
      if (a) {
        const tr = triad(a.root, a.q === 'minor');
        [0, a.third, 7].forEach((d, k) => { const pc = (a.root + d) % 12; s.forEach(x => { if (x % 12 === pc) labels[x] = tr.tones[k]; }); });
        nameEl.textContent = tr.name;
        typeEl.textContent = (a.q === 'major' ? t('Durakkord – lys', 'Major chord – bright') : t('Mollakkord – mørkere', 'Minor chord – darker')) + (a.inv ? t(' · omvending', ' · inversion') : '');
        tonesEl.textContent = t('Toner: ', 'Notes: ') + tr.tones.join(' – ');
        quality.set(a.q);
        status.textContent = a.inv
          ? t('Samme tre toner, men en annen tone ligger nederst. Det kalles en omvending.', 'Same three notes, but a different one at the bottom. That is called an inversion.')
          : a.q === 'major' ? t('Hør hvor åpen og lys durakkorden klinger. Trykk Moll og lytt etter forskjellen.', 'Hear how open and bright the major chord sounds. Press Minor and listen for the difference.')
            : t('Bare den midterste tonen har flyttet seg ett trinn ned – og fargen er en helt annen.', 'Only the middle note moved one rung down – and the colour is completely different.');
      } else {
        s.forEach(x => (labels[x] = NEUTRAL[x % 12]));
        nameEl.textContent = sel.length < 3 ? t(`${sel.length} av 3`, `${sel.length} of 3`) : '–';
        typeEl.textContent = sel.length < 3 ? t('Velg tre trinn', 'Pick three rungs') : t('Verken dur eller moll', 'Neither major nor minor');
        tonesEl.textContent = s.length ? t('Toner: ', 'Notes: ') + s.map(x => NEUTRAL[x % 12]).join(' – ') : '';
        quality.set(null);
        status.textContent = sel.length < 3 ? '' : t('Også dette er en klang – men ikke en dur- eller mollakkord. Trykk Dur eller Moll for å bygge en fra den nederste tonen.', 'This is a sound too – but not a major or minor chord. Press Major or Minor to build one from the lowest note.');
      }
      gapsEl.replaceChildren(...s.slice(1).map((x, k) => h('span', { text: '+' + (x - s[k]) })));
      card.classList.toggle('major', a?.q === 'major'); card.classList.toggle('minor', a?.q === 'minor');
      stage.classList.toggle('major', a?.q === 'major'); stage.classList.toggle('minor', a?.q === 'minor');
      rungs.forEach((r, i) => { r.on = sel.includes(i); r.label = labels[i] || NEUTRAL[i % 12]; r.color = a?.q === 'minor' ? COOL[0] : a?.q === 'major' ? WARM[1] : '#ff2a5f'; });
    }
    function strum(gap) {
      audio(); const t0 = RS.now() + 0.03, s = sel.slice().sort((a, b) => a - b);
      s.forEach((i, k) => { note(BASE + i, { time: t0 + k * (gap || 0.025), dur: 1.6, vel: 0.5 }); setTimeout(() => (rungs[i].glow = 1), (k * (gap || 0.025)) * 1000); });
      if (!gap && s.length === 3) note(BASE + s[0] - 12, { time: t0, dur: 1.4, vel: 0.5, kind: 'bass' });
    }
    function frame() {
      decay(rungs);
      const s = sel.slice().sort((a, b) => a - b), col = analyse()?.q === 'minor' ? '#9db8ff' : '#ffb070';
      const steps = s.length > 1 ? s.slice(1).map((x, k) => ({ from: s[k], to: x, text: '+' + (x - s[k]), color: col })) : [];
      geo = drawLadder(cv, rungs, steps);
      requestAnimationFrame(frame);
    }
    update(); requestAnimationFrame(frame);
  }

  // ======================================================================
  // Widget: Lite eller stort steg
  function stepWidget() {
    const rungs = Array.from({ length: 5 }, () => ({ glow: 0 }));
    let quiz = null, score = [0, 0];
    const fb = h('p', { class: 'status', role: 'status', text: t('Kort steg = nabotrinnet. Langt steg = hopp over ett trinn.', 'Short step = the next rung. Long step = skip one rung.') });
    const stage = h('div', { class: 'stage' });
    const playStep = (size, show = true) => {
      audio(); const t0 = RS.now() + 0.05, from = 1;
      note(62, { time: t0, dur: 0.5, vel: 0.6 }); note(62 + size, { time: t0 + 0.55, dur: 0.8, vel: 0.6 });
      if (show) { rungs.forEach(r => (r.on = false)); rungs[from].on = rungs[from + size].on = true; setTimeout(() => (rungs[from].glow = 1), 50); setTimeout(() => (rungs[from + size].glow = 1), 600); }
    };
    const answer = size => {
      if (!quiz) return;
      const ok = size === quiz.size; score[0] += ok ? 1 : 0; score[1]++;
      rungs.forEach(r => (r.on = false)); rungs[1].on = rungs[1 + quiz.size].on = true;
      fb.innerHTML = ''; fb.append(h('span', { class: 'feedback ' + (ok ? 'good' : 'bad'), text: ok ? t('Riktig! ', 'Right! ') : t('Ikke helt. ', 'Not quite. ') }), (quiz.size === 1 ? t('Det var et kort steg.', 'It was a short step.') : t('Det var et langt steg.', 'It was a long step.')) + ` (${score[0]}/${score[1]})`);
      quiz = null;
    };
    app.append(
      h('header', {}, h('div', {}, h('p', { class: 'eyebrow', text: t('Tonestigen', 'The tone ladder') }), h('h1', { text: params.get('title') || t('Lite eller stort steg?', 'Small or large step?') }))),
      stage,
      h('div', { class: 'row' },
        h('button', { type: 'button', on: { click: () => (quiz ? answer(1) : playStep(1)) } }, t('Kort', 'Short')),
        h('button', { type: 'button', on: { click: () => (quiz ? answer(2) : playStep(2)) } }, t('Langt', 'Long')),
        h('button', { type: 'button', class: 'primary', on: { click: () => { quiz = { size: rand([1, 2]) }; rungs.forEach(r => (r.on = false)); playStep(quiz.size, false); fb.textContent = t('Var det kort eller langt? Svar med knappene.', 'Was it short or long? Answer with the buttons.'); } } }, t('Test deg', 'Test yourself'))),
      fb);
    const cv = canvas(stage, 150); stage.prepend(cv.c);
    (function frame() {
      decay(rungs);
      const on = rungs.map((r, i) => (r.on ? i : -1)).filter(i => i >= 0);
      const steps = on.length === 2 ? [{ from: on[0], to: on[1], text: on[1] - on[0] === 1 ? t('kort', 'short') : t('langt', 'long'), color: on[1] - on[0] === 1 ? '#ff7a9a' : '#fff' }] : [];
      drawLadder(cv, rungs, steps, { left: 30, right: Math.min(cv.w - 90, 220) });
      requestAnimationFrame(frame);
    })();
  }

  // Widget: Lys eller mørk? (dur eller moll)
  function quizWidget() {
    let cur = null, score = [0, 0];
    const fb = h('p', { class: 'status', role: 'status', text: t('Trykk Ny akkord og lytt.', 'Press New chord and listen.') });
    const orb = h('div', { class: 'orb' });
    const playCur = () => {
      if (!cur) return; audio(); const t0 = RS.now() + 0.03, r = 55 + cur.root;
      [0, cur.minor ? 3 : 4, 7].forEach((d, k) => note(r + d, { time: t0 + k * 0.02, dur: 1.8, vel: 0.5 }));
      note(r - 12, { time: t0, dur: 1.6, vel: 0.45, kind: 'bass' });
      orb.className = 'orb pulse'; void orb.offsetWidth; orb.classList.add('go');
    };
    const ask = () => { cur = { root: Math.floor(Math.random() * 12), minor: Math.random() < 0.5, answered: false }; orb.className = 'orb'; playCur(); fb.textContent = t('Lys (dur) eller mørk (moll)?', 'Bright (major) or dark (minor)?'); };
    const answer = minor => {
      if (!cur || cur.answered) return; cur.answered = true;
      const ok = minor === cur.minor; score[0] += ok ? 1 : 0; score[1]++;
      const tr = triad(cur.root + 55, cur.minor);
      orb.className = 'orb ' + (cur.minor ? 'minor' : 'major');
      fb.replaceChildren(h('span', { class: 'feedback ' + (ok ? 'good' : 'bad'), text: ok ? t('Riktig! ', 'Right! ') : t('Ikke denne gangen. ', 'Not this time. ') }),
        (cur.minor ? t(`Det var ${tr.name} – moll.`, `It was ${tr.name} – minor.`) : t(`Det var ${tr.name} – dur.`, `It was ${tr.name} – major.`)) + ` (${score[0]}/${score[1]})`);
    };
    app.append(
      h('style', { text: `
        .orb { height:110px; border-radius:14px; border:1px solid var(--line); background:radial-gradient(60% 80% at 50% 50%,#2a2a33,#0e0e13); transition:background .6s; }
        .orb.go { animation:orbpulse 1.6s ease-out; }
        .orb.major { background:radial-gradient(60% 80% at 50% 50%,#ffb070,#ff2a5f 45%,#1a0d10 100%); }
        .orb.minor { background:radial-gradient(60% 80% at 50% 50%,#9db8ff,#3b4fd1 45%,#0b0e1c 100%); }
        @keyframes orbpulse { 0% { box-shadow:0 0 0 0 rgba(255,255,255,.35) inset; } 100% { box-shadow:0 0 0 60px rgba(255,255,255,0) inset; } }
      ` }),
      h('header', {}, h('div', {}, h('p', { class: 'eyebrow', text: t('Quiz', 'Quiz') }), h('h1', { text: params.get('title') || t('Lys eller mørk?', 'Bright or dark?') }))),
      orb,
      h('div', { class: 'row' },
        h('button', { type: 'button', class: 'primary', on: { click: ask } }, t('Ny akkord', 'New chord')),
        h('button', { type: 'button', on: { click: playCur } }, t('Igjen', 'Again'))),
      h('div', { class: 'row' },
        h('button', { type: 'button', on: { click: () => answer(false) } }, t('☀ Lys (dur)', '☀ Bright (major)')),
        h('button', { type: 'button', on: { click: () => answer(true) } }, t('☾ Mørk (moll)', '☾ Dark (minor)'))),
      fb);
  }
})();
