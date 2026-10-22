let currentTaktCount = 0;
let currentTaktslag = 4;
let currentSongId = null;
const current = encodeURIComponent(window.location.pathname + window.location.search);

function renderUserStatus(){
  const el = document.getElementById("userStatus");
  if(!el) return;

  if(window.CL_IS_LOGGED_IN){
    el.innerHTML =
      `Innlogget <strong>${window.CL_USER_NAME || ""}</strong>`;
    el.className = "userLoggedIn";
  } else {
el.innerHTML =
  `Ikke innlogget - <a href="/members/login.php?redirect=${current}">Logg inn</a>`;
    el.className = "userLoggedOut";
  }

}

window.addEventListener("DOMContentLoaded", () => {
  renderUserStatus();
  loadSongs();
  if (!document.querySelector("#chordGrid .takt")) {
    document.getElementById("songForm").dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true })
    );
  }
});


// Build initial form-generated grid.
document.getElementById("songForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const form = new FormData(e.target);
  const timeSignature = form.get("timeSignature");

  currentSongId = null;

  currentTaktslag = parseInt(timeSignature.split("/")[0], 10);
  currentTaktCount = 0;

  const grid = document.getElementById("chordGrid");
  updateSongHeader();

  grid.innerHTML = "";
  document.getElementById("notation").innerHTML = "";

  for (let i = 1; i <= 8; i++) {
    addTakt(i);
  }

  renderCurrentNotation();
});

document.getElementById("songForm").addEventListener("input", () => {
  updateSongHeader();
  renderCurrentNotation();
});

document.getElementById("songForm").addEventListener("change", () => {
  updateSongHeader();
  renderCurrentNotation();
});

function updateSongHeader() {
  const form = new FormData(document.getElementById("songForm"));
  const title = form.get("title") || "Nytt akkordskjema";
  const tempo = form.get("tempo") || "120";
  const timeSignature = form.get("timeSignature") || "4/4";
  const key = form.get("key") || "";
  const keyText = key ? ` (${key})` : "";

  const header = document.getElementById("songHeader");
  header.innerHTML = "";

  const heading = document.createElement("h2");
  heading.textContent = `${title}${keyText} – ${timeSignature} @ ${tempo} BPM`;
  header.appendChild(heading);
}


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
document.getElementById("btnSaveChart")?.addEventListener("click", saveChordData);


