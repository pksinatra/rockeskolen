// ===== INIT =====

const whiteOrder = ["C","D","E","F","G","A","B"];
const blackMap = {
  "C":"C#",
  "D":"D#",
  "F":"F#",
  "G":"G#",
  "A":"A#"
};

const chordData = {
  "C":     ["C","E","G"],
  "Cm":    ["C","Eb","G"],
  "C7":    ["C","E","G","Bb"],
  "Cmaj7": ["C","E","G","B"],
  "Cm7":   ["C","Eb","G","Bb"]
};

// ===== GET CHORD =====

function getChord() {
  const params = new URLSearchParams(window.location.search);
  return params.get("chord") || "Cmaj7";
}

// ===== BUILD KEYBOARD =====

function buildKeyboard() {
  const piano = document.getElementById("piano");
  if (!piano) return;

  piano.innerHTML = "";

  const keyboard = document.createElement("div");
  keyboard.className = "keyboard";

  whiteOrder.forEach((note, i) => {
    const key = document.createElement("div");
    key.className = "white-key";
    key.dataset.note = note;
    key.style.display = "inline-block";

    keyboard.appendChild(key);

    if (blackMap[note]) {
      const black = document.createElement("div");
      black.className = "black-key";
      black.dataset.note = blackMap[note];

      black.style.left = (i * 48 + 32) + "px";

      keyboard.appendChild(black);
    }
  });

  piano.appendChild(keyboard);
}

// ===== RENDER =====

function renderChord() {
  const chord = getChord();
  const notes = chordData[chord] || chordData["Cmaj7"];

  // reset
  document.querySelectorAll(".white-key, .black-key").forEach(el => {
    el.classList.remove("active-white", "active-black");
  });

  // highlight
  notes.forEach(note => {
    const base = note.replace("b","").replace("#","");

    document.querySelectorAll(`[data-note="${note}"]`).forEach(el => {
      if (el.classList.contains("white-key")) el.classList.add("active-white");
      if (el.classList.contains("black-key")) el.classList.add("active-black");
    });
  });
}

// ===== AUDIO =====

function playChord() {
  const chord = getChord();
  const notes = chordData[chord] || chordData["Cmaj7"];

  const synth = new Tone.PolySynth().toDestination();
  synth.triggerAttackRelease(notes.map(n => n + "4"), "2n");
}

// ===== INIT RUN =====

buildKeyboard();
renderChord();