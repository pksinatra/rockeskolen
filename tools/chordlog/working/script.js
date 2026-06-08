let currentTaktCount = 0;
let currentTaktslag = 4;
let currentSongId = null; // which song are we editing?
const current = encodeURIComponent(window.location.pathname + window.location.search);

function renderUserStatus(){
  const el = document.getElementById("userStatus");
  if(!el) return;

  if(window.CL_IS_LOGGED_IN){
    el.innerHTML =
      `Innlogget ✔ <strong>${window.CL_USER_NAME || ""}</strong>`;
    el.className = "userLoggedIn";
  } else {
el.innerHTML =
  `Ikke innlogget – <a href="/members/login.php?redirect=${current}">Logg inn</a>`;
    el.className = "userLoggedOut";
  }

}

window.addEventListener("DOMContentLoaded", () => {
  renderUserStatus();
  loadSongs();
});


// Build initial form-generated grid (new song)
document.getElementById("songForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const form = new FormData(e.target);
  const title = form.get("title");
  const tempo = form.get("tempo");
  const timeSignature = form.get("timeSignature");
  const key = form.get("key");

  currentSongId = null;

  currentTaktslag = parseInt(timeSignature.split("/")[0], 10);
  currentTaktCount = 0;

  const grid = document.getElementById("chordGrid");

  document.getElementById("songHeader").innerHTML =
    `<h2>${title} (${key}) – ${timeSignature} @ ${tempo} BPM</h2>`;

  grid.innerHTML = "";
  document.getElementById("notation").innerHTML = "";

  for (let i = 1; i <= 4; i++) {
    addTakt(i);
  }
});


// Add a new bar
document.getElementById("addTaktBtn").addEventListener("click", () => addTakt());
document.getElementById("removeTaktBtn").addEventListener("click", () => {

  const takter = document.querySelectorAll("#chordGrid .takt");

  if(takter.length <= 1){
    alert("Minst én takt må finnes.");
    return;
  }

  takter[takter.length - 1].remove();

  currentTaktCount--;

});

function addTakt(taktNr = null) {
  const grid = document.getElementById("chordGrid");

  const nummer = (Number.isInteger(taktNr) && taktNr > 0) ? taktNr : ++currentTaktCount;

  const takt = document.createElement("div");
  takt.classList.add("takt");

  takt.dataset.nr = String(nummer);
  takt.dataset.doublebar = "0";   // ← DENNE mangler

takt.innerHTML =
  `<div class="taktHeader">
      <strong>Takt ${nummer}</strong>
   </div>
   <div class="taktChords"></div>`;

const chordRow = takt.querySelector(".taktChords");

for (let j = 1; j <= currentTaktslag; j++) {
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Akkord";
  input.size = 3;
  input.name = `takt${nummer}_slag${j}`;

  chordRow.appendChild(input);
}

const btn = document.createElement("button");
btn.type = "button";
btn.className = "doubleBarBtn";
btn.textContent = "||";
btn.style.marginLeft = "6px";

chordRow.appendChild(btn);


  grid.appendChild(takt);

  // Keep the counter in sync when adding by explicit number
  if (nummer > currentTaktCount) currentTaktCount = nummer;
}

async function saveChordData() {

  const form = document.getElementById("songForm");
  const formData = new FormData(form);

  formData.append("total_takter", currentTaktCount);

  if (currentSongId) formData.append("song_id", currentSongId);

  const takter = document.querySelectorAll("#chordGrid .takt");

  takter.forEach((taktDiv) => {

    const taktNr = parseInt(taktDiv.dataset.nr, 10) || 1;

    const doublebar = taktDiv.dataset.doublebar === "1" ? 1 : 0;

    formData.append(`takt${taktNr}_doublebar`, doublebar);

    const inputs = taktDiv.querySelectorAll("input");

    inputs.forEach((input, j) => {
      formData.append(`takt${taktNr}_slag${j + 1}`, input.value);
    });

  });

  const res = await fetch("save_song.php", { method: "POST", body: formData });

  const data = await res.json();

  if (data.success) {

    if (data.song_id) currentSongId = data.song_id;

    loadSongs();

  } else {

    alert("Feil: " + (data.error || "Ukjent feil"));

  }

}

