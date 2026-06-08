console.log("Guitar JS loaded");

const NOTES = ["C","C#","D","Eb","E","F","F#","G","Ab","A","Bb","B"];
const TUNING = ["E","A","D","G","B","E"];

function getNoteAt(stringNote, fret) {
  const index = NOTES.indexOf(stringNote);
  return NOTES[(index + fret) % 12];
}
async function loadScale(root, type) {
  try {
    const res = await fetch(
      "https://chordlink.net/api/scales/guitar.php?root=" +
      encodeURIComponent(root) +
      "&type=" +
      encodeURIComponent(type)
    );

    const text = await res.text();

    console.log("RAW RESPONSE:", text);

    if (text.trim().startsWith("<")) {
      console.error("API returned HTML instead of JSON");
      return [];
    }

    const data = JSON.parse(text);

    if (!data.notes) {
      console.error("Unexpected API format:", data);
      return [];
    }

    const pitchClasses = data.notes.map(n =>
      n.name.replace(/[0-9]/g, "")
    );

    return [...new Set(pitchClasses)];

  } catch (err) {
    console.error("Scale loading failed:", err);
    return [];
  }
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
