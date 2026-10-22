(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const canvas = $("canvas");
  const ctx = canvas.getContext("2d");
  const mode = $("mode");
  const colorMode = $("colorMode");
  const playMode = $("playMode");
  const rootSelect = $("rootSelect");
  const scaleSelect = $("scaleSelect");
  const scaleControl = document.querySelector(".scale-control");
  const tonalityField = document.querySelector(".tonality-field");
  const sourceSelect = $("sourceSelect");
  const presetSelect = $("presetSelect");
  const bpmInput = $("bpm");
  const bpmDown = $("bpmDown");
  const bpmUp = $("bpmUp");
  const playBtn = $("playBtn");
  const loopBtn = $("loopBtn");
  const stopBtn = $("stopBtn");
  const midiFile = $("midiFile");
  const midiFileButton = $("midiFileButton");
  const pieceStatus = $("pieceStatus");
  const timeStatus = $("timeStatus");
  const detailStatus = $("detailStatus");
  const statusCard = document.querySelector(".status-card");
  const progressBar = $("progressBar");
  const dropZone = $("dropZone");
  const toast = $("toast");
  const soundPreset = $("soundPreset");
  const sustainPedal = $("sustainPedal");
  const sampleStatus = $("sampleStatus");
  const soundProNotice = $("soundProNotice");
  const soundGrid = document.querySelector(".sound-grid");
  const IS_PRO = window.CL_IS_PRO === true;
  const PRO_URL = window.CL_PRO_URL || "/members/upgrade.php";
  const soundControlIds = ["volume", "attack", "sustain", "release", "cutoff", "reverb", "delay", "lowEq", "midEq", "highEq"];
  const soundControls = Object.fromEntries(soundControlIds.map(id => [id, $(id)]));

  const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const NOTE_COLORS = ["#59e0ff", "#568cff", "#a347ff", "#d159ff", "#f05fa8"];
  const PITCH_GRADIENTS = {
    cyan:{low:[8,76,94],high:[120,233,255]},
    violetPink:{low:[62,25,105],high:[240,95,168]}
  };
  const COLOR_MODE_STORAGE_KEY = "rockeskolenVisualizerColorMode";
  const FALLBACK_SCALES = {
    major: { name_no: "Dur", intervals: [0,2,4,5,7,9,11] },
    nat_minor: { name_no: "Naturlig moll", intervals: [0,2,3,5,7,8,10] },
    harm_minor: { name_no: "Harmonisk moll", intervals: [0,2,3,5,7,8,11] },
    mel_minor: { name_no: "Melodisk moll", intervals: [0,2,3,5,7,9,11] },
    dorian: { name_no: "Dorisk", intervals: [0,2,3,5,7,9,10] },
    phrygian: { name_no: "Frygisk", intervals: [0,1,3,5,7,8,10] },
    lydian: { name_no: "Lydisk", intervals: [0,2,4,6,7,9,11] },
    mixolydian: { name_no: "Miksolydisk", intervals: [0,2,4,5,7,9,10] },
    locrian: { name_no: "Lokrisk", intervals: [0,1,3,5,6,8,10] },
    major_pent: { name_no: "Dur pentaton", intervals: [0,2,4,7,9] },
    minor_pent: { name_no: "Moll pentaton", intervals: [0,3,5,7,10] },
    pent_blues: { name_no: "Bluesskala", intervals: [0,3,5,6,7,10] },
    chromatic: { name_no: "Kromatisk skala", intervals: [0,1,2,3,4,5,6,7,8,9,10,11] }
  };
  const SCALE_PRIORITY = Object.keys(FALLBACK_SCALES);
  const SAMPLE_LIBRARIES = {
    piano: {
      label: "Piano",
      baseUrl: "/audio/keys/piano/",
      urls: {
        C2:"c2.mp3","D#2":"eb2.mp3","F#2":"gb2.mp3",A2:"a2.mp3",
        C3:"c3.mp3","D#3":"eb3.mp3","F#3":"gb3.mp3",A3:"a3.mp3",
        C4:"c4.mp3","D#4":"eb4.mp3","F#4":"gb4.mp3",A4:"a4.mp3",
        C5:"c5.mp3","D#5":"eb5.mp3","F#5":"gb5.mp3",A5:"a5.mp3",
        C6:"c6.mp3",E6:"e6.mp3","F#6":"gb6.mp3",A6:"a6.mp3",C7:"c7.mp3"
      }
    },
    guitar: {
      label: "Akustisk gitar",
      baseUrl: "/audio/guitars/acoustic/",
      urls: {
        E2:"e2.mp3",G2:"g2.mp3","A#2":"bb2.mp3","C#3":"db3.mp3",
        E3:"e3.mp3",G3:"g3.mp3","A#3":"bb3.mp3","C#4":"db4.mp3",
        E4:"e4.mp3",G4:"g4.mp3","A#4":"bb4.mp3","C#5":"db5.mp3",E5:"e5.mp3"
      }
    }
  };
  const SOUND_PRESETS = {
    original:  { oscillator: "sine",     decay: .12, volume: 0,  attack: .01,  sustain: .2,  release: 1,   cutoff: 10000, reverb: .1,  delay: .04, lowEq: 0,  midEq: 0, highEq: 0 },
    samplePiano:  { sample: "piano",  decay: .2, volume: 2, attack: .005, sustain: .35, release: 1.2, cutoff: 14000, reverb: .14, delay: .02, lowEq: 1, midEq: 0, highEq: 1 },
    sampleGuitar: { sample: "guitar", decay: .2, volume: 2, attack: .005, sustain: .25, release: .7, cutoff: 12000, reverb: .1,  delay: .03, lowEq: 1, midEq: 1, highEq: 0 },
    softPiano: { oscillator: "triangle", decay: .35, volume: -2, attack: .005, sustain: .12, release: 1.8, cutoff: 7500,  reverb: .16, delay: .02, lowEq: 1,  midEq: 0, highEq: 1 },
    electric:  { oscillator: "sine",     decay: .6,  volume: -2, attack: .01,  sustain: .35, release: 1.4, cutoff: 9000,  reverb: .18, delay: .1,  lowEq: -1, midEq: 2, highEq: 1 },
    pad:       { oscillator: "sawtooth", decay: .8,  volume: -8, attack: .8,   sustain: .65, release: 4,   cutoff: 2800,  reverb: .38, delay: .16, lowEq: 2,  midEq: -1, highEq: -3 },
    pluck:     { oscillator: "triangle", decay: .12, volume: -4, attack: .005, sustain: .04, release: .25, cutoff: 6500,  reverb: .12, delay: .12, lowEq: 0,  midEq: 1, highEq: 2 },
    organ:     { oscillator: "square",   decay: .1,  volume: -9, attack: .02,  sustain: .9,  release: .35, cutoff: 5200,  reverb: .14, delay: .03, lowEq: 2,  midEq: 1, highEq: -2 }
  };
  const PRESETS = {
    simple: {
      label: "Enkel melodi",
      bpm: 120,
      items: [
        ["C4",0,.5,105],["D4",.5,.5,105],["E4",1,.5,108],["G4",1.5,.5,112],
        ["A4",2,.5,115],["G4",2.5,.5,108],["E4",3,.75,104],["D4",3.75,.25,100],["C4",4,1,110]
      ]
    },
    triad: {
      label: "Treklangsfigur",
      bpm: 100,
      items: [["C4",0,.4,110],["E4",.5,.4,110],["G4",1,.4,110],["C5",1.5,.8,115],["G4",2.5,.4,108],["E4",3,.4,108],["C4",3.5,.8,112]]
    },
    nokia: {
      label: "Gran Vals · Nokia-motivet",
      bpm: 120,
      items: [
        ["G4",0,.35,112],["F4",.375,.35,108],["A3",.75,.7,112],["B3",1.5,.7,112],
        ["E4",2.25,.35,114],["D4",2.625,.35,108],["F3",3,.7,110],["G3",3.75,.7,112],
        ["D4",4.5,.35,110],["C4",4.875,.35,108],["E3",5.25,.7,110],["G3",6,.7,112],
        ["C4",6.75,1.25,116]
      ]
    },
    ode: {
      label: "Beethoven · Ode til gleden",
      bpm: 112,
      items: [
        ["E4",0,.45,108],["E4",.5,.45,108],["F4",1,.45,110],["G4",1.5,.45,112],
        ["G4",2,.45,112],["F4",2.5,.45,108],["E4",3,.45,108],["D4",3.5,.45,106],
        ["C4",4,.45,108],["C4",4.5,.45,108],["D4",5,.45,108],["E4",5.5,.45,112],
        ["E4",6,.7,112],["D4",6.75,.25,106],["D4",7,1,110],
        ["E4",8,.45,108],["E4",8.5,.45,108],["F4",9,.45,110],["G4",9.5,.45,112],
        ["G4",10,.45,112],["F4",10.5,.45,108],["E4",11,.45,108],["D4",11.5,.45,106],
        ["C4",12,.45,108],["C4",12.5,.45,108],["D4",13,.45,108],["E4",13.5,.45,112],
        ["D4",14,.7,108],["C4",14.75,.25,106],["C4",15,1.25,114]
      ]
    }
  };
  const MIDI_EXAMPLES = {
    bohemian: {
      label: "Queen · Bohemian Rhapsody",
      url: "midi/bohemian-rhapsody.mid"
    },
    clair: {
      label: "Debussy · Clair de Lune",
      url: "midi/clair-de-lune.mid"
    },
    ode: {
      label: "Beethoven · Ode to Joy",
      url: "midi/ode-to-joy.mid"
    },
    entertainer: {
      label: "Scott Joplin · The Entertainer",
      url: "midi/the-entertainer.mid"
    }
  };

  let scales = FALLBACK_SCALES;
  let activeScale = [];
  let synth;
  let reverb;
  let delay;
  let filter;
  let eq;
  let master;
  let sampleCompressor;
  let sampleGain;
  const sampleSamplers = {};
  const samplePromises = {};
  let audioReady = false;
  let keys = [];
  let notes = [];
  let particles = [];
  let activeKeys = {};
  let timers = [];
  let loop = false;
  let midiSong = null;
  let uploadedMidiSong = null;
  let playbackStart = 0;
  let playbackDuration = 0;
  let playbackBeatOffset = 0;
  let playbackTotalBeats = 0;
  let playbackBpm = 90;
  let playing = false;
  let toastTimer;
  let tempoTimer;
  let sustainOn = false;

  const whiteWidth = 44;
  const blackWidth = 28;
  const keyboardStart = 36;
  const keyboardEnd = 84;

  function resize() {
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const height = window.innerHeight;
    canvas.width = Math.round(window.innerWidth * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    buildKeyboard();
    document.documentElement.style.setProperty("--keyboard-height", `${keyboardHeight()}px`);
    positionHint();
  }

  function positionHint() {
    const rect = statusCard.getBoundingClientRect();
    document.documentElement.style.setProperty("--hint-top", `${Math.round(rect.bottom + 8)}px`);
    document.documentElement.style.setProperty("--hint-right", `${Math.round(window.innerWidth - rect.right)}px`);
    document.documentElement.style.setProperty("--hint-width", `${Math.round(rect.width)}px`);
  }

  function viewport() {
    return { width: canvas.clientWidth, height: canvas.clientHeight };
  }

  function keyboardHeight() {
    const h = viewport().height;
    return matchMedia("(pointer:coarse)").matches ? Math.max(160, Math.round(h * .23)) : 160;
  }

  function midiName(number) {
    return NOTE_NAMES[number % 12] + (Math.floor(number / 12) - 1);
  }

  function noteNumber(note) {
    const match = /^([A-G])(#?)(-?\d+)$/.exec(note);
    if (!match) return 60;
    const pitch = NOTE_NAMES.indexOf(match[1] + match[2]);
    return (Number(match[3]) + 1) * 12 + pitch;
  }

  function buildKeyboard() {
    keys = [];
    const whites = [];
    for (let n = keyboardStart; n <= keyboardEnd; n++) {
      if (![1,3,6,8,10].includes(n % 12)) whites.push(n);
    }
    const middleCIndex = whites.indexOf(60);
    const isMobile = matchMedia("(max-width: 680px)").matches;
    const middleCX = isMobile ? 0 : (viewport().width - whiteWidth) / 2;
    const offset = middleCX - middleCIndex * whiteWidth;
    whites.forEach((n, index) => {
      const x = offset + index * whiteWidth;
      keys.push({ note: midiName(n), number: n, x, type: "white" });
      const sharp = n + 1;
      if ([1,3,6,8,10].includes(sharp % 12) && sharp <= keyboardEnd) {
        keys.push({ note: midiName(sharp), number: sharp, x: x + whiteWidth - blackWidth / 2, type: "black" });
      }
    });
  }

  function scaleLabel(key) {
    return scales[key]?.name_no || FALLBACK_SCALES[key]?.name_no || scales[key]?.name || key;
  }

  function updateScale() {
    const root = NOTE_NAMES.indexOf(rootSelect.value);
    const intervals = scales[scaleSelect.value]?.intervals || [];
    activeScale = intervals.map(i => NOTE_NAMES[(root + i) % 12]);
    if (playing && sourceSelect.value !== "midi") {
      rescheduleFromCurrentPosition("Tonearten er endret · fortsetter fra samme sted");
    }
    updateStatus();
  }

  function populateScales() {
    scaleSelect.replaceChildren();
    Object.entries(scales)
      .sort(([a],[b]) => {
        const ai = SCALE_PRIORITY.indexOf(a);
        const bi = SCALE_PRIORITY.indexOf(b);
        if (ai >= 0 || bi >= 0) return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
        return scaleLabel(a).localeCompare(scaleLabel(b), "no");
      })
      .forEach(([key]) => scaleSelect.add(new Option(scaleLabel(key), key)));
    scaleSelect.value = scales.major ? "major" : scaleSelect.options[0]?.value;
    updateScale();
  }

  async function loadScales() {
    try {
      const response = await fetch("/assets/data/scales.json", { cache: "no-store" });
      if (!response.ok) throw new Error();
      scales = await response.json();
    } catch {
      scales = FALLBACK_SCALES;
    }
    populateScales();
  }

  function normalized(items) {
    return items.map(item => Array.isArray(item)
      ? { note: item[0], time: item[1], duration: item[2], velocity: item[3] }
      : item);
  }

  function scaleItems() {
    const root = NOTE_NAMES.indexOf(rootSelect.value);
    const intervals = scales[scaleSelect.value]?.intervals || [];
    if(!intervals.length) return [];
    const ascending=[...intervals,12];
    const descendingIntervals=scaleSelect.value === "mel_minor"
      ? (scales.nat_minor?.intervals||FALLBACK_SCALES.nat_minor.intervals)
      : intervals;
    const descending=[12,...descendingIntervals.slice(1).reverse(),0];
    const direction=presetSelect.value||"scale-up";
    const sequence=direction === "scale-down"
      ? descending
      : direction === "scale-up-down"
        ? [...ascending,...descending.slice(1)]
        : ascending;
    return sequence.map((interval, index) => {
      const absolute = root + interval;
      return {note:NOTE_NAMES[absolute%12]+(4+Math.floor(absolute/12)),time:index*.5,duration:index===sequence.length-1?.75:.45,velocity:interval%12===0?112:108};
    });
  }

  function currentItems() {
    if (sourceSelect.value === "midi") return midiSong?.items || [];
    if (sourceSelect.value === "scale") return scaleItems();
    const semitones = NOTE_NAMES.indexOf(rootSelect.value);
    return normalized((PRESETS[presetSelect.value] || PRESETS.simple).items).map(item => ({
      ...item,
      note: midiName(noteNumber(item.note) + semitones)
    }));
  }

  function populatePresets() {
    presetSelect.replaceChildren();
    scaleControl.hidden = sourceSelect.value === "midi";
    tonalityField.hidden = sourceSelect.value !== "scale";
    if (sourceSelect.value === "melody") {
      Object.entries(PRESETS).forEach(([key, preset]) => presetSelect.add(new Option(preset.label, key)));
      bpmInput.value = PRESETS[presetSelect.value]?.bpm || 120;
    } else if (sourceSelect.value === "scale") {
      presetSelect.add(new Option("Spill opp", "scale-up"));
      presetSelect.add(new Option("Spill ned", "scale-down"));
      presetSelect.add(new Option("Spill opp og ned", "scale-up-down"));
    } else {
      presetSelect.add(new Option("Velg MIDI-eksempel …", ""));
      Object.entries(MIDI_EXAMPLES).forEach(([key, example]) => presetSelect.add(new Option(example.label, `example:${key}`)));
      if (uploadedMidiSong) presetSelect.add(new Option(`Min fil · ${uploadedMidiSong.name}`, "upload"));
      const selected = midiSong?.source === "upload"
        ? "upload"
        : midiSong?.exampleKey
          ? `example:${midiSong.exampleKey}`
          : "";
      presetSelect.value = selected;
    }
    updateStatus();
  }

  async function selectMidiPreset(value) {
    if (value === "upload" && uploadedMidiSong) {
      midiSong = uploadedMidiSong;
      bpmInput.value = midiSong.bpm;
      playbackDuration = beatsToMs(sequenceLength(midiSong.items));
      updateStatus();
      return;
    }
    if (!value.startsWith("example:")) return;
    const key = value.slice(8);
    const example = MIDI_EXAMPLES[key];
    if (!example || midiSong?.exampleKey === key) return;
    try {
      const response = await fetch(example.url);
      if (!response.ok) throw new Error();
      midiSong = parseMidi(await response.arrayBuffer(), example.label);
      midiSong.exampleKey = key;
      midiSong.source = "example";
      bpmInput.value = Math.max(40, Math.min(220, midiSong.bpm));
      playbackDuration = beatsToMs(sequenceLength(midiSong.items));
      showToast(`${example.label} er klar`);
      updateStatus();
    } catch {
      showToast("Kunne ikke laste MIDI-eksempelet.");
    }
  }

  function soundSettings() {
    const preset = SOUND_PRESETS[soundPreset.value] || SOUND_PRESETS.original;
    return {
      oscillator: preset.oscillator,
      sample: preset.sample,
      decay: preset.decay,
      ...Object.fromEntries(soundControlIds.map(id => [id, Number(soundControls[id].value)]))
    };
  }

  function soundValue(id, value) {
    if (id === "volume" || id.endsWith("Eq")) return `${value > 0 ? "+" : ""}${Math.round(value)} dB`;
    if (id === "attack" || id === "release") return `${value < .1 ? value.toFixed(3) : value.toFixed(1)} s`;
    if (id === "cutoff") return value >= 1000 ? `${(value / 1000).toFixed(value % 1000 ? 1 : 0)} kHz` : `${Math.round(value)} Hz`;
    return `${Math.round(value * 100)} %`;
  }

  function updateSoundLabels() {
    soundControlIds.forEach(id => {
      const output = document.querySelector(`output[data-value-for="${id}"]`);
      if (output) output.textContent = soundValue(id, Number(soundControls[id].value));
    });
  }

  function saveSoundSettings() {
    try {
      localStorage.setItem("chordlinkVisualizerSound", JSON.stringify({
        preset: soundPreset.value,
        sustainOn,
        controls: Object.fromEntries(soundControlIds.map(id => [id, soundControls[id].value]))
      }));
    } catch {}
  }

  function applySoundSettings() {
    const settings = soundSettings();
    updateSoundLabels();
    if (audioReady) {
      if (!settings.sample) {
        synth.set({
          oscillator: { type: settings.oscillator },
          envelope: {
            attack: settings.attack,
            decay: settings.decay,
            sustain: settings.sustain,
            release: settings.release
          }
        });
      }
      master.volume.value = settings.volume;
      filter.frequency.value = settings.cutoff;
      reverb.wet.value = settings.reverb;
      delay.wet.value = settings.delay;
      eq.low.value = settings.lowEq;
      eq.mid.value = settings.midEq;
      eq.high.value = settings.highEq;
    }
    saveSoundSettings();
  }

  async function ensureSampler(kind) {
    if (sampleSamplers[kind]) return sampleSamplers[kind];
    if (samplePromises[kind]) return samplePromises[kind];
    const library = SAMPLE_LIBRARIES[kind];
    if (!library) throw new Error("Ukjent samplebibliotek.");
    sampleStatus.textContent = `Laster ${library.label.toLowerCase()}…`;
    playBtn.disabled = true;
    samplePromises[kind] = new Promise((resolve, reject) => {
      let sampler;
      sampler = new Tone.Sampler({
        urls: library.urls,
        baseUrl: library.baseUrl,
        release: 1,
        onload: () => {
          sampleSamplers[kind] = sampler;
          sampleStatus.textContent = `${library.label} bufret`;
          playBtn.disabled = false;
          resolve(sampler);
        },
        onerror: error => {
          sampleStatus.textContent = "Kunne ikke laste samples";
          playBtn.disabled = false;
          reject(error);
        }
      }).connect(sampleCompressor);
    });
    return samplePromises[kind];
  }

  function activeInstrument() {
    const sample = SOUND_PRESETS[soundPreset.value]?.sample;
    return sample ? sampleSamplers[sample] || synth : synth;
  }

  async function applySoundPreset(name) {
    const preset = SOUND_PRESETS[name] || SOUND_PRESETS.original;
    soundPreset.value = SOUND_PRESETS[name] ? name : "original";
    soundControlIds.forEach(id => {
      if (id in preset) soundControls[id].value = preset[id];
    });
    const resumeBeat = playing ? currentPlaybackBeat() : 0;
    releaseAllInstruments();
    applySoundSettings();
    try {
      if (audioReady && preset.sample) await ensureSampler(preset.sample);
      if (playing) schedule(currentItems(), loop, resumeBeat, true);
      showToast(`Klang: ${soundPreset.options[soundPreset.selectedIndex]?.textContent || "Original"}`);
    } catch {
      soundPreset.value = "original";
      applySoundSettings();
      showToast("Kunne ikke laste samplelyden – bruker Original.");
    }
  }

  function restoreSoundSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem("chordlinkVisualizerSound") || "null");
      if (!saved) {
        soundPreset.value = "original";
        soundControlIds.forEach(id => {
          if (id in SOUND_PRESETS.original) soundControls[id].value = SOUND_PRESETS.original[id];
        });
        return updateSoundLabels();
      }
      soundPreset.value = SOUND_PRESETS[saved.preset] ? saved.preset : "original";
      Object.entries(saved.controls || {}).forEach(([id, value]) => {
        if (soundControls[id]) soundControls[id].value = value;
      });
      sustainOn = Boolean(saved.sustainOn);
      sustainPedal.setAttribute("aria-pressed", String(sustainOn));
      updateSoundLabels();
    } catch {
      applySoundPreset("original");
    }
  }

  async function initAudio() {
    if (audioReady) return;
    if (!window.Tone) throw new Error("Lydmotoren kunne ikke lastes.");
    await Tone.start();
    master = new Tone.Volume(0).toDestination();
    reverb = new Tone.Reverb({ decay: 5.5, wet: .1 }).connect(master);
    delay = new Tone.FeedbackDelay("8n", .16);
    delay.wet.value = .04;
    delay.connect(reverb);
    eq = new Tone.EQ3({ low: 0, mid: 0, high: 0 }).connect(delay);
    filter = new Tone.Filter({ frequency: 10000, type: "lowpass", rolloff: -12 }).connect(eq);
    sampleGain = new Tone.Gain(2).connect(filter);
    sampleCompressor = new Tone.Compressor({
      threshold: -24,
      ratio: 3,
      attack: .003,
      release: .3
    }).connect(sampleGain);
    synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: .01, decay: .12, sustain: .2, release: 1 }
    });
    synth.connect(filter);
    audioReady = true;
    updateSound();
    const sample = SOUND_PRESETS[soundPreset.value]?.sample;
    if (sample) await ensureSampler(sample);
  }

  function updateSound() {
    applySoundSettings();
  }

  function bpm() {
    return Math.max(40, Math.min(220, Number(bpmInput.value) || 90));
  }

  function beatsToMs(beats) {
    return 60000 / bpm() * beats;
  }

  function sequenceLength(items) {
    return items.reduce((end, item) => Math.max(end, item.time + (item.duration || .5)), 0);
  }

  function keyFor(note) {
    return keys.find(k => k.number === noteNumber(note));
  }

  function setActive(note, ms = 180) {
    activeKeys[note] = noteColor(note);
    setTimeout(() => delete activeKeys[note], ms);
  }

  function pitchColor(note){
    const position=Math.max(0,Math.min(1,(noteNumber(note)-keyboardStart)/(keyboardEnd-keyboardStart)));
    const gradient=PITCH_GRADIENTS[colorMode.value]||PITCH_GRADIENTS.cyan;
    const channel=index=>Math.round(gradient.low[index]+(gradient.high[index]-gradient.low[index])*position);
    return `rgb(${channel(0)}, ${channel(1)}, ${channel(2)})`;
  }

  function noteColor(note){
    if(colorMode.value!=="variation") return pitchColor(note);
    return NOTE_COLORS[Math.max(0,noteNumber(note))%NOTE_COLORS.length];
  }

  function restoreColorMode(){
    try{
      const saved=localStorage.getItem(COLOR_MODE_STORAGE_KEY);
      colorMode.value=saved === "variation"||saved === "violetPink"?saved:"cyan";
    }catch(error){colorMode.value="cyan";}
  }

  function saveColorMode(){
    try{localStorage.setItem(COLOR_MODE_STORAGE_KEY,colorMode.value);}catch(error){}
  }

  function trigger(note, duration = .5, velocity = 100) {
    const instrument = activeInstrument();
    if (!audioReady || !instrument) return;
    const sustainedDuration = duration + (sustainOn ? 2 : 0);
    instrument.triggerAttackRelease(note, beatsToMs(sustainedDuration) / 1000, undefined, Math.max(.12, Math.min(1, velocity / 127)));
  }

  function releaseAllInstruments() {
    synth?.releaseAll();
    Object.values(sampleSamplers).forEach(sampler => sampler.releaseAll());
  }

  function addVisual(item, hitTime, leadMs) {
    const key = keyFor(item.note);
    if (!key) return;
    const hitY = viewport().height - keyboardHeight();
    notes.push({
      note: item.note,
      x: key.x,
      width: key.type === "black" ? 18 : 24,
      length: Math.max(34, (item.duration || .5) * 115),
      inScale: activeScale.includes(item.note.replace(/-?\d+/g, "")),
      hitY,
      spawnTime: hitTime - leadMs,
      hitTime,
      prepare: playMode.value === "prepare",
      live: false,
      sounded: false
    });
  }

  function liveNote(note, duration = .5, velocity = 112) {
    const key = keyFor(note);
    if (!key) return;
    trigger(note, duration, velocity);
    setActive(note);
    const hitY = viewport().height - keyboardHeight();
    notes.push({
      note, x: key.x, width: key.type === "black" ? 18 : 24,
      length: Math.max(34, duration * 115), inScale: activeScale.includes(note.replace(/-?\d+/g, "")),
      hitY, y: hitY - Math.max(34, duration * 115), live: true, liveSpeed: 2
    });
    if (mode.value === "flow") sparkle(key.x + 10, hitY - 8);
  }

  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function currentPlaybackBeat(now = performance.now()) {
    if (!playing || !playbackStart) return 0;
    const elapsed = Math.max(0, now - playbackStart);
    return Math.min(playbackTotalBeats, playbackBeatOffset + elapsed / (60000 / playbackBpm));
  }

  function stop(resetLoop = true) {
    clearTimers();
    releaseAllInstruments();
    playing = false;
    notes = [];
    particles = [];
    if (resetLoop) {
      loop = false;
      loopBtn.setAttribute("aria-pressed", "false");
    }
    playbackStart = 0;
    playbackBeatOffset = 0;
    progressBar.style.width = "0%";
    timeStatus.textContent = `0:00 / ${formatTime(playbackDuration / 1000, true)}`;
    updateStatus();
  }

  function schedule(items, shouldLoop = false, startBeat = 0, liveResume = false) {
    clearTimers();
    if (liveResume) releaseAllInstruments();
    notes = [];
    const leadMs = playMode.value === "prepare" ? 2200 : playMode.value === "sync" ? 1600 : 0;
    const delayBefore = liveResume || playMode.value === "immediate" ? 0 : leadMs + 80;
    const start = performance.now() + delayBefore;
    playbackTotalBeats = sequenceLength(items);
    playbackBeatOffset = Math.max(0, Math.min(startBeat, playbackTotalBeats));
    playbackBpm = bpm();
    playbackDuration = 60000 / playbackBpm * playbackTotalBeats;
    playbackStart = start;
    playing = true;

    items.forEach(item => {
      const itemEnd = item.time + (item.duration || .5);
      if (itemEnd <= playbackBeatOffset) return;
      const alreadyStarted = item.time < playbackBeatOffset;
      const playableItem = alreadyStarted
        ? { ...item, duration: itemEnd - playbackBeatOffset }
        : item;
      const offset = 60000 / playbackBpm * Math.max(0, item.time - playbackBeatOffset);
      const hitTime = start + offset;
      if (leadMs) addVisual(playableItem, hitTime, leadMs);
      timers.push(setTimeout(() => {
        if (!leadMs) liveNote(playableItem.note, playableItem.duration, playableItem.velocity);
        else trigger(playableItem.note, playableItem.duration, playableItem.velocity);
      }, Math.max(0, delayBefore + offset)));
    });

    const remainingMs = 60000 / playbackBpm * (playbackTotalBeats - playbackBeatOffset);
    const finish = delayBefore + remainingMs + 250;
    timers.push(setTimeout(() => {
      playing = false;
      if (shouldLoop && loop) schedule(items, true, 0, false);
      else updateStatus();
    }, finish));
    updateStatus();
  }

  function rescheduleFromCurrentPosition(message) {
    if (!playing) {
      updateStatus();
      return;
    }
    const position = currentPlaybackBeat();
    schedule(currentItems(), loop, position, true);
    if (message) showToast(message);
  }

  async function play() {
    const items = currentItems();
    if (!items.length) return showToast("Last inn en MIDI-fil først.");
    try {
      await initAudio();
      schedule(items, loop, 0, false);
    } catch (error) {
      showToast(error.message || "Kunne ikke starte lyd.");
    }
  }

  function readVar(bytes, state) {
    let value = 0;
    let byte;
    do {
      if (state.pos >= bytes.length) throw new Error("Ufullstendig MIDI-fil.");
      byte = bytes[state.pos++];
      value = (value << 7) | (byte & 0x7f);
    } while (byte & 0x80);
    return value;
  }

  function ascii(bytes, start, length) {
    return String.fromCharCode(...bytes.slice(start, start + length));
  }

  function u16(bytes, pos) {
    return (bytes[pos] << 8) | bytes[pos + 1];
  }

  function u32(bytes, pos) {
    return ((bytes[pos] << 24) >>> 0) + (bytes[pos + 1] << 16) + (bytes[pos + 2] << 8) + bytes[pos + 3];
  }

  function parseMidi(buffer, name) {
    const bytes = new Uint8Array(buffer);
    if (ascii(bytes, 0, 4) !== "MThd" || bytes.length < 14) throw new Error("Dette ser ikke ut som en gyldig MIDI-fil.");
    const format = u16(bytes, 8);
    const trackCount = u16(bytes, 10);
    const division = u16(bytes, 12);
    if (division & 0x8000) throw new Error("SMPTE-tidskode støttes ikke ennå.");
    const ppq = division;
    let pos = 8 + u32(bytes, 4);
    const rawNotes = [];
    const tempos = [{ tick: 0, mpqn: 500000 }];

    for (let track = 0; track < trackCount; track++) {
      if (ascii(bytes, pos, 4) !== "MTrk") throw new Error("MIDI-sporet er skadet.");
      const length = u32(bytes, pos + 4);
      const end = pos + 8 + length;
      const state = { pos: pos + 8 };
      const active = new Map();
      let tick = 0;
      let running = 0;

      while (state.pos < end) {
        tick += readVar(bytes, state);
        let status = bytes[state.pos++];
        if (status < 0x80) {
          state.pos--;
          if (!running) throw new Error("Ugyldig MIDI-status.");
          status = running;
        } else if (status < 0xf0) {
          running = status;
        }

        if (status === 0xff) {
          const type = bytes[state.pos++];
          const size = readVar(bytes, state);
          if (type === 0x51 && size === 3) {
            tempos.push({ tick, mpqn: (bytes[state.pos] << 16) | (bytes[state.pos + 1] << 8) | bytes[state.pos + 2] });
          }
          state.pos += size;
          continue;
        }
        if (status === 0xf0 || status === 0xf7) {
          state.pos += readVar(bytes, state);
          continue;
        }

        const command = status & 0xf0;
        const channel = status & 0x0f;
        const data1 = bytes[state.pos++];
        const data2 = (command === 0xc0 || command === 0xd0) ? 0 : bytes[state.pos++];
        const key = `${channel}:${data1}`;

        if (command === 0x90 && data2 > 0) {
          if (!active.has(key)) active.set(key, []);
          active.get(key).push({ tick, note: data1, velocity: data2 });
        } else if (command === 0x80 || (command === 0x90 && data2 === 0)) {
          const starts = active.get(key);
          const start = starts?.shift();
          if (start) rawNotes.push({ ...start, endTick: Math.max(tick, start.tick + 1), track });
        }
      }
      pos = end;
    }

    if (!rawNotes.length) throw new Error("Fant ingen noter i MIDI-filen.");
    tempos.sort((a,b) => a.tick - b.tick);
    const uniqueTempos = tempos.filter((tempo, index) => index === tempos.length - 1 || tempo.tick !== tempos[index + 1].tick);
    function tickSeconds(target) {
      let seconds = 0;
      let previous = 0;
      let mpqn = uniqueTempos[0].mpqn;
      for (let i = 1; i < uniqueTempos.length && uniqueTempos[i].tick < target; i++) {
        const tempo = uniqueTempos[i];
        seconds += (tempo.tick - previous) * mpqn / 1000000 / ppq;
        previous = tempo.tick;
        mpqn = tempo.mpqn;
      }
      return seconds + (target - previous) * mpqn / 1000000 / ppq;
    }

    const initialBpm = Math.round(60000000 / uniqueTempos[0].mpqn);
    const secondsPerBeat = 60 / initialBpm;
    const items = rawNotes
      .sort((a,b) => a.tick - b.tick || a.note - b.note)
      .map(note => {
        const start = tickSeconds(note.tick);
        const end = tickSeconds(note.endTick);
        return {
          note: midiName(note.note),
          time: start / secondsPerBeat,
          duration: Math.max(.05, (end - start) / secondsPerBeat),
          velocity: note.velocity
        };
      });
    return { name, format, tracks: trackCount, ppq, bpm: initialBpm, items };
  }

  async function loadMidi(file) {
    if (!IS_PRO) {
      showProUpgrade("Egne MIDI-filer er med i VIP.");
      midiFile.value = "";
      return;
    }
    if (!file || !/\.midi?$/i.test(file.name)) return showToast("Velg en .mid- eller .midi-fil.");
    try {
      midiSong = parseMidi(await file.arrayBuffer(), file.name.replace(/\.midi?$/i, ""));
      midiSong.source = "upload";
      uploadedMidiSong = midiSong;
      bpmInput.value = Math.max(40, Math.min(220, midiSong.bpm));
      sourceSelect.value = "midi";
      populatePresets();
      playbackDuration = beatsToMs(sequenceLength(midiSong.items));
      showToast(`${midiSong.items.length} noter lastet fra ${file.name}`);
      updateStatus();
    } catch (error) {
      showToast(error.message || "Kunne ikke lese MIDI-filen.");
    } finally {
      midiFile.value = "";
    }
  }

  function formatTime(seconds, roundUp = false) {
    if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
    seconds = roundUp ? Math.ceil(seconds) : Math.floor(seconds);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
  }

  function updateStatus() {
    const item = sourceSelect.value === "midi"
      ? midiSong?.name || "Ingen MIDI-fil"
      : sourceSelect.value === "scale"
        ? `${rootSelect.value} ${scaleLabel(scaleSelect.value)}`
        : PRESETS[presetSelect.value]?.label || "Enkel melodi";
    pieceStatus.textContent = item;
    const source = sourceSelect.value === "midi"
      ? midiSong
        ? `${midiSong.items.length} noter · ${midiSong.tracks} spor`
        : "Velg eksempel eller last inn fil"
      : `${rootSelect.value} ${scaleLabel(scaleSelect.value).toLowerCase()}`;
    if (!playing) {
      playbackDuration = beatsToMs(sequenceLength(currentItems()));
      timeStatus.textContent = `0:00 / ${formatTime(playbackDuration / 1000, true)}`;
    }
    detailStatus.textContent = `${source} · ${bpm()} BPM · ${playing ? "Spiller" : audioReady ? "Klar" : "Klikk Spill for lyd"}`;
    requestAnimationFrame(positionHint);
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 3400);
  }

  function showProUpgrade(message) {
    showToast(message);
    window.setTimeout(() => {
      window.top.location.href = PRO_URL;
    }, 450);
  }

  function applyProAccess() {
    document.body.classList.toggle("has-pro", IS_PRO);
    if (IS_PRO) return;

    soundPreset.value = "original";
    soundPreset.disabled = true;
    soundControlIds.forEach(id => {
      if (id in SOUND_PRESETS.original) soundControls[id].value = SOUND_PRESETS.original[id];
    });
    updateSoundLabels();
    sustainOn = false;
    sustainPedal.setAttribute("aria-pressed", "false");
    sustainPedal.disabled = true;
    soundControlIds.forEach(id => { soundControls[id].disabled = true; });
    soundProNotice.hidden = false;
    soundGrid.classList.add("is-locked");
    midiFileButton.classList.add("is-locked");
  }

  function sparkle(x, y) {
    for (let i = 0; i < 10; i++) {
      particles.push({ x, y, dx: (Math.random() - .5) * 1.8, dy: -Math.random() * 2.4 - .2, size: 1 + Math.random() * 2.4, life: 35 + Math.random() * 22 });
    }
  }

  function drawBackground(width, height) {
    if (mode.value === "flow") {
      ctx.fillStyle = "rgba(5,7,10,.11)";
      ctx.fillRect(0, 0, width, height);
      const gradient = ctx.createRadialGradient(width * .5, height * .35, 30, width * .5, height * .35, width * .55);
      gradient.addColorStop(0, "rgba(90,210,255,.06)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.clearRect(0, 0, width, height);
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "#07101a");
      gradient.addColorStop(1, "#030508");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }
  }

  function drawKeyboard(width, height) {
    const kh = keyboardHeight();
    const y = height - kh;
    keys.filter(k => k.type === "white").forEach(key => {
      const inScale = activeScale.includes(key.note.replace(/-?\d+/g, ""));
      ctx.fillStyle = activeKeys[key.note] || "#f4f8fb";
      ctx.fillRect(key.x, y, whiteWidth, kh);
      ctx.strokeStyle = "#18202b";
      ctx.strokeRect(key.x, y, whiteWidth, kh);
      if (mode.value === "learn" && inScale && !activeKeys[key.note]) {
        ctx.fillStyle = "rgba(88,239,154,.12)";
        ctx.fillRect(key.x, y, whiteWidth, kh);
      }
    });
    keys.filter(k => k.type === "black").forEach(key => {
      const inScale = activeScale.includes(key.note.replace(/-?\d+/g, ""));
      ctx.fillStyle = activeKeys[key.note] || (inScale && mode.value === "learn" ? "#20313c" : "#10151c");
      ctx.fillRect(key.x, y, blackWidth, kh * .62);
    });
    if (mode.value === "learn") {
      ctx.strokeStyle = "rgba(255,255,255,.16)";
      ctx.setLineDash([7,6]);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function drawNotes(now, height) {
    notes.forEach(note => {
      if (note.live) {
        note.y += note.liveSpeed;
      } else {
        const total = note.hitY + note.length;
        const span = Math.max(1, note.hitTime - note.spawnTime);
        note.y = -note.length + total * Math.max(0, Math.min(1.25, (now - note.spawnTime) / span));
        if (!note.sounded && now >= note.hitTime) {
          note.sounded = true;
          setActive(note.note);
          if (mode.value === "flow") sparkle(note.x + 10, note.hitY - 8);
        }
      }
      ctx.fillStyle = noteColor(note.note);
      if (!note.live && note.prepare && note.hitY - (note.y + note.length) < 55 && note.hitY - (note.y + note.length) > 0) ctx.fillStyle = "#ffe678";
      ctx.shadowBlur = mode.value === "flow" ? 18 : 10;
      ctx.shadowColor = ctx.fillStyle;
      ctx.fillRect(note.x, note.y, note.width, note.length);
      if (note.y > height + 100) note.dead = true;
    });
    notes = notes.filter(note => !note.dead);
    ctx.shadowBlur = 0;
  }

  function drawParticles() {
    if (mode.value !== "flow") return;
    particles.forEach(p => {
      ctx.fillStyle = `rgba(160,235,255,${Math.max(0, p.life / 56)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      p.x += p.dx; p.y += p.dy; p.life--;
    });
    particles = particles.filter(p => p.life > 0);
  }

  function animate(now) {
    const { width, height } = viewport();
    drawBackground(width, height);
    drawNotes(now, height);
    drawParticles();
    drawKeyboard(width, height);
    if (playing && playbackStart) {
      const beat = currentPlaybackBeat(now);
      const percent = playbackTotalBeats ? beat / playbackTotalBeats * 100 : 0;
      const elapsed = beat * 60000 / playbackBpm;
      progressBar.style.width = `${percent}%`;
      timeStatus.textContent = `${formatTime(elapsed / 1000)} / ${formatTime(playbackDuration / 1000, true)}`;
    }
    requestAnimationFrame(animate);
  }

  function keyAt(x, y) {
    const { height } = viewport();
    const top = height - keyboardHeight();
    if (y < top) return null;
    const black = keys.find(key => key.type === "black" && x >= key.x && x <= key.x + blackWidth && y <= top + keyboardHeight() * .62);
    return black || keys.find(key => key.type === "white" && x >= key.x && x <= key.x + whiteWidth);
  }

  async function pointerNote(event) {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const key = keyAt(event.clientX - rect.left, event.clientY - rect.top);
    if (!key) return;
    try {
      await initAudio();
      liveNote(key.note);
      updateStatus();
    } catch (error) {
      showToast(error.message || "Kunne ikke starte lyd.");
    }
  }

  playBtn.addEventListener("click", play);
  stopBtn.addEventListener("click", () => stop(true));
  loopBtn.addEventListener("click", () => {
    loop = !loop;
    loopBtn.setAttribute("aria-pressed", String(loop));
    if (loop && !playing) play();
  });
  mode.addEventListener("change", () => { updateSound(); updateStatus(); });
  colorMode.addEventListener("change",saveColorMode);
  soundPreset.addEventListener("change", () => {
    const selectedSound = soundPreset.value;
    soundPreset.blur();
    applySoundPreset(selectedSound);
  });
  sustainPedal.addEventListener("click", () => {
    sustainOn = !sustainOn;
    sustainPedal.setAttribute("aria-pressed", String(sustainOn));
    saveSoundSettings();
    showToast(`Sustain-pedal: ${sustainOn ? "på" : "av"}`);
  });
  soundControlIds.forEach(id => {
    soundControls[id].addEventListener("input", applySoundSettings);
  });
  playMode.addEventListener("change", () => {
    const label = playMode.options[playMode.selectedIndex]?.textContent || playMode.value;
    rescheduleFromCurrentPosition(`Avspilling: ${label} · fortsetter fra samme sted`);
  });
  rootSelect.addEventListener("change", updateScale);
  scaleSelect.addEventListener("change", updateScale);
  sourceSelect.addEventListener("change", populatePresets);
  presetSelect.addEventListener("change", () => {
    if (sourceSelect.value === "midi") selectMidiPreset(presetSelect.value);
    else if (sourceSelect.value === "melody") {
      bpmInput.value = PRESETS[presetSelect.value]?.bpm || 120;
      if (playing) rescheduleFromCurrentPosition(`Tempo: ${bpm()} BPM · fortsetter fra samme sted`);
      else updateStatus();
    } else updateStatus();
  });
  function applyTempoChange(announce = false) {
    const value = Number(bpmInput.value);
    if (!Number.isFinite(value)) return;
    bpmInput.value = bpm();
    rescheduleFromCurrentPosition(announce ? `Tempo: ${bpm()} BPM · fortsetter fra samme sted` : "");
  }
  bpmInput.addEventListener("change", () => {
    clearTimeout(tempoTimer);
    applyTempoChange(true);
  });
  bpmInput.addEventListener("keydown", event => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    bpmInput.blur();
  });
  function stepTempo(amount) {
    bpmInput.value = Math.max(40, Math.min(220, bpm() + amount));
    applyTempoChange(true);
  }
  bpmDown.addEventListener("click", () => stepTempo(-1));
  bpmUp.addEventListener("click", () => stepTempo(1));
  midiFile.addEventListener("change", event => loadMidi(event.target.files[0]));
  midiFileButton.addEventListener("click", event => {
    if (IS_PRO) return;
    event.preventDefault();
    showProUpgrade("Last opp egne MIDI-filer med VIP.");
  });
  canvas.addEventListener("pointerdown", pointerNote);

  let dragDepth = 0;
  window.addEventListener("dragenter", event => {
    event.preventDefault();
    if (!IS_PRO) return;
    dragDepth++;
    dropZone.hidden = false;
  });
  window.addEventListener("dragover", event => event.preventDefault());
  window.addEventListener("dragleave", event => {
    event.preventDefault();
    if (--dragDepth <= 0) { dragDepth = 0; dropZone.hidden = true; }
  });
  window.addEventListener("drop", event => {
    event.preventDefault();
    dragDepth = 0;
    dropZone.hidden = true;
    if (!IS_PRO) return showProUpgrade("Last opp egne MIDI-filer med VIP.");
    loadMidi(event.dataTransfer.files[0]);
  });

  document.addEventListener("keydown", async event => {
    const map = { a:"C4",w:"C#4",s:"D4",e:"D#4",d:"E4",f:"F4",t:"F#4",g:"G4",y:"G#4",h:"A4",u:"A#4",j:"B4",k:"C5" };
    const note = map[event.key.toLowerCase()];
    const isSoundMenu = event.target === soundPreset;
    const isEditingField = event.target.matches("select, input:not([type='range'])");
    if (isEditingField && !isSoundMenu) return;
    if (isSoundMenu && (note || event.key === " ")) {
      event.preventDefault();
      soundPreset.blur();
    }
    if (event.key === " ") {
      event.preventDefault();
      return play();
    }
    if (!note || event.repeat) return;
    try {
      await initAudio();
      liveNote(note);
      updateStatus();
    } catch (error) {
      showToast(error.message || "Kunne ikke starte lyd.");
    }
  });

  window.addEventListener("resize", resize);
  window.visualViewport?.addEventListener("resize", resize);
  resize();
  restoreColorMode();
  restoreSoundSettings();
  applyProAccess();
  populatePresets();
  loadScales();
  playbackDuration = beatsToMs(sequenceLength(currentItems()));
  updateStatus();
  requestAnimationFrame(animate);
})();
