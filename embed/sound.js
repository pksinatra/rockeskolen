/* Rockeskolen – lyd-embed: bølge, tonehøyde, lydstyrke, overtoner og støy.
 *
 * URL-parametere:
 *   widget   (tom) | glide | octave
 *   hz       starttonehøyde, 55–1760 (standard 220)
 *   title    egen overskrift
 *   lang     no | en
 */
(function () {
  const { t, h, audio, slider, seg, canvas, glow, params, nearest, reduced } = RS;
  const app = document.getElementById('app');
  const widget = app.dataset.widget;

  // Bølgeform fra overtoner, normalisert til ±1.
  function shape(harm) {
    const N = 256, ys = new Float32Array(N);
    let peak = 0;
    for (let i = 0; i < N; i++) {
      let y = 0; harm.forEach((a, n) => { if (a) y += a * Math.sin(2 * Math.PI * (n + 1) * i / N); });
      ys[i] = y; peak = Math.max(peak, Math.abs(y));
    }
    return ys.map(y => (peak ? y / peak : 0));
  }
  // Tegner en glødende bølge. cycles = antall svingninger i bildet.
  function drawWave(g, w, h, { cycles, amp, ys, phase = 0, color = '#ff2a5f', noise = 0, mid = h / 2, width = 1 }) {
    g.save();
    const pts = [], n = Math.max(80, Math.min(900, Math.floor(w)));
    for (let i = 0; i <= n; i++) {
      const x = (i / n) * w;
      let y;
      if (noise) y = (Math.random() * 2 - 1) * (0.55 + 0.45 * Math.random());
      else { const p = ((i / n) * cycles + phase) % 1; y = ys[Math.floor((p < 0 ? p + 1 : p) * ys.length) % ys.length]; }
      pts.push([x, mid - y * amp]);
    }
    const path = () => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); };
    g.lineJoin = 'round';
    glow(g, color, 24); g.strokeStyle = color; g.globalAlpha = 0.45; g.lineWidth = 7 * width; path(); g.stroke();
    glow(g, color, 10); g.globalAlpha = 1; g.lineWidth = 2.6 * width; path(); g.stroke();
    g.shadowBlur = 0; g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 1 * width; path(); g.stroke();
    g.restore();
  }
  function grid(g, w, h) {
    g.save(); g.strokeStyle = 'rgba(255,255,255,.05)'; g.lineWidth = 1;
    for (let x = 0; x < w; x += 40) { g.beginPath(); g.moveTo(x + .5, 0); g.lineTo(x + .5, h); g.stroke(); }
    for (let y = h / 2 % 40; y < h; y += 40) { g.beginPath(); g.moveTo(0, y + .5); g.lineTo(w, y + .5); g.stroke(); }
    g.strokeStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(0, h / 2 + .5); g.lineTo(w, h / 2 + .5); g.stroke();
    g.restore();
  }
  const fmtHz = v => (v < 100 ? v.toFixed(1) : Math.round(v)) + ' Hz';

  // ---------- synth som kan endres mens den spiller ----------
  function makeSynth() {
    let osc = null, noiseSrc = null, gain = null, lp = null;
    const s = {
      on: false, hz: 220, vol: 0.6, harm: [1, 0, 0, 0, 0, 0, 0, 0], noise: false,
      start() {
        const ctx = audio();
        gain = ctx.createGain(); gain.gain.value = 0.0001; gain.connect(ctx.destination);
        lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.connect(gain);
        s.on = true; s.rebuild(); s.update(true);
      },
      stop() {
        if (!s.on) return; s.on = false;
        const ctx = RS.ctx, g = gain, o = osc, n = noiseSrc;
        g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.04);
        setTimeout(() => { o && o.stop(); n && n.stop(); g.disconnect(); }, 300);
        osc = noiseSrc = null;
      },
      rebuild() {
        if (!s.on) return;
        const ctx = RS.ctx;
        if (s.noise && !noiseSrc) {
          if (osc) { osc.stop(); osc = null; }
          const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = buf.getChannelData(0);
          for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
          noiseSrc = ctx.createBufferSource(); noiseSrc.buffer = buf; noiseSrc.loop = true; noiseSrc.connect(lp); noiseSrc.start();
        } else if (!s.noise && !osc) {
          if (noiseSrc) { noiseSrc.stop(); noiseSrc = null; }
          osc = ctx.createOscillator(); osc.connect(lp); osc.start();
        }
        if (osc) {
          const real = new Float32Array(9), imag = new Float32Array(9);
          s.harm.forEach((a, i) => (imag[i + 1] = a));
          if (!s.harm.some(Boolean)) imag[1] = 1;
          osc.setPeriodicWave(ctx.createPeriodicWave(real, imag));
        }
      },
      update(fade) {
        if (!s.on) return;
        const ctx = RS.ctx, t0 = ctx.currentTime;
        if (osc) osc.frequency.setTargetAtTime(s.hz, t0, 0.015);
        lp.frequency.setTargetAtTime(s.noise ? Math.min(16000, s.hz * 8) : 18000, t0, 0.02);
        // Lydstyrke følger øret omtrent: kvadratisk kurve.
        const v = Math.max(0.0001, s.vol * s.vol * (s.noise ? 0.16 : 0.3));
        gain.gain.setTargetAtTime(v, t0, fade ? 0.05 : 0.02);
      },
    };
    return s;
  }

  // ======================================================================
  if (widget === 'glide') return glideWidget();
  if (widget === 'octave') return octaveWidget();

  // ---------- stor illustrasjon ----------
  const synth = makeSynth();
  synth.hz = Math.max(55, Math.min(1760, Number(params.get('hz')) || 220));
  const PRESETS = [
    ['pure', t('Ren tone', 'Pure tone'), [1, 0, 0, 0, 0, 0, 0, 0]],
    ['flute', t('Fløyteaktig', 'Flute-like'), [1, 0.35, 0.12, 0.05, 0, 0, 0, 0]],
    ['clar', t('Hul (klarinett)', 'Hollow (clarinet)'), [1, 0, 0.55, 0, 0.32, 0, 0.18, 0]],
    ['string', t('Skarp (strykere)', 'Bright (strings)'), [1, 0.5, 0.33, 0.25, 0.2, 0.17, 0.14, 0.12]],
    ['organ', t('Orgel', 'Organ'), [1, 0.8, 0, 0.6, 0, 0, 0, 0.45]],
  ];
  let ys = shape(synth.harm);

  const title = params.get('title') || t('Fra vibrasjon til tone', 'From vibration to tone');
  const playBtn = h('button', { type: 'button', class: 'primary', on: { click: toggle } }, t('▶ Start lyden', '▶ Start sound'));
  const readHz = h('div', { class: 'big' }), readNote = h('div', { class: 'small muted' });
  const kind = seg(t('Lydtype', 'Sound type'), [['tone', t('Tone', 'Tone')], ['noise', t('Støy', 'Noise')]], 'tone', v => { synth.noise = v === 'noise'; synth.rebuild(); synth.update(); refresh(); });
  const pitch = slider(t('Tonehøyde', 'Pitch'), { min: 0, max: 1000, value: Math.round(1000 * Math.log(synth.hz / 55) / Math.log(32)), format: v => fmtHz(55 * Math.pow(32, v / 1000)), onInput: v => { synth.hz = 55 * Math.pow(32, v / 1000); synth.update(); refresh(); } });
  const volume = slider(t('Lydstyrke', 'Volume'), { min: 0, max: 100, value: 60, format: v => v + ' %', onInput: v => { synth.vol = v / 100; synth.update(); } });

  // Overtonemikser: dra i søylene.
  const bars = synth.harm.map((_, i) => {
    const fill = h('div', { class: 'ot-fill' }), hzl = h('small');
    const bar = h('div', { class: 'ot-bar', role: 'slider', tabindex: 0, 'aria-label': t(`Overtone ${i + 1}`, `Partial ${i + 1}`), 'aria-valuemin': 0, 'aria-valuemax': 100 }, fill);
    const col = h('div', { class: 'ot-col' }, bar, h('b', { text: (i + 1) + '×' }), hzl);
    const set = (v) => { synth.harm[i] = Math.round(Math.max(0, Math.min(1, v)) * 100) / 100; harmChanged(); };
    const fromEvent = e => { const r = bar.getBoundingClientRect(); set(1 - (e.clientY - r.top) / r.height); };
    bar.addEventListener('pointerdown', e => { bar.setPointerCapture(e.pointerId); fromEvent(e); });
    bar.addEventListener('pointermove', e => { if (bar.hasPointerCapture(e.pointerId)) fromEvent(e); });
    bar.addEventListener('keydown', e => { if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { set(synth.harm[i] + 0.1); e.preventDefault(); } if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { set(synth.harm[i] - 0.1); e.preventDefault(); } });
    return { col, fill, hzl, bar };
  });
  const presetRow = h('div', { class: 'row' }, PRESETS.map(([id, label, harm]) => h('button', { type: 'button', 'data-p': id, on: { click: () => { synth.harm = harm.slice(); harmChanged(); } } }, label)));
  function harmChanged() {
    ys = shape(synth.harm); synth.rebuild();
    bars.forEach((b, i) => { b.fill.style.height = synth.harm[i] * 100 + '%'; b.bar.setAttribute('aria-valuenow', Math.round(synth.harm[i] * 100)); });
    presetRow.querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-pressed', String(PRESETS[i][2].every((a, j) => a === synth.harm[j]))));
  }
  const style = h('style', { text: `
    .readout { position:absolute; left:16px; top:12px; pointer-events:none; }
    .readout .big { text-shadow:0 0 24px rgba(255,42,95,.6); }
    .scale-note { position:absolute; right:16px; bottom:10px; color:var(--muted); font-size:12px; pointer-events:none; }
    .mixer { display:grid; grid-template-columns:repeat(8,1fr); gap:8px; margin:10px 0; }
    .ot-col { display:grid; justify-items:center; gap:4px; }
    .ot-col b { font-size:13px; } .ot-col small { color:var(--muted); font-size:10.5px; font-variant-numeric:tabular-nums; }
    .ot-bar { position:relative; width:100%; max-width:46px; height:110px; border-radius:10px; background:#0c0c11; border:1px solid var(--line); cursor:ns-resize; touch-action:none; overflow:hidden; }
    .ot-fill { position:absolute; left:0; right:0; bottom:0; background:linear-gradient(0deg,var(--red2),#ff6f8f); box-shadow:0 0 18px var(--glow); border-radius:8px 8px 0 0; transition:height .12s; }
    .mixer.off { opacity:.35; pointer-events:none; }
    @media (max-width:640px){ .mixer{gap:5px} .ot-bar{height:90px} }
  ` });
  const mixer = h('div', { class: 'mixer' }, bars.map(b => b.col));
  const status = h('p', { class: 'status', role: 'status' });
  const hint = h('div', { class: 'hint' }, t('Trykk «Start lyden» – og dra i gliderne', 'Press “Start sound” – then move the sliders'));
  const stageEl = h('div', { class: 'stage' }, h('div', { class: 'readout' }, readHz, readNote), h('div', { class: 'scale-note', text: t('Bildet viser 1/60 sekund', 'The picture shows 1/60 of a second') }), hint);

  app.append(style,
    h('header', {}, h('div', {}, h('p', { class: 'eyebrow', text: t('Musikk begynner med lyd', 'Music begins with sound') }), h('h1', { text: title })), playBtn),
    stageEl,
    h('div', { class: 'grid2' },
      h('section', { class: 'panel' }, h('div', { class: 'row spread' }, h('strong', { text: t('Tone eller støy', 'Tone or noise') }), kind), pitch, volume),
      h('section', { class: 'panel' }, h('strong', { text: t('Overtoner – klangfarge', 'Overtones – timbre') }), mixer, presetRow)),
    status);

  const cv = canvas(stageEl, w => (w < 520 ? 210 : 270));
  stageEl.prepend(cv.c);
  harmChanged();

  function refresh() {
    readHz.textContent = synth.noise ? t('Støy', 'Noise') : fmtHz(synth.hz);
    readNote.textContent = synth.noise
      ? t('Ingen tydelig tonehøyde', 'No clear pitch')
      : t(`${Math.round(synth.hz)} svingninger per sekund · nær tonen ${nearest(synth.hz)}`, `${Math.round(synth.hz)} vibrations per second · near ${nearest(synth.hz)}`);
    mixer.classList.toggle('off', synth.noise); presetRow.classList.toggle('off', synth.noise);
    presetRow.style.opacity = synth.noise ? .35 : 1;
    bars.forEach((b, i) => (b.hzl.textContent = Math.round(synth.hz * (i + 1)) + ''));
    status.textContent = synth.noise
      ? t('Støy er uregelmessige svingninger. Gliden for tonehøyde gjør støyen mørkere eller lysere, men gir ingen tone.', 'Noise is irregular vibration. The pitch slider makes it darker or brighter, but there is no tone.')
      : t('Tonehøyde endrer hvor tett bølgene ligger. Lydstyrke endrer bare hvor høye de er. Overtonene endrer formen – og dermed klangfargen.', 'Pitch changes how close the waves are. Volume only changes how tall they are. Overtones change the shape – and so the timbre.');
  }
  function toggle() {
    if (synth.on) { synth.stop(); playBtn.textContent = t('▶ Start lyden', '▶ Start sound'); playBtn.classList.add('primary'); }
    else { synth.start(); playBtn.textContent = t('■ Stopp lyden', '■ Stop sound'); playBtn.classList.remove('primary'); hint.classList.add('gone'); }
  }

  let shownAmp = 0.6, phase = 0, last = performance.now();
  function frame(ts) {
    const { g, w, h: hh } = cv, dt = Math.min(0.05, (ts - last) / 1000); last = ts;
    g.clearRect(0, 0, w, hh); grid(g, w, hh);
    const target = synth.on ? synth.vol : 0.04;
    shownAmp += (target - shownAmp) * Math.min(1, dt * 10);
    // Bildet viser 1/60 s; bevegelsen er sterkt forsinket så bølgen kan følges med øynene.
    const cycles = synth.hz / 60;
    if (!reduced) phase -= dt * 0.35;
    drawWave(g, w, hh, { cycles, amp: shownAmp * (hh * 0.4), ys, phase, noise: synth.noise && synth.on ? 1 : 0, color: synth.noise ? '#a3a3b0' : '#ff2a5f' });
    requestAnimationFrame(frame);
  }
  refresh(); requestAnimationFrame(frame);
  addEventListener('pagehide', () => synth.stop());

  // ======================================================================
  // Widget: Fra dyp til lys – og svak til sterk.
  function glideWidget() {
    const synth = makeSynth();
    const readout = h('div', { class: 'small muted', text: t('Velg et eksperiment', 'Choose an experiment') });
    const stage = h('div', { class: 'stage' });
    let anim = null;
    const run = (kindName) => {
      if (anim) cancel();
      synth.harm = [1, 0.3, 0.1, 0, 0, 0, 0, 0];
      synth.hz = 110; synth.vol = 0.6; synth.start();
      const t0 = performance.now(), D = 5000;
      anim = { kind: kindName, t0, D };
      buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.k === kindName)));
    };
    const cancel = () => { synth.stop(); anim = null; buttons.forEach(b => b.setAttribute('aria-pressed', 'false')); };
    const buttons = [
      h('button', { type: 'button', 'data-k': 'glide', on: { click: () => run('glide') } }, t('Dyp → lys → dyp', 'Low → high → low')),
      h('button', { type: 'button', 'data-k': 'swell', on: { click: () => run('swell') } }, t('Svak → sterk', 'Soft → loud')),
    ];
    app.append(
      h('header', {}, h('div', {}, h('p', { class: 'eyebrow', text: t('Prøv selv', 'Try it') }), h('h1', { text: params.get('title') || t('Tonehøyde og lydstyrke', 'Pitch and volume') }))),
      stage, h('div', { class: 'row' }, buttons), readout);
    const cv = canvas(stage, 150); stage.prepend(cv.c);
    const ys = shape([1, 0.3, 0.1]);
    let phase = 0, last = performance.now(), hzNow = 110, volNow = 0.15;
    (function frame(ts) {
      const dt = Math.min(0.05, (ts - last) / 1000); last = ts;
      if (anim) {
        const p = (ts - anim.t0) / anim.D;
        if (p >= 1) cancel();
        else if (anim.kind === 'glide') { const u = p < 0.5 ? p * 2 : 2 - p * 2; synth.hz = 110 * Math.pow(8, u); synth.vol = 0.6; }
        else { synth.hz = 220; synth.vol = 0.12 + 0.78 * Math.sin(Math.PI * p); }
        synth.update();
        hzNow = synth.hz; volNow = synth.vol;
        readout.textContent = `${Math.round(hzNow)} Hz · ${t('lydstyrke', 'volume')} ${Math.round(volNow * 100)} %`;
      } else volNow += (0.05 - volNow) * 0.1;
      const { g, w, h: hh } = cv;
      g.clearRect(0, 0, w, hh); grid(g, w, hh);
      if (!reduced) phase -= dt * 0.35;
      drawWave(g, w, hh, { cycles: hzNow / 40, amp: volNow * hh * 0.42, ys, phase, width: 0.8 });
      requestAnimationFrame(frame);
    })(last);
  }

  // Widget: Oktav = dobbel frekvens.
  function octaveWidget() {
    const freqs = [200, 400, 800];
    let active = -1, timers = [];
    const ys = shape([1, 0.25, 0.08]);
    const stage = h('div', { class: 'stage' });
    const info = h('p', { class: 'status', text: t('Hver gang frekvensen dobles, kommer du én oktav opp – til «samme» tone.', 'Each time the frequency doubles, you go up one octave – to the “same” tone.') });
    const play = (i, time) => RS.note(0, { hz: freqs[i], time, dur: 0.9, vel: 0.7, kind: 'keys' });
    const pick = i => { audio(); active = i; play(i); };
    const all = () => {
      audio(); timers.forEach(clearTimeout); const t0 = RS.now() + 0.05;
      freqs.forEach((_, i) => { play(i, t0 + i * 0.75); timers.push(setTimeout(() => (active = i), i * 750)); });
      timers.push(setTimeout(() => { active = 3; freqs.forEach((_, i) => play(i, RS.now() + 0.02)); }, 2400));
    };
    app.append(
      h('header', {}, h('div', {}, h('p', { class: 'eyebrow', text: t('Oktav', 'Octave') }), h('h1', { text: params.get('title') || t('Dobbel frekvens', 'Double the frequency') }))),
      stage,
      h('div', { class: 'row' }, freqs.map((f, i) => h('button', { type: 'button', on: { click: () => pick(i) } }, f + ' Hz')), h('button', { type: 'button', class: 'primary', on: { click: all } }, t('Spill alle', 'Play all'))),
      info);
    const cv = canvas(stage, 170); stage.prepend(cv.c);
    let phase = 0, last = performance.now();
    (function frame(ts) {
      const dt = Math.min(0.05, (ts - last) / 1000); last = ts; if (!reduced) phase -= dt * 0.25;
      const { g, w, h: hh } = cv; g.clearRect(0, 0, w, hh);
      freqs.forEach((f, i) => {
        const mid = hh * (0.2 + 0.3 * (2 - i)), on = active === i || active === 3;
        g.globalAlpha = on ? 1 : 0.3;
        drawWave(g, w - 56, hh, { cycles: f / 100, amp: hh * 0.11, ys, phase: phase * f / 200, mid, width: 0.7, color: on ? '#ff2a5f' : '#8a8a96' });
        g.globalAlpha = 1; g.fillStyle = on ? '#fff' : '#a3a3b0'; g.font = '700 12px Inter, system-ui'; g.textAlign = 'right';
        g.fillText(f + ' Hz', w - 6, mid + 4);
      });
      requestAnimationFrame(frame);
    })(last);
  }
})();