function loadSongs() {
  const url = "get_songs.php?nocache=" + Date.now();

  fetch(url, { cache: "no-store" })
    .then((res) => res.json())
    .then((songs) => {

      const list = document.getElementById("songList");
      list.innerHTML = "";

      songs.forEach((song) => {

        const wrapper = document.createElement("div");
        wrapper.className = "songItem";

        const a = document.createElement("a");
        a.href = "#";
        a.textContent = `${song.title} – ${song.song_key || "?"} (${song.created_at})`;
        a.onclick = () => loadSong(song.id);

        const delBtn = document.createElement("button");
        delBtn.className = "songDelete";
        delBtn.textContent = "🗑";
        delBtn.onclick = () => deleteSong(song.id);

        wrapper.appendChild(a);
        wrapper.appendChild(delBtn);

        list.appendChild(wrapper);
      });

    })
    .catch((err) => console.error(err));
}


function loadSong(id) {

  const url = "get_song.php?id=" + encodeURIComponent(id) + "&nocache=" + Date.now();

  fetch(url, { cache: "no-store" })

    .then(res => res.json())

    .then(data => {

      if (!data || !data.song) {
        alert("Fant ikke sang.");
        return;
      }

      const song = data.song;
      const chords = data.chords || [];

      currentSongId = song.id;

      document.getElementById("title").value = song.title || "";
      document.querySelector("input[name='tempo']").value = song.tempo || 120;
      document.querySelector("select[name='timeSignature']").value = song.time_signature || "4/4";
      document.querySelector("input[name='key']").value = song.song_key || "C";

      currentTaktslag = parseInt((song.time_signature || "4/4").split("/")[0], 10);

      const grid = document.getElementById("chordGrid");
document.getElementById("songHeader").innerHTML =
  `<h2>${song.title} (${song.song_key}) – ${song.time_signature} @ ${song.tempo} BPM</h2>`;

grid.innerHTML = "";
      const grouped = new Map();

      chords.forEach(ch => {

        const t = Number(ch.takt_nr);

        if (!grouped.has(t)) grouped.set(t, []);

        grouped.get(t).push(ch);

      });

      const maxTakt =
        Number(song.total_takter || 0) ||
        (grouped.size ? Math.max(...Array.from(grouped.keys())) : 0);

      currentTaktCount = 0;

      for (let t = 1; t <= maxTakt; t++) {

        addTakt(t);

        const taktDiv = grid.querySelector(`.takt[data-nr="${t}"]`);

          const slagArr = (grouped.get(t) || []).sort((a,b) => a.slag_nr - b.slag_nr);

          const inputs = taktDiv.querySelectorAll("input");

          inputs.forEach((input, i) => {

            const match = slagArr.find(s => Number(s.slag_nr) === i+1);

            input.value = match ? match.chord_label : "";

          });

          // riktig dobbelstrek
          const db = slagArr.find(s => s.doublebar == 1);

          taktDiv.dataset.doublebar = db ? "1" : "0";

          const btn = taktDiv.querySelector(".doubleBarBtn");

if (btn) {

  if (taktDiv.dataset.doublebar === "1") {
    btn.style.fontWeight = "bold";
    btn.style.background = "#4caf50";
    btn.style.color = "#fff";
  } else {
    btn.style.fontWeight = "normal";
    btn.style.background = "";
    btn.style.color = "";
  }

}
} // ← DENNE manglet
      const chordsFromGrid = exportChordsFromGridOnePerBar();
      const doubleBars = exportDoubleBars();

      const measuresPerLine =
        parseInt(document.getElementById("measuresPerLine")?.value || "6", 10);

      renderChordStaff({
        chords: chordsFromGrid,
        doubleBars,
        timeSig: song.time_signature,
        measuresPerLine
      });

})

.catch(err => alert("Feil ved henting: " + err.message));

}

