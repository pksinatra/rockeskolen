/* Rockeskolen – felles motor for «Musikkteori uten noter».
 *
 * window.RS gir språk, lyd (Web Audio), tonenavn, en presis loop-planlegger og små tegnehjelpere.
 * Lyden lages først ved et klikk, slik nettleserne krever.
 */
(function () {
  const lang = document.documentElement.lang === 'en' ? 'en' : 'no';
  const t = (no, en) => (lang === 'en' ? en : no);

  // ---------- lyd ----------
  let ctx = null, out = null, wet = null, noiseBuf = null;
  function audio() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
      out = ctx.createGain(); out.gain.value = 0.7;
      out.connect(comp); comp.connect(ctx.destination);
      // Romklang: generert impulsrespons, sendes parallelt.
      const len = Math.floor(ctx.sampleRate * 2.2), ir = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
      const conv = ctx.createConvolver(); conv.buffer = ir;
      wet = ctx.createGain(); wet.gain.value = 0.22; wet.connect(conv); conv.connect(out);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const n = noiseBuf.getChannelData(0); for (let i = 0; i < n.length; i++) n[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  const now = () => audio().currentTime;

  // Utgang med envelope; send > 0 gir romklang.
  function voiceOut(time, peak, attack, decay, send) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(peak, time + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, time + attack + decay);
    g.connect(out);
    if (send) { const s = ctx.createGain(); s.gain.value = send; g.connect(s); s.connect(wet); }
    return g;
  }
  function osc(type, freq, time, end, dest, detune) {
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq; if (detune) o.detune.value = detune;
    o.connect(dest); o.start(time); o.stop(end); return o;
  }
  // Tone med klang: keys (standard), pluck, pad, bell, bass.
  function note(midi, opt = {}) {
    audio();
    const time = opt.time ?? ctx.currentTime + 0.01, dur = opt.dur ?? 0.6, vel = opt.vel ?? 0.5, f = opt.hz ?? hz(midi), kind = opt.kind || 'keys';
    if (kind === 'pad') {
      const g = voiceOut(time, 0.09 * vel, 0.25, dur + 0.8, 0.5), lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 1400; lp.Q.value = 0.4; lp.connect(g);
      [-8, 8].forEach(d => osc('sawtooth', f, time, time + dur + 1.2, lp, d));
      osc('sine', f / 2, time, time + dur + 1.2, g);
      return;
    }
    if (kind === 'bass') {
      const g = voiceOut(time, 0.35 * vel, 0.008, dur, 0.05), lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.Q.value = 2; lp.frequency.setValueAtTime(900, time); lp.frequency.exponentialRampToValueAtTime(160, time + dur);
      lp.connect(g); osc('sawtooth', f, time, time + dur + 0.05, lp); osc('sine', f, time, time + dur + 0.05, g);
      return;
    }
    if (kind === 'bell') {
      const g = voiceOut(time, 0.28 * vel, 0.004, dur + 0.9, 0.45);
      osc('sine', f, time, time + dur + 1, g); osc('triangle', f * 2, time, time + 0.5, voiceOut(time, 0.06 * vel, 0.003, 0.4, 0.3));
      return;
    }
    const pluck = kind === 'pluck';
    const g = voiceOut(time, (pluck ? 0.32 : 0.26) * vel, pluck ? 0.003 : 0.008, dur + 0.25, 0.28), lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.Q.value = 0.8;
    lp.frequency.setValueAtTime(Math.min(9000, f * (pluck ? 10 : 7)), time);
    lp.frequency.exponentialRampToValueAtTime(Math.max(300, f * 2), time + dur + 0.2);
    lp.connect(g);
    osc(pluck ? 'sawtooth' : 'triangle', f, time, time + dur + 0.3, lp);
    osc('sine', f, time, time + dur + 0.3, g);
    if (!pluck) osc('sine', f * 2, time, time + dur + 0.3, voiceOut(time, 0.04 * vel, 0.005, dur * 0.6, 0.2));
  }
  function chord(midis, opt = {}) { midis.forEach((m, i) => note(m, { ...opt, time: (opt.time ?? now() + 0.01) + i * (opt.strum ?? 0), vel: (opt.vel ?? 0.5) * 0.75 })); }
  function noise(time, filter, freq, peak, decay) {
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = filter; f.frequency.value = freq;
    src.connect(f); f.connect(voiceOut(time, peak, 0.002, decay, 0.08)); src.start(time); src.stop(time + decay + 0.05);
  }
  const drum = {
    kick(time, v = 1) { audio(); const g = voiceOut(time, 0.9 * v, 0.003, 0.28); const o = osc('sine', 150, time, time + 0.32, g); o.frequency.setValueAtTime(150, time); o.frequency.exponentialRampToValueAtTime(42, time + 0.22); },
    snare(time, v = 1) { audio(); noise(time, 'highpass', 1400, 0.4 * v, 0.17); osc('triangle', 190, time, time + 0.1, voiceOut(time, 0.25 * v, 0.002, 0.08)); },
    hat(time, v = 1) { audio(); noise(time, 'highpass', 8000, 0.13 * v, 0.045); },
    click(time, accent) { audio(); osc('sine', accent ? 1760 : 1180, time, time + 0.06, voiceOut(time, accent ? 0.5 : 0.28, 0.001, 0.045)); osc('square', accent ? 3520 : 2360, time, time + 0.02, voiceOut(time, 0.03, 0.001, 0.012)); },
    wood(time, accent) { audio(); osc('sine', accent ? 1046 : 784, time, time + 0.1, voiceOut(time, accent ? 0.6 : 0.3, 0.001, accent ? 0.09 : 0.06, 0.15)); },
  };

  // ---------- presis loop: planlegger lyd litt i forkant og melder fra når hvert steg høres ----------
  function loop({ stepDur, onStep, onShow }) {
    let timer = 0, raf = 0, next = 0, step = 0, queue = [], running = false;
    function schedule() {
      while (next < ctx.currentTime + 0.12) {
        onStep(step, next); queue.push({ step, time: next });
        next += stepDur(); step++;
      }
    }
    function frame() {
      while (queue.length && queue[0].time <= ctx.currentTime) { const q = queue.shift(); onShow && onShow(q.step, q.time); }
      raf = requestAnimationFrame(frame);
    }
    return {
      start(delay = 0.08) { audio(); if (running) return; running = true; step = 0; queue = []; next = ctx.currentTime + delay; schedule(); timer = setInterval(schedule, 25); raf = requestAnimationFrame(frame); },
      stop() { running = false; clearInterval(timer); cancelAnimationFrame(raf); queue = []; },
      get running() { return running; },
      get nextTime() { return next; },
    };
  }

  // ---------- tonenavn ----------
  // Bokstavbasert stavemåte: trinn i skala/akkord får egen bokstav, fortegn regnes ut fra halvtoner.
  const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'], NAT = [0, 2, 4, 5, 7, 9, 11];
  function spell(rootLetter, rootPc, degreeLetterOffset, semis) {
    const li = (LETTERS.indexOf(rootLetter) + degreeLetterOffset) % 7, pc = (rootPc + semis) % 12;
    let acc = ((pc - NAT[li]) % 12 + 12) % 12; if (acc > 6) acc -= 12;
    return LETTERS[li] + (acc === 1 ? '♯' : acc === -1 ? '♭' : acc === 2 ? '𝄪' : acc === -2 ? '𝄫' : '');
  }
  // Akkordnavn med vanlige tegn (Bb, F#m), som i Rockeskolens tekster.
  const MAJOR_ROOT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  const MINOR_ROOT = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
  const toTone = s => s.replace('#', '♯').replace(/b$/, '♭');
  function triad(rootPc, minor) {
    const name = (minor ? MINOR_ROOT : MAJOR_ROOT)[((rootPc % 12) + 12) % 12];
    const tone = toTone(name), pc = ((rootPc % 12) + 12) % 12;
    return { name: name + (minor ? 'm' : ''), tones: [tone, spell(name[0], pc, 2, minor ? 3 : 4), spell(name[0], pc, 4, 7)] };
  }
  // Nærmeste tone til en frekvens, nøytralt stavet (C♯/D♭).
  const NEUTRAL = ['C', 'C♯/D♭', 'D', 'D♯/E♭', 'E', 'F', 'F♯/G♭', 'G', 'G♯/A♭', 'A', 'A♯/B♭', 'B'];
  const nearest = f => NEUTRAL[((Math.round(12 * Math.log2(f / 440)) + 69) % 12 + 12) % 12];

  // ---------- tegning ----------
  function canvas(el, height) {
    const c = el.tagName === 'CANVAS' ? el : el.appendChild(document.createElement('canvas'));
    const g = c.getContext('2d');
    const state = { c, g, w: 0, h: 0 };
    function fit() {
      const dpr = Math.min(2, window.devicePixelRatio || 1), w = c.parentElement.clientWidth;
      const h = typeof height === 'function' ? height(w) : height;
      if (w === state.w && h === state.h) return;
      state.w = w; state.h = h; c.width = w * dpr; c.height = h * dpr; c.style.height = h + 'px';
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    fit(); new ResizeObserver(fit).observe(c.parentElement);
    return state;
  }
  function glow(g, color, blur) { g.shadowColor = color; g.shadowBlur = blur; }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- DOM ----------
  function h(tag, attrs = {}, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'on') Object.entries(v).forEach(([e, fn]) => el.addEventListener(e, fn));
      else if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : v);
    }
    kids.flat().forEach(k => k != null && el.append(k));
    return el;
  }
  // Glider med fylt spor og verdi.
  function slider(label, { min, max, step = 1, value, format = v => v, onInput }) {
    const input = h('input', { type: 'range', min, max, step, value, 'aria-label': label });
    const output = h('output');
    const paint = () => { input.style.setProperty('--p', ((input.value - min) / (max - min)) * 100 + '%'); output.textContent = format(Number(input.value)); };
    input.addEventListener('input', () => { paint(); onInput && onInput(Number(input.value)); });
    paint();
    const el = h('label', { class: 'slider' }, h('span', { text: label }), input, output);
    el.input = input; el.set = v => { input.value = v; paint(); };
    return el;
  }
  // Segmentert valg; returnerer element med .set(value).
  function seg(label, options, value, onChange) {
    const el = h('div', { class: 'seg', role: 'group', 'aria-label': label });
    const buttons = options.map(([v, text]) => h('button', { type: 'button', 'aria-pressed': String(v === value), on: { click: () => { el.set(v); onChange(v); } } }, text));
    el.append(...buttons);
    el.set = v => buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(options[i][0] === v)));
    return el;
  }
  const params = new URLSearchParams(location.search);
  const rand = arr => arr[Math.floor(Math.random() * arr.length)];

  window.RS = { lang, t, audio, now, hz, note, chord, drum, loop, spell, triad, nearest, canvas, glow, reduced, h, slider, seg, params, rand, get ctx() { return ctx; } };
})();
