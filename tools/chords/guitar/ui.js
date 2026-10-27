(function () {
  // Vi venter til DOM-en er klar før vi prøver å hente elementer
  document.addEventListener("DOMContentLoaded", function () {
    // ---- DOM ----
    const rootSelect = document.getElementById("root");

    const extSelect = document.getElementById("extension");
    const variantSelect = document.getElementById("variantSelect");
    const playBtn = document.getElementById("playBtn");
    const debugEl = document.getElementById("debug");
    const fretboardEl = document.getElementById("fretboard");
    const chordNameMainEl = document.getElementById("chordNameMain");
    const chordNameBookEl = document.getElementById("chordNameBook");
    const tagFamilyEl = document.getElementById("tagFamily");
    const tagQualityEl = document.getElementById("tagQuality");
    const variantInfoEl = document.getElementById("variantInfo");
    const fileNameInfoEl = document.getElementById("fileNameInfo");

    // Hvis vi ikke finner noe av dette, gir vi opp stille for denne siden
    if (
      !rootSelect ||

      !extSelect ||
      !variantSelect ||
      !playBtn ||
      !fretboardEl ||
      !chordNameMainEl ||
      !chordNameBookEl ||
      !tagFamilyEl ||
      !tagQualityEl ||
      !variantInfoEl
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
    const FREE_ROOTS = new Set(window.CL_IS_LOGGED_IN ? ["C", "F", "G", "E"] : ["C", "F", "G"]);
const RS_ALLOWED_EXTENSIONS = new Set(window.CL_IS_LOGGED_IN ? ["maj", "min", "7", "maj7", "m7", "add9", "sus2", "sus4"] : ["maj", "min", "7"]);
const PRO_EXTENSIONS = new Set(Array.from(extSelect.options, opt => opt.value).filter(key => !RS_ALLOWED_EXTENSIONS.has(key)));
    const UPGRADE_URL = (window.CL_UPGRADE_URL || "/members/upgrade.php");

function ensureProBox() {
  if (document.getElementById("proBox")) return;

  const a = document.createElement("a");
  a.id = "proBox";
  a.href = UPGRADE_URL;
    a.target = "_top";
  a.className = "pro-cta"; // 👈 viktig: gjenbruk felles stil
  a.setAttribute("role", "button");
  a.style.display = "none";

  const card = document.querySelector(".card") || document.body;
  card.insertBefore(a, card.firstChild);
}

function showProBox(name) {
  ensureProBox();
  const box = document.getElementById("proBox");
  if (!box) return;

  box.innerHTML = `
    <strong>VIP only:</strong> <strong>${name}</strong> is available with VIP.
    Choose a free option, or
    <span class="pro-cta-sub">upgrade to VIP to unlock all features</span>.
  `;

  box.style.display = "block";
  box.scrollIntoView({ behavior: "smooth", block: "center" });
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
      opt.textContent = base.includes("VIP") ? base : (base + " (VIP)");
    } else {
      opt.removeAttribute("aria-disabled");
      opt.textContent = opt.dataset.label;
    }

    if (!firstFree && isFree) firstFree = opt.value;
  }

  // Hvis user er free og står på en pro-root → hopp til C (eller første free)
  if (!IS_PRO && !FREE_ROOTS.has(rootSelect.value)) {
    rootSelect.value = firstFree || "C";
  }
}

    function applyProGates_Extensions() {
  // iOS/Safari kan vise "blanke" rader for <option disabled>.
  // Derfor: vi lar alle options være enabled, men merker Pro-only og håndhever ved change.
  for (const opt of extSelect.options) {
    if (!opt.dataset.label) opt.dataset.label = opt.textContent;

    const isProOnly = PRO_EXTENSIONS.has(opt.value);
    opt.dataset.pro = isProOnly ? "1" : "0";
    opt.hidden = false;
    opt.disabled = false;

    if (!IS_PRO && isProOnly) {
      opt.setAttribute("aria-disabled", "true");
      const base = opt.dataset.label;
      opt.textContent = base.includes("VIP") ? base : (base + " (VIP)");
    } else {
      opt.removeAttribute("aria-disabled");
      opt.textContent = opt.dataset.label;
    }
  }

  // Hvis user er free og står på pro-extension → hopp til "none"
  if (!IS_PRO && PRO_EXTENSIONS.has(extSelect.value)) {
    extSelect.value = "maj";
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
    let toneDrive = null;
    let currentVariant = null; // sist viste grep
    let playbackMarkerTimers = [];
    const ACOUSTIC_SAMPLE_ROOT = "/audio/guitars/acoustic/";
    const SAMPLE_NOTE_NAMES = ["c", "c#", "d", "d#", "e", "f", "f#", "g", "g#", "a", "a#", "b"];
    const SAMPLE_MIN_MIDI = 40;
    const SAMPLE_MAX_MIDI = 76;
    let sampleAudioContext = null;
    const sampleBufferCache = new Map();
    const activeSampleSources = new Set();

    // ---- Harmonics toggle (stable) ----
    (function ensureHarmonicsButton() {
      const host = playBtn && playBtn.parentElement;
      if (!host) return;
      if (document.getElementById("harmonicsToggle")) return;
      const btn = document.createElement("button");
      btn.id = "harmonicsToggle";
      btn.type = "button";
      btn.className = "secondary";
      btn.textContent = "Harmonics";
      btn.addEventListener("click", function () {
        showHarmonics = !showHarmonics;
        if (currentVariant) renderFretboard(currentVariant);
      });
      host.appendChild(btn);
    })();

    function fretsToPlayedNotes(frets) {
      const out = [];
      for (let i = 0; i < TUNING.length; i++) {
        const fret = frets[i];
        if (fret == null || fret < 0) continue; // X
        const base = TUNING[i];
        const midi = base + (fret || 0); // 0 = åpen streng
        out.push({ midi, stringIndex: i });
      }
      return out;
    }

    function clearPlaybackMarkers() {
      playbackMarkerTimers.forEach(window.clearTimeout);
      playbackMarkerTimers = [];
      fretboardEl.querySelectorAll(".cl-note-playing, .cl-string-playing").forEach(function (element) {
        element.classList.remove("cl-note-playing", "cl-string-playing");
      });
    }

    function schedulePlaybackMarker(stringIndex, delayMs, durationMs) {
      const startTimer = window.setTimeout(function () {
        const marker = fretboardEl.querySelector(
          '[data-string-index="' + stringIndex + '"]'
        );
        const neckString = fretboardEl.querySelector(
          '[data-neck-string-index="' + stringIndex + '"]'
        );
        if (!marker && !neckString) return;

        if (marker) marker.classList.remove("cl-note-playing");
        if (neckString) neckString.classList.remove("cl-string-playing");
        void (marker || neckString).getBoundingClientRect();
        if (marker) marker.classList.add("cl-note-playing");
        if (neckString) neckString.classList.add("cl-string-playing");

        const stopTimer = window.setTimeout(function () {
          if (marker) marker.classList.remove("cl-note-playing");
          if (neckString) neckString.classList.remove("cl-string-playing");
        }, durationMs);
        playbackMarkerTimers.push(stopTimer);
      }, delayMs);
      playbackMarkerTimers.push(startTimer);
    }

    async function ensureSampleAudioContext() {
      if (!sampleAudioContext) {
        sampleAudioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (sampleAudioContext.state === "suspended") await sampleAudioContext.resume();
      return sampleAudioContext;
    }

    function midiToSampleName(midi) {
      const note = SAMPLE_NOTE_NAMES[(midi + 1200) % 12];
      const octave = Math.floor(midi / 12) - 1;
      return note + octave + ".mp3";
    }

    function acousticSampleForMidi(midi) {
      const sourceMidi = Math.max(SAMPLE_MIN_MIDI, Math.min(SAMPLE_MAX_MIDI, midi));
      const url = ACOUSTIC_SAMPLE_ROOT + encodeURIComponent(midiToSampleName(sourceMidi));
      if (!sampleBufferCache.has(url)) {
        const loading = fetch(url, { cache: "force-cache" })
          .then(function (response) {
            if (!response.ok) throw new Error("Could not load guitar sample (" + response.status + "): " + url);
            return response.arrayBuffer();
          })
          .then(function (arrayBuffer) {
            return sampleAudioContext.decodeAudioData(arrayBuffer);
          })
          .then(function (buffer) {
            return { buffer: buffer, sourceMidi: sourceMidi };
          })
          .catch(function (error) {
            sampleBufferCache.delete(url);
            throw error;
          });
        sampleBufferCache.set(url, loading);
      }
      return sampleBufferCache.get(url);
    }

    function stopActiveSamples() {
      activeSampleSources.forEach(function (source) {
        try { source.stop(); } catch (error) {}
      });
      activeSampleSources.clear();
    }

    function scheduleAcousticSample(sample, targetMidi, time, volume) {
      const source = sampleAudioContext.createBufferSource();
      const gain = sampleAudioContext.createGain();
      source.buffer = sample.buffer;
      source.playbackRate.setValueAtTime(Math.pow(2, (targetMidi - sample.sourceMidi) / 12), time);
      gain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), time);
      source.connect(gain).connect(sampleAudioContext.destination);
      activeSampleSources.add(source);
      source.addEventListener("ended", function () {
        activeSampleSources.delete(source);
      }, { once: true });
      source.start(time);
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
      toneDrive = new Tone.Distortion(0).connect(toneLimiter);

      toneSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sine" },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.8 },
        volume: -10
      }).connect(toneDrive);

      return Tone;
    }

    function logDiagnostics(obj) {
      if (!window.CL_DEBUG_UI || !debugEl) return;
      debugEl.textContent = JSON.stringify(obj, null, 2);
    }

    // ---- Datakilder ----
    function normalizeApiGuitarChord(row, requestedRoot) {
      const data = row?.data || {};
      const root = (row?.root_note || data?.root || requestedRoot || "").toString().trim();
      const symbol = (data?.symbol || data?.name || row?.name || row?.slug || "").toString().trim();
      const slug = (data?.slug || row?.slug || symbol || root).toString().trim().toLowerCase();
      const variants = Array.isArray(data?.variants) ? data.variants : [];
      if (!root || !variants.length) return null;

      const rootSlug = root.toLowerCase().replace(/[^a-g#b]/g, "");
      const normalizedSlug = slug.replace(/[^a-z0-9#b()+]/g, "");
      let suffix = normalizedSlug.startsWith(rootSlug)
        ? normalizedSlug.slice(rootSlug.length)
        : normalizedSlug;
      if (!suffix || suffix === "major") suffix = "maj";
      if (suffix === "m" || suffix === "minor") suffix = "min";
      const parsed = (data?.family && data?.quality)
        ? { family: data.family, quality: data.quality }
        : parseChordType(suffix);

      return {
        root,
        family: parsed.family,
        quality: parsed.quality,
        variants,
        slug,
        symbol: symbol || row?.name || slug,
        bookSymbol: data?.bookSymbol || "",
        aliases: Array.isArray(data?.aliases) ? data.aliases : [],
        name: row?.name || symbol || slug
      };
    }

    // ---- Filnavn/API basert på rot ----
    function getChordApiUrl(root) {
      return `/tools/shared/music.php?type=guitar_chord&instrument=guitar&root=${encodeURIComponent(root)}`;
    }

    function setChordApiLabel(url) {
      if (!fileNameInfoEl) return;
      fileNameInfoEl.textContent = url;
    }

    async function loadDataForRoot(root) {
      const key = root.toString().trim().toUpperCase();
      if (jsonCache[key]) return jsonCache[key];

      const url = getChordApiUrl(root);
      setChordApiLabel(url);
      const res = await fetch(url, { credentials: "same-origin" });
      if (!res.ok) {
        throw new Error("Could not load API or " + url + " (" + res.status + ")");
      }
      const payload = await res.json();
      if (!payload?.success || !Array.isArray(payload.results)) {
        throw new Error("Invalid response from music API");
      }

      const chords = payload.results
        .map((row) => normalizeApiGuitarChord(row, root))
        .filter(Boolean);

      const data = { chords };
      jsonCache[key] = data;
      return data;
    }

    function rootMatchesChord(ch, root) {
      const wanted = (root || "").toString().trim().toUpperCase();
      const chordRoot = (ch.root || "").toString().trim().toUpperCase();
      if (chordRoot === wanted) return true;
      if (Array.isArray(ch.aliases) && ch.aliases.some(alias => (alias || "").toString().trim().toUpperCase() === wanted))
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

  // Added 2026-10-27: extended and altered types
  const MORE_TYPES = {
    dim7: "dim", "m(maj9)": "minor", madd9: "minor", add11: "major",
    "maj7#5": "major", "maj7#11": "major", "maj9#11": "major", maj13: "major",
    m11: "minor", m13: "minor", m9b5: "minor", "7#11": "major", "9#11": "major",
    "13#11": "major", "7b13": "major", "13b9": "major", "9b5": "major",
    "9#5": "major", "7#5#9": "major", "7#5b9": "major"
  };
  if (MORE_TYPES[chordType]) return { quality: MORE_TYPES[chordType], family: chordType };

  // fallback: major triad
  return { quality: "major", family: "plain" };
}

    function qualityLabel(quality) {
      if (quality === "major") return "Major";
      if (quality === "minor") return "Minor";
      if (quality === "dim") return "Dim";
      if (quality === "aug") return "Aug";
      return quality;
    }

    function familyLabel(family) {
      const map = {
        plain: "Root",
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
        altered: "Altered / crazychords",
        dim7: "dim7",
        "m(maj9)": "m(maj9)",
        madd9: "m(add9)",
        add11: "add11",
        "maj7#5": "maj7(#5)",
        "maj7#11": "maj7(#11)",
        "maj9#11": "maj9(#11)",
        maj13: "maj13",
        m11: "m11",
        m13: "m13",
        m9b5: "m9(b5)",
        "7#11": "7(#11)",
        "9#11": "9(#11)",
        "13#11": "13(#11)",
        "7b13": "7(b13)",
        "13b9": "13(b9)",
        "9b5": "9(b5)",
        "9#5": "9(#5)",
        "7#5#9": "7(#5,#9)",
        "7#5b9": "7(#5,b9)"
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
        fretboardEl.textContent = "No chord shapes found for this combination.";
        return;
      }

      const frets = variant.frets; // f.eks. [-1, 3, 2, 0, 1, 0]
      const fingers = variant.fingers || [0, 0, 0, 0, 0, 0];

      const width = 960;
      const height = 270;
      const marginLeft = 64;
      const marginTop = 46;
      const boardHeight = 166;
      const nutWidth = 10;
      const strings = 6;
      const totalFrets = 14; // bånd 1–14
      const stringGap = boardHeight / 5; // 6 strenger = 5 mellomrom
      const boardWidth = width - marginLeft - 34;
      const fretGap = boardWidth / totalFrets;
      const yForStringIndex = function (stringIndex) {
        return marginTop + (strings - 1 - stringIndex) * stringGap;
      };

      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      svg.setAttribute("viewBox", "0 0 " + width + " " + height);
      svg.setAttribute("class", "chord-neck-svg");

      const defs = document.createElementNS(svgNS, "defs");
      const boardGradient = document.createElementNS(svgNS, "linearGradient");
      boardGradient.setAttribute("id", "clChordBoardGradient");
      boardGradient.setAttribute("x1", "0");
      boardGradient.setAttribute("x2", "1");
      boardGradient.setAttribute("y1", "0");
      boardGradient.setAttribute("y2", "1");
      [
        ["0%", "#7b4a24"],
        ["42%", "#4f2e17"],
        ["100%", "#24140c"]
      ].forEach(function ([offset, color]) {
        const stop = document.createElementNS(svgNS, "stop");
        stop.setAttribute("offset", offset);
        stop.setAttribute("stop-color", color);
        boardGradient.appendChild(stop);
      });
      defs.appendChild(boardGradient);
      svg.appendChild(defs);

      const board = document.createElementNS(svgNS, "rect");
      board.setAttribute("x", String(marginLeft));
      board.setAttribute("y", String(marginTop));
      board.setAttribute("width", String(boardWidth));
      board.setAttribute("height", String(boardHeight));
      board.setAttribute("rx", "18");
      board.setAttribute("class", "cl-chord-board");
      board.setAttribute("fill", "url(#clChordBoardGradient)");
      svg.appendChild(board);

      // Nut (alltid fast, helt til venstre)
      const nut = document.createElementNS(svgNS, "rect");
      nut.setAttribute("x", String(marginLeft - nutWidth));
      nut.setAttribute("y", String(marginTop));
      nut.setAttribute("width", String(nutWidth));
      nut.setAttribute("height", String(boardHeight));
      nut.setAttribute("rx", "4");
      nut.setAttribute("fill", "#9ca3af");
      svg.appendChild(nut);

      // Bånd 0–14 (0 = ved nut)
      for (let i = 0; i <= totalFrets; i++) {
        const line = document.createElementNS(svgNS, "line");
        const x = marginLeft + i * fretGap;
        line.setAttribute("x1", String(x));
        line.setAttribute("y1", String(marginTop));
        line.setAttribute("x2", String(x));
        line.setAttribute("y2", String(marginTop + boardHeight));
        line.setAttribute("stroke", i === 0 ? "#4b5563" : "#d1d5db");
        line.setAttribute("stroke-width", i === 0 ? "2" : "1");
        line.setAttribute("class", i === 0 ? "cl-fret cl-fret-zero" : "cl-fret");
        svg.appendChild(line);

        if (i > 0) {
          const label = document.createElementNS(svgNS, "text");
          label.setAttribute("x", String(marginLeft + (i - 0.5) * fretGap));
          label.setAttribute("y", String(marginTop - 14));
          label.setAttribute("text-anchor", "middle");
          label.setAttribute("class", "cl-fret-label");
          label.textContent = String(i);
          svg.appendChild(label);
        }
      }

      // ---- Inlays / posisjonsmarkører (stable) ----
      (function drawInlays() {
        const inlayYCenter = marginTop + boardHeight / 2;
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
        addInlay(cx12, marginTop + 1.5 * stringGap);
        addInlay(cx12, marginTop + 3.5 * stringGap);
      })();

      // Horisontal hals: høy e øverst, lav E nederst.
      // Datarekkefølgen beholdes som E–A–D–G–B–e.
      const stringNames = ["E", "A", "D", "G", "B", "e"];
      const stringWidths = [3.6, 3.1, 2.6, 2.05, 1.55, 1.15];
      for (let s = 0; s < strings; s++) {
        const y = yForStringIndex(s);

        const neckString = document.createElementNS(svgNS, "line");
        neckString.setAttribute("x1", String(marginLeft - nutWidth));
        neckString.setAttribute("y1", String(y));
        neckString.setAttribute("x2", String(marginLeft + boardWidth));
        neckString.setAttribute("y2", String(y));
        neckString.setAttribute("stroke", "#6b7280");
        neckString.setAttribute("stroke-width", String(stringWidths[s]));
        neckString.setAttribute("class", "cl-string cl-neck-string");
        neckString.setAttribute("data-neck-string-index", String(s));
        svg.appendChild(neckString);

        const text = document.createElementNS(svgNS, "text");
        text.setAttribute("x", "18");
        text.setAttribute("y", String(y + 4));
        text.setAttribute("text-anchor", "end");
        text.setAttribute("fill", "#4b5563");
        text.setAttribute("font-size", "10");
        text.setAttribute("class", "cl-string-label");
        text.textContent = stringNames[s];
        svg.appendChild(text);
      }

      // ---- Harmonics / flageolett-markører (stable) ----
      (function drawHarmonics() {
        if (!showHarmonics) return;
        const harmonicFrets = [5, 7, 12];
        const cy = marginTop + boardHeight / 2;

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

      // Barre: samme finger på samme bånd over minst to strenger.
      // Tegnes før fingerprikkene slik at endepunktene forblir lesbare.
      const barreGroups = new Map();
      for (let i = 0; i < strings; i++) {
        const fret = frets[i];
        const finger = fingers[i] || 0;
        if (fret == null || fret <= 0 || finger <= 0) continue;
        const key = finger + ":" + fret;
        if (!barreGroups.has(key)) barreGroups.set(key, []);
        barreGroups.get(key).push(i);
      }

      barreGroups.forEach(function (stringIndexes, key) {
        if (stringIndexes.length < 2) return;
        const parts = key.split(":");
        const finger = parts[0];
        const fret = Number(parts[1]);
        const x = marginLeft + (fret - 0.5) * fretGap;
        const ys = stringIndexes.map(yForStringIndex);
        const y1 = Math.min.apply(null, ys);
        const y2 = Math.max.apply(null, ys);

        const barre = document.createElementNS(svgNS, "line");
        barre.setAttribute("x1", String(x));
        barre.setAttribute("x2", String(x));
        barre.setAttribute("y1", String(y1));
        barre.setAttribute("y2", String(y2));
        barre.setAttribute("class", "cl-barre-indicator");
        barre.setAttribute("data-barre-finger", finger);
        barre.setAttribute("data-barre-fret", String(fret));
        svg.appendChild(barre);

        const sheen = document.createElementNS(svgNS, "line");
        sheen.setAttribute("x1", String(x - 2.5));
        sheen.setAttribute("x2", String(x - 2.5));
        sheen.setAttribute("y1", String(y1 + 3));
        sheen.setAttribute("y2", String(y2 - 3));
        sheen.setAttribute("class", "cl-barre-sheen");
        svg.appendChild(sheen);
      });

      // Prikker og X / O
      const openStringMarkerX = marginLeft - nutWidth - 12;
      for (let i = 0; i < strings; i++) {
        const fret = frets[i];
        const finger = fingers[i] || 0;
        const y = yForStringIndex(i);

        // X = dempet streng
        if (fret === -1) {
          const text = document.createElementNS(svgNS, "text");
          text.setAttribute("x", String(openStringMarkerX));
          text.setAttribute("y", String(y + 4));
          text.setAttribute("text-anchor", "middle");
          text.setAttribute("fill", "#111827");
          text.setAttribute("font-size", "12");
          text.setAttribute("class", "cl-muted-string");
          text.textContent = "X";
          svg.appendChild(text);
          continue;
        }

        // Åpen streng (O)
        if (fret === 0) {
          const circle = document.createElementNS(svgNS, "circle");
          circle.setAttribute("cx", String(openStringMarkerX));
          circle.setAttribute("cy", String(y));
          circle.setAttribute("r", "6");
          circle.setAttribute("fill", "#ffffff");
          circle.setAttribute("stroke", "#111827");
          circle.setAttribute("class", "cl-open-string");
          circle.setAttribute("data-string-index", String(i));
          svg.appendChild(circle);
          continue;
        }

        // Vanlig grepsprikk – absolutt bånd: 1,2,3,... på fast hals
        const cx = marginLeft + (fret - 0.5) * fretGap;

        const dot = document.createElementNS(svgNS, "circle");
        dot.setAttribute("cx", String(cx));
        dot.setAttribute("cy", String(y));
        dot.setAttribute("r", "12");
        dot.setAttribute("fill", "#111827");
        dot.setAttribute("class", "cl-finger-dot");
        dot.setAttribute("data-string-index", String(i));
        svg.appendChild(dot);

        if (finger > 0) {
          const t = document.createElementNS(svgNS, "text");
          t.setAttribute("x", String(cx));
          t.setAttribute("y", String(y + 3));
          t.setAttribute("fill", "#ffffff");
          t.setAttribute("font-size", "11");
          t.setAttribute("text-anchor", "middle");
          t.setAttribute("class", "cl-finger-label");
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
        opt.textContent = "No variants";
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
          "(position " + pos + ")";
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
      chordNameBookEl.textContent = "";

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
        variantInfoEl.textContent = "";
      } else {
        variantInfoEl.textContent = "";
      }
    }

    // ---- Hovedoppdatering ----
    async function updateChordFromUI() {
      const root = rootSelect.value; // C, Cb, C#, osv








      ///          jjjjjjjjjjjj
const chordType = extSelect.value;

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
    logDiagnostics({ root, chordType: chordType2, found: false });
    return;
  }

  populateVariants(chord);
  const idx = parseInt(variantSelect.value || "0", 10) || 0;
  const variant = chord.variants[idx] || chord.variants[0];
  currentVariant = variant;

  renderFretboard(variant);
  updateHeader(chord, variant);

  logDiagnostics({
    root,
    chordType: chordType2,
    family: chord.family,
    quality: chord.quality,
    chosenSymbol: chord.symbol,
    variant: variant
  });
} catch (err) {
        console.error(err);
        fretboardEl.textContent = "Error loading data: " + err.message;
        logDiagnostics({ error: String(err) });
      }
    }

function onVariantChange() {
  const root = rootSelect.value;
  const chordType = extSelect.value; // extension-dropdownen ER chordType nå

  const key = root.toString().trim().toUpperCase();
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

  logDiagnostics({
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
      if (!IS_PRO && !FREE_ROOTS.has(rootSelect.value)) {
        showProBox(rootSelect.value);
        // hopp til en free root
        rootSelect.value = "C";
        updateChordFromUI();
        return;
      }
      hideProBox();
      updateChordFromUI();
    });


    extSelect.addEventListener("change", function () {
      if (!IS_PRO && PRO_EXTENSIONS.has(extSelect.value)) {
        showProBox(extSelect.value);
        extSelect.value = "maj";
        updateChordFromUI();
        return;
      }
      hideProBox();
      updateChordFromUI();
    });

    variantSelect.addEventListener("change", onVariantChange);

    playBtn.addEventListener("click", async function () {
      try {
        if (!currentVariant || !Array.isArray(currentVariant.frets)) {
          alert(window.RS_TRANSLATE ? window.RS_TRANSLATE("No chord shape selected.") : "No chord shape selected.");
          return;
        }

        const playedNotes = fretsToPlayedNotes(currentVariant.frets);
        if (!playedNotes.length) {
          alert(window.RS_TRANSLATE ? window.RS_TRANSLATE("This chord shape has no sounding strings.") : "This chord shape has no sounding strings.");
          return;
        }

        const sustainMs = Number(document.getElementById("sustain")?.value || 80);
        const volumePct = Number(document.getElementById("volume")?.value || 78);
        const drivePct = Number(document.getElementById("drive")?.value || 0);
        const soundType = document.getElementById("soundType")?.value || "acoustic_guitar";
        const dur = Math.max(0.2, sustainMs / 100);
        const strumMs = 40; // strum-delay mellom strenger
        const markerNotes = playedNotes.slice();
        clearPlaybackMarkers();
        stopActiveSamples();

        if (soundType === "acoustic_guitar") {
          await ensureSampleAudioContext();
          const samples = await Promise.all(playedNotes.map(function (note) {
            return acousticSampleForMidi(note.midi);
          }));
          const sampleNow = sampleAudioContext.currentTime + 0.05;
          playedNotes.forEach(function (note, i) {
            scheduleAcousticSample(samples[i], note.midi, sampleNow + i * (strumMs / 1000), volumePct / 100);
          });
        } else {
          const Tone = await ensureTone();
          const synthNow = Tone.now() + 0.05;
          toneSynth.set({
            oscillator: { type: soundType },
            volume: -24 + (volumePct / 100) * 20
          });
          if (toneDrive) toneDrive.distortion = Math.min(0.9, drivePct / 100);
          playedNotes.forEach(function (note, i) {
            const frequency = 440 * Math.pow(2, (note.midi - 69) / 12);
            toneSynth.triggerAttackRelease(frequency, dur, synthNow + i * (strumMs / 1000), 0.95);
          });
        }

        markerNotes.forEach(function (note, i) {
          schedulePlaybackMarker(
            note.stringIndex,
            50 + i * strumMs,
            Math.max(220, Math.min(520, dur * 1000))
          );
        });
      } catch (err) {
        console.error("Feil ved avspilling:", err);
        alert(window.RS_TRANSLATE ? window.RS_TRANSLATE("Could not start audio. Please try again.") : "Could not start audio. Please try again.");
      }
    });

    const debugToggle = document.getElementById("debugToggle");
    if (debugToggle && debugEl) {
      debugToggle.addEventListener("click", function () {
        if (debugEl.style.display === "none" || debugEl.style.display === "") {
          debugEl.style.display = "block";
        } else {
          debugEl.style.display = "none";
        }
      });
    }

    // ---- Theme toggle (NO persistence) ----
    // Default on every load: :root (no data-theme attribute)
    function initThemeToggle() {
      const btn = document.getElementById("themeBtn");
      if (!btn) return;

      const labelEl = document.getElementById("themeLabel");
      const THEMES = ["dark", "light"];
      const THEME_LABELS = { dark: "Dark", light: "Light" };

      function setTheme(theme) {
        document.body.setAttribute("data-theme", theme);
        if (labelEl) labelEl.textContent = THEME_LABELS[theme] || theme;
      }

      function getCurrentTheme() {
        return document.body.getAttribute("data-theme") || "dark";
      }

      // ✅ Always start at :root on page load
      setTheme("dark");

      btn.setAttribute("aria-label", "Bytt tema");
      btn.title = "Bytt tema";

      btn.addEventListener("click", function () {
        const cur = getCurrentTheme();
        const idx = THEMES.indexOf(cur);
        const next = THEMES[(idx === -1 ? 0 : idx + 1) % THEMES.length];
        setTheme(next);
      });
    }

    // ---- Init ----
    initThemeToggle();
    updateChordFromUI();
  });
})();
