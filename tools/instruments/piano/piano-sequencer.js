// tools/instruments/piano/piano-sequencer.js
// Stegsequencer for Playable Piano. Timing via Tone.Transport (lookahead mot AudioContext-tiden),
// visuell oppdatering via Tone.Draw. Filen deles mellom ChordLink og Rockeskolen – hold kopiene like.
(function (global) {
  'use strict';

  const MAX_STEPS = 16;
  const MAX_NOTES_PER_STEP = 8;
  const GATES = { '32n': 0.5, '16n': 1, '8n': 2, '4n': 4, tie: null };
  const STORAGE_KEY = 'cl-piano-sequence-v1';

  function emptySteps() {
    return Array.from({ length: MAX_STEPS }, () => []);
  }

  function create(options) {
    const opts = Object.assign({
      engine: null,
      onStep: function () {},   // (index | -1) – steget som høres nå
      onChange: function () {}  // data eller tilstand er endret
    }, options || {});

    const engine = opts.engine;
    // steps[i] = [{ midi, vel, gate }]; midi lagres utransponert, transponering skjer ved avspilling
    let steps = emptySteps();
    let length = 16;
    let tempo = 100;
    let selected = 0;
    let recording = false;
    let playing = false;
    let counter = 0;

    load();
    Tone.Transport.bpm.value = tempo;

    function save() {
      try {
        const data = {
          v: 1,
          length: length,
          tempo: tempo,
          steps: steps.map(step => step.map(n => [n.midi, Math.round(n.vel * 100) / 100, n.gate]))
        };
        global.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (err) { /* lagring er en bonus, ikke et krav */ }
    }

    function load() {
      let data = null;
      try { data = JSON.parse(global.localStorage.getItem(STORAGE_KEY) || 'null'); } catch (err) { data = null; }
      if (!data || data.v !== 1 || !Array.isArray(data.steps)) return;
      length = data.length === 8 ? 8 : 16;
      tempo = clampTempo(data.tempo);
      steps = emptySteps();
      data.steps.slice(0, MAX_STEPS).forEach((step, i) => {
        if (!Array.isArray(step)) return;
        steps[i] = step.slice(0, MAX_NOTES_PER_STEP)
          .filter(n => Array.isArray(n) && Number.isInteger(n[0]) && n[0] >= 0 && n[0] <= 127)
          .map(n => ({ midi: n[0], vel: typeof n[1] === 'number' ? Math.max(0.1, Math.min(1, n[1])) : 0.9, gate: n[2] in GATES ? n[2] : '16n' }));
      });
    }

    function clampTempo(value) {
      const n = parseInt(value, 10);
      return Number.isFinite(n) ? Math.max(40, Math.min(220, n)) : 100;
    }

    function changed() {
      save();
      opts.onChange();
    }

    // Antall steg til neste steg med toner (for «Tie (hold)»), innenfor looplengden
    function stepsToNextNote(index) {
      for (let d = 1; d <= length; d++) {
        if (steps[(index + d) % length].length) return d;
      }
      return length;
    }

    Tone.Transport.scheduleRepeat(time => {
      if (!playing) return;
      const index = counter % length;
      counter++;
      const notes = steps[index];
      if (notes.length) {
        const sixteenth = Tone.Time('16n').toSeconds();
        engine.playStep(notes, n => {
          const factor = GATES[n.gate];
          // Bind holder tonen helt fram til neste steg som har toner, med et lite overlapp for legato
          return factor == null ? stepsToNextNote(index) * sixteenth + 0.02 : factor * sixteenth;
        }, time);
      }
      Tone.Draw.schedule(() => { if (playing) opts.onStep(index); }, time);
    }, '16n');

    function play() {
      if (playing) return;
      playing = true;
      counter = 0;
      // Tone.start() må kalles direkte i klikkhendelsen for at lyden skal låses opp på iOS
      engine.start().then(() => {
        if (!playing) return;
        Tone.Transport.stop();
        Tone.Transport.position = 0;
        Tone.Transport.start('+0.05');
      });
      opts.onChange();
    }

    function stop() {
      if (!playing) return;
      playing = false;
      Tone.Transport.stop();
      opts.onStep(-1);
      opts.onChange();
    }

    function addNote(midi, vel, gate) {
      if (!recording) return false;
      const step = steps[selected];
      const existing = step.find(n => n.midi === midi);
      if (existing) {
        existing.vel = vel;
        existing.gate = gate;
      } else {
        if (step.length >= MAX_NOTES_PER_STEP) return false;
        step.push({ midi: midi, vel: vel, gate: gate });
        step.sort((a, b) => a.midi - b.midi);
      }
      changed();
      return true;
    }

    return {
      play,
      stop,
      addNote,
      removeNote(index, midi) {
        steps[index] = steps[index].filter(n => n.midi !== midi);
        changed();
      },
      clearStep(index) {
        steps[index] = [];
        changed();
      },
      clearAll() {
        steps = emptySteps();
        changed();
      },
      select(index) {
        selected = Math.max(0, Math.min(length - 1, index));
        opts.onChange();
      },
      setRecording(flag) {
        recording = !!flag;
        opts.onChange();
      },
      setLength(n) {
        length = n === 8 ? 8 : 16;
        if (selected >= length) selected = 0;
        changed();
      },
      setTempo(value) {
        tempo = clampTempo(value);
        Tone.Transport.bpm.value = tempo;
        save();
        return tempo;
      },
      getStep: index => steps[index].slice(),
      getState: () => ({ length, tempo, selected, recording, playing })
    };
  }

  global.CLPianoSequencer = { create, GATES, MAX_STEPS };
})(window);
