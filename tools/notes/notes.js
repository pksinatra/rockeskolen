  let currentScaleNotes = [];
  let currentVexNotes = [];
  let currentCtx = null;
  let currentStave = null;
  let playTimeouts = [];

  (function () {

    const VF = Vex.Flow;
    const synth = new Tone.PolySynth(Tone.Synth).toDestination();

    /* =========================
       URL-parametre
       ========================= */
    function param(name, fallback) {
      return new URLSearchParams(window.location.search).get(name) || fallback;
    }

    /* =========================
       Skala-data
       ========================= */
    async function loadScales() {
      const res = await fetch("/data/scales.json");
      return await res.json();
    }



  // --- Accidentals / fortegn logic (per measure) -----------------------------

  function normalizeAccText(s) {
    return String(s)
      .replace(/♯/g, '#')
      .replace(/𝄪/g, '##')
      .replace(/♭/g, 'b')
      .replace(/𝄫/g, 'bb')
      .replace(/♮/g, 'n')
      .trim();
  }

  // Expects spellings like: "C", "Db", "E♭", "F#", "Bb", "C5" etc.
  // Returns: { letter:'c'..'g', acc:'#'|'b'|'##'|'bb'|null, octave:number|null }
  function parseSpelling(spelling) {
    const s0 = normalizeAccText(spelling);

    // Allow formats like "Db4", "Db/4", "D♭ 4"
    const s = s0.replace(/\s+/g, '').replace('/', '');

    // Letter + optional accidental + optional octave
    const m = s.match(/^([A-Ga-g])((?:##|bb|#|b|n)?)\s*([0-9]+)?$/);
    if (!m) return null;

    const letter = m[1].toLowerCase();
    const accRaw = m[2] || '';
    const octave = (m[3] !== undefined) ? parseInt(m[3], 10) : null;

    // Treat explicit natural "n" as "n" accidental request
    const acc = accRaw === '' ? null : accRaw;

    return { letter, acc, octave };
  }

  // Convert spelling to VexFlow key string, e.g. "Db4" -> "db/4", "F#4" -> "f#/4", "C4" -> "c/4"
function spellingToVfKey(spelling, fallbackOctave = 4) {

  const m = spelling.match(/^([A-Ga-g])([#b]{0,2})(\d)$/);

  if (!m) {
    return "c/" + fallbackOctave;
  }

  const letter = m[1].toLowerCase();
  const accidental = m[2] || "";
  const octave = m[3] || fallbackOctave;

  return letter + accidental + "/" + octave;
}


  // Apply per-measure accidental rules.
  // - accidental state is tracked per pitch position (letter+octave) within the bar
  // - reset when a new measure starts
  function applyAccidentalsToNotes(vfNotes, spellings, keyAccidentals = [], {
    beatsPerBar = 4
  } = {}) {
    const state = new Map(); // key: "e/4" (letter+octave) -> last accidental in bar: '#','b','##','bb', or 'n' (natural)

    // Very lightweight bar tracking:
    // Assumes your scale notes are quarters in 4/4 (like in screenshot). If you already compute bars elsewhere,
    // call state.clear() exactly when you add a barline.
    let beatCounter = 0;

  function accFromDiff(diff) {
    if (diff === 0) return "";
    if (diff === 1) return "#";
    if (diff === 2) return "##";
    if (diff === -1) return "b";
    if (diff === -2) return "bb";
    // fallback (burde ikke skje i normale skalaer)
    return diff > 0 ? "#".repeat(diff) : "b".repeat(-diff);
  }

  function signedDiffPc(targetPc, naturalPc) {
    let d = (targetPc - naturalPc + 12) % 12;
    if (d > 6) d -= 12;   // gjør diff til -6..+6
    return d;
  }

    for (let i = 0; i < vfNotes.length; i++) {
      const spelling = spellings[i];
      const p = parseSpelling(spelling);

      // If parsing fails, skip
      if (!p) continue;

      const oct = (p.octave == null) ? null : p.octave;
      // Build a "position key" for accidental memory: letter + octave (octave is important on staff)
      const posKey = (oct == null) ? p.letter : `${p.letter}${oct}`;

  const prevAcc = state.get(posKey); // '#','b','bb','##','n', null/undefined

  // baseAcc: hva noten eksplisitt sier (b/#/bb/##) – eller null hvis ingen
  const baseAcc = p.acc ? p.acc : null;

  // desiredAcc: hva vi skal TEGNE nå
  let desiredAcc = baseAcc;

  // Hvis tonen nå er natural (ingen b/#), men tidligere i samme takt var den b/#
  // → vi må tegne ♮
  if (baseAcc === null && (prevAcc === 'b' || prevAcc === '#' || prevAcc === 'bb' || prevAcc === '##')) {
    desiredAcc = 'n';
  }

  // Tegn fortegn ved behov
  if (prevAcc === undefined) {
    // første gang i takten: tegn b/# hvis vi har det
    if (desiredAcc === 'b' || desiredAcc === '#' || desiredAcc === 'bb' || desiredAcc === '##') {
      vfNotes[i].addModifier(new Vex.Flow.Accidental(desiredAcc), 0);
    }
  } else if (prevAcc !== desiredAcc) {
    // endring i samme takt
    if (desiredAcc === 'n') {
      vfNotes[i].addModifier(new Vex.Flow.Accidental('n'), 0);
    } else if (desiredAcc === 'b' || desiredAcc === '#' || desiredAcc === 'bb' || desiredAcc === '##') {
      vfNotes[i].addModifier(new Vex.Flow.Accidental(desiredAcc), 0);
    }
  }

  // Oppdater state: hva som nå gjelder for denne posisjonen i resten av takten
  if (desiredAcc === 'n') {
    state.set(posKey, 'n');
  } else if (desiredAcc === 'b' || desiredAcc === '#' || desiredAcc === 'bb' || desiredAcc === '##') {
    state.set(posKey, desiredAcc);
  } else {
    // natural uten symbol: behold null hvis vi ikke har sett denne posKey før
    if (!state.has(posKey)) state.set(posKey, null);
  }


      // --- bar reset ---
      // If your notes are all quarter-notes in 4/4, each note = 1 beat.
      // If you have mixed durations, replace this with your existing duration math.
      beatCounter += 1;

      if (beatCounter >= beatsPerBar) {
        beatCounter = 0;
        state.clear();
      }
    }

    return vfNotes;
  }



  // FRA FØR: 

  const NOTE_NAMES = {
    "C": 0,
    "C#": 1, "Db": 1,
    "D": 2,
    "D#": 3, "Eb": 3,
    "E": 4, "Fb": 4,
    "E#": 5, "F": 5,
    "F#": 6, "Gb": 6,
    "G": 7,
    "G#": 8, "Ab": 8,
    "A": 9,
    "A#": 10, "Bb": 10,
    "B": 11, "Cb": 11
  };

  const LETTERS = ["C","D","E","F","G","A","B"];

  const NATURAL_PC = {
    C:0,
    D:2,
    E:4,
    F:5,
    G:7,
    A:9,
    B:11
  };

  function accFromDiff(diff) {
    if (diff === 0) return "";
    if (diff === 1) return "#";
    if (diff === 2) return "##";
    if (diff === -1) return "b";
    if (diff === -2) return "bb";
    return diff > 0 ? "#".repeat(diff) : "b".repeat(-diff);
  }

  function signedDiffPc(targetPc, naturalPc) {
    let d = (targetPc - naturalPc + 12) % 12;
    if (d > 6) d -= 12;
    return d;
  }


  const SEMITONE_TO_NOTE_SHARP = [
    "C","C#","D","D#","E","F","F#","G","G#","A","A#","B"
  ];

  const SEMITONE_TO_NOTE_FLAT = [
    "C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"
  ];

  function preferSharps(key) {
    return key.includes("#");
  }

  function midiToNote(midi, key="C") {
    const table = preferSharps(key)
      ? SEMITONE_TO_NOTE_SHARP
      : SEMITONE_TO_NOTE_FLAT;

    const note = table[midi % 12];
    const oct  = Math.floor(midi / 12) - 1;

    return note + oct;
  }

  function noteToMidi(note, oct) {
    const p = parseSpelling(note);
    if (!p) throw new Error("Ukjent note: " + note);

    const letter = p.letter.toUpperCase();
    const acc = (p.acc && p.acc !== "n") ? p.acc : "";

    const base = NATURAL_PC[letter];
    if (base === undefined) throw new Error("Ukjent bokstav: " + letter);

    const shift =
      (acc === "#"  ? 1 :
       acc === "##" ? 2 :
       acc === "b"  ? -1 :
       acc === "bb" ? -2 : 0);

    const semi = (base + shift + 12) % 12;
    return (oct + 1) * 12 + semi;
  }

  function getKeySignature(root, type) {
    if (type === "major") return root;
    if (type === "nat_minor") return root + "m";
    return null; // pentatonisk, blues osv
  }
function buildScale(root, type, oct, scales) {

  const scale = scales[type];
  if (!scale) throw new Error("Ukjent skala: " + type);

  const pr = parseSpelling(root);
  if (!pr) throw new Error("Ugyldig root: " + root);

  const rootLetter = pr.letter.toUpperCase();
  const rootAcc = (pr.acc && pr.acc !== "n") ? pr.acc : "";
  const rootMidi = noteToMidi(rootLetter + rootAcc, oct);

  const intervals = [...scale.intervals, 12];

  // ✅ Diatonisk spelling kun for 7-toneskalaer
  const isHeptatonic = scale.intervals.length === 7;

  if (!isHeptatonic) {
    // Pentatonisk/blues/etc: trygg spelling uten ###/bbb
    return intervals.map(semi => midiToNote(rootMidi + semi, root));
  }

  // Heptatonisk: teoretisk korrekt (E#, B# osv.)
  const rootIndex = LETTERS.indexOf(rootLetter);

  return intervals.map((semi, degree) => {

    const midi = rootMidi + semi;
    const targetPc = midi % 12;

    const letter = LETTERS[(rootIndex + degree) % 7];
    const naturalPc = NATURAL_PC[letter];

    const diff = signedDiffPc(targetPc, naturalPc);
    const acc = accFromDiff(diff);

    const octave = oct + Math.floor((rootIndex + degree) / 7);

    return `${letter}${acc}${octave}`;
  });
}

  function getKeyAccidentals(keySig) {
    if (!keySig) return [];

    const ks = new VF.KeySignature(keySig);

    // VexFlow kan mangle accidentals i enkelte versjoner
    if (!ks.accidentals || !Array.isArray(ks.accidentals)) return [];

    return ks.accidentals.map(a => a.note.toUpperCase());
  }

  function normalizeNoteForKey(note, keySig) {
    return note;
  }
  function normalizeKey(root, type) {

    if (type === "major") {

      if (root === "D#") return "Eb";
      if (root === "G#") return "Ab";
      if (root === "A#") return "Bb";

    }

    return root;
  }



    /* =========================
       VexFlow-konvertering
       ========================= */
    function toVex(note) {
      note = note.replace("♭","b").replace("♯","#");
      const m = note.match(/^([A-G])([#b]?)(\d)$/);
      return m ? m[1].toLowerCase() + m[2] + "/" + m[3] : "c/4";
    }

    /* =========================
       Render
       ========================= */
 async function render() {

const rootRaw = param("root","C");
const type = param("type","major");
const oct  = parseInt(param("oct","4"),10);

const theoretical = param("theoretical","0") === "1";

// Normaliser bare hvis vi ikke viser teoretisk toneart
const root = theoretical ? rootRaw : normalizeKey(rootRaw, type);

  const scales = await loadScales();

  currentScaleNotes = buildScale(root, type, oct, scales);
  
  // ===== Pianoroll-adapter =====
  window.RK_PIANOROLL_STATE = {
    baseMidi: 60, // C4
    rows: 13,     // C4–C5
    events: currentScaleNotes.map((note, i) => {
      const m = note.match(/^([A-G][b#]{0,2})(\d)$/);
      if (!m) return null;

      const midi = noteToMidi(m[1], parseInt(m[2], 10));

      return {
        beatStart: i,
        beatLen: 1,
        midis: [midi],
        label: note
      };
    }).filter(Boolean),
    activeIdx: -1
  };
  window.dispatchEvent(new Event("rk-pianoroll-ready"));


      const host = document.getElementById("notation");
      host.innerHTML = "";
  // Tving hvit bakgrunn uansett tema
  host.style.background = "#ffffff";

  const width = host.clientWidth || 600;

  const renderer = new VF.Renderer(host, VF.Renderer.Backends.SVG);
  renderer.resize(width, 140);

  currentStave = new VF.Stave(10, 40, width - 20);


      currentCtx = renderer.getContext();

  currentStave.addClef("treble");

const keySig = theoretical ? null : getKeySignature(root, type);

if (keySig) {
  currentStave.addKeySignature(keySig);
}

  currentStave.setContext(currentCtx).draw();


      /* 👻 Luft etter G-nøkkel */
      currentVexNotes = [];
      currentVexNotes.push(new VF.GhostNote({ duration: "8" }));
  currentScaleNotes.forEach(n => {

  const midi = noteToMidi(
    n.match(/^([A-G][b#]{0,2})/)[1],
    parseInt(n.match(/(\d)$/)[1], 10)
  );

  const match = n.match(/^([A-G][b#]{0,2})(\d)$/);
  const letter = match[1][0];
  const octave = parseInt(match[2], 10);

  let stemDirection;

  if (octave > 4) {
    stemDirection = VF.Stem.DOWN;
  }
  else if (octave < 4) {
    stemDirection = VF.Stem.UP;
  }
  else {
    stemDirection = (letter === "B")
      ? VF.Stem.DOWN
      : VF.Stem.UP;
  }

  currentVexNotes.push(
    new VF.StaveNote({
      clef: "treble",
      keys: [spellingToVfKey(n, oct)],
      duration: "q",
      stem_direction: stemDirection
    })
  );

  });


  // 🎼 Løse fortegn: kun når det IKKE finnes nøkkelsignatur
  if (!keySig) {
    applyAccidentalsToNotes(
      currentVexNotes.slice(1), // hopp over GhostNote
      currentScaleNotes,
      [],
      { beatsPerBar: 4 }
    );
  }

      const voice = new VF.Voice({
        num_beats: currentVexNotes.length,
        beat_value: 4
      }).setStrict(false);

      voice.addTickables(currentVexNotes);
      new VF.Formatter().joinVoices([voice]).format([voice], width - 100);
      voice.draw(currentCtx, currentStave);
    }

    /* =========================
       Redraw + highlight
       ========================= */
    function redraw(activeIndex = -1) {
      currentCtx.clear();
      currentStave.setContext(currentCtx).draw();

      currentVexNotes.forEach((vn, i) => {
        const isGhost = (i === 0);
        const isActive = (!isGhost && i === activeIndex + 1);

        vn.setStyle({
          fillStyle: isActive ? "#00b060" : "#000",
          strokeStyle: isActive ? "#00b060" : "#000"
        });

        vn.setContext(currentCtx).draw();
      });
    }

    /* =========================
       Play / Stop
       ========================= */
    async function playScale() {
      stopScale();
      if (!currentScaleNotes.length) return;

      await Tone.start();
      const stepMs = 400;

      currentScaleNotes.forEach((note, i) => {
          const id = setTimeout(() => {
            synth.triggerAttackRelease(note, "8n");
            redraw(i);
            // 🔑 oppdater pianoroll highlight
            if (window.RK_PIANOROLL_STATE) {
              window.RK_PIANOROLL_STATE.activeIdx = i;
              window.dispatchEvent(new Event("rk-pianoroll-ready"));
            }
          }, i * stepMs);
        playTimeouts.push(id);
      });
    }

    function stopScale() {
      playTimeouts.forEach(clearTimeout);
      playTimeouts = [];
      synth.releaseAll();
      redraw();
    }

    /* =========================
       Init
       ========================= */
    document.addEventListener("DOMContentLoaded", () => {
      render();
      document.getElementById("playScale")?.addEventListener("click", playScale);
      document.getElementById("stopScale")?.addEventListener("click", stopScale);
    });

  })();
