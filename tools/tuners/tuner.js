(() => {
  const freqEl = document.getElementById('freq');
  const playBtn = document.getElementById('play');
  const stopBtn = document.getElementById('stop');

  let listenMicButtons = Array.from(document.querySelectorAll('#listenMic, .js-listen-mic, [data-action="listen-mic"]'));
  let stopMicButtons = Array.from(document.querySelectorAll('#stopMic, .js-stop-mic, [data-action="stop-mic"]'));

  // Fallback: create one compact mic group after the main Stop button if HTML has none.
  if (!listenMicButtons.length && stopBtn?.parentElement) {
    const micGroup = document.createElement('span');
    micGroup.className = 'mic-mini-controls';

    const listenMicBtn = document.createElement('button');
    listenMicBtn.id = 'listenMic';
    listenMicBtn.className = 'btn mic-btn mic-icon-btn js-listen-mic';
    listenMicBtn.type = 'button';
    listenMicBtn.title = 'Listen with microphone';
    listenMicBtn.setAttribute('aria-label', 'Listen with microphone');
    listenMicBtn.textContent = '🎤';

    const stopMicBtn = document.createElement('button');
    stopMicBtn.id = 'stopMic';
    stopMicBtn.className = 'btn mic-stop-btn js-stop-mic';
    stopMicBtn.type = 'button';
    stopMicBtn.title = 'Stop microphone';
    stopMicBtn.setAttribute('aria-label', 'Stop microphone');
    stopMicBtn.textContent = '■';

    micGroup.appendChild(listenMicBtn);
    micGroup.appendChild(stopMicBtn);
    stopBtn.insertAdjacentElement('afterend', micGroup);

    listenMicButtons = [listenMicBtn];
    stopMicButtons = [stopMicBtn];
  }

  listenMicButtons.forEach(btn => {
    btn.classList.add('mic-icon-btn');
    btn.title = 'Listen with microphone';
    btn.setAttribute('aria-label', 'Listen with microphone');
    btn.textContent = '🎤';
  });

  stopMicButtons.forEach(btn => {
    btn.classList.add('mic-stop-btn');
    btn.title = 'Stop microphone';
    btn.setAttribute('aria-label', 'Stop microphone');
    btn.textContent = '■';
  });

  function setMicButtonsActive(active){
    listenMicButtons.forEach(btn => btn.classList.toggle('active', active));
    stopMicButtons.forEach(btn => btn.classList.toggle('active', active));
  }

  const octDownBtn = document.getElementById('octDown');
  const octUpBtn = document.getElementById('octUp');
  const set440Btn = document.getElementById('set440');
  const hzText = document.getElementById('hzText');
  const noteText = document.getElementById('noteText');
  const statusText = document.getElementById('statusText');
  const sourceStatus = document.getElementById('sourceStatus');
  const modeTitle = document.getElementById('modeTitle');
  const modeSubtitle = document.getElementById('modeSubtitle');
  const forkWrap = document.getElementById('forkWrap');
  const instrumentName = document.getElementById('instrumentName');
  const stringButtons = document.getElementById('stringButtons');
  const tipBadge = document.getElementById('tipBadge');
  const tipText = document.getElementById('tipText');
  const tipBox = document.querySelector('.tip-card');
  const octaveStatus = document.getElementById('octaveStatus');
  const forkNotes = document.getElementById('forkNotes');
  const signalCanvas = document.getElementById('signalCanvas');
  const signalLabel = document.getElementById('signalLabel');
  const pitchCard = document.getElementById('pitchCard');
  const micStatus = document.getElementById('micStatus');
  const micHz = document.getElementById('micHz');
  const detectedNote = document.getElementById('detectedNote');
  const centsText = document.getElementById('centsText');
  const tuneNeedle = document.getElementById('tuneNeedle');

  const TUNINGS = {
    guitar: { label: 'Guitar', subtitle: 'Standard tuning · sampled or modeled steel string', type: 'guitar', folder: 'guitar', strings: [
      { name:'E', note:'E2', hz:82.41, sample:'samples/guitar/e2.mp3' },
      { name:'A', note:'A2', hz:110.00, sample:'samples/guitar/a2.mp3' },
      { name:'D', note:'D3', hz:146.83, sample:'samples/guitar/d3.mp3' },
      { name:'G', note:'G3', hz:196.00, sample:'samples/guitar/g3.mp3' },
      { name:'B', note:'B3', hz:246.94, sample:'samples/guitar/b3.mp3' },
      { name:'E', note:'E4', hz:329.63, sample:'samples/guitar/e4.mp3' }
    ]},
    bass: { label: 'Bass', subtitle: '4-string standard · sampled or modeled roundwound bass', type: 'bass', folder: 'bass', strings: [
      { name:'E', note:'E1', hz:41.20, sample:'samples/bass/e1.mp3' },
      { name:'A', note:'A1', hz:55.00, sample:'samples/bass/a1.mp3' },
      { name:'D', note:'D2', hz:73.42, sample:'samples/bass/d2.mp3' },
      { name:'G', note:'G2', hz:98.00, sample:'samples/bass/g2.mp3' }
    ]},
    ukulele: { label: 'Ukulele', subtitle: 'Standard re-entrant G-C-E-A · nylon model fallback', type: 'ukulele', folder: 'ukulele', strings: [
      { name:'G', note:'G4', hz:392.00, sample:'samples/ukulele/g4.mp3' },
      { name:'C', note:'C4', hz:261.63, sample:'samples/ukulele/c4.mp3' },
      { name:'E', note:'E4', hz:329.63, sample:'samples/ukulele/e4.mp3' },
      { name:'A', note:'A4', hz:440.00, sample:'samples/ukulele/a4.mp3' }
    ]},
    banjo: { label: 'Banjo', subtitle: '5-string standard/open G · bright pluck fallback', type: 'banjo', folder: 'banjo', strings: [
      { name:'g', note:'G4', hz:392.00, sample:'samples/banjo/g4.mp3' },
      { name:'D', note:'D3', hz:146.83, sample:'samples/banjo/d3.mp3' },
      { name:'G', note:'G3', hz:196.00, sample:'samples/banjo/g3.mp3' },
      { name:'B', note:'B3', hz:246.94, sample:'samples/banjo/b3.mp3' },
      { name:'D', note:'D4', hz:293.66, sample:'samples/banjo/d4.mp3' }
    ]},
    violin: { label: 'Violin', subtitle: 'G-D-A-E · bowed-string fallback', type: 'violin', folder: 'violin', strings: [
      { name:'G', note:'G3', hz:196.00, sample:'samples/violin/g3.mp3' },
      { name:'D', note:'D4', hz:293.66, sample:'samples/violin/d4.mp3' },
      { name:'A', note:'A4', hz:440.00, sample:'samples/violin/a4.mp3' },
      { name:'E', note:'E5', hz:659.25, sample:'samples/violin/e5.mp3' }
    ]},
    viola: { label: 'Viola', subtitle: 'C-G-D-A · warm bowed-string fallback', type: 'viola', folder: 'viola', strings: [
      { name:'C', note:'C3', hz:130.81, sample:'samples/viola/c3.mp3' },
      { name:'G', note:'G3', hz:196.00, sample:'samples/viola/g3.mp3' },
      { name:'D', note:'D4', hz:293.66, sample:'samples/viola/d4.mp3' },
      { name:'A', note:'A4', hz:440.00, sample:'samples/viola/a4.mp3' }
    ]},
    cello: { label: 'Cello', subtitle: 'C-G-D-A · rich bowed-string fallback', type: 'cello', folder: 'cello', strings: [
      { name:'C', note:'C2', hz:65.41, sample:'samples/cello/c2.mp3' },
      { name:'G', note:'G2', hz:98.00, sample:'samples/cello/g2.mp3' },
      { name:'D', note:'D3', hz:146.83, sample:'samples/cello/d3.mp3' },
      { name:'A', note:'A3', hz:220.00, sample:'samples/cello/a3.mp3' }
    ]}
  };

  const FORK_NOTES = [
    ['C','C4',261.63], ['C#','C#4',277.18], ['D','D4',293.66], ['D#','D#4',311.13],
    ['E','E4',329.63], ['F','F4',349.23], ['F#','F#4',369.99], ['G','G4',392.00],
    ['G#','G#4',415.30], ['A','A4',440.00], ['A#','A#4',466.16], ['B','B4',493.88], ['C','C5',523.25]
  ];

  const MIN_HZ = 27.5, MAX_HZ = 2093.0, MAX_OCT = 2;
  const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

  let mode = 'fork', octaveOffset = 0, selectedString = null, playbackMode = 'hold';
  let audioCtx = null, osc = null, gain = null, sampleAudio = null, isPlaying = false, loopTimer = null;
  let synthNodes = [];
  let lowFreqHintShown = false;
  let signalRaf = null, signalPhase = 0;

  let micStream = null, micSource = null, micAnalyser = null, micRaf = null;
  let pitchBuffer = null;
  let micListening = false;
  let stableFreq = null;

  function clampHz(v){ return Math.min(MAX_HZ, Math.max(MIN_HZ, Number(v) || 440)); }
  function getBaseHz(){ return clampHz(parseFloat(freqEl?.value)); }
  function getEffectiveHz(){ return clampHz(getBaseHz() * Math.pow(2, octaveOffset)); }
  function noteFromHz(hz){
    const midi = Math.round(12 * Math.log2(hz / 440) + 69);
    return { name:NOTE_NAMES[(midi + 1200) % 12], octave:Math.floor(midi / 12) - 1, midi };
  }
  function hzFromMidi(midi){ return 440 * Math.pow(2, (midi - 69) / 12); }
  function centsOff(freq, target){ return 1200 * Math.log2(freq / target); }
  function forkScaleFromHz(hz){ const t=(hz-MIN_HZ)/(MAX_HZ-MIN_HZ); return 0.82 + Math.pow(1-Math.min(1,Math.max(0,t)),.55)*.40; }

  function tipFor(freq, label){
    if (Math.abs(freq - 440) < .05) return { badge:'A4 – 440 Hz', text:'A4 (440 Hz) is the standard reference pitch. Tune by ear: listen for beating between your instrument and the tone, then adjust until it disappears.' };
    if (freq < 90) return { badge:`${label} – low reference`, text:'Low frequencies can be hard to hear on small speakers. Use + Octave for the same pitch class in a clearer register.' };
    return { badge:`${label} – ${freq.toFixed(2)} Hz`, text:'Tune by ear: as the pitch matches, beating between the reference and instrument slows down — then disappears.' };
  }

  function setFreq(hz){ if (freqEl) freqEl.value = clampHz(hz).toFixed(1); updateUI(); }
  function clearActiveStrings(){ document.querySelectorAll('.string-btn').forEach(b => b.classList.remove('active')); }
  function clearActiveForkNotes(){ document.querySelectorAll('.note-choice').forEach(b => b.classList.remove('active')); }

  function renderForkNotes(){
    if (!forkNotes) return;
    forkNotes.innerHTML = '';
    FORK_NOTES.forEach(([label,note,hz]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'note-choice';
      btn.dataset.hz = hz;
      btn.innerHTML = `<strong>${label}</strong><span>${note}</span>`;
      btn.addEventListener('click', () => {
        selectedString = null;
        clearActiveForkNotes();
        btn.classList.add('active');
        octaveOffset = 0;
        updateOctaveUI();
        setFreq(hz);
        restartCurrentSound();
      });
      forkNotes.appendChild(btn);
    });
  }

  function renderStrings(key){
    const data = TUNINGS[key];
    if (!data || !stringButtons) return;
    if (instrumentName) instrumentName.textContent = data.label;
    stringButtons.innerHTML = '';
    data.strings.forEach((s, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn string-btn';
      btn.innerHTML = `<strong>${s.name}</strong><span>${s.note} · ${s.hz.toFixed(2)} Hz</span>`;
      btn.title = `${s.note} – ${s.hz.toFixed(2)} Hz`;
      btn.addEventListener('click', () => {
        selectedString = s;
        clearActiveStrings();
        btn.classList.add('active');
        octaveOffset = 0;
        updateOctaveUI();
        setFreq(s.hz);
        restartCurrentSound(true);
      });
      stringButtons.appendChild(btn);
      if (i === 0 && !selectedString) selectedString = s;
    });
  }

  function setMode(nextMode){
    stop();
    mode = nextMode;
    selectedString = null;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
    document.querySelectorAll('.mode-panel').forEach(p => p.classList.remove('active'));

    if (mode === 'fork') {
      document.getElementById('forkPanel')?.classList.add('active');
      if (modeTitle) modeTitle.textContent = 'Tuning Fork';
      if (modeSubtitle) modeSubtitle.textContent = 'Pure reference tone · C–C · sine, loop, or one-hit';
      if (sourceStatus) sourceStatus.textContent = playbackMode === 'hold' ? 'Sinus' : playbackMode === 'loop' ? 'Loop sinus' : 'One-hit sinus';
    } else {
      document.getElementById('instrumentPanel')?.classList.add('active');
      renderStrings(mode);
      if (modeTitle) modeTitle.textContent = TUNINGS[mode].label;
      if (modeSubtitle) modeSubtitle.textContent = TUNINGS[mode].subtitle;
      if (sourceStatus) sourceStatus.textContent = 'Sample/sinus';
    }

    octaveOffset = 0;
    updateOctaveUI();
    updateUI();
  }

  async function ensureAudio(){
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
    if (audioCtx.state === 'suspended') await audioCtx.resume();
  }

  async function playTone(hz, duration = null){
    await ensureAudio();
    osc = audioCtx.createOscillator();
    gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(hz, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, audioCtx.currentTime + 0.025);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    if (duration) {
      const now = audioCtx.currentTime;
      gain.gain.setValueAtTime(0.18, now + Math.max(.03, duration - .08));
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.stop(now + duration + .03);
      setTimeout(() => {
        try { osc?.disconnect(); gain?.disconnect(); } catch {}
        osc = null; gain = null;
      }, (duration + .08) * 1000);
    }
  }

  function stopSynthNodes(){
    synthNodes.forEach(({ node, gainNode }) => {
      try { node.stop?.(); } catch {}
      try { node.disconnect?.(); } catch {}
      try { gainNode?.disconnect?.(); } catch {}
    });
    synthNodes = [];
  }

  function instrumentPreset(key){
    const presets = {
      guitar: { wave:'triangle', gain:.13, harmonics:[1,.42,.18,.08], attack:.012, decay:.9, sustain:.18, vibrato:0 },
      bass: { wave:'sawtooth', gain:.18, harmonics:[1,.62,.28,.16], attack:.018, decay:1.4, sustain:.34, vibrato:.15 },
      ukulele: { wave:'triangle', gain:.12, harmonics:[1,.28,.10,.04], attack:.008, decay:.55, sustain:.10, vibrato:0 },
      banjo: { wave:'square', gain:.10, harmonics:[1,.58,.36,.18,.08], attack:.004, decay:.38, sustain:.05, vibrato:0 },
      violin: { wave:'sawtooth', gain:.10, harmonics:[1,.55,.34,.20,.12], attack:.015, decay:.7, sustain:.58, vibrato:.42 },
      viola: { wave:'sawtooth', gain:.11, harmonics:[1,.50,.30,.18,.10], attack:.015, decay:.75, sustain:.62, vibrato:.36 },
      cello: { wave:'sawtooth', gain:.13, harmonics:[1,.48,.32,.20,.12], attack:.02, decay:.85, sustain:.66, vibrato:.28 }
    };
    return presets[key] || presets.guitar;
  }

  async function playInstrumentSynth(hz, key = mode){
    await ensureAudio();
    stopSynthNodes();
    const preset = instrumentPreset(key);
    const now = audioCtx.currentTime;
    const master = audioCtx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(preset.gain, now + preset.attack);
    master.gain.exponentialRampToValueAtTime(Math.max(0.015, preset.gain * preset.sustain), now + preset.attack + preset.decay);
    master.connect(audioCtx.destination);

    preset.harmonics.forEach((level, index) => {
      const partial = index + 1;
      const node = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      node.type = index === 0 ? preset.wave : 'sine';
      node.frequency.setValueAtTime(hz * partial, now);
      gainNode.gain.setValueAtTime(level / partial, now);
      node.connect(gainNode).connect(master);
      node.start(now);
      synthNodes.push({ node, gainNode });
    });

    if (preset.vibrato) {
      const lfo = audioCtx.createOscillator();
      const lfoGain = audioCtx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(key === 'bass' ? 4.2 : 5.4, now);
      lfoGain.gain.setValueAtTime(preset.vibrato, now);
      synthNodes.filter(({ node }) => node.frequency).forEach(({ node }) => lfoGain.connect(node.frequency));
      lfo.connect(lfoGain);
      lfo.start(now);
      synthNodes.push({ node:lfo, gainNode:lfoGain });
    }

    synthNodes.push({ node:master, gainNode:null });
    if (sourceStatus) sourceStatus.textContent = `${TUNINGS[key]?.label || 'Instrument'} model`;
  }

  async function playSampleOrTone(hz){
    // Unlock Web Audio during the user's tap, before any network wait.
    await ensureAudio();
    const sample = selectedString?.sample;
    // Only these files ship with the tuner. All other instruments are modeled
    // immediately rather than requesting missing files and waiting for errors.
    const availableSamples = new Set([
      'samples/guitar/e2.mp3', 'samples/guitar/a2.mp3',
      'samples/guitar/d3.mp3', 'samples/guitar/g3.mp3',
      'samples/guitar/b3.mp3', 'samples/guitar/e4.mp3'
    ]);
    if (!sample || !availableSamples.has(sample)) return playInstrumentSynth(hz);
    const pendingAudio = new Audio(sample);
    sampleAudio = pendingAudio;
    pendingAudio.loop = true;
    pendingAudio.volume = 0.85;
    try {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Sample load timeout')), 1800);
        pendingAudio.addEventListener('canplaythrough', () => { clearTimeout(timer); resolve(); }, { once:true });
        pendingAudio.addEventListener('error', () => { clearTimeout(timer); reject(new Error('Sample unavailable')); }, { once:true });
        pendingAudio.load();
      });
      if (sampleAudio !== pendingAudio) return;
      await pendingAudio.play();
      if (sourceStatus) sourceStatus.textContent = 'Sample';
    } catch (err) {
      pendingAudio.pause();
      if (sampleAudio !== pendingAudio) return;
      sampleAudio = null;
      await playInstrumentSynth(hz);
    }
  }

  async function playFork(){
    const hz = getEffectiveHz();
    if (sourceStatus) sourceStatus.textContent = playbackMode === 'hold' ? 'Sinus' : playbackMode === 'loop' ? 'Loop sinus' : 'One-hit sinus';

    if (playbackMode === 'hold') {
      await playTone(hz);
      isPlaying = true;
      if (statusText) statusText.textContent = 'Holding tone…';
    } else if (playbackMode === 'loop') {
      isPlaying = true;
      if (statusText) statusText.textContent = 'Looping tone…';
      await playTone(hz, .9);
      loopTimer = setInterval(() => playTone(getEffectiveHz(), .9), 1300);
    } else {
      isPlaying = true;
      if (statusText) statusText.textContent = 'One-hit…';
      await playTone(hz, 1.15);
      setTimeout(() => {
        if (playbackMode === 'onehit') {
          isPlaying = false;
          if (forkWrap) forkWrap.dataset.playing = 'false';
          playBtn?.classList.remove('active');
          if (statusText) statusText.textContent = 'Ready';
        }
      }, 1250);
    }
  }

  function stopMicTuner(){
    if (micRaf) { cancelAnimationFrame(micRaf); micRaf = null; }
    if (micSource) { try { micSource.disconnect(); } catch {} micSource = null; }
    if (micStream) { micStream.getTracks().forEach(track => track.stop()); micStream = null; }
    micAnalyser = null;
    micListening = false;
    stableFreq = null;
    setMicButtonsActive(false);
    pitchCard?.classList.remove('active');
    pitchCard?.classList.remove('in-tune');
    if (micStatus) micStatus.textContent = 'Microphone stopped';
  }

  async function startMicTuner(){
    await ensureAudio();
    stopMicTuner();

    if (!navigator.mediaDevices?.getUserMedia) {
      if (micStatus) micStatus.textContent = 'Microphone is not supported in this browser.';
      return;
    }

    micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 1
      }
    });

    micSource = audioCtx.createMediaStreamSource(micStream);
    micAnalyser = audioCtx.createAnalyser();
    micAnalyser.fftSize = 16384;
    micAnalyser.smoothingTimeConstant = 0;
    pitchBuffer = new Float32Array(micAnalyser.fftSize);
    micSource.connect(micAnalyser);

    micListening = true;
    setMicButtonsActive(true);
    pitchCard?.classList.add('active');

    if (sourceStatus) sourceStatus.textContent = 'Microphone';
    if (statusText) statusText.textContent = 'Listening…';
    if (signalLabel) signalLabel.textContent = 'Microphone-signal';
    if (micStatus) micStatus.textContent = 'Listening for pitch…';

    updatePitchFromMic();
  }

  function autoCorrelate(buffer, sampleRate){
    const size = buffer.length;

    let rms = 0;
    for (let i = 0; i < size; i++) rms += buffer[i] * buffer[i];
    rms = Math.sqrt(rms / size);
    if (rms < 0.003) return null;

    const minFreq = 35;
    const maxFreq = 1200;
    const minLag = Math.floor(sampleRate / maxFreq);
    const maxLag = Math.min(size - 1, Math.floor(sampleRate / minFreq));

    let bestLag = -1;
    let bestCorr = 0;

    for (let lag = minLag; lag <= maxLag; lag++) {
      let sum = 0;
      let sumA = 0;
      let sumB = 0;
      const limit = size - lag;

      for (let i = 0; i < limit; i++) {
        const a = buffer[i];
        const b = buffer[i + lag];
        sum += a * b;
        sumA += a * a;
        sumB += b * b;
      }

      const corr = sum / Math.sqrt(sumA * sumB || 1);

      if (corr > bestCorr) {
        bestCorr = corr;
        bestLag = lag;
      }
    }

    if (bestLag <= 0 || bestCorr < 0.45) return null;

    let betterLag = bestLag;
    if (bestLag > minLag && bestLag < maxLag) {
      const c0 = correlationAtLag(buffer, bestLag - 1);
      const c1 = correlationAtLag(buffer, bestLag);
      const c2 = correlationAtLag(buffer, bestLag + 1);
      const denom = (c0 - 2 * c1 + c2);
      if (denom !== 0) {
        betterLag = bestLag + 0.5 * (c0 - c2) / denom;
      }
    }

    const freq = sampleRate / betterLag;
    if (!Number.isFinite(freq) || freq < MIN_HZ || freq > MAX_HZ) return null;
    return freq;
  }

  function correlationAtLag(buffer, lag){
    let sum = 0, sumA = 0, sumB = 0;
    const limit = buffer.length - lag;
    for (let i = 0; i < limit; i++) {
      const a = buffer[i];
      const b = buffer[i + lag];
      sum += a * b;
      sumA += a * a;
      sumB += b * b;
    }
    return sum / Math.sqrt(sumA * sumB || 1);
  }

  function updatePitchFromMic(){
    if (!micListening || !micAnalyser || !pitchBuffer) return;

    micAnalyser.getFloatTimeDomainData(pitchBuffer);
    let freq = autoCorrelate(pitchBuffer, audioCtx.sampleRate);

    if (freq) {
      stableFreq = stableFreq ? (stableFreq * 0.72 + freq * 0.28) : freq;
      freq = stableFreq;

      const n = noteFromHz(freq);
      const target = hzFromMidi(n.midi);
      const cents = centsOff(freq, target);
      const limited = Math.max(-50, Math.min(50, cents));
      const percent = 50 + limited;
      const inTune = Math.abs(cents) <= 5;

      if (detectedNote) detectedNote.textContent = `${n.name}${n.octave}`;
      if (micHz) micHz.textContent = `${freq.toFixed(2)} Hz`;
      if (centsText) centsText.textContent = `${cents > 0 ? '+' : ''}${Math.round(cents)} cents`;
      if (tuneNeedle) tuneNeedle.style.left = `${percent}%`;
      pitchCard?.classList.toggle('in-tune', inTune);
      if (micStatus) micStatus.textContent = inTune ? 'In tune' : (cents < 0 ? 'Slightly flat' : 'Slightly sharp');
    } else {
      stableFreq = null;
      if (detectedNote) detectedNote.textContent = '–';
      if (micHz) micHz.textContent = '– Hz';
      if (centsText) centsText.textContent = '0 cents';
      if (tuneNeedle) tuneNeedle.style.left = '50%';
      pitchCard?.classList.remove('in-tune');
      if (micStatus) micStatus.textContent = 'Listening for a clear tone…';
    }

    micRaf = requestAnimationFrame(updatePitchFromMic);
  }

  async function start(){
    stopMicTuner();

    if (isPlaying && playbackMode !== 'onehit') return;
    const hz = getEffectiveHz();

    if (mode === 'fork') await playFork();
    else { await playSampleOrTone(hz); isPlaying = true; if (statusText) statusText.textContent = 'Playing…'; }

    if (forkWrap) forkWrap.dataset.playing = 'true';
    if (signalLabel) signalLabel.textContent = mode === 'fork' ? 'Tuning Fork-signal' : 'Instrument reference';
    playBtn?.classList.add('active');
  }

  function stop(){
    stopMicTuner();

    if (loopTimer) { clearInterval(loopTimer); loopTimer = null; }
    if (sampleAudio) { sampleAudio.pause(); sampleAudio.currentTime = 0; sampleAudio = null; }
    stopSynthNodes();

    if (gain && audioCtx) {
      const now = audioCtx.currentTime;
      try {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
      } catch {}
    }

    if (osc) {
      const oldOsc = osc, oldGain = gain;
      setTimeout(() => { try{oldOsc.stop()}catch{} try{oldOsc.disconnect()}catch{} try{oldGain?.disconnect()}catch{} }, 90);
    }

    osc = null; gain = null; isPlaying = false;
    if (forkWrap) forkWrap.dataset.playing = 'false';
    if (signalLabel) signalLabel.textContent = 'Spectrum / waveform';
    if (statusText) statusText.textContent = 'Stopped';
    playBtn?.classList.remove('active');
  }

  function restartCurrentSound(forceStart = false){
    const wasPlaying = isPlaying;
    stop();
    if (forceStart || wasPlaying || mode === 'fork') start();
  }

  function updateOctaveUI(){
    octDownBtn?.classList.remove('oct-active','level-2');
    octUpBtn?.classList.remove('oct-active','level-2');

    if (octaveOffset < 0) {
      octDownBtn?.classList.add('oct-active');
      if (octaveOffset <= -2) octDownBtn?.classList.add('level-2');
    }

    if (octaveOffset > 0) {
      octUpBtn?.classList.add('oct-active');
      if (octaveOffset >= 2) octUpBtn?.classList.add('level-2');
    }

    if (octaveStatus) octaveStatus.textContent = octaveOffset === 0 ? 'Octave: 0' : `Octave: ${octaveOffset > 0 ? '+' : ''}${octaveOffset}`;
  }

  function maybeLowFreqPulse(hz){
    if (!tipBox) return;

    if (hz < 220 && !lowFreqHintShown) {
      lowFreqHintShown = true;
      tipBox.classList.remove('attention');
      void tipBox.offsetWidth;
      tipBox.classList.add('attention');
      tipBox.addEventListener('animationend', () => tipBox.classList.remove('attention'), { once:true });
    }

    if (hz >= 220) lowFreqHintShown = false;
  }

  function updateUI(){
    const hz = getEffectiveHz();
    const n = noteFromHz(hz);

    if (hzText) hzText.textContent = `${hz.toFixed(2)} Hz`;
    if (noteText) noteText.textContent = `${n.name}${n.octave}${Math.abs(hz-440)<0.05 ? ' (concert pitch)' : ''}`;
    forkWrap?.style.setProperty('--forkScale', forkScaleFromHz(hz).toFixed(3));

    const tip = tipFor(hz, `${n.name}${n.octave}`);
    if (tipBadge) tipBadge.textContent = tip.badge;
    if (tipText) tipText.textContent = tip.text;

    maybeLowFreqPulse(hz);

    if (isPlaying && osc && audioCtx && playbackMode === 'hold') {
      osc.frequency.setValueAtTime(hz, audioCtx.currentTime);
    }
  }

  function drawSignal(){
    if (!signalCanvas) return;

    const ctx = signalCanvas.getContext('2d');
    const ratio = window.devicePixelRatio || 1;
    const rect = signalCanvas.getBoundingClientRect();
    const w = Math.max(320, Math.floor(rect.width * ratio));
    const h = Math.max(90, Math.floor(rect.height * ratio));

    if (signalCanvas.width !== w || signalCanvas.height !== h) {
      signalCanvas.width = w;
      signalCanvas.height = h;
    }

    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = 'rgba(0,0,0,.24)';
    ctx.fillRect(0,0,w,h);

    const hz = getEffectiveHz();
    const active = isPlaying || micListening;
    const speed = active ? 0.014 + Math.min(0.025, hz / 36000) : 0.004;
    signalPhase += speed;

    const bars = 56;
    const gap = w / bars;

    for (let i=0;i<bars;i++){
      const x = i * gap;
      const harmonic = Math.sin(signalPhase*2 + i*.42) * .5 + .5;
      const peak = Math.exp(-Math.abs(i - (hz % 900) / 900 * bars) / 11);
      const energy = active ? (0.18 + harmonic*.28 + peak*.65) : (0.06 + harmonic*.08);
      const bh = Math.max(3, energy * h * .62);
      const grd = ctx.createLinearGradient(0,h-bh,0,h);
      grd.addColorStop(0,'rgba(255,42,95,.80)');
      grd.addColorStop(1,'rgba(168,85,247,.14)');
      ctx.fillStyle = grd;
      ctx.fillRect(x+2,h-bh,gap-4,bh);
    }

    ctx.beginPath();
    const mid = h * .48;
    const amp = active ? h * .18 : h * .045;

    for (let x=0;x<w;x++){
      const t = x / w;
      const y = mid + Math.sin(t * Math.PI * 8 + signalPhase * 3.2) * amp * (0.55 + 0.45*Math.sin(t*Math.PI));
      if (x === 0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }

    ctx.strokeStyle = active ? 'rgba(255,220,230,.92)' : 'rgba(255,255,255,.35)';
    ctx.lineWidth = Math.max(1.2, 1.8 * ratio);
    ctx.shadowColor = 'rgba(255,42,95,.65)';
    ctx.shadowBlur = active ? 14 * ratio : 4 * ratio;
    ctx.stroke();
    ctx.shadowBlur = 0;

    signalRaf = requestAnimationFrame(drawSignal);
  }

  document.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', () => setMode(btn.dataset.mode)));

  document.querySelectorAll('.mode-choice').forEach(btn => btn.addEventListener('click', () => {
    playbackMode = btn.dataset.playback;
    if (playbackMode === 'listen') playbackMode = 'hold';

    document.querySelectorAll('.mode-choice').forEach(b => b.classList.toggle('active', b === btn));

    if (mode === 'fork' && sourceStatus) {
      sourceStatus.textContent = playbackMode === 'hold' ? 'Sinus' : playbackMode === 'loop' ? 'Loop sinus' : 'One-hit sinus';
    }

    restartCurrentSound();
  }));

  freqEl?.addEventListener('input', () => {
    selectedString = null;
    clearActiveStrings();
    clearActiveForkNotes();
    set440Btn?.classList.remove('active');
    updateUI();
    if (isPlaying && (sampleAudio || playbackMode !== 'hold')) restartCurrentSound();
  });

  playBtn?.addEventListener('click', () => start());
  stopBtn?.addEventListener('click', () => stop());

  listenMicButtons.forEach(btn => btn.addEventListener('click', async () => {
    if (micListening) {
      stopMicTuner();
      if (statusText) statusText.textContent = 'Microphone stopped';
      if (signalLabel) signalLabel.textContent = 'Spectrum / waveform';
      return;
    }

    try {
      if (isPlaying) stop();
      await startMicTuner();
    } catch (err) {
      console.error(err);
      stopMicTuner();
      pitchCard?.classList.add('active');
      if (micStatus) micStatus.textContent = 'Microphone error / access denied';
      if (statusText) statusText.textContent = 'Microphone error';
    }
  }));

  stopMicButtons.forEach(btn => btn.addEventListener('click', () => {
    stopMicTuner();
    if (statusText) statusText.textContent = 'Microphone stopped';
    if (signalLabel) signalLabel.textContent = 'Spectrum / waveform';
  }));

  octDownBtn?.addEventListener('click', () => {
    if (octaveOffset > -MAX_OCT) octaveOffset--;
    set440Btn?.classList.remove('active');
    updateOctaveUI();
    updateUI();
    if (isPlaying && (sampleAudio || playbackMode !== 'hold')) restartCurrentSound();
  });

  octUpBtn?.addEventListener('click', () => {
    if (octaveOffset < MAX_OCT) octaveOffset++;
    set440Btn?.classList.remove('active');
    updateOctaveUI();
    updateUI();
    if (isPlaying && (sampleAudio || playbackMode !== 'hold')) restartCurrentSound();
  });

  set440Btn?.addEventListener('click', () => {
    selectedString = null;
    clearActiveStrings();
    clearActiveForkNotes();
    set440Btn.classList.add('active');
    octaveOffset = 0;
    updateOctaveUI();
    setFreq(440);
    restartCurrentSound();
  });

  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });

  renderForkNotes();
  drawSignal();
  setMode('fork');
})();