function buildPrintPreview() {
  const printEl = document.getElementById("printPreview");
  const notation = document.getElementById("notation");

  if (!notation || !notation.innerHTML.trim()) {
    alert("Ingen notasjon å eksportere.");
    return false;
  }

  const title = document.getElementById("title")?.value || "Uten tittel";

const tempo = document.querySelector("input[name='tempo']").value;
const timeSig = document.querySelector("select[name='timeSignature']").value;
const key = document.querySelector("input[name='key']").value;

printEl.innerHTML = `
<div class="print-sheet">

  <div class="chartHeader">
    <h1>${title}</h1>

    <div class="chartMeta">
      <span><strong>Toneart:</strong> ${key}</span>
      <span><strong>Takt:</strong> ${timeSig}</span>
      <span><strong>Tempo:</strong> ${tempo} BPM</span>
    </div>
  </div>

  ${notation.innerHTML}

</div>
`;
  document.body.classList.add("printing");

  return true;
}

document.getElementById("btnExportPdf")?.addEventListener("click", () => {

  const timeSig = document.querySelector("select[name='timeSignature']")?.value || "4/4";
  const chords = exportChordsFromGridOnePerBar();
  const doubleBars = exportDoubleBars();

  const measuresPerLine =
    parseInt(document.getElementById("measuresPerLine")?.value || "6", 10);

  renderChordStaff({
    chords,
    doubleBars,
    timeSig,
    measuresPerLine
  });


  if (buildPrintPreview()) {
    setTimeout(() => {
      window.print();
      document.body.classList.remove("printing");
    }, 100);
  }
});

function exportChordsFromGridOnePerBar() {

  const takter = document.querySelectorAll("#chordGrid .takt");

  return Array.from(takter).map(t => {

    const inputs = t.querySelectorAll("input");

    return Array.from(inputs).map(inp => inp.value.trim());

  });

}

function exportDoubleBars() {

  const takter = document.querySelectorAll("#chordGrid .takt");

  return Array.from(takter).map(t => {
    return t.dataset.doublebar === "1";
  });

}

function deleteSong(id) {
  if (!confirm("Er du sikker på at du vil slette denne låten?")) return;

  fetch("delete_song.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "id=" + encodeURIComponent(id)
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      alert("Låten er slettet.");
      loadSongs(); // reload listen
      document.getElementById("chordGrid").innerHTML = "";
    } else {
      alert("Feil: " + data.error);
    }
  });
}



function renderChordStaff({ chords, doubleBars = [], timeSig = "4/4", measuresPerLine = 8 }) {
  if (!window.Vex || !window.Vex.Flow) {
    alert("VexFlow er ikke lastet. Sjekk at vexflow-min.js ligger inne i index.php.");
    return;
  }

  const VF = Vex.Flow;
  const container = document.getElementById("notation");
  if (!container) {
    alert("Fant ikke #notation på siden. Sjekk index.php.");
    return;
  }

  container.innerHTML = "";

  const [beatsStr, beatValueStr] = timeSig.split("/");
  const numBeats = parseInt(beatsStr, 10) || 4;
  const beatValue = parseInt(beatValueStr, 10) || 4;

  const renderer = new VF.Renderer(container, VF.Renderer.Backends.SVG);

  const width = Math.min(900, (container.clientWidth || 900) - 40);
  const lineHeight = 120;
  const lines = Math.ceil(chords.length / measuresPerLine) || 1;

  renderer.resize(width, lines * lineHeight);

  const ctx = renderer.getContext();
  ctx.setFont("Times New Roman", 12, "");

  const leftMargin = 30;
  const topMargin = 20;
  const usableW = width - leftMargin * 2;
  const measureW = Math.floor(usableW / measuresPerLine);

  let idx = 0;
const takter = document.querySelectorAll("#chordGrid .takt");
  for (let line = 0; line < lines; line++) {
    const y = topMargin + line * lineHeight;

    for (let m = 0; m < measuresPerLine; m++) {
      if (idx >= chords.length) break;

      const x = leftMargin + m * measureW;
      const stave = new VF.Stave(x, y, measureW);
      if (doubleBars[idx]) {
        stave.setEndBarType(VF.Barline.type.DOUBLE);
      }

      if (m === 0) stave.addClef("treble").addTimeSignature(timeSig);

      stave.setContext(ctx).draw();

      // Ghost note kun for å ha noe å feste akkordtekst på
// Hent akkorder per slag (4 per takt)
// const takter = document.querySelectorAll("#chordGrid .takt");
const slagInputs = chords[idx] || [];

const notes = [];

for (let s = 0; s < numBeats; s++) {
  const ghost = new VF.GhostNote({ duration: "q" }); // quarter note

  const chordText = (slagInputs[s] || "").trim();

  if (chordText) {
    const ann = new VF.Annotation(chordText)
      .setVerticalJustification(VF.Annotation.VerticalJustify.TOP)
      .setFont("Times New Roman", 14, "bold");

    ghost.addModifier(ann, 0);
  }

  notes.push(ghost);
}

const voice = new VF.Voice({
  num_beats: numBeats,
  beat_value: beatValue
});

voice.addTickables(notes);

      new VF.Formatter().joinVoices([voice]).format([voice], measureW - 18);
      voice.draw(ctx, stave);

      idx++;
    }
  }
}

