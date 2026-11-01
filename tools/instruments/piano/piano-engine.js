// tools/instruments/piano/piano-engine.js
// Lydmotor for Playable Piano. Filen deles mellom ChordLink og Rockeskolen – hold kopiene like.
(function (global) {
  'use strict';

  const PRESETS = {
    warm:     { wave: 'triangle', volume: -11, attack: 0.01, decay: 0.75, sustain: 0.22, release: 1.1,  cutoff: 3500, reverb: 0.18, drive: 0.02, delay: 0.03 },
    soft:     { wave: 'sine',     volume: -10, attack: 0.03, decay: 0.9,  sustain: 0.30, release: 1.4,  cutoff: 2700, reverb: 0.22, drive: 0.00, delay: 0.02 },
    electric: { wave: 'triangle', volume: -12, attack: 0.01, decay: 0.48, sustain: 0.38, release: 0.9,  cutoff: 5200, reverb: 0.20, drive: 0.08, delay: 0.12 },
    organ:    { wave: 'square',   volume: -15, attack: 0.02, decay: 0.12, sustain: 0.82, release: 0.35, cutoff: 4200, reverb: 0.14, drive: 0.03, delay: 0.00 },
    bright:   { wave: 'sawtooth', volume: -16, attack: 0.01, decay: 0.32, sustain: 0.26, release: 0.55, cutoff: 7600, reverb: 0.12, drive: 0.05, delay: 0.06 },
    pad:      { wave: 'sawtooth', volume: -17, attack: 0.42, decay: 0.65, sustain: 0.62, release: 1.8,  cutoff: 2200, reverb: 0.38, drive: 0.01, delay: 0.18 }
  };

  const LIVE_VOICES = 24;
  const SEQ_VOICES = 16;

  function midiToNote(midi) {
    return Tone.Frequency(midi, 'midi').toNote();
  }

  function create() {
    const params = Object.assign({}, PRESETS.warm);
    const held = new Map();      // tangent (midi) -> tonen som faktisk klinger
    const sustained = new Map(); // tangenter som er sluppet mens sustain er på
    let sustainOn = false;
    let transpose = 0;

    Tone.context.lookAhead = 0.03;

    // Signalvei: synth -> vreng -> filter -> tørt signal + parallelle sends til delay og romklang -> limiter
    const limiter = new Tone.Limiter(-3).toDestination();
    const reverb = new Tone.Reverb({ decay: 2.5, preDelay: 0.02, wet: 1 }).connect(limiter);
    const delay = new Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.25, wet: 1 }).connect(limiter);
    delay.connect(new Tone.Gain(0.3).connect(reverb));
    const reverbSend = new Tone.Gain(params.reverb).connect(reverb);
    const delaySend = new Tone.Gain(params.delay).connect(delay);
    const filter = new Tone.Filter({ type: 'lowpass', frequency: params.cutoff, rolloff: -12 });
    filter.connect(limiter);
    filter.connect(reverbSend);
    filter.connect(delaySend);
    const drive = new Tone.Distortion({ distortion: params.drive, oversample: '2x' }).connect(filter);

    function makeSynth(voices) {
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: params.wave },
        envelope: { attack: params.attack, decay: params.decay, sustain: params.sustain, release: params.release }
      }).connect(drive);
      synth.maxPolyphony = voices;
      synth.volume.value = params.volume;
      return synth;
    }

    // Egen synth for sequenceren, så den ikke stjeler eller slipper stemmer fra det du spiller selv
    const live = makeSynth(LIVE_VOICES);
    const seq = makeSynth(SEQ_VOICES);
    const synths = [live, seq];

    function applyDrive(amount) {
      drive.distortion = amount;
      // Helt tørt ved 0, ellers gradvis inn – unngår at vrengen farger lyden når den er av
      drive.wet.value = Math.min(1, amount / 0.1);
    }
    applyDrive(params.drive);

    function start() {
      if (Tone.context.state === 'running') return Promise.resolve();
      return Tone.start();
    }

    function setParams(next) {
      const env = {};
      Object.keys(next).forEach(key => {
        const value = next[key];
        if (!(key in params)) return;
        params[key] = value;
        switch (key) {
          case 'wave':
            synths.forEach(s => s.set({ oscillator: { type: value } }));
            break;
          case 'volume':
            synths.forEach(s => { s.volume.value = value; });
            break;
          case 'attack':
          case 'decay':
          case 'sustain':
          case 'release':
            env[key] = value;
            break;
          case 'cutoff':
            filter.frequency.rampTo(value, 0.05);
            break;
          case 'reverb':
            reverbSend.gain.rampTo(value, 0.05);
            break;
          case 'delay':
            delaySend.gain.rampTo(value, 0.05);
            break;
          case 'drive':
            applyDrive(value);
            break;
        }
      });
      if (Object.keys(env).length) synths.forEach(s => s.set({ envelope: env }));
    }

    function applyPreset(name) {
      const preset = PRESETS[name];
      if (!preset) return null;
      panic();
      setParams(preset);
      return Object.assign({}, params);
    }

    function noteOn(midi, velocity) {
      start();
      if (held.has(midi)) live.triggerRelease(held.get(midi), Tone.now());
      if (sustained.has(midi)) {
        live.triggerRelease(sustained.get(midi), Tone.now());
        sustained.delete(midi);
      }
      const note = midiToNote(midi + transpose);
      live.triggerAttack(note, Tone.now(), velocity == null ? 0.9 : velocity);
      held.set(midi, note);
    }

    function noteOff(midi) {
      const note = held.get(midi);
      if (!note) return;
      held.delete(midi);
      if (sustainOn) {
        sustained.set(midi, note);
        return;
      }
      live.triggerRelease(note, Tone.now());
    }

    function setSustain(on) {
      sustainOn = !!on;
      if (sustainOn) return;
      sustained.forEach(note => live.triggerRelease(note, Tone.now()));
      sustained.clear();
    }

    // notes: [{ midi, vel }], duration i sekunder, time fra Transport
    function playStep(notes, durationFor, time) {
      notes.forEach(n => {
        seq.triggerAttackRelease(midiToNote(n.midi + transpose), durationFor(n), time, n.vel == null ? 0.9 : n.vel);
      });
    }

    function panic() {
      synths.forEach(s => s.releaseAll());
      held.clear();
      sustained.clear();
    }

    return {
      start,
      noteOn,
      noteOff,
      setSustain,
      playStep,
      panic,
      setParams,
      applyPreset,
      getParams: () => Object.assign({}, params),
      setTranspose: n => { transpose = parseInt(n, 10) || 0; },
      getTranspose: () => transpose
    };
  }

  global.CLPianoEngine = { create, PRESETS };
})(window);
