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
const SEMITONE_TO_NOTE = [
  "C",  "Db", "D",  "Eb",
  "E",  "F",  "Gb", "G",
  "Ab", "A",  "Bb", "B"
];
function noteToMidi(note, oct) {
  const semi = NOTE_NAMES[note];
  if (semi === undefined) {
    throw new Error("Ukjent note: " + note);
  }
  return (oct + 1) * 12 + semi;
}
function midiToNote(midi) {
  const note = SEMITONE_TO_NOTE[midi % 12];
  const oct  = Math.floor(midi / 12) - 1;
  return note + oct;
}
function getKeySignature(root, type) {
  if (type === "major") return root;
  if (type === "nat_minor") return root + "m";
  return null; // pentatonisk, blues osv
}

function buildScale(root, type, oct, scales) {
  const scale = scales[type];
  if (!scale || !scale.intervals) {
    throw new Error("Ukjent skala: " + type);
  }

  const rootMidi = noteToMidi(root, oct);

  const notes = scale.intervals.map(i => {
    return midiToNote(rootMidi + i);
  });

  // 🔼 legg alltid til øverste oktav
  notes.push(midiToNote(rootMidi + 12));

  return notes;
}
function getKeyAccidentals(keySig) {
  const ks = new VF.KeySignature(keySig);

  return ks.accidentals.map(a => a.note.toUpperCase());
}
function normalizeNoteForKey(note, keySig) {
  // 🔑 Bare dur: la nøkkelsignaturen håndtere #
  if (!keySig || keySig.endsWith("m")) return note;

  const m = note.match(/^([A-G])([#b]?)(\d)$/);
  if (!m) return note;

  const [_, letter, accidental, oct] = m;

  // I dur: fjern # hvis tonen ligger i nøkkelen
  if (accidental === "#") {
    return letter + oct;
  }

  return note;
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
    const root = param("root","C");
    const type = param("type","major");
    const oct  = parseInt(param("oct","4"),10);

    const scales = await loadScales();
    currentScaleNotes = buildScale(root, type, oct, scales);

    const host = document.getElementById("notation");
    host.innerHTML = "";

    const renderer = new VF.Renderer(host, VF.Renderer.Backends.SVG);
    renderer.resize(960, 140);

    currentCtx = renderer.getContext();
    currentStave = new VF.Stave(10, 40, 920);
currentStave.addClef("treble");

const keySig = getKeySignature(root, type);
if (keySig) {
  currentStave.addKeySignature(keySig);
}

currentStave.setContext(currentCtx).draw();


    /* 👻 Luft etter G-nøkkel */
    currentVexNotes = [];
    currentVexNotes.push(new VF.GhostNote({ duration: "8" }));

currentScaleNotes.forEach(n => {
  const clean = normalizeNoteForKey(n, keySig);
  currentVexNotes.push(
    new VF.StaveNote({
      clef: "treble",
      keys: [toVex(clean)],
      duration: "q"
    })
  );
});




    const voice = new VF.Voice({
      num_beats: currentVexNotes.length,
      beat_value: 4
    }).setStrict(false);

    voice.addTickables(currentVexNotes);
    new VF.Formatter().joinVoices([voice]).format([voice], 880);
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
