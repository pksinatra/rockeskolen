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
      sustainTitle: 'Notes ring out naturally after you let go, like the sustain pedal on a piano.',
      hold: 'Hold',
      holdTitle: 'Every note keeps sounding after you let go, so you can build a chord one note at a time. Press a held key again to turn it off. Click Hold again or All notes off to release everything.',
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
      sequencer: 'Piano roll',
      play: 'Play',
      stop: 'Stop',
      loop: 'Loop',
      record: 'Record',
      bpm: 'BPM',
      bars: 'Bars',
      grid: 'Grid',
      grids: { 1: '1/4', 0.5: '1/8', 0.25: '1/16', 0.125: '1/32' },
      snap: 'Snap to grid',
      undo: 'Undo',
      redo: 'Redo',
      quantize: 'Quantize',
      clear: 'Clear',
      exportMidi: 'Export MIDI',
      noteCount: n => n + (n === 1 ? ' note' : ' notes'),
      rollLabel: 'Piano roll grid. Rows are pitches, columns are time.',
      rollHint: 'Click an empty cell to add a note and drag to set its length. Click a note to remove it, drag it to move it, or drag its right edge to change its length. On a touch screen, tap to add or remove, drag a note to move it and drag empty space to scroll. With Record on, play the keyboard or a MIDI keyboard: while playing, notes are recorded in time; when stopped, each note or chord goes in at the blue marker, which then moves one grid step. Space plays and stops; Ctrl/⌘+Z undoes. Your pattern is saved in this browser.',
      midiFile: 'piano-idea.mid'
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
      sustainTitle: 'Tonene klinger naturlig ut når du slipper, som med sustainpedalen på et piano.',
      hold: 'Hold',
      holdTitle: 'Hver tone klinger videre når du slipper, så du kan bygge en akkord tone for tone. Trykk på en holdt tangent igjen for å slå den av. Klikk på Hold igjen eller Stopp alle toner for å slippe alt.',
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
      sequencer: 'Pianorull',
      play: 'Spill',
      stop: 'Stopp',
      loop: 'Loop',
      record: 'Ta opp',
      bpm: 'BPM',
      bars: 'Takter',
      grid: 'Rutenett',
      grids: { 1: '1/4', 0.5: '1/8', 0.25: '1/16', 0.125: '1/32' },
      snap: 'Fest til rutenett',
      undo: 'Angre',
      redo: 'Gjør om',
      quantize: 'Kvantiser',
      clear: 'Tøm',
      exportMidi: 'Eksporter MIDI',
      noteCount: n => n + (n === 1 ? ' note' : ' noter'),
      rollLabel: 'Pianorull. Radene er tonehøyder, kolonnene er tid.',
      rollHint: 'Klikk i en tom rute for å legge inn en note, og dra for å velge lengden. Klikk på en note for å fjerne den, dra den for å flytte den, eller dra i høyre kant for å endre lengden. På berøringsskjerm trykker du for å legge til eller fjerne, drar en note for å flytte den og drar i tom flate for å rulle. Med Ta opp på kan du spille på klaviaturet eller et MIDI-klaviatur: under avspilling tas notene opp i takt; når avspillingen står, settes hver tone eller akkord inn ved den blå markøren, som så flytter seg ett rutesteg. Mellomrom spiller og stopper; Ctrl/⌘+Z angrer. Mønsteret lagres i denne nettleseren.',
      midiFile: 'piano-ide.mid'
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
        sequencer.recordNoteOn(midi, velocity);
        roll.setLive(keyboard.heldNotes());
        updateReadout();
      },
      onNoteOff(midi) {
        engine.noteOff(midi);
        sequencer.recordNoteOff(midi, keyboard.heldNotes().length === 0);
        roll.setLive(keyboard.heldNotes());
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
      roll.draw();
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

    // ---------- Piano-roll og transport ----------

    let roll = null;
    const sequencer = global.CLPianoSequencer.create({
      engine: engine,
      onChange: () => { if (roll) roll.draw(); renderTransport(); },
      onTransport: () => { if (roll) roll.transportChanged(); renderTransport(); }
    });
    roll = global.CLPianoRoll.create($('pr-roll'), {
      sequencer: sequencer,
      label: t.rollLabel,
      noteName: m => keyboard.noteName(m),
      onPreview: midi => {
        engine.start();
        engine.playStep([{ midi: midi, vel: 0.75 }], () => 0.3, Tone.now());
      }
    });

    function renderTransport() {
      const st = sequencer.getState();
      const playBtn = $('pr-play');
      playBtn.setAttribute('aria-pressed', String(st.playing));
      $('pr-loop').setAttribute('aria-pressed', String(st.loop));
      $('pr-record').setAttribute('aria-pressed', String(st.recording));
      $('pr-snap').setAttribute('aria-pressed', String(st.snap));
      if (document.activeElement !== $('pr-bpm')) $('pr-bpm').value = String(st.bpm);
      $('pr-bars').value = String(st.bars);
      $('pr-grid').value = String(st.grid);
      $('pr-undo').disabled = !st.canUndo;
      $('pr-redo').disabled = !st.canRedo;
      $('pr-quantize').disabled = !st.count;
      $('pr-clear').disabled = !st.count;
      $('pr-export').disabled = !st.count;
      $('pr-count').textContent = t.noteCount(st.count);
    }

    function togglePlay() {
      if (sequencer.getState().playing) sequencer.stop();
      else sequencer.play();
    }

    $('pr-play').addEventListener('click', () => sequencer.play());
    $('pr-stop').addEventListener('click', () => sequencer.stop());
    $('pr-loop').addEventListener('click', () => sequencer.setLoop(!sequencer.getState().loop));
    $('pr-record').addEventListener('click', () => {
      engine.start();
      sequencer.setRecording(!sequencer.getState().recording);
    });
    $('pr-snap').addEventListener('click', () => sequencer.setSnap(!sequencer.getState().snap));
    $('pr-bpm').addEventListener('change', e => { e.target.value = String(sequencer.setBpm(e.target.value)); });
    $('pr-bpm-down').addEventListener('click', () => sequencer.setBpm(sequencer.getState().bpm - 1));
    $('pr-bpm-up').addEventListener('click', () => sequencer.setBpm(sequencer.getState().bpm + 1));
    $('pr-bars').addEventListener('change', e => sequencer.setBars(Number(e.target.value)));
    $('pr-grid').addEventListener('change', e => sequencer.setGrid(Number(e.target.value)));
    $('pr-undo').addEventListener('click', () => sequencer.undo());
    $('pr-redo').addEventListener('click', () => sequencer.redo());
    $('pr-quantize').addEventListener('click', () => sequencer.quantizeAll());
    $('pr-clear').addEventListener('click', () => sequencer.clear());
    $('pr-export').addEventListener('click', () => {
      const blob = new Blob([sequencer.exportMidi()], { type: 'audio/midi' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = t.midiFile;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });

    // Mellomrom spiller/stopper, Ctrl/⌘+Z angrer, Ctrl/⌘+Shift+Z eller Ctrl+Y gjør om
    document.addEventListener('keydown', e => {
      const target = e.target;
      if (target && target.closest && target.closest('input, select, textarea, [contenteditable="true"]')) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && !e.altKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) sequencer.redo();
        else sequencer.undo();
      } else if (mod && !e.altKey && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        sequencer.redo();
      } else if (e.code === 'Space' && !mod && !e.repeat) {
        if (target && target.closest && target.closest('button, .pk-key, summary, a')) return;
        e.preventDefault();
        engine.start();
        togglePlay();
      }
    });

    // Lås opp lyden ved første berøring, uansett hvor på siden
    const unlock = () => {
      engine.start();
      document.removeEventListener('pointerdown', unlock, true);
      document.removeEventListener('keydown', unlock, true);
    };
    document.addEventListener('pointerdown', unlock, true);
    document.addEventListener('keydown', unlock, true);

    renderTransport();
    updateReadout();
  }

  function buildMarkup(t) {
    const option = (value, label, selected) =>
      '<option value="' + esc(value) + '"' + (selected ? ' selected' : '') + '>' + esc(label) + '</option>';

    const presetOptions = Object.keys(t.presets).map((k, i) => option(k, t.presets[k], i === 0)).join('') + option('custom', t.custom);
    const waveOptions = Object.keys(t.waves).map(k => option(k, t.waves[k], k === 'triangle')).join('');
    const transposeOptions = [-24, -12, 0, 12, 24].map(n => option(n, n === 0 ? '0' : t.oct(n / 12), n === 0)).join('');
    const barOptions = global.CLPianoSequencer.BAR_OPTIONS.map(n => option(n, String(n), n === 2)).join('');
    const gridOptions = global.CLPianoSequencer.GRID_OPTIONS.map(g => option(g, t.grids[g], g === 0.25)).join('');
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
        '<button type="button" id="pk-sustain" class="pk-btn pk-toggle" aria-pressed="false" title="' + esc(t.sustainTitle) + '">' + esc(t.sustainPedal) + '</button>' +
        '<button type="button" id="pk-hold" class="pk-btn pk-toggle pk-hold" aria-pressed="false" title="' + esc(t.holdTitle) + '"><span class="pk-led" aria-hidden="true"></span>' + esc(t.hold) + '</button>' +
        '<button type="button" id="pk-panic" class="pk-btn">' + esc(t.panic) + '</button>' +
      '</div>' +
      '<p id="pk-readout" class="pk-readout is-idle" aria-live="polite"></p>' +
      '<div class="pk-keyboard-wrap"><div id="pk-keyboard" aria-label="' + esc(t.keyboard) + '"></div></div>' +
      '<div class="pk-subbar">' +
        '<p class="pk-hint pk-keys-hint">' + esc(t.keysHint) + '</p>' +
        '<div class="pk-midi"><button type="button" id="pk-midi" class="pk-btn">' + esc(t.midi) + '</button><span id="pk-midi-status" class="pk-muted" aria-live="polite"></span></div>' +
      '</div>' +

      '<details class="pk-panel pr-panel" open>' +
        '<summary>' + esc(t.sequencer) + '</summary>' +
        '<div class="pr-transport">' +
          '<div class="pr-group">' +
            '<button type="button" id="pr-play" class="pk-btn pk-play" aria-pressed="false">▶ ' + esc(t.play) + '</button>' +
            '<button type="button" id="pr-stop" class="pk-btn">■ ' + esc(t.stop) + '</button>' +
            '<button type="button" id="pr-loop" class="pk-btn pk-toggle" aria-pressed="true">⟲ ' + esc(t.loop) + '</button>' +
            '<button type="button" id="pr-record" class="pk-btn pk-toggle pk-record" aria-pressed="false">● ' + esc(t.record) + '</button>' +
          '</div>' +
          '<div class="pr-group pr-bpm">' +
            '<button type="button" id="pr-bpm-down" class="pk-btn pk-icon" aria-label="' + esc(t.bpm) + ' −1">−</button>' +
            '<label class="pk-field"><span>' + esc(t.bpm) + '</span><input type="number" id="pr-bpm" min="40" max="240" step="1" inputmode="numeric"></label>' +
            '<button type="button" id="pr-bpm-up" class="pk-btn pk-icon" aria-label="' + esc(t.bpm) + ' +1">+</button>' +
          '</div>' +
          '<div class="pr-group">' +
            '<label class="pk-field"><span>' + esc(t.bars) + '</span><select id="pr-bars">' + barOptions + '</select></label>' +
            '<label class="pk-field"><span>' + esc(t.grid) + '</span><select id="pr-grid">' + gridOptions + '</select></label>' +
            '<button type="button" id="pr-snap" class="pk-btn pk-toggle" aria-pressed="true">' + esc(t.snap) + '</button>' +
          '</div>' +
          '<div class="pr-group">' +
            '<button type="button" id="pr-undo" class="pk-btn pk-icon" aria-label="' + esc(t.undo) + '" title="' + esc(t.undo) + '">↶</button>' +
            '<button type="button" id="pr-redo" class="pk-btn pk-icon" aria-label="' + esc(t.redo) + '" title="' + esc(t.redo) + '">↷</button>' +
            '<button type="button" id="pr-quantize" class="pk-btn">' + esc(t.quantize) + '</button>' +
            '<button type="button" id="pr-clear" class="pk-btn">' + esc(t.clear) + '</button>' +
            '<button type="button" id="pr-export" class="pk-btn">' + esc(t.exportMidi) + '</button>' +
          '</div>' +
        '</div>' +
        '<div id="pr-roll"></div>' +
        '<div class="pr-foot"><span id="pr-count" class="pk-muted" aria-live="polite"></span></div>' +
        '<p class="pk-hint">' + esc(t.rollHint) + '</p>' +
      '</details>' +

      '<details class="pk-panel" open>' +
        '<summary>' + esc(t.sound) + '</summary>' +
        '<div class="pk-controls">' +
          '<label class="pk-control pk-control-preset" for="pk-preset"><span class="pk-control-head"><span>' + esc(t.preset) + '</span></span><select id="pk-preset">' + presetOptions + '</select></label>' +
          '<label class="pk-control" for="pk-wave"><span class="pk-control-head"><span>' + esc(t.waveform) + '</span></span><select id="pk-wave">' + waveOptions + '</select></label>' +
          '<label class="pk-control" for="pk-transpose"><span class="pk-control-head"><span>' + esc(t.transpose) + '</span></span><select id="pk-transpose">' + transposeOptions + '</select></label>' +
          sliders +
        '</div>' +
      '</details>';
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window);
