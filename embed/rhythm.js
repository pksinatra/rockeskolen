/* Rockeskolen – rytme-embed for artikler.
 *
 * URL-parametere:
 *   mode     metronome | subdivision | pattern | meter   (standard: pattern)
 *   bpm      40–220 (standard 90; i meter-modus gjelder tempoet firedelen)
 *   presets  kommaliste over varianter som vises, f.eks. "rock,halftime" eller "4/4,6/8,7/8"
 *   preset   varianten som er valgt først
 *   swing    0–100, viser swing-glidebryter når mønsteret har åttendedeler
 *   title    egen overskrift
 *   lang     no | en
 * Lyden lages med Web Audio, og alt kan prøves fritt: celler i rutenettet kan slås av og på.
 */
(function () {
  const app = document.querySelector('.rhythm');
  const lang = app.dataset.lang === 'no' ? 'no' : 'en';
  const no = lang === 'no';
  const params = new URLSearchParams(location.search);
  const mode = ['metronome', 'subdivision', 'pattern', 'meter'].includes(params.get('mode')) ? params.get('mode') : 'pattern';

  const T = {
    hihat: no ? 'Hi-hat' : 'Hi-hat', snare: no ? 'Skarptromme' : 'Snare', kick: no ? 'Basstromme' : 'Kick',
    clap: no ? 'Klapp' : 'Clap', chord: no ? 'Akkord' : 'Chord', crash: no ? 'Crash' : 'Crash',
    click: no ? 'Klikk' : 'Click', pulse: no ? 'Puls' : 'Pulse', sub: no ? 'Underdeling' : 'Subdivision',
    ready: no ? 'Trykk Spill. Du kan slå ruter av og på mens det spiller.' : 'Press Play. You can toggle cells while it plays.',
    playing: no ? 'Spiller' : 'Playing', stopped: no ? 'Stoppet' : 'Stopped',
    straight: no ? 'Straight' : 'Straight', triplet: no ? 'triolfølelse' : 'triplet feel',
  };

  // Telleord per underdeling. Norsk: 1 og 2 og, 1 e og a, 1 tri ol.
  const SYLL = {
    1: n => [String(n)],
    2: n => [String(n), no ? 'og' : '&'],
    3: n => [String(n), no ? 'tri' : 'trip', no ? 'ol' : 'let'],
    4: n => [String(n), 'e', no ? 'og' : '&', 'a'],
  };

  // ---------- varianter ----------
  const range = (from, to, step = 1) => { const out = []; for (let i = from; i < to; i += step) out.push(i); return out; };

  // Trommemønstre. steps = slag per takt × underdeling × takter.
  const PATTERNS = {
    rock: { no: 'Rockebeat', en: 'Rock beat', spb: 2, beats: 4, bars: 1,
      rows: { hihat: range(0, 8), snare: [2, 6], kick: [0, 4] },
      ex: no ? 'Hi-hat på alle åttendedeler, basstromme på 1 og 3, skarptromme på 2 og 4.' : 'Hi-hat on every eighth, kick on 1 and 3, snare on 2 and 4.' },
    rock_var: { no: 'Variant: ekstra basstromme', en: 'Variation: extra kick', spb: 2, beats: 4, bars: 1,
      rows: { hihat: range(0, 8), snare: [2, 6], kick: [0, 4, 5] },
      ex: no ? 'Et ekstra basstrommeslag på «3 og» gir mønsteret mer driv.' : 'An extra kick on "3 &" adds drive.' },
    four: { no: 'Four on the floor', en: 'Four on the floor', spb: 2, beats: 4, bars: 1,
      rows: { hihat: [1, 3, 5, 7], clap: [2, 6], kick: [0, 2, 4, 6] },
      ex: no ? 'Basstromme på alle fire slag og hi-hat på offbeat – typisk for disco og house.' : 'Kick on all four beats and offbeat hi-hat – typical of disco and house.' },
    halftime: { no: 'Halftime feel', en: 'Halftime feel', spb: 2, beats: 4, bars: 1,
      rows: { hihat: range(0, 8), snare: [4], kick: [0, 5] },
      ex: no ? 'Samme tempo, men skarptromma ligger bare på 3. Låten føles halvparten så rask.' : 'Same tempo, but the snare only lands on 3. The song feels half as fast.' },
    offbeat: { no: 'Offbeat', en: 'Offbeat', spb: 2, beats: 4, bars: 1,
      rows: { clap: [1, 3, 5, 7], kick: [0, 2, 4, 6] },
      ex: no ? 'Basstromma holder pulsen. Klappene ligger på «og»-ene – offbeat.' : 'The kick keeps the pulse. The claps land on the "&"s – offbeat.' },
    push: { no: 'Akkordskifte på «4 og»', en: 'Chord change on "4 &"', spb: 2, beats: 4, bars: 2,
      rows: { hihat: range(0, 16), snare: [2, 6, 10, 14], kick: [0, 4, 8, 12], chord: [7, 15] },
      chords: { 7: ['F3', 'A3', 'C4'], 15: ['C3', 'E3', 'G3'] },
      ex: no ? 'Akkorden kommer en åttendedel før ener i neste takt og drar musikken framover.' : 'The chord arrives an eighth before beat one of the next bar and pulls the music forward.' },
    straight8: { no: 'Straight eller swing', en: 'Straight or swing', spb: 2, beats: 4, bars: 1, swing: true,
      rows: { hihat: range(0, 8), snare: [2, 6], kick: [0, 4] },
      ex: no ? 'Dra i swing-bryteren: åttendedelene går fra like lange til lang – kort.' : 'Move the swing slider: the eighths go from even to long – short.' },
    shuffle: { no: 'Shuffle', en: 'Shuffle', spb: 3, beats: 4, bars: 1,
      rows: { hihat: [0, 2, 3, 5, 6, 8, 9, 11], snare: [3, 9], kick: [0, 6] },
      ex: no ? 'Shuffle bygger på trioler: hi-hat på første og tredje triol i hvert slag gir lang – kort.' : 'Shuffle is built on triplets: hi-hat on the first and third triplet of each beat gives long – short.' },
    fill: { no: 'Komp og fill', en: 'Groove and fill', spb: 4, beats: 4, bars: 2,
      rows: { crash: [0], hihat: range(0, 28, 2), snare: [4, 12, 20, 28, 29, 30, 31], kick: [0, 8, 16, 24] },
      ex: no ? 'Fire sekstendedeler på skarptromma i slutten av takt 2 leder inn i neste del, som starter med crash.' : 'Four sixteenths on the snare at the end of bar 2 lead into the next section, which starts with a crash.' },
  };

  // Taktarter: unit 4 = firedeler, 8 = åttendedeler. groups = tyngdepunkter.
  const METERS = {
    '4/4': { unit: 4, groups: [1, 1, 1, 1], ex: no ? 'Fire slag, tyngst på 1.' : 'Four beats, strongest on 1.' },
    '3/4': { unit: 4, groups: [1, 1, 1], ex: no ? 'Tre slag – vals.' : 'Three beats – waltz.' },
    '2/4': { unit: 4, groups: [1, 1], ex: no ? 'To slag – marsj.' : 'Two beats – march.' },
    '6/8': { unit: 8, groups: [3, 3], ex: no ? 'Seks åttendedeler i to grupper på tre – to tyngdepunkter.' : 'Six eighths in two groups of three – two main beats.' },
    '9/8': { unit: 8, groups: [3, 3, 3], ex: no ? 'Tre grupper på tre åttendedeler.' : 'Three groups of three eighths.' },
    '12/8': { unit: 8, groups: [3, 3, 3, 3], ex: no ? 'Fire grupper på tre – nær trioler i 4/4.' : 'Four groups of three – close to triplets in 4/4.' },
    '5/4': { unit: 4, groups: [3, 2], ex: no ? '5/4 delt 3 + 2.' : '5/4 split 3 + 2.' },
    '7/8': { unit: 8, groups: [2, 2, 3], ex: no ? '7/8 delt 2 + 2 + 3.' : '7/8 split 2 + 2 + 3.' },
  };

  function buildPreset(id) {
    if (mode === 'pattern') {
      const p = PATTERNS[id];
      const steps = p.spb * p.beats * p.bars;
      return { id, label: p[lang], spb: p.spb, beats: p.beats, steps, swing: !!p.swing, ex: p.ex, chords: p.chords || {},
        rows: Object.entries(p.rows).map(([key, on]) => ({ key, label: T[key], on: new Set(on), accent: new Set() })),
        counts: countsFor(p.spb, p.beats, p.bars), stepDur: bpm => 60 / bpm / p.spb };
    }
    if (mode === 'meter') {
      const m = METERS[id];
      const steps = m.groups.reduce((a, b) => a + b, 0);
      const starts = new Set(); let pos = 0; m.groups.forEach(g => { starts.add(pos); pos += g; });
      const counts = []; let n = 0;
      m.groups.forEach(g => { for (let i = 0; i < g; i++) counts.push({ text: m.unit === 8 ? String(i + 1) : String(++n), beat: i === 0, group: i === 0 }); });
      if (m.unit === 4) counts.forEach((c, i) => { c.beat = true; c.group = starts.has(i); });
      return { id, label: id + (m.groups.length > 1 && new Set(m.groups).size > 1 ? ` (${m.groups.join(' + ')})` : ''), ex: m.ex, steps, chords: {},
        rows: [{ key: 'click', label: T.click, on: new Set(range(0, steps)), accent: starts }],
        counts, starts, stepDur: bpm => (m.unit === 8 ? 30 : 60) / bpm };
    }
    if (mode === 'subdivision') {
      const spb = Number(id);
      const names = { 1: no ? 'Firedeler' : 'Quarters', 2: no ? 'Åttendedeler' : 'Eighths', 3: no ? 'Trioler' : 'Triplets', 4: no ? 'Sekstendedeler' : 'Sixteenths' };
      const steps = spb * 4;
      return { id, label: names[spb], spb, beats: 4, steps, chords: {},
        ex: no ? 'Foten holder pulsen. Klikkene viser hvordan hvert slag deles.' : 'The foot keeps the pulse. The clicks show how each beat is divided.',
        rows: [
          { key: 'kick', label: T.pulse, on: new Set(range(0, steps, spb)), accent: new Set() },
          { key: 'click', label: T.sub, on: new Set(range(0, steps)), accent: new Set(range(0, steps, spb)) },
        ],
        counts: countsFor(spb, 4, 1), stepDur: bpm => 60 / bpm / spb };
    }
    // metronome
    const beats = Number(id.split('/')[0]) || 4;
    return { id, label: id, spb: 1, beats, steps: beats, chords: {}, ex: '',
      rows: [{ key: 'click', label: T.click, on: new Set(range(0, beats)), accent: new Set([0]) }],
      counts: countsFor(1, beats, 1), stepDur: bpm => 60 / bpm };
  }

  function countsFor(spb, beats, bars) {
    const out = [];
    for (let bar = 0; bar < bars; bar++) for (let b = 1; b <= beats; b++) SYLL[spb](b).forEach((text, i) => out.push({ text, beat: i === 0, group: b === 1 && i === 0 }));
    return out;
  }

  const DEFAULTS = {
    pattern: 'rock,rock_var,four,halftime',
    meter: '4/4,3/4,6/8,5/4,7/8',
    subdivision: '1,2,3,4',
    metronome: '4/4,3/4,2/4',
  };
  const known = mode === 'pattern' ? PATTERNS : mode === 'meter' ? METERS : null;
  const ids = (params.get('presets') || DEFAULTS[mode]).split(',').map(s => s.trim())
    .filter(id => known ? Object.hasOwn(known, id) : (mode === 'subdivision' ? ['1', '2', '3', '4'].includes(id) : /^[2-7]\/4$/.test(id)));
  if (!ids.length) ids.push(DEFAULTS[mode].split(',')[0]);
  let active = buildPreset(ids.includes(params.get('preset')) ? params.get('preset') : ids[0]);

  const titles = {
    pattern: no ? 'Spill og endre mønsteret' : 'Play and change the pattern',
    meter: no ? 'Hør taktartene' : 'Hear the time signatures',
    subdivision: no ? 'Del opp pulsen' : 'Divide the pulse',
    metronome: no ? 'Metronom' : 'Metronome',
  };
  document.getElementById('title').textContent = (params.get('title') || '').trim() || titles[mode];

  const tempo = document.getElementById('tempo');
  tempo.value = Math.max(40, Math.min(220, Number(params.get('bpm')) || 90));
  const swing = document.getElementById('swing');
  swing.value = Math.max(0, Math.min(100, Number(params.get('swing')) || 0));
  if (mode === 'metronome') document.getElementById('tap').hidden = false;

  // ---------- visning ----------
  function render() {
    renderPresets();
    document.getElementById('swingPanel').hidden = !(active.swing || (params.has('swing') && active.spb === 2));
    const grid = document.getElementById('grid');
    grid.style.setProperty('--steps', active.steps);
    grid.classList.toggle('dense', active.steps > 16);
    let html = '';
    if (mode === 'metronome') {
      html += '<div class="big-beats">' + range(0, active.steps).map(i => `<div class="big-beat${i === 0 ? ' first' : ''}" data-step="${i}">${i + 1}</div>`).join('') + '</div>';
    }
    html += '<div class="row"><span class="row-label"></span>' + active.counts.map((c, i) =>
      `<span class="count${c.beat ? ' beat' : ''}${c.group ? ' group' : ''}" data-step="${i}">${c.text}</span>`).join('') + '</div>';
    active.rows.forEach((row, r) => {
      html += `<div class="row"><span class="row-label">${row.label}</span>` + range(0, active.steps).map(i =>
        `<button type="button" class="cell${row.on.has(i) ? ' on' : ''}${row.accent.has(i) ? ' accent' : ''}${active.counts[i] && active.counts[i].beat ? ' beat-start' : ''}" data-row="${r}" data-step="${i}" aria-label="${row.label} ${active.counts[i] ? active.counts[i].text : i + 1}" aria-pressed="${row.on.has(i)}"></button>`).join('') + '</div>';
    });
    grid.innerHTML = html;
    document.getElementById('explain').textContent = active.ex || '';
    updateLabels();
  }
  function renderPresets() {
    const nav = document.getElementById('presets');
    nav.innerHTML = '';
    if (ids.length < 2) return;
    ids.forEach(id => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'preset' + (id === active.id ? ' active' : '');
      b.textContent = buildPreset(id).label;
      b.onclick = () => { active = buildPreset(id); if (playing) restart(); else render(); };
      nav.append(b);
    });
  }
  function updateLabels() {
    document.getElementById('tempoValue').textContent = `${tempo.value} BPM`;
    const s = Number(swing.value);
    document.getElementById('swingValue').textContent = s === 0 ? T.straight : s === 100 ? `100 % (${T.triplet})` : `${s} %`;
  }
  document.getElementById('grid').addEventListener('click', e => {
    const cell = e.target.closest('.cell');
    if (!cell) return;
    const row = active.rows[Number(cell.dataset.row)];
    const step = Number(cell.dataset.step);
    if (row.on.has(step)) row.on.delete(step); else row.on.add(step);
    cell.classList.toggle('on', row.on.has(step));
    cell.setAttribute('aria-pressed', String(row.on.has(step)));
  });
  function highlight(step) {
    document.querySelectorAll('.now').forEach(el => el.classList.remove('now'));
    if (step < 0) return;
    document.querySelectorAll(`[data-step="${step}"]`).forEach(el => el.classList.add('now'));
  }

  // ---------- lyd ----------
  let ctx = null, noise = null, master = null;
  function audio() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      // Felles utgang: lavere nivå og kompressor, så samtidige slag ikke klipper.
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -12; comp.knee.value = 6; comp.ratio.value = 8;
      master = ctx.createGain(); master.gain.value = 0.6;
      master.connect(comp); comp.connect(ctx.destination);
      noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function env(t, peak, decay) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    g.connect(master);
    return g;
  }
  function noiseHit(t, type, freq, peak, decay) {
    const src = ctx.createBufferSource(); src.buffer = noise;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    src.connect(f); f.connect(env(t, peak, decay));
    src.start(t); src.stop(t + decay + 0.02);
  }
  function tone(t, type, freq, peak, decay, endFreq) {
    const o = ctx.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t + decay);
    o.connect(env(t, peak, decay));
    o.start(t); o.stop(t + decay + 0.02);
  }
  const midiOf = n => { const m = /^([A-G])([#b]?)(-?\d)$/.exec(n); return 12 * (Number(m[3]) + 1) + { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); };
  const SOUNDS = {
    kick: t => tone(t, 'sine', 150, 0.9, 0.18, 45),
    snare: t => { noiseHit(t, 'highpass', 1200, 0.45, 0.16); tone(t, 'triangle', 190, 0.25, 0.08); },
    hihat: (t, acc) => noiseHit(t, 'highpass', 7500, acc ? 0.22 : 0.14, 0.045),
    clap: t => { [0, 0.012, 0.024].forEach(d => noiseHit(t + d, 'bandpass', 1500, 0.35, 0.05)); },
    crash: t => noiseHit(t, 'highpass', 5000, 0.3, 1.1),
    click: (t, acc) => tone(t, 'square', acc ? 1760 : 1100, acc ? 0.22 : 0.12, 0.035),
    chord: (t, acc, step) => (active.chords[step] || ['C3', 'E3', 'G3']).forEach(n => tone(t, 'triangle', 440 * Math.pow(2, (midiOf(n) - 69) / 12), 0.16, 0.9)),
  };

  // ---------- avspilling (planlegger i forkant for presis timing) ----------
  let playing = false, timer = null, nextTime = 0, step = 0, queue = [], raf = 0;
  function swingOffset(i) {
    if (active.spb !== 2 || i % 2 === 0) return 0;
    return (Number(swing.value) / 100) * (60 / Number(tempo.value)) / 6;
  }
  function scheduler() {
    while (nextTime < ctx.currentTime + 0.12) {
      const t = nextTime + swingOffset(step);
      active.rows.forEach(row => { if (row.on.has(step)) SOUNDS[row.key](t, row.accent.has(step), step); });
      queue.push({ step, t });
      nextTime += active.stepDur(Number(tempo.value));
      step = (step + 1) % active.steps;
    }
  }
  function draw() {
    let current = -1;
    while (queue.length && queue[0].t <= ctx.currentTime) current = queue.shift().step;
    if (current >= 0) highlight(current);
    raf = requestAnimationFrame(draw);
  }
  function start() {
    audio();
    render();
    playing = true; step = 0; queue = []; nextTime = ctx.currentTime + 0.06;
    if (mode === 'pattern' && active.rows.some(r => r.key === 'chord')) SOUNDS.chord(nextTime, false, -1);
    scheduler(); timer = setInterval(scheduler, 25); raf = requestAnimationFrame(draw);
    document.getElementById('status').textContent = `${T.playing}: ${active.label}`;
  }
  function stop() {
    playing = false; clearInterval(timer); cancelAnimationFrame(raf); queue = []; highlight(-1);
    document.getElementById('status').textContent = T.stopped;
  }
  function restart() { stop(); start(); }

  document.getElementById('play').onclick = () => { if (playing) restart(); else start(); };
  document.getElementById('stop').onclick = stop;
  tempo.oninput = updateLabels;
  swing.oninput = updateLabels;

  // Tapp tempo: snitt av de siste slagene.
  let taps = [];
  document.getElementById('tap').onclick = () => {
    const now = performance.now();
    taps = taps.filter(x => now - x < 2500).concat(now);
    if (taps.length >= 2) {
      const gaps = taps.slice(1).map((x, i) => x - taps[i]);
      const bpm = Math.round(60000 / (gaps.reduce((a, b) => a + b, 0) / gaps.length));
      tempo.value = Math.max(40, Math.min(220, bpm));
      updateLabels();
    }
  };

  render();
  document.getElementById('status').textContent = T.ready;
})();
