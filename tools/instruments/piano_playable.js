// assets/js/piano_playable.js
(function () {
  // ---------- KONFIG ----------

  // 4 hele oktaver: C3 (48) til B6 (95)
  const START_MIDI = 48;  // C3
  const END_MIDI   = 96;  // C7 (ekstra topp-C)

  const WHITE_WIDTH = 30; // px
  const BLACK_WIDTH = 20; // px;

  const PIANO_KEYS = [];
  for (let midi = START_MIDI; midi <= END_MIDI; midi++) {
    const noteNames = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
    const name = noteNames[midi % 12];
    const octave = Math.floor(midi / 12) - 1;
    PIANO_KEYS.push({
      midi,
      note: name + octave,
      isBlack: name.indexOf('#') !== -1
    });
  }

  let synth;
  let transpose = 0;

  // FX-noder
  let filterNode;
  let reverbNode;
  let delayNode;
  let driveNode;

  const STEPS = 8;
let recordingActive = false;   // begynner som false
  // Hvert step er et objekt: { [midi]: { length: '16n' | '8n' | '32n' | 'tie' } }
  let sequence = Array.from({ length: STEPS }, () => ({}));
  let playing = false;
  let currentStep = 0;

  // Global gate-innstilling for nye noter
  let currentGate = '16n';

  // ---------- INIT ----------

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    setupAudio();
    renderPiano();
    setupToneControls();
    setupSequencer();
  }

  // ---------- AUDIO ----------

  function setupAudio() {
    Tone.context.lookAhead = 0.03;

    const limiter = new Tone.Limiter(-6).toDestination();

    reverbNode = new Tone.Reverb({
      decay: 2.5,
      preDelay: 0.02,
      wet: 0.15
    }).connect(limiter);

    delayNode = new Tone.FeedbackDelay({
      delayTime: "8n",
      feedback: 0.25,
      wet: 0.10
    }).connect(reverbNode);

    filterNode = new Tone.Filter({
      type: "lowpass",
      frequency: 18000,
      rolloff: -12
    }).connect(delayNode);

    driveNode = new Tone.Distortion({
      distortion: 0.10,
      oversample: "4x"
    }).connect(filterNode);

    synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: {
        attack: 0.03,
        decay: 0.2,
        sustain: 0.3,
        release: 0.15
      }
    }).connect(driveNode);

    synth.volume.value = -12;
  }

  function midiToNote(midi) {
    const notes = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
    const note = notes[midi % 12];
    const octave = Math.floor(midi / 12) - 1;
    return note + octave;
  }

  function noteOn(midi) {
    const tMidi = midi + transpose;
    synth.triggerAttack(midiToNote(tMidi));
  }

  function noteOff(midi) {
    const tMidi = midi + transpose;
    synth.triggerRelease(midiToNote(tMidi));
  }

  function triggerStepNotes(notes, time) {
    notes.forEach(note => {
      const midi = note.midi;
      const gate = note.length || '16n';

      let dur;
      switch (gate) {
        case '32n':
          dur = '32n';
          break;
        case '8n':
          dur = '8n';
          break;
        case 'tie':
          dur = '8n';
          break;
        case '16n':
        default:
          dur = '16n';
          break;
      }

      const tMidi = midi + transpose;
      synth.triggerAttackRelease(midiToNote(tMidi), dur, time);
    });
  }

  // ---------- PIANO UI ----------

  function renderPiano() {
    const container = document.getElementById('piano');
    if (!container) return;

    container.innerHTML = '';

    const whiteKeys = PIANO_KEYS.filter(k => !k.isBlack);
    const whiteCount = whiteKeys.length;

    container.style.position = 'relative';
    container.style.width = (whiteCount * WHITE_WIDTH) + 'px';

    let whiteIndex = 0;

    PIANO_KEYS.forEach(k => {
      const el = document.createElement('div');
      el.classList.add('piano-key');
      el.dataset.midi = k.midi;
      el.dataset.note = k.note;

      if (!k.isBlack) {
        el.classList.add('white');
        el.style.left = (whiteIndex * WHITE_WIDTH) + 'px';
        whiteIndex++;
      } else {
        el.classList.add('black');
        el.style.left = (whiteIndex * WHITE_WIDTH - BLACK_WIDTH / 2) + 'px';
      }

      container.appendChild(el);
    });

    container.addEventListener('mousedown', onKeyDown);
    container.addEventListener('mouseup', onKeyUp);
    container.addEventListener('mouseleave', onKeyUp);
    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchend', onTouchEnd);
  }

  function onKeyDown(e) {
    const key = e.target.closest('.piano-key');
    if (!key) return;
    const midi = parseInt(key.dataset.midi, 10);
    key.classList.add('active');
    noteOn(midi);
    addNoteToSelectedStep(midi);
  }

  function onKeyUp() {
    document.querySelectorAll('.piano-key.active').forEach(el => {
      el.classList.remove('active');
      const midi = parseInt(el.dataset.midi, 10);
      noteOff(midi);
    });
  }

  function onTouchStart(e) {
    e.preventDefault();
    const touch = e.changedTouches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!el) return;
    const key = el.closest('.piano-key');
    if (!key) return;
    const midi = parseInt(key.dataset.midi, 10);
    key.classList.add('active');
    noteOn(midi);
    addNoteToSelectedStep(midi);
  }

  function onTouchEnd() {
    onKeyUp();
  }

  // ---------- TONE-KONTROLLER ----------

  function setupToneControls() {
    const waveSel = document.getElementById('waveform');
    const vol = document.getElementById('volume');
    const atk = document.getElementById('attack');
    const dec = document.getElementById('decay');
    const rel = document.getElementById('release');
    const tr = document.getElementById('transpose');
    const gateSel = document.getElementById('gate-length');

    const cutoff = document.getElementById('filter-cutoff');
    const revMix = document.getElementById('reverb-mix');
    const drive = document.getElementById('drive');
    const delayMix = document.getElementById('delay-mix');

    if (waveSel) waveSel.addEventListener('change', e => {
      synth.set({ oscillator: { type: e.target.value } });
    });

    if (vol) vol.addEventListener('input', e => {
      synth.volume.value = parseFloat(e.target.value);
    });

    if (atk) atk.addEventListener('input', e => {
      const env = synth.get().envelope;
      synth.set({
        envelope: Object.assign({}, env, { attack: parseFloat(e.target.value) })
      });
    });

    if (dec) dec.addEventListener('input', e => {
      const env = synth.get().envelope;
      synth.set({
        envelope: Object.assign({}, env, { decay: parseFloat(e.target.value) })
      });
    });

    if (rel) rel.addEventListener('input', e => {
      const env = synth.get().envelope;
      synth.set({
        envelope: Object.assign({}, env, { release: parseFloat(e.target.value) })
      });
    });

    if (tr) tr.addEventListener('change', e => {
      transpose = parseInt(e.target.value, 10) || 0;
    });

    if (gateSel) {
      currentGate = gateSel.value || '16n';
      gateSel.addEventListener('change', e => {
        currentGate = e.target.value || '16n';
      });
    }

    if (cutoff && filterNode) {
      cutoff.addEventListener('input', e => {
        const hz = parseFloat(e.target.value);
        filterNode.frequency.value = hz;
      });
    }

    if (revMix && reverbNode) {
      revMix.addEventListener('input', e => {
        const wet = parseFloat(e.target.value);
        reverbNode.wet.value = wet;
      });
    }

    if (drive && driveNode) {
      drive.addEventListener('input', e => {
        const amt = parseFloat(e.target.value);
        driveNode.distortion = amt;
      });
    }

    if (delayMix && delayNode) {
      delayMix.addEventListener('input', e => {
        const wet = parseFloat(e.target.value);
        delayNode.wet.value = wet;
      });
    }
  }

  // ---------- SEQUENCER ----------

  function setupSequencer() {
    const grid = document.getElementById('seq-grid');
    const tempoInput = document.getElementById('tempo');
    const btnPlay = document.getElementById('seq-play');
    const btnStop = document.getElementById('seq-stop');
    const btnClear = document.getElementById('seq-clear');

    if (!grid) return;

    grid.classList.add('seq-steps');
    for (let i = 0; i < STEPS; i++) {
      const stepEl = document.createElement('div');
      stepEl.className = 'seq-step';
      stepEl.dataset.step = i;
      stepEl.textContent = i + 1;
      stepEl.addEventListener('click', () => selectStep(i));
      grid.appendChild(stepEl);
    }
    selectStep(0);

    if (tempoInput) {
      Tone.Transport.bpm.value = parseInt(tempoInput.value, 10) || 100;
      tempoInput.addEventListener('change', function () {
        Tone.Transport.bpm.value = parseInt(this.value, 10) || 100;
      });
    }

    Tone.Transport.scheduleRepeat(time => {
      if (!playing) return;
      playCurrentStep(time);
      currentStep = (currentStep + 1) % STEPS;
      highlightCurrentStep();
    }, '16n');

    if (btnPlay) btnPlay.addEventListener('click', startSequencer);
    if (btnStop) btnStop.addEventListener('click', stopSequencer);
    if (btnClear) btnClear.addEventListener('click', clearSequence);
  }

  function getSelectedStep() {
    const el = document.querySelector('.seq-step.selected');
    return el ? parseInt(el.dataset.step, 10) : 0;
  }

  function selectStep(i) {
    document.querySelectorAll('.seq-step.selected').forEach(el => el.classList.remove('selected'));
    const stepEl = document.querySelector('.seq-step[data-step="' + i + '"]');
    if (stepEl) stepEl.classList.add('selected');
  }