function setDoubleBarButtonState(taktDiv) {
  const btn = taktDiv.querySelector(".doubleBarBtn");
  if (!btn) return;

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


function addTakt(taktNr = null) {
  const grid = document.getElementById("chordGrid");

  const nummer = (Number.isInteger(taktNr) && taktNr > 0) ? taktNr : ++currentTaktCount;

  const takt = document.createElement("div");
  takt.classList.add("takt");

  takt.dataset.nr = String(nummer);
  takt.dataset.doublebar = "0";   // ← DENNE mangler
  takt.dataset.section = "";


takt.innerHTML =
  `<div class="taktHeader">
      <strong>Takt ${nummer}</strong>
      <input class="sectionInput" name="takt${nummer}_section" placeholder="${nummer === 1 ? "Intro / Vers" : "Seksjon"}">
   </div>
   <div class="taktChords"></div>`;

const chordRow = takt.querySelector(".taktChords");

for (let j = 1; j <= currentTaktslag; j++) {
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "";
  input.size = 3;
  input.name = `takt${nummer}_slag${j}`;
  input.className = "chordInput";
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
  if (!window.CL_IS_LOGGED_IN) {
    alert("Logg inn for å lagre låter.");
    window.location.href = `/members/login.php?redirect=${current}`;
    return false;
  }

  const form = document.getElementById("songForm");
  const formData = new FormData(form);

  formData.append("total_takter", currentTaktCount);

  if (currentSongId) formData.append("song_id", currentSongId);

  const takter = document.querySelectorAll("#chordGrid .takt");

  takter.forEach((taktDiv) => {

    const taktNr = parseInt(taktDiv.dataset.nr, 10) || 1;

    const doublebar = taktDiv.dataset.doublebar === "1" ? 1 : 0;
    const sectionInput = taktDiv.querySelector(".sectionInput");

    if(sectionInput){
      formData.append(`takt${taktNr}_section`, sectionInput.value);
    }
    formData.append(`takt${taktNr}_doublebar`, doublebar);

    const inputs = taktDiv.querySelectorAll(".taktChords input");

    inputs.forEach((input, j) => {
      formData.append(`takt${taktNr}_slag${j + 1}`, input.value);
    });

  });

  const res = await fetch("save_song.php", { method: "POST", body: formData });

  const data = await res.json();

  if (data.success) {

    if (data.song_id) currentSongId = data.song_id;

    loadSongs();
    return true;

  } else {

    alert("Feil: " + (data.error || "Ukjent feil"));
    return false;

  }

}

function loadSongs() {
  const url = "get_songs.php?nocache=" + Date.now();

  fetch(url, { cache: "no-store" })
    .then((res) => res.json())
    .then((songs) => {

      const list = document.getElementById("songList");
      list.innerHTML = "";

      if (!Array.isArray(songs)) {
        list.innerHTML = `<div class="songItem">Kunne ikke laste låter.</div>`;
        return;
      }

      if (!songs.length) {
        list.innerHTML = `<div class="songItem">Ingen lagrede låter ennå.</div>`;
        return;
      }

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
console.log("Laster låt", id);
  const url = "get_song.php?id=" + encodeURIComponent(id) + "&nocache=" + Date.now();

  fetch(url, { cache: "no-store" })

    .then(res => res.json())

    .then(data => {

      if (!data || !data.song) {
        alert("Fant ikke låten.");
        return;
      }

      const song = data.song;
      const chords = data.chords || [];
console.log(chords);
      currentSongId = song.id;

      document.getElementById("title").value = song.title || "";
      document.querySelector("input[name='tempo']").value = song.tempo || 120;
      document.querySelector("select[name='timeSignature']").value = song.time_signature || "4/4";
      document.querySelector("[name='key']").value = song.song_key || "";

      currentTaktslag = parseInt((song.time_signature || "4/4").split("/")[0], 10);

      const grid = document.getElementById("chordGrid");
      updateSongHeader();

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

        const inputs = taktDiv.querySelectorAll(".taktChords input");

        inputs.forEach((input, i) => {
          const match = slagArr.find(s => Number(s.slag_nr) === i+1);
          input.value = match ? match.chord_label : "";
        });

        // seksjon
        const sectionInput = taktDiv.querySelector(".sectionInput");

        const sectionRow = slagArr.find(s => s.section_label);

        if(sectionInput && sectionRow){
          sectionInput.value = sectionRow.section_label;
        }

// dobbelstrek
const db = slagArr.find(s => s.doublebar == 1);

taktDiv.dataset.doublebar = db ? "1" : "0";

setDoubleBarButtonState(taktDiv);


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

      document.querySelectorAll("#chordGrid .takt").forEach(setDoubleBarButtonState);

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
const key = document.querySelector("[name='key']").value;

const keyHtml = key ? `<span><strong>Toneart:</strong> ${key}</span>` : "";
const tempoHtml = tempo ? `<span><strong>Tempo:</strong> ${tempo} BPM</span>` : "";



printEl.innerHTML = `
<div class="print-sheet">

  <div class="chartHeader">
    <h1>${title}</h1>

    <div class="chartMeta">
      ${keyHtml}
      ${tempoHtml}
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

    const inputs = t.querySelectorAll(".taktChords input");

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
    alert("VexFlow er ikke lastet. Sjekk at VexFlow er inkludert i index.php.");
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

  const containerWidth = Math.max(0, (container.clientWidth || 1100) - 40);
  const minMeasureWidth = measuresPerLine <= 4 ? 280 : 230;
  const targetWidth = measuresPerLine * minMeasureWidth + 100;
  const width = Math.max(containerWidth, targetWidth);
  const lineHeight = 120;
  const lines = Math.ceil(chords.length / measuresPerLine) || 1;

  renderer.resize(width, lines * lineHeight);

  const ctx = renderer.getContext();
  ctx.setFont("Times New Roman", 12, "");

  const leftMargin = 50;
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
      const sectionInput = takter[idx]?.querySelector(".sectionInput");

      if(sectionInput && sectionInput.value.trim()){

        ctx.setFont("Helvetica, Arial, sans-serif", 10, "bold");
        ctx.fillText(sectionInput.value.toUpperCase(), x + 4, y + 12);
      }
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

      new VF.Formatter().joinVoices([voice]).format([voice], measureW - 36);
      voice.draw(ctx, stave);

      idx++;
    }
  }
}

function renderCurrentNotation() {
  const chords = exportChordsFromGridOnePerBar();
  const doubleBars = exportDoubleBars();

  const timeSig =
    document.querySelector("select[name='timeSignature']").value;

  const measuresPerLine =
    parseInt(document.getElementById("measuresPerLine").value, 10);

  renderChordStaff({
    chords,
    doubleBars,
    timeSig,
    measuresPerLine
  });
}

document.getElementById("btnRenderNotation")?.addEventListener("click", async () => {
  renderCurrentNotation();

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
  if (!takt) return;

  takt.dataset.doublebar =
    takt.dataset.doublebar === "1" ? "0" : "1";

  setDoubleBarButtonState(takt);

  const chords = exportChordsFromGridOnePerBar();
  const doubleBars = exportDoubleBars();
  const timeSig = document.querySelector("select[name='timeSignature']").value;
  const measuresPerLine =
    parseInt(document.getElementById("measuresPerLine").value, 10);

  renderChordStaff({
    chords,
    doubleBars,
    timeSig,
    measuresPerLine
  });
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
  renderCurrentNotation();

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
