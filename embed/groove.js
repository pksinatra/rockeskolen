/* Rockeskolen – groove-embed: puls, akkordrekke og en pentaton-stige der alle toner passer.
 *
 * Akkordrekka er Am – F – C – G. Stigen er A-moll-pentaton (A C D E G), som har de samme tonene som C-dur-pentaton.
 *
 * URL-parametere:
 *   widget   (tom) | pad    pad = liten pentaton-pad i C (C D E G A C)
 *   bpm      70–130 (standard 92)
 *   title    egen overskrift
 *   lang     no | en
 */
(function () {
  const { t, h, audio, slider, canvas, glow, params, note, drum, reduced } = RS;
  const app = document.getElementById('app');
  const NAME = { 57: 'A', 60: 'C', 62: 'D', 64: 'E', 67: 'G', 69: 'A', 72: 'C', 74: 'D', 76: 'E', 79: 'G' };
  const HUE = m => 350 + ((m - 57) / 22) * 50; // fra rød mot oransje oppover stigen
  if (app.dataset.widget === 'pad') return padWidget();

  const PADS = [57, 60, 62, 64, 67, 69, 72, 74, 76, 79];
  const KEYS = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ø'];
  const BARS = [
    { name: 'Am', bass: 45, pad: [57, 60, 64] },
    { name: 'F', bass: 41, pad: [57, 60, 65] },
    { name: 'C', bass: 48, pad: [55, 60, 64] },
    { name: 'G', bass: 43, pad: [55, 59, 62] },
  ];
  const DRUMS = { kick: [0, 3, 4], snare: [2, 6], hat: [0, 1, 2, 3, 4, 5, 6, 7] };
  const BASS = [0, 3, 4, 6];
  let bpm = Math.max(70, Math.min(130, Number(params.get('bpm')) || 92));
  const layers = { drums: true, bass: true, chords: true };
  let pos = { bar: -1, step: -1, time: 0 }, sparks = [], beatPop = 0;

  const playBtn = h('button', { type: 'button', class: 'primary', on: { click: () => (lp.running ? stop() : start()) } }, t('▶ Start grooven', '▶ Start the groove'));
  const layerBtn = (k, label) => { const b = h('button', { type: 'button', 'aria-pressed': 'true', on: { click: () => { layers[k] = !layers[k]; b.setAttribute('aria-pressed', String(layers[k])); } } }, label); return b; };
  const tempo = slider('Tempo', { min: 70, max: 130, value: bpm, format: v => v + ' BPM', onInput: v => (bpm = v) });
  const chordsEl = h('div', { class: 'gchords' }, BARS.map(b => h('span', { text: b.name })));
  const padEls = PADS.map((m, i) => h('button', { type: 'button', class: 'pad', style: `--h:${HUE(m)};--i:${i};--r:${i % 5}`, 'aria-label': NAME[m], on: { pointerdown: e => { e.preventDefault(); hit(i); } } }, h('b', { text: NAME[m] }), h('small', { text: KEYS[i].toUpperCase() })));
  const stage = h('div', { class: 'stage gstage' });
  app.append(
    h('style', { text: `
      .gstage { min-height:150px; }
      .gchords { position:absolute; left:0; right:0; top:14px; display:flex; justify-content:center; gap:8px; pointer-events:none; }
      .gchords span { padding:6px 14px; border-radius:999px; font-weight:900; font-size:15px; color:rgba(255,255,255,.4); border:1px solid var(--line); background:rgba(0,0,0,.25); transition:.12s; }
      .gchords span.now { color:#fff; border-color:var(--red); box-shadow:0 0 20px var(--glow); transform:scale(1.08); }
      .pads { display:grid; grid-template-columns:repeat(10,1fr); gap:8px; align-items:end; }
      .pad { position:relative; display:grid; align-content:end; justify-items:center; gap:2px; height:calc(96px + var(--i) * 9px); padding:10px 0; border-radius:14px; border:1px solid hsla(var(--h),100%,60%,.45);
        background:linear-gradient(180deg,hsla(var(--h),100%,55%,.22),hsla(var(--h),100%,40%,.08)); touch-action:none; user-select:none; -webkit-user-select:none; }
      .pad b { font-size:16px; } .pad small { color:var(--muted); font-size:10px; font-weight:700; }
      .pad.hit { background:hsl(var(--h),100%,58%); box-shadow:0 0 34px hsla(var(--h),100%,60%,.85); transform:translateY(-3px); }
      .pad.hit small { color:#fff; }
      @media (hover:none) { .pad small { display:none; } }
      @media (max-width:640px) {
        .pads { grid-template-columns:repeat(5,1fr); gap:6px; }
        .pad { height:calc(64px + var(--r) * 8px); }
        .pad:nth-child(-n+5) { order:2; } .pad:nth-child(n+6) { order:1; }
        .gchords span { padding:5px 10px; font-size:13px; }
      }
    ` }),
    h('header', {}, h('div', {}, h('p', { class: 'eyebrow', text: t('Alt henger sammen', 'It all connects') }), h('h1', { text: params.get('title') || t('Spill med i grooven', 'Play along with the groove') })), playBtn),
    stage,
    h('div', { class: 'pads', role: 'group', 'aria-label': t('Pentaton-stige', 'Pentatonic ladder') }, padEls),
    h('div', { class: 'grid2' },
      h('section', { class: 'panel' }, h('p', { class: 'eyebrow', text: t('Lag i grooven', 'Layers') }), h('div', { class: 'row' }, layerBtn('drums', t('Trommer', 'Drums')), layerBtn('bass', 'Bass'), layerBtn('chords', t('Akkorder', 'Chords'))), tempo),
      h('section', { class: 'panel' }, h('p', { class: 'eyebrow', text: t('Hvorfor passer alt?', 'Why does everything fit?') }),
        h('p', { class: 'small muted', style: 'margin:0', text: t('Stigen har bare fem toner: A, C, D, E og G. Skalaen mangler de tonene som lett skurrer mot akkordene, så du kan spille fritt. Prøv å lande på A når Am kommer tilbake.', 'The ladder has only five notes: A, C, D, E and G. It leaves out the notes that easily clash with the chords, so you can play freely. Try landing on A when Am comes back.') })))
  );
  stage.prepend(chordsEl);
  const cv = canvas(stage, w => (w < 520 ? 150 : 190));
  stage.prepend(cv.c);

  function hit(i) {
    audio();
    note(PADS[i] + 12, { dur: 0.5, vel: 0.65, kind: 'bell' });
    const el = padEls[i]; el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); setTimeout(() => el.classList.remove('hit'), 160);
    const r = el.getBoundingClientRect(), s = cv.c.getBoundingClientRect(), x = r.left + r.width / 2 - s.left;
    if (!reduced) for (let k = 0; k < 14; k++) sparks.push({ x, y: cv.h, vx: (Math.random() - 0.5) * 120, vy: -(140 + Math.random() * 220) - i * 12, life: 1, hue: HUE(PADS[i]) });
    if (!lp.running) start();
  }
  addEventListener('keydown', e => {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    const i = KEYS.indexOf(e.key.toLowerCase()); if (i >= 0) { e.preventDefault(); hit(i); }
    if (e.code === 'Space') { e.preventDefault(); lp.running ? stop() : start(); }
  });

  const lp = RS.loop({
    stepDur: () => 30 / bpm,
    onStep: (n, time) => {
      const step = n % 8, bar = BARS[Math.floor(n / 8) % 4], len = 30 / bpm;
      if (layers.drums) {
        if (DRUMS.kick.includes(step)) drum.kick(time, step === 0 ? 1 : 0.75);
        if (DRUMS.snare.includes(step)) drum.snare(time, 0.9);
        drum.hat(time, step % 2 ? 0.6 : 1);
      }
      if (layers.bass && BASS.includes(step)) note(bar.bass + (step === 3 ? 12 : 0), { time, dur: len * (step === 0 ? 1.8 : 0.9), vel: 0.7, kind: 'bass' });
      if (layers.chords && step === 0) bar.pad.forEach(m => note(m, { time, dur: len * 7.5, vel: 0.5, kind: 'pad' }));
      if (layers.chords && (step === 2 || step === 6)) bar.pad.forEach(m => note(m + 12, { time, dur: len * 0.5, vel: 0.22, kind: 'pluck' }));
    },
    onShow: (n, time) => {
      const step = n % 8, bar = Math.floor(n / 8) % 4;
      pos = { bar, step, time };
      if (step % 2 === 0) beatPop = 1;
      [...chordsEl.children].forEach((c, i) => c.classList.toggle('now', i === bar));
    },
  });
  function start() { lp.start(); playBtn.textContent = t('■ Stopp', '■ Stop'); playBtn.classList.remove('primary'); }
  function stop() { lp.stop(); pos = { bar: -1, step: -1, time: 0 }; [...chordsEl.children].forEach(c => c.classList.remove('now')); playBtn.textContent = t('▶ Start grooven', '▶ Start the groove'); playBtn.classList.add('primary'); }

  let last = performance.now();
  function frame(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000); last = ts;
    const { g, w, h: hh } = cv; g.clearRect(0, 0, w, hh);
    beatPop = Math.max(0, beatPop - dt * 5);
    // pulserende horisont
    const cy = hh * 0.62;
    const grad = g.createRadialGradient(w / 2, cy, 10, w / 2, cy, w * 0.55);
    grad.addColorStop(0, `rgba(255,42,95,${0.1 + 0.25 * beatPop})`); grad.addColorStop(1, 'rgba(255,42,95,0)');
    g.fillStyle = grad; g.fillRect(0, 0, w, hh);
    // fire slag
    for (let b = 0; b < 4; b++) {
      const x = w / 2 + (b - 1.5) * 46, on = pos.step >= 0 && Math.floor(pos.step / 2) === b;
      glow(g, '#ff2a5f', on ? 24 * (0.4 + beatPop) : 0); g.fillStyle = on ? '#fff' : 'rgba(255,255,255,.16)';
      g.beginPath(); g.arc(x, cy, on ? 9 + 5 * beatPop : 7, 0, Math.PI * 2); g.fill(); g.shadowBlur = 0;
    }
    // gnister fra padene
    sparks = sparks.filter(s => (s.life -= dt * 1.1) > 0);
    sparks.forEach(s => {
      s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 260 * dt;
      g.fillStyle = `hsla(${s.hue},100%,65%,${s.life})`; glow(g, `hsl(${s.hue},100%,60%)`, 12);
      g.beginPath(); g.arc(s.x, s.y, 2.5 + 2 * s.life, 0, Math.PI * 2); g.fill();
    });
    g.shadowBlur = 0;
    if (!lp.running && !sparks.length) { g.fillStyle = 'rgba(255,255,255,.45)'; g.font = '600 14px Inter, system-ui'; g.textAlign = 'center'; g.fillText(t('Start grooven – eller bare trykk på en tone', 'Start the groove – or just tap a note'), w / 2, hh - 18); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ======================================================================
  // Widget: mini pentatonpad i C (1, 2, 3, 5, 6 og oktaven).
  function padWidget() {
    const P = [60, 62, 64, 67, 69, 72];
    let drone = false, timer = 0;
    const N = { 60: 'C', 62: 'D', 64: 'E', 67: 'G', 69: 'A', 72: 'C' };
    const pads = P.map((m, i) => h('button', { type: 'button', class: 'pad', style: `--h:${350 + i * 9};--i:${i}`, on: { pointerdown: e => { e.preventDefault(); audio(); note(m + 12, { dur: 0.6, vel: 0.65, kind: 'bell' }); const el = e.currentTarget; el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); setTimeout(() => el.classList.remove('hit'), 160); } } }, h('b', { text: N[m] })));
    const droneBtn = h('button', { type: 'button', 'aria-pressed': 'false', on: { click: () => {
      drone = !drone; droneBtn.setAttribute('aria-pressed', String(drone)); clearInterval(timer);
      const pad = () => [48, 55, 64].forEach(m => note(m, { dur: 3.6, vel: 0.4, kind: 'pad' }));
      if (drone) { audio(); pad(); timer = setInterval(pad, 3800); }
    } } }, t('Med akkord under', 'With a chord below'));
    app.append(
      h('style', { text: `
        .pads { display:grid; grid-template-columns:repeat(6,1fr); gap:6px; align-items:end; }
        .pad { display:grid; align-content:end; justify-items:center; height:calc(62px + var(--i) * 8px); padding:8px 0; border-radius:12px; border:1px solid hsla(var(--h),100%,60%,.45); background:linear-gradient(180deg,hsla(var(--h),100%,55%,.22),hsla(var(--h),100%,40%,.08)); touch-action:none; user-select:none; -webkit-user-select:none; }
        .pad b { font-size:14px; }
        .pad.hit { background:hsl(var(--h),100%,58%); box-shadow:0 0 26px hsla(var(--h),100%,60%,.85); }
      ` }),
      h('header', {}, h('div', {}, h('p', { class: 'eyebrow', text: t('Fem toner', 'Five notes') }), h('h1', { text: params.get('title') || t('Lag en melodi', 'Make a melody') }))),
      h('div', { class: 'pads' }, pads),
      h('div', { class: 'row' }, droneBtn),
      h('p', { class: 'status', text: t('Trinn 1, 2, 3, 5 og 6 fra durskalaen. Hopp fritt – det er vanskelig å spille feil.', 'Degrees 1, 2, 3, 5 and 6 of the major scale. Jump around – it is hard to play a wrong note.') }));
    addEventListener('pagehide', () => clearInterval(timer));
  }
})();
