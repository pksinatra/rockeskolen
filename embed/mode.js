/* Rockeskolen – skala- og modus-embed for artikler.
 *
 * URL-parametere:
 *   scales  kommaliste med grunntone:skala, f.eks. "F:ionian,F:lydian" eller "C:major,A:minor".
 *           Skalaer: ionian, dorian, phrygian, lydian, mixolydian, aeolian, locrian, major, minor,
 *           harmonic_minor, phrygian_dominant, minor_blues. Grunntone som C, F#, Bb (# skrives %23).
 *   sets    i stedet for scales: egne tonerekker, "Navn|C4-C%234-D4;Navn 2|E4-F4" (b = ♭, # = ♯, n = ♮)
 *   mark    diff | char | none. diff markerer tonene som skiller skalaene (to skalaer: hverandre;
 *           flere: mot den første). char markerer karaktertonen. Standard: diff ved samme grunntone, ellers char.
 *   drone   1 = borduntone på grunntonen er slått på fra start
 *   title   egen overskrift
 *   tempo   slag per minutt (standard 100)
 *   lang    no | en
 * Tonene staves fra grunntonens bokstav, så F-lydisk gir B (ikke C♭) og E-frygisk gir F (ikke E♯).
 */
(function () {
  const app = document.querySelector('.mode');
  const no = app.dataset.lang === 'no';
  const params = new URLSearchParams(location.search);
  const $ = id => document.getElementById(id);
  const t = (nb, en) => (no ? nb : en);

  // ---------- musikkteori ----------
  const LETTERS = 'CDEFGAB';
  const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const SCALES = {
    ionian:            { st: [0, 2, 4, 5, 7, 9, 11], no: 'jonisk', en: 'Ionian', char: [3, 6] },
    major:             { st: [0, 2, 4, 5, 7, 9, 11], no: 'dur', en: 'major', char: [] },
    dorian:            { st: [0, 2, 3, 5, 7, 9, 10], no: 'dorisk', en: 'Dorian', char: [5] },
    phrygian:          { st: [0, 1, 3, 5, 7, 8, 10], no: 'frygisk', en: 'Phrygian', char: [1] },
    lydian:            { st: [0, 2, 4, 6, 7, 9, 11], no: 'lydisk', en: 'Lydian', char: [3] },
    mixolydian:        { st: [0, 2, 4, 5, 7, 9, 10], no: 'mixolydisk', en: 'Mixolydian', char: [6] },
    aeolian:           { st: [0, 2, 3, 5, 7, 8, 10], no: 'eolisk', en: 'Aeolian', char: [5] },
    minor:             { st: [0, 2, 3, 5, 7, 8, 10], no: 'moll', en: 'minor', char: [] },
    locrian:           { st: [0, 1, 3, 5, 6, 8, 10], no: 'lokrisk', en: 'Locrian', char: [1, 4] },
    harmonic_minor:    { st: [0, 2, 3, 5, 7, 8, 11], no: 'harmonisk moll', en: 'harmonic minor', char: [6] },
    phrygian_dominant: { st: [0, 1, 4, 5, 7, 8, 10], no: 'frygisk dominant', en: 'Phrygian dominant', char: [1, 2] },
    // Bluesskalaen har seks toner; ♭5 staves som eget bokstavtrinn (D♭ i G-blues).
    minor_blues:       { st: [0, 3, 5, 6, 7, 10], steps: [0, 2, 3, 4, 4, 6], no: 'bluesskala', en: 'blues scale', char: [3] }
  };
  // Hva karaktertonen heter, etter trinn (0-basert) og halvtoner over grunntonen.
  const DEGREE_NAME = no
    ? { '1:1': 'liten sekund', '1:2': 'stor sekund', '2:3': 'liten ters', '2:4': 'stor ters', '3:5': 'ren kvart', '3:6': 'forstørret kvart', '4:6': 'forminsket kvint', '4:7': 'ren kvint', '5:8': 'liten sekst', '5:9': 'stor sekst', '6:10': 'liten septim', '6:11': 'stor septim' }
    : { '1:1': 'minor second', '1:2': 'major second', '2:3': 'minor third', '2:4': 'major third', '3:5': 'perfect fourth', '3:6': 'augmented fourth', '4:6': 'diminished fifth', '4:7': 'perfect fifth', '5:8': 'minor sixth', '5:9': 'major sixth', '6:10': 'minor seventh', '6:11': 'major seventh' };
  const MAJOR = [0, 2, 4, 5, 7, 9, 11];

  function parseNote(text) {
    const m = /^([A-G])(bb|b|##|#|n)?(\d)$/.exec(text.trim());
    if (!m) return null;
    const acc = { bb: -2, b: -1, '#': 1, '##': 2, n: 0 }[m[2] || ''] || 0;
    const oct = Number(m[3]);
    return { letter: m[1], acc, natural: m[2] === 'n', oct, midi: 12 * (oct + 1) + PC[m[1]] + acc };
  }
  const accText = acc => ({ '-2': '𝄫', '-1': '♭', 1: '♯', 2: '𝄪' }[acc] || '');
  const noteText = n => n.letter + (n.natural ? '♮' : accText(n.acc));
  // Skala- og tonearternavn skrives med vanlige tegn (Bb-dur, F#-moll), enkelttoner med ♭/♯.
  const plainRoot = root => root;

  function buildScale(root, type) {
    const def = SCALES[type];
    const r = /^([A-G])(b|#)?$/.exec(root);
    if (!def || !r) return null;
    const rootAcc = r[2] === 'b' ? -1 : r[2] === '#' ? 1 : 0;
    const rootMidi = 60 + PC[r[1]] + rootAcc;
    const letterSteps = def.steps || def.st.map((_, i) => i);
    const notes = def.st.map((semi, i) => {
      const li = LETTERS.indexOf(r[1]) + letterSteps[i];
      const letter = LETTERS[li % 7];
      const midi = rootMidi + semi;
      const oct = 4 + Math.floor(li / 7);
      const acc = midi - (12 * (oct + 1) + PC[letter]);
      return { letter, acc, oct, midi, degree: i, semi };
    });
    const top = notes[0];
    notes.push({ ...top, oct: top.oct + 1, midi: top.midi + 12, degree: def.st.length, semi: 12, octave: true });
    const name = `${plainRoot(root)}-${def[no ? 'no' : 'en']}`;
    return { kind: 'scale', root, type, def, notes, name: type === 'minor_blues' && no ? `${plainRoot(root)}-bluesskala (moll)` : name };
  }

  // Bokstavtrinnet (0 = grunntone, 4 = kvint) for et skalatrinn.
  const letterStep = (scale, degree) => (scale.def.steps ? scale.def.steps[degree] : degree);

  function formula(scale) {
    return scale.notes.slice(0, -1).map(n => {
      const num = letterStep(scale, n.degree) + 1;
      const adj = n.semi - MAJOR[num - 1];
      return (adj < 0 ? 'b'.repeat(-adj) : '#'.repeat(adj)) + num;
    });
  }

  // ---------- data fra URL ----------
  let items = [];
  if (params.get('sets')) {
    items = params.get('sets').split(';').map(part => {
      const [label, list] = part.includes('|') ? part.split('|') : ['', part];
      const notes = (list || '').split('-').map(parseNote).filter(Boolean);
      return notes.length ? { kind: 'set', name: label.trim() || notes.map(noteText).join(' – '), notes } : null;
    }).filter(Boolean);
  } else {
    items = (params.get('scales') || 'C:ionian').split(',').map(s => {
      const [root, type] = s.trim().split(':');
      return buildScale(root, type || 'ionian');
    }).filter(Boolean);
  }
  if (!items.length) items = [buildScale('C', 'ionian')];

  const scales = items.filter(i => i.kind === 'scale');
  const sameRoot = scales.length > 1 && scales.every(s => s.root === scales[0].root);
  const markMode = ['diff', 'char', 'none'].includes(params.get('mark')) ? params.get('mark') : (sameRoot ? 'diff' : 'char');

  // Hvilke trinn som markeres i hver skala.
  items.forEach((item, idx) => {
    item.marks = new Set();
    if (item.kind !== 'scale' || markMode === 'none') return;
    if (markMode === 'char') { item.def.char.forEach(d => item.marks.add(d)); return; }
    const others = scales.length === 2 ? scales.filter(s => s !== item) : (idx === 0 ? [] : [scales[0]]);
    others.forEach(other => {
      const set = new Set(other.notes.map(n => n.semi % 12));
      item.notes.forEach(n => { if (!n.octave && !set.has(n.semi % 12)) item.marks.add(n.degree); });
    });
  });

  const title = (params.get('title') || '').trim();
  $('title').textContent = title || (items.length === 1 ? items[0].name : items.map(i => i.name).join(' og '));
  if (params.get('sets')) $('eyebrow').textContent = no ? 'Toner og fortegn' : 'Notes and accidentals';
  const tempo = Math.max(40, Math.min(200, Number(params.get('tempo')) || 100));
  let droneOn = params.get('drone') === '1';
  let upDown = false;
  let active = 0;
  if (!scales.length) { $('drone').hidden = true; $('updown').hidden = true; }
  $('drone').setAttribute('aria-pressed', String(droneOn));
  $('playAll').hidden = items.length < 2;

  // ---------- visning ----------
  function renderCards() {
    const wrap = $('cards');
    wrap.innerHTML = '';
    if (items.length < 2) { wrap.hidden = true; return; }
    items.forEach((item, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'card' + (i === active ? ' active' : '');
      b.setAttribute('aria-pressed', String(i === active));
      const sub = item.kind === 'scale'
        ? `<span class="formula">${formula(item).map((f, d) => item.marks.has(d) ? `<b>${f}</b>` : f).join(' ')}</span>`
        : `<span>${item.notes.map(noteText).join(' – ')}</span>`;
      b.innerHTML = `<strong>${item.name}</strong>${sub}`;
      b.onclick = () => { stop(); active = i; render(); play(); };
      wrap.append(b);
    });
  }

  function renderDetail(playing = -1) {
    const item = items[active];
    const steps = $('steps');
    steps.innerHTML = '';
    item.notes.forEach((n, i) => {
      if (i > 0 && item.kind === 'scale') {
        const semis = n.midi - item.notes[i - 1].midi;
        const s = document.createElement('span');
        s.className = 'step' + (semis === 1 ? ' half' : '');
        s.textContent = semis === 1 ? (no ? 'halv' : 'half') : semis === 2 ? (no ? 'hel' : 'whole') : (no ? '1½' : '1½');
        steps.append(s);
      }
      const chip = document.createElement('span');
      chip.className = 'note' + (item.marks.has(n.degree) && !n.octave ? ' mark' : '') + (i === playing ? ' playing' : '');
      chip.textContent = noteText(n);
      steps.append(chip);
    });
    const info = $('info');
    if (item.kind !== 'scale') { info.textContent = ''; return; }
    const marked = [...item.marks].map(d => item.notes[d]);
    if (!marked.length) {
      info.textContent = no ? 'Halvtonetrinnene er markert med rødt.' : 'Half steps are shown in red.';
      return;
    }
    const names = marked.map(n => `<b>${noteText(n)}</b> (${DEGREE_NAME[`${letterStep(item, n.degree)}:${n.semi}`] || formula(item)[n.degree]})`);
    const lead = markMode === 'diff'
      ? (no ? 'Tonene som skiller skalaene: ' : 'The notes that differ: ')
      : (no ? (marked.length > 1 ? 'Karaktertonene: ' : 'Karaktertonen: ') : 'Colour tone: ');
    const and = no ? ' og ' : ' and ';
    info.innerHTML = lead + (names.length > 1 ? names.slice(0, -1).join(', ') + and + names[names.length - 1] : names[0]) + '.';
  }

  function renderNotation(playing = -1) {
    const target = $('notation');
    target.innerHTML = '';
    if (!window.Vex) return;
    const VF = Vex.Flow;
    const item = items[active];
    const width = Math.max(320, Math.min(920, target.parentElement.clientWidth - 24));
    const renderer = new VF.Renderer(target, VF.Renderer.Backends.SVG);
    renderer.resize(width, 120);
    const ctx = renderer.getContext();
    const stave = new VF.Stave(6, 6, width - 12).addClef('treble');
    stave.setContext(ctx).draw();
    const notes = item.notes.map((n, i) => {
      const note = new VF.StaveNote({ clef: 'treble', keys: [`${n.letter.toLowerCase()}/${n.oct}`], duration: 'q' });
      const acc = n.natural ? 'n' : n.acc > 0 ? '#'.repeat(n.acc) : 'b'.repeat(-n.acc);
      if (acc) note.addModifier(new VF.Accidental(acc), 0);
      const color = i === playing ? '#7c3aed' : (item.marks.has(n.degree) && !n.octave ? '#d97706' : null);
      if (color) note.setStyle({ fillStyle: color, strokeStyle: color });
      return note;
    });
    const voice = new VF.Voice({ num_beats: notes.length, beat_value: 4 }).setStrict(false).addTickables(notes);
    new VF.Formatter().joinVoices([voice]).format([voice], Math.min(width - 70, notes.length * 95));
    voice.draw(ctx, stave);
  }

  function renderPiano(playing = []) {
    const piano = $('piano');
    piano.innerHTML = '';
    const item = items[active];
    const inScale = new Set(item.notes.map(n => n.midi));
    const marked = new Set(item.notes.filter(n => item.marks.has(n.degree) && !n.octave).map(n => n.midi));
    const lo = Math.min(...inScale), hi = Math.max(...inScale);
    const start = Math.min(60, lo - (lo % 12)), end = Math.max(83, hi);
    for (let midi = start; midi <= end; midi++) {
      const black = [1, 3, 6, 8, 10].includes(midi % 12);
      const key = document.createElement('div');
      key.className = `key ${black ? 'black' : 'white'}${inScale.has(midi) ? ' inscale' : ''}${marked.has(midi) ? ' mark' : ''}${playing.includes(midi) ? ' playing' : ''}`;
      if (!black && midi % 12 === 0) key.innerHTML = `<span class="key-label">C${Math.floor(midi / 12) - 1}</span>`;
      piano.append(key);
    }
  }

  function render(playing = -1) {
    renderCards();
    renderDetail(playing);
    renderNotation(playing);
    const item = items[active];
    renderPiano(playing >= 0 ? [item.notes[playing].midi] : []);
    $('playMark').hidden = !item.marks || item.marks.size === 0;
    $('playMark').textContent = markMode === 'diff' ? t('♪ Hør tonen som skiller', '♪ Hear the difference') : t('♪ Hør karaktertonen', '♪ Hear the colour tone');
  }

  // ---------- lyd ----------
  let ctx = null, master = null, droneNodes = [];
  const timers = [];
  function audio() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 4;
      master = ctx.createGain(); master.gain.value = 0.55;
      master.connect(comp); comp.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  const freq = midi => 440 * Math.pow(2, (midi - 69) / 12);
  function tone(midi, t, dur, peak = 0.26) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), g2 = ctx.createGain();
    o.type = 'triangle'; o.frequency.value = freq(midi);
    o2.type = 'sine'; o2.frequency.value = freq(midi) * 2; g2.gain.value = 0.16;
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(master);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }
  function startDrone(rootMidi) {
    stopDrone();
    const t = ctx.currentTime;
    [rootMidi - 12, rootMidi - 24].forEach((m, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = i ? 'sine' : 'triangle'; o.frequency.value = freq(m);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(i ? 0.12 : 0.09, t + 0.4);
      o.connect(g); g.connect(master); o.start(t);
      droneNodes.push({ o, g });
    });
  }
  function stopDrone() {
    if (!ctx) return;
    const t = ctx.currentTime;
    droneNodes.forEach(({ o, g }) => {
      g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(Math.max(g.gain.value, 0.0001), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35); o.stop(t + 0.4);
    });
    droneNodes = [];
  }
  function clearTimers() { while (timers.length) clearTimeout(timers.pop()); }
  function stop() {
    clearTimers(); stopDrone(); render();
    $('status').textContent = '';
  }

  // Spiller ett element; returnerer varigheten i sekunder.
  function playItem(index, offset = 0) {
    const item = items[index];
    const beat = 60 / tempo;
    const order = item.notes.map((_, i) => i);
    const seq = upDown && item.kind === 'scale' ? order.concat(order.slice(0, -1).reverse()) : order;
    const t0 = ctx.currentTime + 0.05 + offset;
    timers.push(setTimeout(() => {
      active = index; render();
      if (droneOn && item.kind === 'scale') startDrone(item.notes[0].midi);
      $('status').textContent = (no ? 'Spiller ' : 'Playing ') + item.name;
    }, offset * 1000));
    seq.forEach((n, k) => {
      tone(item.notes[n].midi, t0 + k * beat + (droneOn ? 0.5 : 0), beat * 0.95);
      timers.push(setTimeout(() => { renderDetail(n); renderNotation(n); renderPiano([item.notes[n].midi]); },
        (offset + k * beat + (droneOn ? 0.5 : 0)) * 1000 + 50));
    });
    return seq.length * beat + (droneOn ? 0.9 : 0.3);
  }
  function play() {
    stop(); audio();
    const dur = playItem(active);
    timers.push(setTimeout(() => { stopDrone(); render(); $('status').textContent = ''; }, dur * 1000));
  }
  function playAll() {
    stop(); audio();
    let offset = 0;
    items.forEach((_, i) => {
      const start = offset;
      offset += playItem(i, start) + 0.4;
      timers.push(setTimeout(stopDrone, (offset - 0.4) * 1000));
    });
    timers.push(setTimeout(() => { render(); $('status').textContent = ''; }, offset * 1000));
  }
  // Grunntonen holdes mens karaktertonen(e) spilles over den.
  function playMark() {
    stop(); audio();
    const item = items[active];
    const root = item.notes[0];
    const marked = [...item.marks].sort((a, b) => a - b).map(d => item.notes[d]);
    const t = ctx.currentTime + 0.05;
    tone(root.midi - 12, t, 1.2 + marked.length * 1.1, 0.2);
    tone(root.midi, t, 0.9);
    renderPiano([root.midi]);
    marked.forEach((n, i) => {
      const at = 1 + i * 1.1;
      tone(n.midi, t + at, 1.0);
      timers.push(setTimeout(() => { renderDetail(n.degree); renderNotation(n.degree); renderPiano([root.midi, n.midi]); }, at * 1000));
    });
    timers.push(setTimeout(() => render(), (1.3 + marked.length * 1.1) * 1000));
  }

  $('play').onclick = play;
  $('playAll').onclick = playAll;
  $('playMark').onclick = playMark;
  $('stop').onclick = stop;
  $('drone').onclick = () => { droneOn = !droneOn; $('drone').setAttribute('aria-pressed', String(droneOn)); if (!droneOn) stopDrone(); };
  $('updown').onclick = () => { upDown = !upDown; $('updown').setAttribute('aria-pressed', String(upDown)); };
  addEventListener('resize', () => renderNotation());
  render();
})();