function addNoteToSelectedStep(midi) {
  // Ikke ta opp noter i sequencer før vi har trykket Play minst én gang
  if (!recordingActive) return;

  const stepIndex = getSelectedStep();
  const step = sequence[stepIndex];

  step[midi] = { length: currentGate };

  updateStepUI(stepIndex);
}

  function updateStepUI(i) {
    const el = document.querySelector('.seq-step[data-step="' + i + '"]');
    if (!el) return;
    const step = sequence[i];
    const count = Object.keys(step).length;
    el.dataset.count = count;
    el.classList.toggle('has-notes', count > 0);
  }

  function clearSequence() {
    sequence = Array.from({ length: STEPS }, () => ({}));
    for (let i = 0; i < STEPS; i++) updateStepUI(i);
  }

function startSequencer() {
  if (playing) return;
  playing = true;
  recordingActive = true;   // fra nå av tar vi opp innspilte noter i steps
  currentStep = 0;
  highlightCurrentStep();
  Tone.start().then(() => {
    Tone.Transport.start();
  });
}


  function stopSequencer() {
    playing = false;
    Tone.Transport.stop();
    clearHighlight();
  }

  function playCurrentStep(time) {
    const step = sequence[currentStep];

    const notes = Object.keys(step).map(midiStr => {
      return {
        midi: parseInt(midiStr, 10),
        length: step[midiStr].length || '16n'
      };
    });

    if (notes.length > 0) {
      triggerStepNotes(notes, time);
    }
  }

  function highlightCurrentStep() {
    clearHighlight();
    const el = document.querySelector('.seq-step[data-step="' + currentStep + '"]');
    if (el) el.classList.add('current');
  }

  function clearHighlight() {
    document.querySelectorAll('.seq-step.current').forEach(el => el.classList.remove('current'));
  }
})();
