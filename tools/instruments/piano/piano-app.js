// tools/instruments/piano/piano-app.js
// Kobler sammen lydmotor, klaviatur og sequencer, og bygger brukergrensesnittet.
// Språk velges med window.CL_PIANO_CONFIG = { lang: 'en' | 'nb' } fra index.php.
// Filen deles mellom ChordLink og Rockeskolen – hold kopiene like.
(function (global) {
  'use strict';

  const STRINGS = {
    en: {
      keyboard: 'Piano keyboard',
      octaveDown: 'Octave down',
      octaveUp: 'Octave up',
      octaves: 'Octaves',
      auto: 'Auto',
      labels: 'Note names',
      labelsC: 'C only',
      labelsAll: 'All',
      labelsNone: 'None',
      showFlats: 'Show flats',
      showSharps: 'Show sharps',
      sustainPedal: 'Sustain pedal',
      hold: 'Hold',
      holdTitle: 'Every note keeps sounding after you let go, so you can build a chord one note at a time. Click Hold again or All notes off to release.',
      midi: 'Connect MIDI',
      midiOn: n => 'MIDI: ' + n + (n === 1 ? ' device' : ' devices'),
      midiNone: 'MIDI: no devices found',
      midiUnsupported: 'MIDI is not supported in this browser',
      midiDenied: 'MIDI access was denied',
      panic: 'All notes off',
      readoutIdle: 'Play a key or a chord …',
      keysHint: 'Computer keys: Z–M plays the lowest octave shown, Q–P the next one. Use the arrows to change octave.',
      sound: 'Sound',
      preset: 'Sound preset',
      custom: 'Custom',
      presets: { warm: 'Warm piano', soft: 'Soft keys', electric: 'Electric piano', organ: 'Organ', bright: 'Bright synth', pad: 'Ambient pad' },
      waveform: 'Waveform',
      waves: { sine: 'Sine', triangle: 'Triangle', square: 'Square', sawtooth: 'Saw' },
      volume: 'Volume',
      attack: 'Attack',
      decay: 'Decay',
      sustain: 'Sustain level',
      release: 'Release',
      cutoff: 'Filter cutoff',
      reverb: 'Reverb',
      delay: 'Delay',
      drive: 'Overdrive',
      transpose: 'Transpose',
      oct: n => (n > 0 ? '+' : '') + n + ' oct',
      sequencer: 'Step sequencer',
      play: 'Play',
      stop: 'Stop',
      record: 'Record notes',
      tempo: 'Tempo (BPM)',
      steps: 'Steps',
      gate: 'Note length',
      gates: { '32n': '32nd', '16n': '16th', '8n': '8th', '4n': 'Quarter', tie: 'Tie (hold to next note)' },
      clearStep: 'Clear step',
      clearAll: 'Clear all',
      stepLabel: (i, n) => 'Step ' + i + (n ? ', ' + n + (n === 1 ? ' note' : ' notes') : ', empty'),
      stepTitle: i => 'Step ' + i,
      emptyStep: 'No notes yet.',
      removeNote: name => 'Remove ' + name,
      seqHint: 'Turn on Record notes, choose a step and play keys to add them. Tie holds a note until the next step with notes. The pattern is saved in this browser.'
    },
    nb: {
      keyboard: 'Pianoklaviatur',
      octaveDown: 'Oktav ned',
      octaveUp: 'Oktav opp',
      octaves: 'Antall oktaver',
      auto: 'Automatisk',
      labels: 'Tonenavn',
      labelsC: 'Bare C',
      labelsAll: 'Alle',
      labelsNone: 'Ingen',
      showFlats: 'Vis b-er',
      showSharps: 'Vis kryss',
      sustainPedal: 'Sustainpedal',
      hold: 'Hold',
      holdTitle: 'Hver tone klinger videre når du slipper, så du kan bygge en akkord tone for tone. Klikk på Hold igjen eller Stopp alle toner for å slippe.',
      midi: 'Koble til MIDI',
      midiOn: n => 'MIDI: ' + n + (n === 1 ? ' enhet' : ' enheter'),
      midiNone: 'MIDI: fant ingen enheter',
      midiUnsupported: 'Denne nettleseren støtter ikke MIDI',
      midiDenied: 'Tilgang til MIDI ble avvist',
      panic: 'Stopp alle toner',
      readoutIdle: 'Spill en tangent eller en akkord …',
      keysHint: 'Datatastatur: Z–M spiller den laveste oktaven som vises, Q–P den neste. Bruk pilene for å bytte oktav.',
      sound: 'Lyd',
      preset: 'Lydvalg',
      custom: 'Egendefinert',
      presets: { warm: 'Varmt piano', soft: 'Myke tangenter', electric: 'Elpiano', organ: 'Orgel', bright: 'Lys synth', pad: 'Flate (pad)' },
      waveform: 'Bølgeform',
      waves: { sine: 'Sinus', triangle: 'Trekant', square: 'Firkant', sawtooth: 'Sagtann' },
      volume: 'Volum',
      attack: 'Attack',
      decay: 'Decay',
      sustain: 'Sustainnivå',
      release: 'Release',
      cutoff: 'Filter (lysstyrke)',
      reverb: 'Romklang',
      delay: 'Ekko (delay)',
      drive: 'Vreng',
      transpose: 'Transponering',
      oct: n => (n > 0 ? '+' : '') + n + ' okt.',
      sequencer: 'Stegsequencer',
      play: 'Spill',
      stop: 'Stopp',
      record: 'Ta opp toner',
      tempo: 'Tempo (BPM)',
      steps: 'Antall steg',
      gate: 'Notelengde',
      gates: { '32n': '32-del', '16n': '16-del', '8n': '8-del', '4n': '4-del', tie: 'Bind (hold til neste tone)' },
      clearStep: 'Tøm steget',
      clearAll: 'Tøm alt',
      stepLabel: (i, n) => 'Steg ' + i + (n ? ', ' + n + (n === 1 ? ' tone' : ' toner') : ', tomt'),
      stepTitle: i => 'Steg ' + i,
      emptyStep: 'Ingen toner ennå.',
      removeNote: name => 'Fjern ' + name,
      seqHint: 'Slå på Ta opp toner, velg et steg og spill tangenter for å legge dem inn. Bind holder tonen til neste steg som har toner. Mønsteret lagres i denne nettleseren.'
    }
  };

  const SLIDERS = [
    { key: 'volume',  min: -30, max: 0,     step: 1,    fmt: v => v + ' dB' },
    { key: 'attack',  min: 0,   max: 1,     step: 0.01, fmt: v => Math.round(v * 1000) + ' ms' },
    { key: 'decay',   min: 0,   max: 2,     step: 0.05, fmt: v => v.toFixed(2) + ' s' },
    { key: 'sustain', min: 0,   max: 1,     step: 0.01, fmt: v => Math.round(v * 100) + ' %' },
    { key: 'release', min: 0,   max: 3,     step: 0.05, fmt: v => v.toFixed(2) + ' s' },
    { key: 'cutoff',  min: 500, max: 20000, step: 100,  fmt: v => (v >= 1000 ? (v / 1000).toFixed(1) + ' kHz' : v + ' Hz') },
    { key: 'reverb',  min: 0,   max: 1,     step: 0.01, fmt: v => Math.round(v * 100) + ' %' },
    { key: 'delay',   min: 0,   max: 1,     step: 0.01, fmt: v => Math.round(v * 100) + ' %' },
    { key: 'drive',   min: 0,   max: 0.8,   step: 0.01, fmt: v => Math.round(v * 125) + ' %' }
  ];

  const SOUND_KEY = 'cl-piano-sound-v1';

  function esc(value) {
    return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function readJSON(key) {
    try { return JSON.parse(global.localStorage.getItem(key) || 'null'); } catch (err) { return null; }
  }

  function writeJSON(key, value) {
    try { global.localStorage.setItem(key, JSON.stringify(value)); } catch (err) { /* ignorer */ }
  }

  function init() {
    const root = document.getElementById('piano-app');
    if (!root || !global.Tone || !global.CLPianoEngine) return;

    const config = global.CL_PIANO_CONFIG || {};
    const t = STRINGS[config.lang] || STRINGS.en;
    const theory = global.CLNotedMusic && typeof global.CLNotedMusic.detectChords === 'function' ? global.CLNotedMusic : null;

    root.innerHTML = buildMarkup(t);
    const $ = id => document.getElementById(id);

    const engine = global.CLPianoEngine.create();
    let preferFlats = false;
    let sustainOn = false;

    // ---------- Lyd ----------

    const presetSel = $('pk-preset');
    const waveSel = $('pk-wave');
    const transposeSel = $('pk-transpose');

    function showParams(params) {
      waveSel.value = params.wave;
      SLIDERS.forEach(s => {
        $('pk-' + s.key).value = String(params[s.key]);
        $('pk-' + s.key + '-out').textContent = s.fmt(Number(params[s.key]));
      });
    }

    function saveSound() {
      writeJSON(SOUND_KEY, { v: 1, preset: presetSel.value, params: engine.getParams(), transpose: engine.getTranspose() });
    }

    const storedSound = readJSON(SOUND_KEY);
    if (storedSound && storedSound.v === 1 && storedSound.params) {
      const safe = {};
      SLIDERS.forEach(s => {
        const v = Number(storedSound.params[s.key]);
        if (Number.isFinite(v)) safe[s.key] = Math.max(s.min, Math.min(s.max, v));
      });
      if (t.waves[storedSound.params.wave]) safe.wave = storedSound.params.wave;
      engine.setParams(safe);
      presetSel.value = storedSound.preset in t.presets || storedSound.preset === 'custom' ? storedSound.preset : 'warm';
      const tr = parseInt(storedSound.transpose, 10);
      if ([-24, -12, 0, 12, 24].indexOf(tr) !== -1) {
        engine.setTranspose(tr);
        transposeSel.value = String(tr);
      }
    }
    showParams(engine.getParams());

    function markCustom() {
      presetSel.value = 'custom';
    }

    presetSel.addEventListener('change', () => {
      if (presetSel.value === 'custom') return;
      keyboard.allOff();
      const params = engine.applyPreset(presetSel.value);
      if (params) showParams(params);
      saveSound();
    });

    waveSel.addEventListener('change', () => {
      engine.setParams({ wave: waveSel.value });
      markCustom();
      saveSound();
    });

    SLIDERS.forEach(s => {
      const input = $('pk-' + s.key);
      input.addEventListener('input', () => {
        const value = parseFloat(input.value);
        engine.setParams({ [s.key]: value });
        $('pk-' + s.key + '-out').textContent = s.fmt(value);
        markCustom();
      });
      input.addEventListener('change', saveSound);
    });

    transposeSel.addEventListener('change', () => {
      engine.setTranspose(transposeSel.value);
      saveSound();
    });

    // ---------- Klaviatur ----------

    const readout = $('pk-readout');

    function updateReadout() {
      const held = keyboard.heldNotes();
      if (!held.length) {
        readout.textContent = t.readoutIdle;
        readout.classList.add('is-idle');
        return;
      }
      readout.classList.remove('is-idle');
      let text = held.map(m => keyboard.noteName(m)).join(' · ');
      if (theory && held.length >= 2) {
        const result = theory.detectChords(held.map(m => ({ pc: m % 12, midi: m })), preferFlats);
        if (result && result.best) {
          const label = result.best.label.replace(/([A-G])#/g, '$1♯').replace(/([A-G])b/g, '$1♭').replace(/b(\d)/g, '♭$1');
          text += '  →  ' + label;
        }
      }
      readout.textContent = text;
    }

    let keyboard = null;
    keyboard = global.CLPianoKeyboard.create($('pk-keyboard'), {
      octaves: 'auto',
      labels: 'c',
      onNoteOn(midi, velocity) {
        engine.noteOn(midi, velocity);
        if (sequencer.addNote(midi, velocity, $('pk-gate').value)) renderSteps();
        updateReadout();
      },
      onNoteOff(midi) {
        engine.noteOff(midi);
        updateReadout();
      },
      onRangeChange(range) {
        $('pk-range').textContent = keyboard ? keyboard.noteName(range.low) + '–' + keyboard.noteName(range.high) : '';
        if (keyboard) {
          $('pk-oct-down').disabled = !keyboard.canShift(-1);
          $('pk-oct-up').disabled = !keyboard.canShift(1);
        }
      }
    });
    keyboard.render(); // oppdaterer rekkeviddeteksten nå som keyboard-variabelen finnes

    $('pk-oct-down').addEventListener('click', () => keyboard.shiftOctave(-1));
    $('pk-oct-up').addEventListener('click', () => keyboard.shiftOctave(1));
    $('pk-octaves').addEventListener('change', e => keyboard.setOctaves(e.target.value));
    $('pk-labels').addEventListener('change', e => keyboard.setLabels(e.target.value));

    const accBtn = $('pk-accidentals');
    accBtn.addEventListener('click', () => {
      preferFlats = !preferFlats;
      accBtn.textContent = preferFlats ? '♭' : '♯';
      accBtn.setAttribute('aria-label', preferFlats ? t.showSharps : t.showFlats);
      accBtn.title = accBtn.getAttribute('aria-label');
      keyboard.setPreferFlats(preferFlats);
      updateReadout();
      renderSteps();
    });

    const sustainBtn = $('pk-sustain');
    function setSustain(on) {
      sustainOn = on;
      engine.setSustain(on);
      sustainBtn.setAttribute('aria-pressed', String(on));
    }
    sustainBtn.addEventListener('click', () => setSustain(!sustainOn));

    const holdBtn = $('pk-hold');
    let holdOn = false;
    function setHold(on) {
      holdOn = on;
      keyboard.setHold(on);
      holdBtn.setAttribute('aria-pressed', String(on));
      updateReadout();
    }
    holdBtn.addEventListener('click', () => setHold(!holdOn));

    $('pk-panic').addEventListener('click', () => {
      setHold(false);
      keyboard.allOff();
      setSustain(false);
      engine.panic();
      updateReadout();
    });

    // ---------- MIDI ----------

    const midiStatus = $('pk-midi-status');
    $('pk-midi').addEventListener('click', () => {
      engine.start();
      if (!navigator.requestMIDIAccess) {
        midiStatus.textContent = t.midiUnsupported;
        return;
      }
      navigator.requestMIDIAccess({ sysex: false }).then(access => {
        const attach = () => {
          let count = 0;
          access.inputs.forEach(input => {
            input.onmidimessage = onMidi;
            count++;
          });
          midiStatus.textContent = count ? t.midiOn(count) : t.midiNone;
        };
        attach();
        access.onstatechange = attach;
      }, () => {
        midiStatus.textContent = t.midiDenied;
      });
    });

    function onMidi(e) {
      const [status, data1, data2] = e.data;
      const type = status & 0xf0;
      const channel = status & 0x0f;
      if (type === 0x90 && data2 > 0) keyboard.press(data1, 'm' + channel, data2 / 127);
      else if (type === 0x80 || (type === 0x90 && data2 === 0)) keyboard.release(data1, 'm' + channel);
      else if (type === 0xb0 && data1 === 64) setSustain(data2 >= 64);
    }

    // ---------- Sequencer ----------

    const grid = $('pk-steps');
    const sequencer = global.CLPianoSequencer.create({
      engine: engine,
      onStep(index) {
        grid.querySelectorAll('.pk-step.is-current').forEach(el => el.classList.remove('is-current'));
        if (index >= 0) {
          const el = grid.children[index];
          if (el) el.classList.add('is-current');
        }
      },
      onChange: () => renderSteps()
    });

    function renderSteps() {
      const state = sequencer.getState();
      if (grid.children.length !== state.length) {
        grid.textContent = '';
        for (let i = 0; i < state.length; i++) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'pk-step';
          btn.dataset.step = i;
          btn.innerHTML = '<span class="pk-step-num">' + (i + 1) + '</span><span class="pk-step-dots" aria-hidden="true"></span>';
          grid.appendChild(btn);
        }
      }
      Array.from(grid.children).forEach((btn, i) => {
        const count = sequencer.getStep(i).length;
        btn.classList.toggle('is-selected', i === state.selected);
        btn.classList.toggle('has-notes', count > 0);
        btn.classList.toggle('is-beat', i % 4 === 0);
        btn.setAttribute('aria-pressed', String(i === state.selected));
        btn.setAttribute('aria-label', t.stepLabel(i + 1, count));
        btn.querySelector('.pk-step-dots').textContent = count ? '•'.repeat(Math.min(count, 4)) : '';
      });

      const playBtn = $('pk-play');
      playBtn.textContent = state.playing ? t.stop : t.play;
      playBtn.setAttribute('aria-pressed', String(state.playing));
      playBtn.classList.toggle('is-on', state.playing);
      $('pk-record').setAttribute('aria-pressed', String(state.recording));
      $('pk-tempo').value = String(state.tempo);
      $('pk-length').value = String(state.length);

      const notes = sequencer.getStep(state.selected);
      $('pk-step-title').textContent = t.stepTitle(state.selected + 1);
      const list = $('pk-step-notes');
      list.textContent = '';
      if (!notes.length) {
        const empty = document.createElement('span');
        empty.className = 'pk-muted';
        empty.textContent = t.emptyStep;
        list.appendChild(empty);
      }
      notes.forEach(n => {
        const name = keyboard.noteName(n.midi);
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'pk-chip';
        chip.dataset.midi = n.midi;
        chip.setAttribute('aria-label', t.removeNote(name));
        chip.textContent = name + ' · ' + t.gates[n.gate].split(' (')[0] + ' ×';
        list.appendChild(chip);
      });
      keyboard.mark(notes.map(n => n.midi));
    }

    grid.addEventListener('click', e => {
      const btn = e.target.closest('.pk-step');
      if (btn) sequencer.select(Number(btn.dataset.step));
    });
    $('pk-step-notes').addEventListener('click', e => {
      const chip = e.target.closest('.pk-chip');
      if (chip) sequencer.removeNote(sequencer.getState().selected, Number(chip.dataset.midi));
    });
    $('pk-play').addEventListener('click', () => {
      if (sequencer.getState().playing) sequencer.stop();
      else sequencer.play();
    });
    $('pk-record').addEventListener('click', () => {
      engine.start();
      sequencer.setRecording(!sequencer.getState().recording);
    });
    $('pk-tempo').addEventListener('change', e => {
      e.target.value = String(sequencer.setTempo(e.target.value));
    });
    $('pk-length').addEventListener('change', e => sequencer.setLength(Number(e.target.value)));
    $('pk-clear-step').addEventListener('click', () => sequencer.clearStep(sequencer.getState().selected));
    $('pk-clear-all').addEventListener('click', () => sequencer.clearAll());

    // Lås opp lyden ved første berøring, uansett hvor på siden
    const unlock = () => {
      engine.start();
      document.removeEventListener('pointerdown', unlock, true);
      document.removeEventListener('keydown', unlock, true);
    };
    document.addEventListener('pointerdown', unlock, true);
    document.addEventListener('keydown', unlock, true);

    renderSteps();
    updateReadout();
  }

  function buildMarkup(t) {
    const option = (value, label, selected) =>
      '<option value="' + esc(value) + '"' + (selected ? ' selected' : '') + '>' + esc(label) + '</option>';

    const presetOptions = Object.keys(t.presets).map((k, i) => option(k, t.presets[k], i === 0)).join('') + option('custom', t.custom);
    const waveOptions = Object.keys(t.waves).map(k => option(k, t.waves[k], k === 'triangle')).join('');
    const transposeOptions = [-24, -12, 0, 12, 24].map(n => option(n, n === 0 ? '0' : t.oct(n / 12), n === 0)).join('');
    const gateOptions = Object.keys(t.gates).map(k => option(k, t.gates[k], k === '16n')).join('');
    const sliders = SLIDERS.map(s =>
      '<label class="pk-control" for="pk-' + s.key + '">' +
        '<span class="pk-control-head"><span>' + esc(t[s.key]) + '</span><output id="pk-' + s.key + '-out" for="pk-' + s.key + '"></output></span>' +
        '<input type="range" id="pk-' + s.key + '" min="' + s.min + '" max="' + s.max + '" step="' + s.step + '">' +
      '</label>'
    ).join('');

    return '' +
      '<div class="pk-bar">' +
        '<div class="pk-octave">' +
          '<button type="button" id="pk-oct-down" class="pk-btn pk-icon" aria-label="' + esc(t.octaveDown) + '" title="' + esc(t.octaveDown) + '">◀</button>' +
          '<span id="pk-range" class="pk-range" aria-live="polite"></span>' +
          '<button type="button" id="pk-oct-up" class="pk-btn pk-icon" aria-label="' + esc(t.octaveUp) + '" title="' + esc(t.octaveUp) + '">▶</button>' +
        '</div>' +
        '<label class="pk-field"><span>' + esc(t.octaves) + '</span><select id="pk-octaves">' +
          option('auto', t.auto, true) + option(1, '1') + option(2, '2') + option(3, '3') + option(4, '4') +
        '</select></label>' +
        '<label class="pk-field"><span>' + esc(t.labels) + '</span><select id="pk-labels">' +
          option('c', t.labelsC, true) + option('all', t.labelsAll) + option('none', t.labelsNone) +
        '</select></label>' +
        '<button type="button" id="pk-accidentals" class="pk-btn pk-icon" aria-label="' + esc(t.showFlats) + '" title="' + esc(t.showFlats) + '">♯</button>' +
        '<button type="button" id="pk-sustain" class="pk-btn pk-toggle" aria-pressed="false">' + esc(t.sustainPedal) + '</button>' +
        '<button type="button" id="pk-hold" class="pk-btn pk-toggle pk-hold" aria-pressed="false" title="' + esc(t.holdTitle) + '"><span class="pk-led" aria-hidden="true"></span>' + esc(t.hold) + '</button>' +
        '<button type="button" id="pk-panic" class="pk-btn">' + esc(t.panic) + '</button>' +
      '</div>' +
      '<p id="pk-readout" class="pk-readout is-idle" aria-live="polite"></p>' +
      '<div class="pk-keyboard-wrap"><div id="pk-keyboard" aria-label="' + esc(t.keyboard) + '"></div></div>' +
      '<div class="pk-subbar">' +
        '<p class="pk-hint pk-keys-hint">' + esc(t.keysHint) + '</p>' +
        '<div class="pk-midi"><button type="button" id="pk-midi" class="pk-btn">' + esc(t.midi) + '</button><span id="pk-midi-status" class="pk-muted" aria-live="polite"></span></div>' +
      '</div>' +

      '<details class="pk-panel" open>' +
        '<summary>' + esc(t.sound) + '</summary>' +
        '<div class="pk-controls">' +
          '<label class="pk-control pk-control-preset" for="pk-preset"><span class="pk-control-head"><span>' + esc(t.preset) + '</span></span><select id="pk-preset">' + presetOptions + '</select></label>' +
          '<label class="pk-control" for="pk-wave"><span class="pk-control-head"><span>' + esc(t.waveform) + '</span></span><select id="pk-wave">' + waveOptions + '</select></label>' +
          '<label class="pk-control" for="pk-transpose"><span class="pk-control-head"><span>' + esc(t.transpose) + '</span></span><select id="pk-transpose">' + transposeOptions + '</select></label>' +
          sliders +
        '</div>' +
      '</details>' +

      '<details class="pk-panel" open>' +
        '<summary>' + esc(t.sequencer) + '</summary>' +
        '<div class="pk-seq-controls">' +
          '<button type="button" id="pk-play" class="pk-btn pk-play" aria-pressed="false">' + esc(t.play) + '</button>' +
          '<button type="button" id="pk-record" class="pk-btn pk-toggle pk-record" aria-pressed="false">● ' + esc(t.record) + '</button>' +
          '<label class="pk-field"><span>' + esc(t.tempo) + '</span><input type="number" id="pk-tempo" min="40" max="220" step="1" inputmode="numeric"></label>' +
          '<label class="pk-field"><span>' + esc(t.steps) + '</span><select id="pk-length">' + option(8, '8') + option(16, '16', true) + '</select></label>' +
          '<label class="pk-field"><span>' + esc(t.gate) + '</span><select id="pk-gate">' + gateOptions + '</select></label>' +
        '</div>' +
        '<div id="pk-steps" class="pk-steps" role="group" aria-label="' + esc(t.sequencer) + '"></div>' +
        '<div class="pk-step-detail">' +
          '<strong id="pk-step-title"></strong>' +
          '<div id="pk-step-notes" class="pk-step-notes"></div>' +
          '<div class="pk-step-actions">' +
            '<button type="button" id="pk-clear-step" class="pk-btn">' + esc(t.clearStep) + '</button>' +
            '<button type="button" id="pk-clear-all" class="pk-btn">' + esc(t.clearAll) + '</button>' +
          '</div>' +
        '</div>' +
        '<p class="pk-hint">' + esc(t.seqHint) + '</p>' +
      '</details>';
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window);
