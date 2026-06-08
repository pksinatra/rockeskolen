const NOTES = ["C","C#","D","Eb","E","F","F#","G","Ab","A","Bb","B"];
const TUNING = ["E","A","D","G","B","E"];

function getNoteAt(stringNote, fret) {
  const index = NOTES.indexOf(stringNote);
  return NOTES[(index + fret) % 12];
}

async function loadScale(root, type) {
  const res = await fetch(`/api/scales?root=${root}&type=${type}`);
  const data = await res.json();
  return data.notes;
}

function renderGuitar(scaleNotes, root) {
  const container = document.getElementById("guitar");
  container.innerHTML = "";

  const frets = 12;

  TUNING.slice().reverse().forEach(stringNote => {
    const row = document.createElement("div");
    row.className = "string";

    for (let fret = 0; fret <= frets; fret++) {
      const note = getNoteAt(stringNote, fret);
      const cell = document.createElement("div");
      cell.className = "fret";

      if (scaleNotes.includes(note)) {
        cell.classList.add("in-scale");
        if (note === root) {
          cell.classList.add("root");
        }
      }

      row.appendChild(cell);
    }

    container.appendChild(row);
  });
}

(async () => {
  const scaleNotes = await loadScale(ROOT, TYPE);
  renderGuitar(scaleNotes, ROOT);
})();
