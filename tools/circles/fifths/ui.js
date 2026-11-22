/* Circle of Fifths – shared between ChordLink and Rockeskolen.
 * The host page sets window.CF_CONFIG = { lang: 'en'|'nb', paid: bool, upgradeUrl: string, tierLabel: string }.
 * Spelling rules: chord and key names use plain characters (Bb, F#m, Eb major, bVII);
 * single notes use ♭/♯ (E♭, F♯). The note B is always B, never H.
 */
(() => {
  'use strict';

  const CFG = Object.assign({ lang: 'en', paid: false, upgradeUrl: '/members/upgrade.php', tierLabel: 'PRO' }, window.CF_CONFIG || {});
  const LANG = CFG.lang === 'nb' ? 'nb' : 'en';

  // ---------------------------------------------------------------- texts
  const STR = {
    en: {
      title: 'Circle of Fifths',
      tagline: 'Click a key to hear it and see its chords, scale and key signature.',
      wheelLabel: 'Circle of fifths',
      rotate: 'Turn the selected key to the top',
      enh: 'Show {a} instead of {b}',
      legendTonic: 'Selected key',
      legendDiatonic: 'Chords in the key',
      signature: 'Key signature',
      scaleNotes: 'Scale notes',
      noSignature: 'No sharps or flats',
      sharps: '{n} sharp|{n} sharps',
      flats: '{n} flat|{n} flats',
      scaleLabel: 'Scale or mode',
      groupMajMin: 'Major and minor',
      groupModes: 'Modes',
      chordsInKey: 'Chords in the key',
      chordSize: 'Chord size',
      triads: 'Triads',
      sevenths: 'Sevenths',
      playback: 'Playback',
      playChord: 'Play chord',
      playScale: 'Play scale',
      stop: 'Stop all sound',
      progression: 'Chord progression',
      playProg: 'Play',
      octave: 'Octave',
      tempo: 'Tempo (BPM)',
      locked: '{name} is a {tier} feature.',
      upgrade: 'Upgrade to {tier} to unlock scale and progression playback.',
      noAudio: 'Sound could not start. Check that the page has loaded and try again.',
      relative: 'Relative {q}',
      parallel: 'Parallel {q}',
      dominantKey: 'Dominant key',
      subdominantKey: 'Subdominant key',
      parentKey: 'Parent major key',
      melodicNote: 'Descending, melodic minor is usually played as natural minor.',
      harmonicNote: 'The raised 7th ({n}) is added as an accidental. It is not part of the key signature.',
      melodicSig: 'The raised 6th and 7th ({n}) are added as accidentals. They are not part of the key signature.',
      major: 'major', minor: 'minor',
      keyName: '{k} {s}',
      pianoLabel: 'Keyboard with the scale notes marked',
      playing: 'Playing {x}',
      scales: {
        major: 'major', minor: 'natural minor', harmonic: 'harmonic minor', melodic: 'melodic minor',
        dorian: 'Dorian', phrygian: 'Phrygian', lydian: 'Lydian', mixolydian: 'Mixolydian', locrian: 'Locrian'
      },
      scaleMenu: {
        major: 'Major (Ionian)', minor: 'Natural minor (Aeolian)', harmonic: 'Harmonic minor', melodic: 'Melodic minor',
        dorian: 'Dorian', phrygian: 'Phrygian', lydian: 'Lydian', mixolydian: 'Mixolydian', locrian: 'Locrian'
      }
    },
    nb: {
      title: 'Kvintsirkel',
      tagline: 'Klikk på en toneart for å høre den og se akkorder, skala og fortegn.',
      wheelLabel: 'Kvintsirkel',
      rotate: 'Snu valgt toneart til toppen',
      enh: 'Vis {a} i stedet for {b}',
      legendTonic: 'Valgt toneart',
      legendDiatonic: 'Akkorder i tonearten',
      signature: 'Faste fortegn',
      scaleNotes: 'Skalatoner',
      noSignature: 'Ingen faste fortegn',
      sharps: '{n} kryss|{n} kryss',
      flats: '{n} b|{n} b-er',
      scaleLabel: 'Skala eller modus',
      groupMajMin: 'Dur og moll',
      groupModes: 'Moduser',
      chordsInKey: 'Akkorder i tonearten',
      chordSize: 'Akkordstørrelse',
      triads: 'Treklanger',
      sevenths: 'Firklanger',
      playback: 'Avspilling',
      playChord: 'Spill akkord',
      playScale: 'Spill skala',
      stop: 'Stopp all lyd',
      progression: 'Akkordrekke',
      playProg: 'Spill',
      octave: 'Oktav',
      tempo: 'Tempo (BPM)',
      locked: '{name} krever {tier}.',
      upgrade: 'Bli {tier} for å spille av skalaer og akkordrekker.',
      noAudio: 'Lyden kunne ikke starte. Kontroller at siden er lastet, og prøv igjen.',
      relative: 'Parallelltoneart',
      parallel: 'Varianttoneart',
      dominantKey: 'Dominanttoneart',
      subdominantKey: 'Subdominanttoneart',
      parentKey: 'Dur med samme fortegn',
      melodicNote: 'Nedadgående spilles melodisk moll vanligvis som naturlig moll.',
      harmonicNote: 'Det hevede 7. trinnet ({n}) skrives som løst fortegn. Det er ikke med i de faste fortegnene.',
      melodicSig: 'Det hevede 6. og 7. trinnet ({n}) skrives som løse fortegn. De er ikke med i de faste fortegnene.',
      major: 'dur', minor: 'moll',
      keyName: '{k}-{s}',
      pianoLabel: 'Klaviatur med skalatonene markert',
      playing: 'Spiller {x}',
      scales: {
        major: 'dur', minor: 'moll', harmonic: 'harmonisk moll', melodic: 'melodisk moll',
        dorian: 'dorisk', phrygian: 'frygisk', lydian: 'lydisk', mixolydian: 'miksolydisk', locrian: 'lokrisk'
      },
      scaleMenu: {
        major: 'Dur (ionisk)', minor: 'Naturlig moll (eolisk)', harmonic: 'Harmonisk moll', melodic: 'Melodisk moll',
        dorian: 'Dorisk', phrygian: 'Frygisk', lydian: 'Lydisk', mixolydian: 'Miksolydisk', locrian: 'Lokrisk'
      }
    }
  };
  const S = STR[LANG];
  function t(key, vars) {
    let s = key.split('.').reduce((o, k) => (o ? o[k] : undefined), S);
    if (s === undefined) s = key;
    if (vars && typeof vars.n === 'number' && s.includes('|')) {
      const [one, many] = s.split('|');
      s = vars.n === 1 ? one : many;
    }
    return String(s).replace(/\{(\w+)\}/g, (_, k) => (vars && vars[k] !== undefined ? vars[k] : ''));
  }

  // ---------------------------------------------------------------- theory
  const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const NAT = [0, 2, 4, 5, 7, 9, 11];
  const LETTER_FIFTHS = { F: -1, C: 0, G: 1, D: 2, A: 3, E: 4, B: 5 };
  const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11];

  // Modes rotate the major scale; mode = degree of the parent major scale (0 = Ionian).
  const SCALES = {
    major:      { steps: [0, 2, 4, 5, 7, 9, 11], mode: 0, family: 'maj' },
    minor:      { steps: [0, 2, 3, 5, 7, 8, 10], mode: 5, family: 'min' },
    harmonic:   { steps: [0, 2, 3, 5, 7, 8, 11], mode: 5, family: 'min', raised: [6] },
    melodic:    { steps: [0, 2, 3, 5, 7, 9, 11], mode: 5, family: 'min', raised: [5, 6], descending: 'minor' },
    dorian:     { steps: [0, 2, 3, 5, 7, 9, 10], mode: 1, family: 'min' },
    phrygian:   { steps: [0, 1, 3, 5, 7, 8, 10], mode: 2, family: 'min' },
    lydian:     { steps: [0, 2, 4, 6, 7, 9, 11], mode: 3, family: 'maj' },
    mixolydian: { steps: [0, 2, 4, 5, 7, 9, 10], mode: 4, family: 'maj' },
    locrian:    { steps: [0, 1, 3, 5, 6, 8, 10], mode: 6, family: 'min' }
  };
  const SCALE_GROUPS = [['groupMajMin', ['major', 'minor', 'harmonic', 'melodic']], ['groupModes', ['dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian']]];

  const mod = (n, m) => ((n % m) + m) % m;
  function parseNote(s) {
    const m = /^([A-G])(##|#|x|bb|b)?$/.exec(String(s || '').trim());
    if (!m) return null;
    const acc = { '#': 1, '##': 2, x: 2, b: -1, bb: -2 }[m[2]] || 0;
    return { l: LETTERS.indexOf(m[1]), a: acc };
  }
  const pc = n => mod(NAT[n.l] + n.a, 12);
  const fifthsPos = n => LETTER_FIFTHS[LETTERS[n.l]] + 7 * n.a;
  function noteAt(n, letterSteps, semis) {
    const l = mod(n.l + letterSteps, 7);
    let a = mod(pc(n) + semis - NAT[l], 12);
    if (a > 6) a -= 12;
    return { l, a };
  }
  // Single note: ♯/♭ (𝄪 for double sharp). Chord/key names: plain characters.
  function noteSym(n) {
    const L = LETTERS[n.l];
    if (n.a === 2) return L + '𝄪';
    if (n.a > 0) return L + '♯'.repeat(n.a);
    if (n.a < 0) return L + '♭'.repeat(-n.a);
    return L;
  }
  function noteTxt(n) {
    const L = LETTERS[n.l];
    return n.a >= 0 ? L + '#'.repeat(n.a) : L + 'b'.repeat(-n.a);
  }
  const sameNote = (a, b) => a && b && a.l === b.l && a.a === b.a;

  function scaleNotes(tonic, id) {
    return SCALES[id].steps.map((s, i) => noteAt(tonic, i, s));
  }

  const TRIAD = { '4,7': ['', 'maj'], '3,7': ['m', 'min'], '3,6': ['°', 'dim'], '4,8': ['+', 'aug'] };
  const SEVENTH = {
    '4,7,11': ['maj7', 'maj'], '4,7,10': ['7', 'maj'], '3,7,10': ['m7', 'min'], '3,7,11': ['m(maj7)', 'min'],
    '3,6,10': ['m7b5', 'dim'], '3,6,9': ['dim7', 'dim'], '4,8,11': ['maj7#5', 'aug'], '4,8,10': ['7#5', 'aug']
  };
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

  function diatonicChords(tonic, id, size) {
    const notes = scaleNotes(tonic, id);
    const steps = SCALES[id].steps;
    return notes.map((root, i) => {
      const tones = [0, 2, 4, 6].slice(0, size).map(k => notes[(i + k) % 7]);
      const ints = tones.slice(1).map(n => mod(pc(n) - pc(root), 12));
      const triad = TRIAD[ints.slice(0, 2).join(',')] || ['?', 'maj'];
      const quality = triad[1];
      let suffix = triad[0];
      let rn = ROMAN[i];
      if (quality === 'min' || quality === 'dim') rn = rn.toLowerCase();
      const alt = mod(steps[i] - MAJOR_STEPS[i] + 6, 12) - 6;
      const prefix = alt < 0 ? 'b'.repeat(-alt) : '#'.repeat(alt);
      let rnSuffix = quality === 'dim' ? '°' : quality === 'aug' ? '+' : '';
      if (size === 4) {
        const sev = SEVENTH[ints.join(',')];
        suffix = sev ? sev[0] : suffix;
        rnSuffix = { maj7: 'maj7', '7': '7', m7: '7', 'm(maj7)': '(maj7)', m7b5: 'ø7', dim7: '°7', 'maj7#5': '+maj7', '7#5': '+7' }[suffix] || rnSuffix;
      }
      return { root, tones, quality, name: noteTxt(root) + suffix, roman: prefix + rn + rnSuffix, degree: i };
    });
  }

  // Wheel: 12 positions clockwise from C. Position 6 can be shown with sharps or flats.
  const WHEEL_MAJOR = ['C', 'G', 'D', 'A', 'E', 'B', 'Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
  function wheelMajor(pos) {
    if (pos === 6 && state.enhSharp) return parseNote('F#');
    return parseNote(WHEEL_MAJOR[pos]);
  }
  const wheelMinor = pos => noteAt(wheelMajor(pos), 5, 9);
  const wheelDim = pos => noteAt(wheelMajor(pos), 6, 11);
  // Position of a key on the wheel, from the major key with the same signature.
  function parentMajor(tonic, id) {
    const m = SCALES[id].mode;
    return noteAt(tonic, mod(-m, 7), mod(-MAJOR_STEPS[m], 12));
  }
  const posOf = majorNote => mod(fifthsPos(majorNote), 12);

  // ---------------------------------------------------------------- state
  const state = {
    tonic: parseNote('C'),
    scale: 'major',
    size: 3,
    rotate: false,
    enhSharp: false,
    activeChord: null
  };

  function readUrl() {
    const p = new URLSearchParams(location.search);
    const k = parseNote((p.get('key') || '').replace(/♯/g, '#').replace(/♭/g, 'b'));
    const s = p.get('scale');
    if (s && SCALES[s]) state.scale = s;
    if (k) state.tonic = k;
    if (p.get('rotate') === '1') state.rotate = true;
    const pm = parentMajor(state.tonic, state.scale);
    if (Math.abs(fifthsPos(pm)) > 7) state.tonic = parseNote('C');
  }
  function writeUrl() {
    const p = new URLSearchParams(location.search);
    p.set('key', noteTxt(state.tonic));
    p.set('scale', state.scale);
    if (state.rotate) p.set('rotate', '1'); else p.delete('rotate');
    try { history.replaceState(null, '', location.pathname + '?' + p.toString() + location.hash); } catch (e) { /* ignore */ }
  }

  // ---------------------------------------------------------------- audio
  let synth = null;
  let audioReady = false;
  let timers = [];
  const statusEl = document.getElementById('cfStatus');

  async function ensureAudio() {
    if (audioReady) return true;
    if (typeof window.Tone === 'undefined') { setStatus(t('noAudio')); return false; }
    try {
      await Tone.start();
      synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle8' },
        envelope: { attack: 0.008, decay: 0.2, sustain: 0.25, release: 0.9 }
      }).toDestination();
      synth.volume.value = -8;
      audioReady = true;
      return true;
    } catch (e) {
      setStatus(t('noAudio'));
      return false;
    }
  }
  const midiOf = (n, oct) => 12 * (oct + 1) + NAT[n.l] + n.a;
  const freq = midi => 440 * Math.pow(2, (midi - 69) / 12);
  function voice(tones, oct) {
    const out = [];
    let prev = -Infinity;
    tones.forEach(n => {
      let m = midiOf(n, oct);
      while (m <= prev) m += 12;
      out.push(m);
      prev = m;
    });
    return out;
  }
  function stopAll() {
    timers.forEach(clearTimeout);
    timers = [];
    if (synth) synth.releaseAll();
    flashPiano(null);
    setStatus('');
  }
  function octave() { return parseInt(octSel.value, 10) || 4; }
  function beat() { return 60 / (parseInt(bpmEl.value, 10) || 100); }

  async function playChord(chord) {
    if (!(await ensureAudio())) return;
    stopAll();
    const midis = voice(chord.tones, chord.root.l >= 4 ? octave() - 1 : octave());
    synth.triggerAttackRelease(midis.map(freq), 1.1);
    state.activeChord = chord;
    flashPiano(chord.tones.map(pc));
    renderWheelState();
    renderChords();
    setStatus(t('playing', { x: chord.name }));
  }

  async function playScale() {
    if (!guard(t('playScale'))) return;
    if (!(await ensureAudio())) return;
    stopAll();
    const up = scaleNotes(state.tonic, state.scale);
    const downId = SCALES[state.scale].descending || state.scale;
    const down = scaleNotes(state.tonic, downId);
    const oct = state.tonic.l >= 4 ? octave() - 1 : octave();
    const upMidi = voice(up.concat([state.tonic]), oct);
    const top = upMidi[upMidi.length - 1];
    const downMidi = [];
    for (let i = 6; i >= 0; i--) {
      let m = midiOf(down[i], oct);
      while (m < upMidi[0]) m += 12;
      while (m >= top) m -= 12;
      if (i === 0) m = upMidi[0];
      downMidi.push(m);
    }
    const seq = upMidi.map((m, i) => [m, up[i % 7]]).concat(downMidi.map((m, i) => [m, down[6 - i]]));
    const step = beat() / 2;
    seq.forEach(([m, n], i) => {
      timers.push(setTimeout(() => {
        synth.triggerAttackRelease(freq(m), step * 0.95);
        flashPiano([pc(n)]);
      }, i * step * 1000));
    });
    timers.push(setTimeout(() => { flashPiano(null); setStatus(''); }, seq.length * step * 1000 + 200));
    setStatus(t('playing', { x: keyTitle() }));
  }

  async function playProgression() {
    if (!guard(t('progression'))) return;
    if (!(await ensureAudio())) return;
    stopAll();
    const chords = diatonicChords(state.tonic, state.scale, state.size);
    const prog = PROGRESSIONS[parseInt(progSel.value, 10) || 0];
    const len = beat() * 2;
    prog.forEach((deg, i) => {
      timers.push(setTimeout(() => {
        const c = chords[deg];
        const midis = voice(c.tones, c.root.l >= 4 ? octave() - 1 : octave());
        synth.triggerAttackRelease(midis.map(freq), len * 0.9);
        state.activeChord = c;
        flashPiano(c.tones.map(pc));
        renderWheelState();
        renderChords();
      }, i * len * 1000));
    });
    timers.push(setTimeout(() => setStatus(''), prog.length * len * 1000));
    setStatus(t('playing', { x: prog.map(d => chords[d].name).join(' – ') }));
  }

  const PROGRESSIONS = [[0, 3, 4, 0], [0, 4, 5, 3], [1, 4, 0], [0, 5, 3, 4], [5, 3, 0, 4], [0, 6, 5, 4]];

  function guard(name) {
    if (CFG.paid) { upgradeEl.hidden = true; return true; }
    upgradeEl.href = CFG.upgradeUrl;
    upgradeEl.innerHTML = '<strong>' + esc(t('locked', { name, tier: CFG.tierLabel })) + '</strong> ' + esc(t('upgrade', { tier: CFG.tierLabel }));
    upgradeEl.hidden = false;
    return false;
  }
  function setStatus(s) { if (statusEl) statusEl.textContent = s; }
  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  // ---------------------------------------------------------------- DOM
  const $ = id => document.getElementById(id);
  const wheelEl = $('cfWheel');
  const pianoEl = $('cfPiano');
  const scaleSel = $('cfScale');
  const progSel = $('cfProg');
  const octSel = $('cfOct');
  const bpmEl = $('cfBpm');
  const bpmVal = $('cfBpmVal');
  const upgradeEl = $('cfUpgrade');
  const rotateEl = $('cfRotate');
  const enhBtn = $('cfEnh');

  function applyStaticText() {
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
    document.querySelectorAll('[data-i18n-title]').forEach(el => el.setAttribute('title', t(el.dataset.i18nTitle)));
    const lock = CFG.paid ? '' : ' 🔒';
    $('cfPlayScale').textContent = t('playScale') + lock;
    $('cfPlayProg').textContent = t('playProg') + lock;
    scaleSel.innerHTML = SCALE_GROUPS.map(([g, ids]) =>
      '<optgroup label="' + esc(t(g)) + '">' + ids.map(id => '<option value="' + id + '">' + esc(t('scaleMenu.' + id)) + '</option>').join('') + '</optgroup>'
    ).join('');
  }

  function keyTitle() {
    const fam = SCALES[state.scale].family;
    const name = noteTxt(state.tonic);
    if (state.scale === 'major' || state.scale === 'minor') {
      return t('keyName', { k: name, s: t(fam === 'maj' ? 'major' : 'minor') });
    }
    return name + ' ' + t('scales.' + state.scale);
  }
  function keyNameFor(note, family) {
    return t('keyName', { k: noteTxt(note), s: t(family === 'maj' ? 'major' : 'minor') });
  }

  function signatureInfo() {
    const pm = parentMajor(state.tonic, state.scale);
    const n = fifthsPos(pm);
    if (n === 0) return { text: t('noSignature'), n };
    const order = n > 0 ? ['F', 'C', 'G', 'D', 'A', 'E', 'B'] : ['B', 'E', 'A', 'D', 'G', 'C', 'F'];
    const count = Math.abs(n);
    const list = [];
    for (let i = 0; i < Math.min(count, 7); i++) list.push(order[i] + (n > 0 ? '♯' : '♭'));
    const label = t(n > 0 ? 'sharps' : 'flats', { n: count });
    return { text: label + ': ' + list.join(' '), n };
  }

  // ---------------------------------------------------------------- wheel
  const SVGNS = 'http://www.w3.org/2000/svg';
  const SIZE = 760, C = SIZE / 2;
  const R = { out: 335, maj: 236, min: 150, dim: 98, disk: 92, sig: 356 };
  let cells = [];
  let rotGroup = null;
  let centerKey = null, centerSub = null, centerSig = null;

  function el(name, attrs, parent) {
    const e = document.createElementNS(SVGNS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  const polar = (r, a) => [C + r * Math.cos(a), C + r * Math.sin(a)];
  function arc(r0, r1, a0, a1) {
    const [x0, y0] = polar(r1, a0), [x1, y1] = polar(r1, a1), [x2, y2] = polar(r0, a1), [x3, y3] = polar(r0, a0);
    return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r1} ${r1} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}L${x2.toFixed(2)} ${y2.toFixed(2)}A${r0} ${r0} 0 0 0 ${x3.toFixed(2)} ${y3.toFixed(2)}Z`;
  }

  function buildWheel() {
    wheelEl.innerHTML = '';
    cells = [];
    const svg = el('svg', { viewBox: `0 0 ${SIZE} ${SIZE}`, class: 'cf-svg' }, wheelEl);
    rotGroup = el('g', { class: 'cf-rot' }, svg);
    const step = Math.PI * 2 / 12;
    const rings = [['maj', R.maj, R.out, 0.5], ['min', R.min, R.maj, 0.5], ['dim', R.dim, R.min, 0.5]];
    for (let pos = 0; pos < 12; pos++) {
      const mid = -Math.PI / 2 + pos * step;
      const a0 = mid - step / 2 + 0.006, a1 = mid + step / 2 - 0.006;
      rings.forEach(([ring, r0, r1, nameAt]) => {
        const g = el('g', { class: 'cf-cell cf-' + ring, tabindex: '0', role: 'button', 'data-pos': pos, 'data-ring': ring }, rotGroup);
        el('path', { d: arc(r0 + 2, r1 - 2, a0, a1), class: 'cf-cellbg' }, g);
        // Name and degree sit in one upright group, so they stay stacked when the wheel turns.
        const [lx, ly] = polar(r0 + (r1 - r0) * nameAt, mid);
        const anchor = el('g', { transform: `translate(${lx.toFixed(2)} ${ly.toFixed(2)})` }, g);
        const lbl = el('g', { class: 'cf-lbl' }, anchor);
        const gap = ring === 'maj' ? 20 : ring === 'min' ? 15 : 10;
        const name = el('text', { x: 0, y: -gap * 0.35, class: 'cf-name' }, lbl);
        const roman = el('text', { x: 0, y: gap * 0.85, class: 'cf-roman' }, lbl);
        g.addEventListener('click', e => onCell(pos, ring, e));
        g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCell(pos, ring, e); } });
        cells.push({ g, pos, ring, name, roman, lbl, gap });
      });
      const [sx, sy] = polar(R.sig, mid);
      const sig = el('text', { x: sx, y: sy, class: 'cf-sig cf-lbl', 'data-pos': pos }, rotGroup);
      cells.push({ g: null, pos, ring: 'sig', name: sig });
    }
    el('circle', { cx: C, cy: C, r: R.disk, class: 'cf-disk' }, svg);
    centerKey = el('text', { x: C, y: C - 18, class: 'cf-ckey' }, svg);
    centerSub = el('text', { x: C, y: C + 16, class: 'cf-csub' }, svg);
    centerSig = el('text', { x: C, y: C + 44, class: 'cf-csig' }, svg);
  }

  function cellChord(pos, ring) {
    const root = ring === 'maj' ? wheelMajor(pos) : ring === 'min' ? wheelMinor(pos) : wheelDim(pos);
    const ints = ring === 'maj' ? [[2, 4], [4, 7]] : ring === 'min' ? [[2, 3], [4, 7]] : [[2, 3], [4, 6]];
    const tones = [root].concat(ints.map(([l, s]) => noteAt(root, l, s)));
    const suffix = ring === 'maj' ? '' : ring === 'min' ? 'm' : '°';
    return { root, tones, quality: ring, name: noteTxt(root) + suffix, roman: '' };
  }

  function renderWheelState() {
    const triads = diatonicChords(state.tonic, state.scale, 3);
    const tonicPc = pc(state.tonic);
    const fam = SCALES[state.scale].family;
    // Turn the tonic's own cell to the top (for modes this differs from the parent major).
    const tq = triads[0].quality;
    const tonicPos = mod(fifthsPos(state.tonic) - (tq === 'min' ? 3 : tq === 'dim' ? 5 : 0), 12);
    const rot = state.rotate ? -(mod(tonicPos + 6, 12) - 6) * 30 : 0;
    rotGroup.style.transform = `rotate(${rot}deg)`;
    cells.forEach(c => {
      if (c.ring === 'sig') {
        const n = fifthsPos(wheelMajor(c.pos));
        c.name.textContent = n === 0 ? '0' : Math.abs(n) + (n > 0 ? '♯' : '♭');
        c.name.style.transform = `rotate(${-rot}deg)`;
        return;
      }
      const ch = cellChord(c.pos, c.ring);
      c.lbl.style.transform = `rotate(${-rot}deg)`;
      const match = triads.find(d => pc(d.root) === pc(ch.root) && d.quality === c.ring);
      // Chords in the key are spelled as in the key (e.g. C# rather than Db in F# major).
      c.name.textContent = match ? match.name : ch.name;
      c.roman.textContent = match ? match.roman : '';
      c.name.setAttribute('y', match ? (-c.gap * 0.35).toFixed(1) : '0');
      c.g.classList.toggle('is-dia', !!match);
      const isTonic = pc(ch.root) === tonicPc && ((c.ring === 'maj' && fam === 'maj' && (triads[0].quality === 'maj' || triads[0].quality === 'aug')) || (c.ring === 'min' && triads[0].quality === 'min') || (c.ring === 'dim' && triads[0].quality === 'dim'));
      c.g.classList.toggle('is-tonic', isTonic);
      const active = state.activeChord && pc(state.activeChord.root) === pc(ch.root) && state.activeChord.quality === c.ring;
      c.g.classList.toggle('is-active', !!active);
      c.g.setAttribute('aria-label', (match ? match.name + ', ' + match.roman : ch.name));
      c.g.setAttribute('aria-pressed', isTonic ? 'true' : 'false');
    });
    const sig = signatureInfo();
    centerKey.textContent = noteTxt(state.tonic);
    centerSub.textContent = t('scales.' + state.scale);
    centerSig.textContent = sig.n === 0 ? '0' : Math.abs(sig.n) + (sig.n > 0 ? '♯' : '♭');
    const other = state.enhSharp ? 'Gb / Ebm' : 'F# / D#m';
    const cur = state.enhSharp ? 'F# / D#m' : 'Gb / Ebm';
    enhBtn.textContent = t('enh', { a: other, b: cur });
  }

  function onCell(pos, ring, e) {
    upgradeEl.hidden = true;
    const ch = cellChord(pos, ring);
    if (ring === 'dim' || (e && e.shiftKey)) { playChord(ch); return; }
    const fam = ring === 'maj' ? 'maj' : 'min';
    let scale = state.scale;
    if (SCALES[scale].family !== fam || !['major', 'minor', 'harmonic', 'melodic'].includes(scale)) scale = fam === 'maj' ? 'major' : 'minor';
    state.tonic = ch.root;
    state.scale = scale;
    scaleSel.value = scale;
    update();
    playChord(diatonicChords(state.tonic, state.scale, state.size)[0]);
  }

  // ---------------------------------------------------------------- piano
  let pianoKeys = [];
  function buildPiano() {
    const W = 36, H = 130, BW = 22, BH = 80, whites = 14;
    const svg = el('svg', { viewBox: `0 0 ${whites * W + 2} ${H + 2}`, class: 'cf-pianosvg', role: 'img', 'aria-label': t('pianoLabel') }, pianoEl);
    pianoKeys = [];
    const whitePcs = [0, 2, 4, 5, 7, 9, 11];
    for (let i = 0; i < whites; i++) {
      const p = whitePcs[i % 7];
      const g = el('g', { class: 'cf-key cf-white' }, svg);
      el('rect', { x: 1 + i * W, y: 1, width: W - 2, height: H, rx: 4 }, g);
      const lbl = el('text', { x: 1 + i * W + W / 2 - 1, y: H - 12, class: 'cf-keylbl' }, g);
      pianoKeys.push({ g, pc: p, lbl });
    }
    const blackAfter = [0, 1, 3, 4, 5];
    const blackPcs = { 0: 1, 1: 3, 3: 6, 4: 8, 5: 10 };
    for (let o = 0; o < 2; o++) {
      blackAfter.forEach(w => {
        const i = o * 7 + w;
        const x = 1 + (i + 1) * W - BW / 2 - 1;
        const g = el('g', { class: 'cf-key cf-black' }, svg);
        el('rect', { x, y: 1, width: BW, height: BH, rx: 3 }, g);
        const lbl = el('text', { x: x + BW / 2, y: BH - 10, class: 'cf-keylbl' }, g);
        pianoKeys.push({ g, pc: blackPcs[w], lbl });
      });
    }
  }
  function renderPiano() {
    const notes = scaleNotes(state.tonic, state.scale);
    const byPc = {};
    notes.forEach(n => { byPc[pc(n)] = n; });
    const tonicPc = pc(state.tonic);
    pianoKeys.forEach(k => {
      const n = byPc[k.pc];
      k.g.classList.toggle('is-scale', !!n);
      k.g.classList.toggle('is-tonic', k.pc === tonicPc);
      k.lbl.textContent = n ? noteSym(n) : '';
    });
  }
  function flashPiano(pcs) {
    pianoKeys.forEach(k => k.g.classList.toggle('is-on', !!pcs && pcs.includes(k.pc)));
  }

  // ---------------------------------------------------------------- panel
  function renderPanel() {
    const sc = SCALES[state.scale];
    const notes = scaleNotes(state.tonic, state.scale);
    $('cfKeyTitle').textContent = keyTitle();
    const sig = signatureInfo();
    $('cfSignature').textContent = sig.text;
    $('cfNotes').textContent = notes.map(noteSym).join(' – ');
    const noteEl = $('cfScaleNote');
    let note = '';
    if (state.scale === 'harmonic') note = t('harmonicNote', { n: noteSym(notes[6]) });
    if (state.scale === 'melodic') note = t('melodicSig', { n: noteSym(notes[5]) + ', ' + noteSym(notes[6]) }) + ' ' + t('melodicNote');
    noteEl.textContent = note;
    noteEl.hidden = !note;

    // related keys
    const rel = [];
    if (state.scale === 'major') {
      rel.push([t('relative', { q: t('minor') }), noteAt(state.tonic, 5, 9), 'minor']);
      rel.push([t('parallel', { q: t('minor') }), state.tonic, 'minor']);
      rel.push([t('dominantKey'), noteAt(state.tonic, 4, 7), 'major']);
      rel.push([t('subdominantKey'), noteAt(state.tonic, 3, 5), 'major']);
    } else if (sc.family === 'min' && sc.mode === 5) {
      rel.push([t('relative', { q: t('major') }), noteAt(state.tonic, 2, 3), 'major']);
      rel.push([t('parallel', { q: t('major') }), state.tonic, 'major']);
      rel.push([t('dominantKey'), noteAt(state.tonic, 4, 7), state.scale]);
      rel.push([t('subdominantKey'), noteAt(state.tonic, 3, 5), state.scale]);
    } else {
      rel.push([t('parentKey'), parentMajor(state.tonic, state.scale), 'major']);
    }
    const relEl = $('cfRelated');
    relEl.innerHTML = '';
    rel.forEach(([label, note, scale]) => {
      const pm = parentMajor(note, scale);
      const ok = Math.abs(fifthsPos(pm)) <= 7;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cf-relbtn';
      b.disabled = !ok;
      const fam = SCALES[scale].family;
      const name = (scale === 'major' || scale === 'minor') ? keyNameFor(note, fam) : noteTxt(note) + ' ' + t('scales.' + scale);
      b.innerHTML = '<span>' + esc(label) + '</span><strong>' + esc(name) + '</strong>';
      b.addEventListener('click', () => {
        state.tonic = note;
        state.scale = scale;
        scaleSel.value = scale;
        update();
        playChord(diatonicChords(state.tonic, state.scale, state.size)[0]);
      });
      relEl.appendChild(b);
    });

    // progressions
    const triads = diatonicChords(state.tonic, state.scale, 3);
    const prev = progSel.value;
    progSel.innerHTML = PROGRESSIONS.map((p, i) => '<option value="' + i + '">' + esc(p.map(d => triads[d].roman).join(' – ')) + '</option>').join('');
    if (prev) progSel.value = prev;
  }

  function renderChords() {
    const list = diatonicChords(state.tonic, state.scale, state.size);
    const box = $('cfChords');
    box.innerHTML = '';
    list.forEach(c => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cf-chord cf-q-' + c.quality;
      const active = state.activeChord && pc(state.activeChord.root) === pc(c.root) && state.activeChord.name === c.name;
      if (active) b.classList.add('is-active');
      b.innerHTML = '<span class="cf-chord-rn">' + esc(c.roman) + '</span><span class="cf-chord-name">' + esc(c.name) + '</span><span class="cf-chord-notes">' + esc(c.tones.map(noteSym).join(' ')) + '</span>';
      b.addEventListener('click', () => { upgradeEl.hidden = true; playChord(c); });
      box.appendChild(b);
    });
  }

  function update() {
    stopAll(); // pending scale/progression playback belongs to the previous key
    const pm = parentMajor(state.tonic, state.scale);
    if (posOf(pm) === 6) state.enhSharp = fifthsPos(pm) > 0;
    state.activeChord = null;
    renderWheelState();
    renderPiano();
    renderPanel();
    renderChords();
    writeUrl();
  }

  function move(delta) {
    // Move the parent key one fifth; keep the scale.
    const pm = parentMajor(state.tonic, state.scale);
    const next = mod(posOf(pm) + delta, 12);
    const newParent = wheelMajor(next);
    const m = SCALES[state.scale].mode;
    state.tonic = noteAt(newParent, m, MAJOR_STEPS[m]);
    update();
    playChord(diatonicChords(state.tonic, state.scale, state.size)[0]);
  }

  // ---------------------------------------------------------------- init
  function init() {
    readUrl();
    applyStaticText();
    buildWheel();
    buildPiano();
    scaleSel.value = state.scale;
    rotateEl.checked = state.rotate;
    bpmVal.textContent = bpmEl.value;

    scaleSel.addEventListener('change', () => {
      const s = scaleSel.value;
      if (!SCALES[s]) return;
      const pm = parentMajor(state.tonic, s);
      if (Math.abs(fifthsPos(pm)) > 7) {
        // e.g. G# Lydian: respell the tonic enharmonically so the key exists.
        const alt = noteAt(state.tonic, fifthsPos(pm) > 0 ? 1 : -1, 0);
        if (Math.abs(fifthsPos(parentMajor(alt, s))) <= 7) state.tonic = alt;
      }
      state.scale = s;
      update();
    });
    document.querySelectorAll('.cf-segbtn[data-size]').forEach(b => b.addEventListener('click', () => {
      state.size = parseInt(b.dataset.size, 10) === 4 ? 4 : 3;
      document.querySelectorAll('.cf-segbtn[data-size]').forEach(x => x.classList.toggle('is-on', x === b));
      state.activeChord = null;
      renderChords();
    }));
    rotateEl.addEventListener('change', () => { state.rotate = rotateEl.checked; renderWheelState(); writeUrl(); });
    enhBtn.addEventListener('click', () => {
      state.enhSharp = !state.enhSharp;
      const pm = parentMajor(state.tonic, state.scale);
      if (posOf(pm) === 6) {
        const m = SCALES[state.scale].mode;
        state.tonic = noteAt(wheelMajor(6), m, MAJOR_STEPS[m]);
        update();
      } else renderWheelState();
    });
    bpmEl.addEventListener('input', () => { bpmVal.textContent = bpmEl.value; });
    $('cfPlayChord').addEventListener('click', () => { upgradeEl.hidden = true; playChord(diatonicChords(state.tonic, state.scale, state.size)[0]); });
    $('cfPlayScale').addEventListener('click', playScale);
    $('cfPlayProg').addEventListener('click', playProgression);
    $('cfStop').addEventListener('click', stopAll);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { stopAll(); return; }
      const tag = (e.target && e.target.tagName) || '';
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(tag)) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); move(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); }
    });
    update();
  }

  // Exposed for tests.
  window.CF_THEORY = { parseNote, scaleNotes, diatonicChords, noteSym, noteTxt, parentMajor, fifthsPos };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
