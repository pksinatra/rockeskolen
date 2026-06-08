(function () {
  // Vi venter til DOM-en er klar før vi prøver å hente elementer
  document.addEventListener("DOMContentLoaded", function () {
    // ---- DOM ----
    const rootSelect = document.getElementById("root");

    const extSelect = document.getElementById("extension");
    const variantSelect = document.getElementById("variantSelect");
    const playBtn = document.getElementById("playBtn");
    const debugToggle = document.getElementById("debugToggle");
    const debugEl = document.getElementById("debug");
    const fretboardEl = document.getElementById("fretboard");
    const chordNameMainEl = document.getElementById("chordNameMain");
    const chordNameBookEl = document.getElementById("chordNameBook");
    const tagFamilyEl = document.getElementById("tagFamily");
    const tagQualityEl = document.getElementById("tagQuality");
    const variantInfoEl = document.getElementById("variantInfo");
    const fileNameInfoEl = document.getElementById("fileNameInfo");


console.log("root:", !!rootSelect);

console.log("extension:", !!extSelect);
console.log("variantSelect:", !!variantSelect);
console.log("playBtn:", !!playBtn);
console.log("debugToggle:", !!debugToggle);
console.log("debugEl:", !!debugEl);
console.log("fretboard:", !!fretboardEl);
console.log("chordNameMain:", !!chordNameMainEl);
console.log("chordNameBook:", !!chordNameBookEl);
console.log("tagFamily:", !!tagFamilyEl);
console.log("tagQuality:", !!tagQualityEl);
console.log("variantInfo:", !!variantInfoEl);
console.log("fileNameInfo:", !!fileNameInfoEl);



    // Hvis vi ikke finner noe av dette, gir vi opp stille for denne siden
    if (
      !rootSelect ||

      !extSelect ||
      !variantSelect ||
      !playBtn ||
      !debugToggle ||
      !debugEl ||
      !fretboardEl ||
      !chordNameMainEl ||
      !chordNameBookEl ||
      !tagFamilyEl ||
      !tagQualityEl ||
      !variantInfoEl ||
      !fileNameInfoEl
    ) {
      console.error(
        "ChordLink Guitar UI: Required DOM elements not found. " +
          "Sannsynligvis lastes ui.js på en side uten gitar-UI."
      );
      return;
    }

    // ------------------------------------------------------------
    // PRO gating (public app + lås Pro-funksjoner)
    // - GuitarChords er public
    // - Free: kun C, F, G (roots)
    // - Free extensions: none, 6, 7, maj7, add9, sus2, sus4, 9
    // - Pro extensions: 11, 13, altered
    // ------------------------------------------------------------
    const IS_PRO = !!window.CL_IS_PRO; // settes i PHP (window.CL_IS_PRO = true/false)
    const IS_LOGGED_IN = !!window.CL_IS_LOGGED_IN;
    const GUEST_ROOTS = new Set(["C", "F", "G"]);
    const FREE_ROOTS = new Set(["C", "F", "G", "E"]);

const GUEST_EXTENSIONS = new Set([
  "maj",
  "min",
  "7"
]);

const FREE_EXTENSIONS = new Set([
  "maj7",
  "m7",
  "add9",
  "sus2",
  "sus4"
]);


const PRO_EXTENSIONS = new Set([
  "6",
  "m6",  
  "11",
  "13",
  "altered",
  "69",
  "m69",
  "m7b5",
  "maj9",
  "m9",
  "7sus4",
  "7sus2",
  "9sus4",
  "13sus4",
  "7b5",
  "7#5",
  "7b9",
  "7#9"
]);
    const UPGRADE_URL = (window.CL_UPGRADE_URL || "/members/upgrade.php");

function ensureProBox() {
  if (document.getElementById("proBox")) return;

  const a = document.createElement("a");
  a.id = "proBox";
  a.href = UPGRADE_URL;
  a.className = "pro-cta pro-cta--promo";
  a.setAttribute("role", "button");
  a.style.display = "none";

  // 🔥 MAGIC FIX HER
  a.addEventListener("click", function(e){
    e.preventDefault();

    if(!IS_LOGGED_IN){
      // send rett til upgrade, IKKE login
      window.location.href = "/members/upgrade.php";
    } else {
      // allerede innlogget → samme sted
      window.location.href = "/members/upgrade.php";
    }
  });

  const card = document.querySelector(".card") || document.body;
  card.insertBefore(a, card.firstChild);
}
function showProBox(name) {
  ensureProBox();

  const box = document.getElementById("proBox");
  if (!box) return;

  let text = "";

  if(!IS_LOGGED_IN){
    text = `
      Akkorden <strong>${name}</strong> krever konto.<br>
      <span class="pro-cta-sub">Opprett gratis konto med begrensninger, </span>
      eller
      <span class="pro-cta-sub">bli VIP-medlem og få full tilgang til alt innhold.</span>
    `;
  } else {
    text = `
      Akkorden <strong>${name}</strong> er en premium-akkord.<br>
      <span class="pro-cta-sub">Oppgrader til VIP-medlem</span>
    `;
  }

  box.innerHTML = text;
  box.style.display = "block";
}




    function hideProBox() {
      const b = document.getElementById("proBox");
      if (b) b.style.display = "none";
    }

    function applyProGates_Roots() {
  // iOS/Safari kan vise "blanke" rader for <option disabled>.
  // Derfor: vi lar alle options være enabled, men merker Pro-only og håndhever ved change.
  let firstFree = null;

  for (const opt of rootSelect.options) {
    // Bevar original label én gang
    if (!opt.dataset.label) opt.dataset.label = opt.textContent;

    const isFree = FREE_ROOTS.has(opt.value);
    const isProOnly = !isFree;

    opt.dataset.pro = isProOnly ? "1" : "0";
    opt.hidden = false;        // alltid synlig i lista
    opt.disabled = false;      // aldri disabled (unngår blanke rader)

    if (!IS_PRO && isProOnly) {
      opt.setAttribute("aria-disabled", "true");
      // Sett label med Pro-indikasjon
      const base = opt.dataset.label;
      opt.textContent = base.includes("Pro") ? base : (base + "  • Pro");
    } else {
      opt.removeAttribute("aria-disabled");
      opt.textContent = opt.dataset.label;
    }

    if (!firstFree && isFree) firstFree = opt.value;
  }

  // Hvis user er free og står på en pro-root → hopp til C (eller første free)
if (!IS_PRO) {

  if (!IS_LOGGED_IN && !GUEST_ROOTS.has(rootSelect.value)) {
    showProBox(rootSelect.value);
    rootSelect.value = "C";
    updateChordFromUI();
    return;
  }

  if (IS_LOGGED_IN && !FREE_ROOTS.has(rootSelect.value)) {
    showProBox(rootSelect.value);
    rootSelect.value = "C";
    updateChordFromUI();
    return;
  }

}
}


function applyProGates_Extensions() {

  for (const opt of extSelect.options) {
    if (!opt.dataset.label) opt.dataset.label = opt.textContent;

    const isProOnly = PRO_EXTENSIONS.has(opt.value);
    opt.dataset.pro = isProOnly ? "1" : "0";
    opt.hidden = false;
    opt.disabled = false;

    if (!IS_PRO && isProOnly) {
      opt.setAttribute("aria-disabled", "true");
      const base = opt.dataset.label;
      opt.textContent = base.includes("Pro") ? base : (base + "  • Pro");
    } else {
      opt.removeAttribute("aria-disabled");
      opt.textContent = opt.dataset.label;
    }
  }

  // 👉 FLYTTET INN HER (viktig!)
  if (!IS_PRO) {

    if (!IS_LOGGED_IN && !GUEST_EXTENSIONS.has(extSelect.value)) {
      showProBox(extSelect.value);
      extSelect.value = "maj";
      updateChordFromUI();
      return;
    }

    if (IS_LOGGED_IN && !FREE_EXTENSIONS.has(extSelect.value)) {
      showProBox(extSelect.value);
      extSelect.value = "maj";
      updateChordFromUI();
      return;
    }

  }
}



// Skjul Quality-dropdown – brukes ikke lenger

    // Kjør gating én gang ved oppstart (uten å endre “det som virker” ellers)
    applyProGates_Roots();
    applyProGates_Extensions();

    // ---- Stable addon state ----
    // Vis/skjul naturlige flageolett-/harmonics-markører (5/7/12)
    let showHarmonics = false;

    const jsonCache = {};
    // ---- Audio (Tone.js) ----
    const TUNING = [40, 45, 50, 55, 59, 64]; // E2 A2 D3 G3 B3 E4
    let toneSynth = null;
    let toneLimiter = null;
    let currentVariant = null; // sist viste grep

    // ---- Harmonics toggle (stable) ----
    // Legg en knapp ved siden av Debug uten å avhenge av ekstra wrappers.
    (function ensureHarmonicsButton() {
      const host = debugToggle && debugToggle.parentElement;
      if (!host) return;
      if (document.getElementById("harmonicsToggle")) return;
      const btn = document.createElement("button");
      btn.id = "harmonicsToggle";
      btn.type = "button";
      btn.className = "secondary";
      btn.textContent = "Flageoletter";
      btn.addEventListener("click", function () {
        showHarmonics = !showHarmonics;
        if (currentVariant) renderFretboard(currentVariant);
      });
      host.appendChild(btn);
    })();

    function fretsToMidis(frets) {
      const out = [];
      for (let i = 0; i < TUNING.length; i++) {
        const fret = frets[i];
        if (fret == null || fret < 0) continue; // X
        const base = TUNING[i];
        const midi = base + (fret || 0); // 0 = åpen streng
        out.push(midi);
      }
      return out;
    }

    async function ensureTone() {
      if (!window.Tone) {
        throw new Error(
          "Tone.js er ikke lastet (mangler <script src='...Tone.js'> i HTML)."
        );
      }

      const Tone = window.Tone;

      // allerede initialisert
      if (toneSynth) {
        // Sørg for at contexten er i gang
        try {
          await Tone.start();
        } catch (e) {}
        if (Tone.context && Tone.context.state !== "running") {
          try {
            await Tone.context.resume();
          } catch (e) {}
        }
        return Tone;
      }

      // start audio context
      try {
        await Tone.start();
      } catch (e) {}
      if (Tone.context && Tone.context.state !== "running") {
        try {
          await Tone.context.resume();
        } catch (e) {}
      }

      // limiter + litt lavere nivå for å unngå skurring
      toneLimiter = new Tone.Limiter(-6).toDestination();

      toneSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sine" },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.8 },
        volume: -10
      }).connect(toneLimiter);

      return Tone;
    }

    function logDebug(obj) {
      if (!debugEl) return;
      debugEl.textContent = JSON.stringify(obj, null, 2);
    }

    // ---- Filnavn basert på rot ----
    function getChordFileForRoot(root) {
      // C, Cb, C# -> "c"
      const base = root.charAt(0).toLowerCase();
      const file = "/assets/data/guitarchords_" + base + ".json";
      fileNameInfoEl.textContent = file;
      return file;
    }

    async function loadDataForRoot(root) {
      const key = root.charAt(0).toUpperCase(); // C, D, E, ...
      if (jsonCache[key]) return jsonCache[key];

      const url = getChordFileForRoot(root);
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Klarte ikke å laste " + url + " (" + res.status + ")");
      }
      const data = await res.json();
      jsonCache[key] = data;
      return data;
    }

    function rootMatchesChord(ch, root) {
      if (ch.root === root) return true;
      if (Array.isArray(ch.aliases) && ch.aliases.indexOf(root) !== -1)
        return true;
      return false;
    }

    // ---- Map UI -> JSON family ----
function parseChordType(chordType) {
  // chordType = extSelect.value, f.eks: "maj", "min", "7", "m7", "maj7", "m7b5", "dim", "aug", "sus4", "add9", "9", "11", "13" ...

  // Triader
  if (chordType === "maj") return { quality: "major", family: "plain" };
  if (chordType === "min") return { quality: "minor", family: "plain" };
  if (chordType === "dim") return { quality: "dim", family: "dim" };
  if (chordType === "aug") return { quality: "aug", family: "aug" };

  // Power
  if (chordType === "5") return { quality: "major", family: "5" };

  // 6 / m6
  if (chordType === "6") return { quality: "major", family: "6" };
  if (chordType === "m6") return { quality: "minor", family: "m6" };

  // 6/9
  if (chordType === "69") return { quality: "major", family: "69" };
  if (chordType === "m69") return { quality: "minor", family: "m69" };

  // 7
  if (chordType === "7") return { quality: "major", family: "7" };
  if (chordType === "m7") return { quality: "minor", family: "m7" };
  if (chordType === "maj7") return { quality: "major", family: "maj7" };
  if (chordType === "m(maj7)") return { quality: "minor", family: "m(maj7)" };

  // Half-diminished
  if (chordType === "m7b5") return { quality: "minor", family: "m7b5" };

  // 9
  if (chordType === "9") return { quality: "major", family: "9" };
  if (chordType === "maj9") return { quality: "major", family: "maj9" };
  if (chordType === "m9") return { quality: "minor", family: "m9" };

  // Sus / add
  if (chordType === "sus2") return { quality: "major", family: "sus2" };
  if (chordType === "sus4") return { quality: "major", family: "sus4" };
  if (chordType === "add9") return { quality: "major", family: "add9" };

  // Extensions
  if (chordType === "11") return { quality: "major", family: "11" };
  if (chordType === "13") return { quality: "major", family: "13" };

  // Dominant sus
  if (chordType === "7sus4") return { quality: "major", family: "7sus4" };
  if (chordType === "7sus2") return { quality: "major", family: "7sus2" };
  if (chordType === "9sus4") return { quality: "major", family: "9sus4" };
  if (chordType === "13sus4") return { quality: "major", family: "13sus4" };

  // Altered dominants
  if (chordType === "7b5") return { quality: "major", family: "7b5" };
  if (chordType === "7#5") return { quality: "major", family: "7#5" };
  if (chordType === "7b9") return { quality: "major", family: "7b9" };
  if (chordType === "7#9") return { quality: "major", family: "7#9" };

  if (chordType === "altered") return { quality: "major", family: "altered" };

  // fallback: major triad
  return { quality: "major", family: "plain" };
}

    function qualityLabel(quality) {
      if (quality === "major") return "Dur";
      if (quality === "minor") return "Moll";
      if (quality === "dim") return "Dim";
      if (quality === "aug") return "Aug";
      return quality;
    }

    function familyLabel(family) {
      const map = {
        plain: "Grunnakkord",
        "6": "6",
        m6: "m6",
        "7": "7",
        m7: "m7",
        maj7: "maj7",
        "m(maj7)": "m(maj7)",
        "5": "5 (power)",
        "69": "6/9",
        m69: "m6/9",
        m7b5: "m7b5",
        maj9: "maj9",
        m9: "m9",
        "7sus4": "7sus4",
        "7sus2": "7sus2",
        "9sus4": "9sus4",
        "13sus4": "13sus4",
        "7b5": "7(b5)",
        "7#5": "7(#5)",
        "7b9": "7(b9)",
        "7#9": "7(#9)",
        dim: "Dim",
        aug: "Aug",
        sus2: "sus2",
        sus4: "sus4",
        add9: "add9",
        "9": "9",
        "11": "11",
        "13": "13",
        altered: "Altered / crazychords"
      };
      return map[family] || family;
    }

    // ---- Finn akkord i JSON ----
function findChord(data, root, chordType) {
  const { quality, family } = parseChordType(chordType);
  const chords = data.chords || [];

  const exact = chords.filter(function (ch) {
    if (!rootMatchesChord(ch, root)) return false;
    if (ch.family !== family) return false;

    // Power chords: ligger under major i datasettet
    if (family === "5") return ch.quality === "major";

    return ch.quality === quality;
  });

  return exact.length > 0 ? exact[0] : null;
}


    // ---- Oppdater hva som er tilgjengelig for valgt rot ----
function updateAvailabilityForRoot(data, root) {
  const chords = data.chords || [];

  // Hvilke chordTypes finnes for denne roten?
  const available = new Set();

  chords.forEach(function (ch) {
    if (!rootMatchesChord(ch, root)) return;

    // Bygg chordType-id basert på JSON
    if (ch.family === "plain") {
      if (ch.quality === "major") available.add("maj");
      else if (ch.quality === "minor") available.add("min");
      else if (ch.quality === "dim") available.add("dim");
      else if (ch.quality === "aug") available.add("aug");
      return;
    }

    // resten: family er chordType, men vi må differensiere noen “minor families”
    if (ch.family === "7" && ch.quality === "major") available.add("7");
    else if (ch.family === "m7" && ch.quality === "minor") available.add("m7");
    else if (ch.family === "maj7" && ch.quality === "major") available.add("maj7");
    else if (ch.family === "m(maj7)" && ch.quality === "minor") available.add("m(maj7)");
    else if (ch.family === "m6" && ch.quality === "minor") available.add("m6");
    else if (ch.family === "m69" && ch.quality === "minor") available.add("m69");
    else if (ch.family === "m9" && ch.quality === "minor") available.add("m9");
    else if (ch.family === "m7b5" && ch.quality === "minor") available.add("m7b5");
    else available.add(ch.family);
  });

  let firstVisible = null;
  for (const opt of extSelect.options) {
    const has = available.has(opt.value);
    opt.hidden = !has;
    opt.disabled = false;
    if (has && !firstVisible) firstVisible = opt.value;
  }

  if (!available.has(extSelect.value)) {
    extSelect.value = firstVisible || "maj";
  }
}

    // ---- Tegn gripebrett (FAST hals, 0–14) ----
    function renderFretboard(variant) {
      fretboardEl.innerHTML = "";

      if (!variant || !Array.isArray(variant.frets)) {
        fretboardEl.textContent = "Ingen grep funnet for denne kombinasjonen.";
        return;
      }

      const frets = variant.frets; // f.eks. [-1, 3, 2, 0, 1, 0]
      const fingers = variant.fingers || [0, 0, 0, 0, 0, 0];

      const width = 720;
      const height = 220;
      const marginLeft = 40;
      const nutWidth = 8;
      const strings = 6;
      const totalFrets = 14; // bånd 1–14
      const stringGap = (height - 20) / 5; // 6 strenger = 5 mellomrom
      const fretGap = (width - marginLeft - 20) / totalFrets;

      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      svg.setAttribute("viewBox", "0 0 " + width + " " + height);

      // Bakgrunn
      const bg = document.createElementNS(svgNS, "rect");
      bg.setAttribute("x", "0");
      bg.setAttribute("y", "0");
      bg.setAttribute("width", String(width));
      bg.setAttribute("height", String(height));
      bg.setAttribute("fill", "transparent");
      svg.appendChild(bg);

      // Nut (alltid fast, helt til venstre)
      const nut = document.createElementNS(svgNS, "rect");
      nut.setAttribute("x", String(marginLeft - nutWidth));
      nut.setAttribute("y", "10");
      nut.setAttribute("width", String(nutWidth));
      nut.setAttribute("height", String(height - 20));
      nut.setAttribute("rx", "2");
      nut.setAttribute("fill", "#9ca3af");
      svg.appendChild(nut);

      // Bånd 0–14 (0 = ved nut)
      for (let i = 0; i <= totalFrets; i++) {
        const line = document.createElementNS(svgNS, "line");
        const x = marginLeft + i * fretGap;
        line.setAttribute("x1", String(x));
        line.setAttribute("y1", "10");
        line.setAttribute("x2", String(x));
        line.setAttribute("y2", String(height - 10));
        line.setAttribute("stroke", i === 0 ? "#4b5563" : "#d1d5db");
        line.setAttribute("stroke-width", i === 0 ? "2" : "1");
        svg.appendChild(line);
      }

      // ---- Inlays / posisjonsmarkører (stable) ----
      (function drawInlays() {
        const inlayYCenter = 10 + (height - 20) / 2;
        const single = [3, 5, 7, 9];
        const r = 7;

        function cxForFret(fretNumber) {
          // midt mellom båndlinjene: fret 1 ligger mellom båndlinje 0 og 1
          return marginLeft + (fretNumber - 0.5) * fretGap;
        }

        function addInlay(cx, cy) {
          const c = document.createElementNS(svgNS, "circle");
          c.setAttribute("cx", String(cx));
          c.setAttribute("cy", String(cy));
          c.setAttribute("r", String(r));
          c.setAttribute("class", "cl-inlay");
          svg.appendChild(c);
        }

        single.forEach(function (f) {
          addInlay(cxForFret(f), inlayYCenter);
        });

        const cx12 = cxForFret(12);
        addInlay(cx12, 10 + 1.5 * stringGap);
        addInlay(cx12, 10 + 3.5 * stringGap);
      })();

      // Strenger (E–A–D–G–B–e)
      const stringNames = ["E", "A", "D", "G", "B", "e"];
      for (let s = 0; s < strings; s++) {
        const y = 10 + s * stringGap;

        const line = document.createElementNS(svgNS, "line");
        line.setAttribute("x1", String(marginLeft - nutWidth));
        line.setAttribute("y1", String(y));
        line.setAttribute("x2", String(width - 10));
        line.setAttribute("y2", String(y));
        line.setAttribute("stroke", "#6b7280");
        line.setAttribute("stroke-width", String(1 + (5 - s) * 0.2));
        svg.appendChild(line);

        const text = document.createElementNS(svgNS, "text");
        text.setAttribute("x", "8");
        text.setAttribute("y", String(14 + s * stringGap));
        text.setAttribute("fill", "#4b5563");
        text.setAttribute("font-size", "10");
        text.textContent = stringNames[s];
        svg.appendChild(text);
      }

      // ---- Harmonics / flageolett-markører (stable) ----
      (function drawHarmonics() {
        if (!showHarmonics) return;
        const harmonicFrets = [5, 7, 12];
        const cy = 10 + (height - 20) / 2;

        function cxForFret(fretNumber) {
          return marginLeft + (fretNumber - 0.5) * fretGap;
        }

        harmonicFrets.forEach(function (f) {
          const c = document.createElementNS(svgNS, "circle");
          c.setAttribute("cx", String(cxForFret(f)));
          c.setAttribute("cy", String(cy));
          c.setAttribute("r", "6");
          c.setAttribute("class", "cl-harmonic");
          svg.appendChild(c);
        });
      })();

      // Prikker og X / O
      for (let i = 0; i < strings; i++) {
        const fret = frets[i];
        const finger = fingers[i] || 0;
        const y = 10 + i * stringGap;

        // X = dempet streng
        if (fret === -1) {
          const text = document.createElementNS(svgNS, "text");
          text.setAttribute("x", String(marginLeft - 24));
          text.setAttribute("y", String(y + 4));
          text.setAttribute("fill", "#111827");
          text.setAttribute("font-size", "12");
          text.textContent = "X";
          svg.appendChild(text);
          continue;
        }

        // Åpen streng (O)
        if (fret === 0) {
          const circle = document.createElementNS(svgNS, "circle");
          circle.setAttribute("cx", String(marginLeft - 16));
          circle.setAttribute("cy", String(y));
          circle.setAttribute("r", "6");
          circle.setAttribute("fill", "#ffffff");
          circle.setAttribute("stroke", "#111827");
          svg.appendChild(circle);
          continue;
        }

        // Vanlig grepsprikk – absolutt bånd: 1,2,3,... på fast hals
        const cx = marginLeft + (fret - 0.5) * fretGap;

        const dot = document.createElementNS(svgNS, "circle");
        dot.setAttribute("cx", String(cx));
        dot.setAttribute("cy", String(y));
        dot.setAttribute("r", "10");
        dot.setAttribute("fill", "#111827");
        svg.appendChild(dot);

        if (finger > 0) {
          const t = document.createElementNS(svgNS, "text");
          t.setAttribute("x", String(cx));
          t.setAttribute("y", String(y + 3));
          t.setAttribute("fill", "#ffffff");
          t.setAttribute("font-size", "10");
          t.setAttribute("text-anchor", "middle");
          t.textContent = String(finger);
          svg.appendChild(t);
        }
      }

      fretboardEl.appendChild(svg);
    }

    // ---- Variant-velger ----
    function populateVariants(chord) {
      variantSelect.innerHTML = "";
      if (!chord || !Array.isArray(chord.variants) || chord.variants.length === 0) {
        const opt = document.createElement("option");
        opt.value = "0";
        opt.textContent = "Ingen varianter";
        variantSelect.appendChild(opt);
        variantSelect.disabled = true;
        return;
      }
      variantSelect.disabled = false;

      chord.variants.forEach(function (v, idx) {
        const opt = document.createElement("option");
        opt.value = String(idx);
        const pos = v.position || 1;
        opt.textContent =
          (idx === 0 ? "Standard " : "Variant " + (idx + 1) + " ") +
          "(pos " + pos + ", id: " + v.id + ")";
        variantSelect.appendChild(opt);
      });
    }

    function updateHeader(chord, variant) {
      if (!chord) {
        chordNameMainEl.textContent = "-";
        chordNameBookEl.textContent = "";
        tagFamilyEl.textContent = "";
        tagQualityEl.textContent = "";
        variantInfoEl.textContent = "";
        return;
      }
      chordNameMainEl.textContent = chord.symbol || chord.root || "-";
      chordNameBookEl.textContent = chord.bookSymbol ? "(bok: " + chord.bookSymbol + ")" : "";

      const fam = chord.family || "plain";
      const qual = chord.quality || "";

      tagFamilyEl.textContent = familyLabel(fam);
      tagQualityEl.textContent = qualityLabel(qual);

      if (fam === "altered") {
        tagFamilyEl.classList.add("altered");
      } else {
        tagFamilyEl.classList.remove("altered");
      }

      if (qual === "minor") {
        tagQualityEl.classList.add("moll");
      } else {
        tagQualityEl.classList.remove("moll");
      }

      if (variant && variant.source) {
        variantInfoEl.textContent = "Kilde: " + variant.source;
      } else {
        variantInfoEl.textContent = "";
      }
    }

    // ---- Hovedoppdatering ----
    async function updateChordFromUI() {
      const root = rootSelect.value; // C, Cb, C#, osv








      ///          jjjjjjjjjjjj

try {
  const data = await loadDataForRoot(root);

  updateAvailabilityForRoot(data, root);

  // kan ha endret seg etter availability
  const chordType2 = extSelect.value;

  const chord = findChord(data, root, chordType2);
  if (!chord) {
    fretboardEl.textContent =
      "Ingen akkord definert for " + root + " (" + chordType2 + ").";
    populateVariants(null);
    updateHeader(null, null);
    logDebug({ root, chordType: chordType2, found: false });
    return;
  }

  populateVariants(chord);
  const idx = parseInt(variantSelect.value || "0", 10) || 0;
  const variant = chord.variants[idx] || chord.variants[0];
  currentVariant = variant;

  renderFretboard(variant);
  updateHeader(chord, variant);

  logDebug({
    root,
    chordType: chordType2,
    family: chord.family,
    quality: chord.quality,
    chosenSymbol: chord.symbol,
    variant: variant
  });
} catch (err) {
        console.error(err);
        fretboardEl.textContent = "Feil ved lasting av data: " + err.message;
        logDebug({ error: String(err) });
      }
    }

function onVariantChange() {
  const root = rootSelect.value;
  const chordType = extSelect.value; // extension-dropdownen ER chordType nå

  const key = root.charAt(0).toUpperCase();
  const data = jsonCache[key];
  if (!data) {
    updateChordFromUI();
    return;
  }

  const chord = findChord(data, root, chordType);
  if (!chord) return;

  const idx = parseInt(variantSelect.value || "0", 10) || 0;
  const variant = chord.variants[idx] || chord.variants[0];
  currentVariant = variant;

  renderFretboard(variant);
  updateHeader(chord, variant);

  logDebug({
    root,
    chordType,
    family: chord.family,
    quality: chord.quality,
    chosenSymbol: chord.symbol,
    variant: variant
  });
}

    // ---- Event listeners ----
rootSelect.addEventListener("change", function () {

  if (!IS_PRO) {

    if (!IS_LOGGED_IN && !GUEST_ROOTS.has(rootSelect.value)) {
      showProBox(rootSelect.value);
      rootSelect.value = "C";
      updateChordFromUI();
      return;
    }

    if (IS_LOGGED_IN && !FREE_ROOTS.has(rootSelect.value)) {
      showProBox(rootSelect.value);
      rootSelect.value = "C";
      updateChordFromUI();
      return;
    }
  }

  hideProBox();
  updateChordFromUI();
});



extSelect.addEventListener("change", function () {

  if (!IS_PRO) {

    if (!IS_LOGGED_IN && !GUEST_EXTENSIONS.has(extSelect.value)) {
      showProBox(extSelect.value);
      extSelect.value = "maj";
      updateChordFromUI();
      return;
    }

    if (IS_LOGGED_IN && !FREE_EXTENSIONS.has(extSelect.value)) {
      showProBox(extSelect.value);
      extSelect.value = "maj";
      updateChordFromUI();
      return;
    }

  }

  hideProBox();
  updateChordFromUI();
});




    variantSelect.addEventListener("change", onVariantChange);

    playBtn.addEventListener("click", async function () {
      try {
        if (!currentVariant || !Array.isArray(currentVariant.frets)) {
          alert("Ingen grep valgt å spille av.");
          return;
        }

        const Tone = await ensureTone();
        const midis = fretsToMidis(currentVariant.frets);
        if (!midis.length) {
          alert("Dette grepet har ingen klingende strenger (bare X?).");
          return;
        }

        // Konverter MIDI -> frekvens
        const freqs = midis.map(function (m) {
          return 440 * Math.pow(2, (m - 69) / 12);
        });

        const now = Tone.now() + 0.05;
        const dur = 0.8; // lengde på tonen
        const strumMs = 40; // strum-delay mellom strenger

        // Enkel strum nedover (6 -> 1)
        freqs.forEach(function (f, i) {
          const t = now + i * (strumMs / 1000);
          toneSynth.triggerAttackRelease(f, dur, t, 0.95);
        });
      } catch (err) {
        console.error("Feil ved avspilling:", err);
        alert("Klarte ikke å starte lyd. Sjekk konsoll for detaljer.");
      }
    });

    debugToggle.addEventListener("click", function () {
      if (debugEl.style.display === "none" || debugEl.style.display === "") {
        debugEl.style.display = "block";
      } else {
        debugEl.style.display = "none";
      }
    });

    // ---- Theme toggle (NO persistence) ----
    // Default on every load: :root (no data-theme attribute)
    function initThemeToggle() {
      const btn = document.getElementById("themeBtn");
      if (!btn) return;

      const labelEl = document.getElementById("themeLabel");
      const THEMES = ["default", "dark", "light", "pink", "mono"];
      const THEME_LABELS = {
        default: "Standard",
        dark: "Mørk",
        light: "Lys",
        pink: "Rosa",
        mono: "Monokrom"
      };

      function setTheme(theme) {
        if (theme === "default") {
          document.body.removeAttribute("data-theme"); // :root
        } else {
          document.body.setAttribute("data-theme", theme);
        }
        if (labelEl) labelEl.textContent = THEME_LABELS[theme] || theme;
      }

      function getCurrentTheme() {
        return document.body.getAttribute("data-theme") || "default";
      }

      // ✅ Always start at :root on page load
      setTheme("default");

      btn.setAttribute("aria-label", "Bytt tema");
      btn.title = "Bytt tema";

      btn.addEventListener("click", function () {
        const cur = getCurrentTheme();
        const idx = THEMES.indexOf(cur);
        const next = THEMES[(idx === -1 ? 0 : idx + 1) % THEMES.length];
        setTheme(next);
      });
    }
function renderUserStatus(){
  const el = document.getElementById("rkUserStatus");
  if(!el) return;

  if(!window.CL_IS_LOGGED_IN){
    el.innerHTML = `Ikke innlogget – <a href="/members/login.php">Logg inn</a>`;
    return;
  }

  const plan = (window.CL_USER_PLAN || "").toLowerCase();

  let label = "Free";

  if(plan === "vip") label = "VIP";
  else if(plan === "pro") label = "Pro";
  else if(plan === "admin") label = "Admin";

  el.innerHTML = `Plan: <strong>${label}</strong>`;
}

// 👇 LEGG DENNE HER
renderUserStatus();

    // ---- Init ----
    initThemeToggle();
    updateChordFromUI();
  });
})();