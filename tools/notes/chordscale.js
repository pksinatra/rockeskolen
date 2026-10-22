(() => {
  const params = new URLSearchParams(window.location.search);
  const card = document.querySelector(".cs-card");
  const lang = card?.dataset.lang === "no" ? "no" : "en";
  const strings = lang === "no"
    ? { title: "C-dur og C-jonisk", explanation: (chord) => `${chord} er akkordtonene. De vises i f-nøkkelen og danner fundamentet under skalaen i g-nøkkelen.`, playingTogether: "Spiller akkord og skala", playingChord: "Spiller akkorden", playingMelody: "Spiller skalaen", stopped: "Avspilling stoppet" }
    : { title: "C major and C Ionian", explanation: (chord) => `${chord} are the chord tones. They appear in the bass clef and form the foundation beneath the scale in the treble clef.`, playingTogether: "Playing chord and scale", playingChord: "Playing the chord", playingMelody: "Playing the scale", stopped: "Playback stopped" };

  const NOTE_RE = /^([A-Ga-g])([#b]?)(-?\d)$/;
  const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const BLACK_PCS = new Set([1, 3, 6, 8, 10]);
  const SHARP_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const DEFAULT_CHORD = ["C3", "E3", "G3"];
  const DEFAULT_MELODY = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"];
  const tempo = Math.min(240, Math.max(30, Number(params.get("tempo")) || 90));
  // Eight scale tones fill one 4/4 measure as eighth notes.
  const stepMs = 30000 / tempo;

  function parseList(name, fallback) {
    const raw = params.get(name);
    if (!raw) return [...fallback];
    const notes = raw.split(",").map(note => note.trim()).filter(Boolean);
    return notes.length && notes.every(note => NOTE_RE.test(note)) ? notes.map(normalizeNote) : [...fallback];
  }

  function normalizeNote(note) {
    const match = note.match(NOTE_RE);
    return `${match[1].toUpperCase()}${match[2]}${match[3]}`;
  }

  function noteToMidi(note) {
    const match = note.match(NOTE_RE);
    const accidental = match[2] === "#" ? 1 : match[2] === "b" ? -1 : 0;
    return (Number(match[3]) + 1) * 12 + ((PC[match[1].toUpperCase()] + accidental + 12) % 12);
  }

  function midiToName(midi) {
    return `${SHARP_NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
  }

  function vexKey(note) {
    const match = note.match(NOTE_RE);
    return `${match[1].toLowerCase()}${match[2]}/${match[3]}`;
  }

  function addAccidental(vfNote, note, index = 0) {
    const accidental = note.match(NOTE_RE)?.[2];
    if (accidental) vfNote.addModifier(new Vex.Flow.Accidental(accidental), index);
  }

  const chordNotes = parseList("chord", DEFAULT_CHORD);
  const melodyNotes = parseList("melody", DEFAULT_MELODY);
  const chordMidis = chordNotes.map(noteToMidi);
  const melodyMidis = melodyNotes.map(noteToMidi);
  const chordLabel = chordNotes.map(note => note.replace(/-?\d$/, "")).join("–");
  const customTitle = (params.get("title") || "").trim();

  document.getElementById("csTitle").textContent = customTitle || strings.title;
  document.getElementById("csExplanation").textContent = strings.explanation(chordLabel);

  function renderNotation() {
    const host = document.getElementById("grandStaff");
    host.innerHTML = "";
    const width = Math.max(560, host.clientWidth || 820);
    const height = 250;
    const VF = Vex.Flow;
    const renderer = new VF.Renderer(host, VF.Renderer.Backends.SVG);
    renderer.resize(width, height);
    const context = renderer.getContext();
    const staveWidth = width - 28;
    const treble = new VF.Stave(14, 22, staveWidth).addClef("treble").addTimeSignature("4/4");
    const bass = new VF.Stave(14, 132, staveWidth).addClef("bass").addTimeSignature("4/4");
    treble.setContext(context).draw();
    bass.setContext(context).draw();
    new VF.StaveConnector(treble, bass).setType(VF.StaveConnector.type.BRACE).setContext(context).draw();
    new VF.StaveConnector(treble, bass).setType(VF.StaveConnector.type.SINGLE_LEFT).setContext(context).draw();

    const melodyVf = melodyNotes.map(note => {
      const stemDirection = noteToMidi(note) >= noteToMidi("B4") ? -1 : 1;
      const vfNote = new VF.StaveNote({ clef: "treble", keys: [vexKey(note)], duration: "8", stem_direction: stemDirection });
      addAccidental(vfNote, note);
      return vfNote;
    });
    const melodyVoice = new VF.Voice({ num_beats: 4, beat_value: 4 }).setStrict(false);
    melodyVoice.addTickables(melodyVf);
    new VF.Formatter().joinVoices([melodyVoice]).format([melodyVoice], staveWidth - 105);
    melodyVoice.draw(context, treble);

    const chordVf = new VF.StaveNote({ clef: "bass", keys: chordNotes.map(vexKey), duration: "w" });
    chordNotes.forEach((note, index) => addAccidental(chordVf, note, index));
    const chordVoice = new VF.Voice({ num_beats: 4, beat_value: 4 }).setStrict(false);
    chordVoice.addTickables([chordVf]);
    new VF.Formatter().joinVoices([chordVoice]).format([chordVoice], staveWidth - 105);
    chordVoice.draw(context, bass);

    const rendered = [...host.querySelectorAll(".vf-stavenote")];
    rendered.slice(0, melodyNotes.length).forEach((element, index) => {
      element.classList.add("notation-melody");
      element.dataset.index = String(index);
    });
    rendered.at(-1)?.classList.add("notation-chord");
  }

  function renderKeyboard() {
    const host = document.getElementById("keyboard");
    host.innerHTML = "";
    const allMidis = [...chordMidis, ...melodyMidis];
    const minMidi = Math.min(...allMidis);
    const maxMidi = Math.max(...allMidis);
    const startMidi = minMidi - (((minMidi % 12) + 12) % 12);
    let endMidi = maxMidi + ((12 - (maxMidi % 12)) % 12);
    if (endMidi === startMidi) endMidi += 12;
    const whiteMidis = [];
    for (let midi = startMidi; midi <= endMidi; midi += 1) {
      if (!BLACK_PCS.has(midi % 12)) whiteMidis.push(midi);
    }
    const whiteW = 44;
    host.style.width = `${whiteMidis.length * whiteW}px`;

    whiteMidis.forEach(midi => {
      const key = createKey(midi, "white");
      if (midi % 12 === 0) {
        const label = document.createElement("span");
        label.className = "key-label";
        label.textContent = midiToName(midi);
        key.appendChild(label);
      }
      host.appendChild(key);
    });

    for (let midi = startMidi; midi <= endMidi; midi += 1) {
      if (!BLACK_PCS.has(midi % 12)) continue;
      const previousWhites = whiteMidis.filter(whiteMidi => whiteMidi < midi).length;
      const key = createKey(midi, "black");
      key.style.left = `${previousWhites * whiteW - 13.5}px`;
      host.appendChild(key);
    }
  }

  function createKey(midi, colour) {
    const key = document.createElement("div");
    key.className = `key ${colour}`;
    key.dataset.midi = String(midi);
    key.setAttribute("role", "button");
    key.tabIndex = 0;
    key.setAttribute("aria-label", midiToName(midi));
    const inChord = chordMidis.includes(midi);
    const inMelody = melodyMidis.includes(midi);
    if (inChord) key.classList.add("chord-tone");
    if (inMelody) key.classList.add("melody-tone");
    if (inChord || inMelody) {
      const badge = document.createElement("span");
      badge.className = `tone-badge ${inChord ? "chord" : "melody"}`;
      badge.textContent = midiToName(midi);
      key.appendChild(badge);
    }
    const play = async () => {
      await Tone.start();
      melodySynth.triggerAttackRelease(midiToName(midi), "8n");
      key.classList.add(inChord ? "playing-chord" : "playing-melody");
      setTimeout(() => key.classList.remove("playing-chord", "playing-melody"), 430);
    };
    key.addEventListener("click", play);
    key.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); play(); }
    });
    return key;
  }

  const chordSynth = new Tone.PolySynth(Tone.Synth).toDestination();
  const melodySynth = new Tone.PolySynth(Tone.Synth).toDestination();
  let timers = [];

  function setChordPlaying(active) {
    document.querySelectorAll(".notation-chord").forEach(note => note.classList.toggle("is-playing", active));
    chordMidis.forEach(midi => document.querySelector(`.key[data-midi="${midi}"]`)?.classList.toggle("playing-chord", active));
  }

  function setMelodyPlaying(index) {
    document.querySelectorAll(".notation-melody").forEach((note, noteIndex) => note.classList.toggle("is-playing", noteIndex === index));
    document.querySelectorAll(".key.playing-melody").forEach(key => key.classList.remove("playing-melody"));
    const midi = melodyMidis[index];
    if (midi !== undefined) document.querySelector(`.key[data-midi="${midi}"]`)?.classList.add("playing-melody");
  }

  function stop() {
    timers.forEach(clearTimeout);
    timers = [];
    chordSynth.releaseAll();
    melodySynth.releaseAll();
    setChordPlaying(false);
    setMelodyPlaying(-1);
    document.body.classList.remove("is-playing");
  }

  async function playChord() {
    stop();
    await Tone.start();
    document.body.classList.add("is-playing");
    setChordPlaying(true);
    chordSynth.triggerAttackRelease(chordNotes, Math.max(.8, stepMs * 8 / 1000));
    timers.push(setTimeout(() => { setChordPlaying(false); document.body.classList.remove("is-playing"); }, Math.max(900, stepMs * 8 + 100)));
    document.getElementById("playbackStatus").textContent = strings.playingChord;
  }

  async function playMelody(withChord = false) {
    stop();
    await Tone.start();
    document.body.classList.add("is-playing");
    const totalSeconds = (melodyNotes.length * stepMs + 150) / 1000;
    if (withChord) {
      setChordPlaying(true);
      chordSynth.triggerAttackRelease(chordNotes, totalSeconds);
    }
    melodyNotes.forEach((note, index) => {
      timers.push(setTimeout(() => {
        melodySynth.triggerAttackRelease(note, "8n");
        setMelodyPlaying(index);
      }, index * stepMs));
    });
    timers.push(setTimeout(() => {
      stop();
      document.getElementById("playbackStatus").textContent = strings.stopped;
    }, melodyNotes.length * stepMs + 160));
    document.getElementById("playbackStatus").textContent = withChord ? strings.playingTogether : strings.playingMelody;
  }

  document.getElementById("playTogether").addEventListener("click", () => playMelody(true));
  document.getElementById("playChord").addEventListener("click", playChord);
  document.getElementById("playMelody").addEventListener("click", () => playMelody(false));
  document.getElementById("stopPlayback").addEventListener("click", () => {
    stop();
    document.getElementById("playbackStatus").textContent = strings.stopped;
  });

  renderNotation();
  renderKeyboard();
  window.addEventListener("resize", () => {
    clearTimeout(window.__csResizeTimer);
    window.__csResizeTimer = setTimeout(renderNotation, 120);
  });
})();