document.getElementById("btnRenderNotation")?.addEventListener("click", async () => {

  await saveChordData();

  const chords = exportChordsFromGridOnePerBar();
  const doubleBars = exportDoubleBars();

  const timeSig =
    document.querySelector("select[name='timeSignature']").value;

  const measuresPerLine =
    parseInt(document.getElementById("measuresPerLine").value,10);

  renderChordStaff({
    chords,
    doubleBars,
    timeSig,
    measuresPerLine
  });

});

document.getElementById("measuresPerLine").addEventListener("change", () => {

  const timeSig = document.querySelector("select[name='timeSignature']").value;

  const chords = exportChordsFromGridOnePerBar();
  const doubleBars = exportDoubleBars();

  renderChordStaff({
    chords,
    doubleBars,
    timeSig,
    measuresPerLine: parseInt(document.getElementById("measuresPerLine").value,10)
  });
});

document.addEventListener("click", function (e) {
  if (!e.target.classList.contains("doubleBarBtn")) return;
  e.preventDefault();

  const takt = e.target.closest(".takt");
  takt.dataset.doublebar =
    takt.dataset.doublebar === "1" ? "0" : "1";

if (takt.dataset.doublebar === "1") {
  e.target.style.fontWeight = "bold";
  e.target.style.background = "#4caf50";
  e.target.style.color = "#fff";
} else {
  e.target.style.fontWeight = "normal";
  e.target.style.background = "";
  e.target.style.color = "";
}

});

document.addEventListener("input", function(e){

  if(!e.target.closest("#chordGrid")) return;

  // Auto-capitalize chord root
  if(e.target.tagName === "INPUT") {
    const v = e.target.value;
    if(v.length > 0) {
      e.target.value =
        v.charAt(0).toUpperCase() + v.slice(1);
    }
  }

  const chords = exportChordsFromGridOnePerBar();
  const doubleBars = exportDoubleBars();

  const timeSig = document.querySelector("select[name='timeSignature']").value;

  const measuresPerLine =
    parseInt(document.getElementById("measuresPerLine").value,10);

  renderChordStaff({
    chords,
    doubleBars,
    timeSig,
    measuresPerLine
  });

});

document.getElementById("btnUpdateChart").addEventListener("click", async () => {

await saveChordData();

  const chords = exportChordsFromGridOnePerBar();
  const doubleBars = exportDoubleBars();

  const timeSig =
    document.querySelector("select[name='timeSignature']").value;

  const measuresPerLine =
    parseInt(document.getElementById("measuresPerLine").value,10);

  renderChordStaff({
    chords,
    doubleBars,
    timeSig,
    measuresPerLine
  });

});

document.getElementById("layoutToggle").onclick = () => {
  document.body.classList.toggle("realbook");
};


document.addEventListener("input", function(e){

  if(!e.target.matches(".taktChords input")) return;

  let value = e.target.value;

  if(!value) return;

  // tillatte rottoner
  const validRoots = ["A","B","C","D","E","F","G","H"];

  // første bokstav
  let first = value.charAt(0).toUpperCase();

  if(!validRoots.includes(first)){
    e.target.value = "";
    return;
  }

  // resten av akkorden
  let rest = value.slice(1);

  e.target.value = first + rest;

});


document.addEventListener("keydown", function(e){

  if(!e.target.matches(".taktChords input")) return;

  if(e.key === "Tab"){

    e.preventDefault();

    const inputs = Array.from(
      document.querySelectorAll(".taktChords input")
    );

    const index = inputs.indexOf(e.target);

    if(index >= 0 && index < inputs.length - 1){
      inputs[index + 1].focus();
    }

  }

});