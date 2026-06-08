(() => {
  const FIFTHS = [
  "C",  // 0
  "G",  // 1  ♯
  "D",  // 2  ♯♯
  "A",  // 3
  "E",  // 4
  "B",  // 5
  "F#", // 6  ← enharmonisk senter
  "Db", // 7  ← enharmonisk senter
  "Ab", // 8  ♭
  "Eb", // 9  ♭♭
  "Bb", // 10 ♭
  "F"   // 11 ♭
];
  const ENHARMONIC = {"A#":"Bb","D#":"Eb","G#":"Ab","C#":"Db","F#":"Gb"};
  const NOTE_TO_SEMI = {"C":0,"C#":1,"Db":1,"D":2,"D#":3,"Eb":3,"E":4,"F":5,"F#":6,"Gb":6,"G":7,"G#":8,"Ab":8,"A":9,"A#":10,"Bb":10,"B":11,"Cb":11};
  const SEMI_TO_NOTE_SHARP = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  const SEMI_TO_NOTE_FLAT  = ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];

  const octSel = document.getElementById("octSel");
  const bpmEl = document.getElementById("bpm");
  const bpmVal = document.getElementById("bpmVal");
  const playChordBtn = document.getElementById("playChordBtn");
  const playScaleBtn = document.getElementById("playScaleBtn");
  const infoPanel = document.getElementById("infoPanel");
  const segBtns = Array.from(document.querySelectorAll(".segBtn[data-quality]"));
  const IS_PRO = !!window.CL_IS_PRO;
  
  let currentKey = "C";
  let currentQuality = "maj"; // maj/min
  let toneReady = false;
  let synth = null;
  let wedges = [];

  // Active chord = what "Play chord" and scale playback use.
  // In minor mode we use the relative minor of the selected major-column (currentKey).
  function getActiveRoot(){
    return (currentQuality === "maj") ? currentKey : relMinorFromMajor(currentKey);
  }
  function getActiveQual(){
    return (currentQuality === "maj") ? "maj" : "min";
  }
let wheelGeom = null;            // {cx,cy,innerR}
let midAngleByKey = {};          // key -> mid angle
let dimBadgeCircle = null;
let dimBadgeText = null;

let scheduledTimeouts = [];



  function preferAccidentals(key){
    const flatKeys = new Set(["F","Bb","Eb","Ab","Db","Gb","Cb"]);
    const k = ENHARMONIC[key] ? ENHARMONIC[key] : key;
    return flatKeys.has(k) ? "flat" : "sharp";
  }
  function normKey(key){
    const pref = preferAccidentals(key);
    if (pref === "flat" && ENHARMONIC[key]) return ENHARMONIC[key];
    return key;
  }
  
function keyLabel(k) {
  if (k === "F#") return "Gb/ F#";
  return k;
}

function minorLabelFromMajorKey(k){
  // Kun én spesial: relativ moll til F# / Gb
  if (k === "F#") return "Ebm / D#m";
  const pref = preferAccidentals(k);       // ♯ høyre / ♭ venstre
  const semi = (NOTE_TO_SEMI[k] + 9) % 12; // relativ moll (−3)
  return semiToNote(semi, pref) + "m";
}

  function semiToNote(semi, pref){
    semi = (semi%12+12)%12;
    return pref==="flat" ? SEMI_TO_NOTE_FLAT[semi] : SEMI_TO_NOTE_SHARP[semi];
  }
function dualLabelSemi(semi, pref){
  semi = (semi%12+12)%12;
  const sharp = SEMI_TO_NOTE_SHARP[semi];
  const flat  = SEMI_TO_NOTE_FLAT[semi];
  if (sharp === flat) return sharp;              // C, D, E, F, G, A, B
  return (pref === "flat") ? `${flat}/${sharp}`  // venstre side
                           : `${sharp}/${flat}`; // høyre side
}


  function scaleSemis(quality){
    return quality==="maj" ? [0,2,4,5,7,9,11] : [0,2,3,5,7,8,10];
  }
  function diatonicChords(quality){
    return quality==="maj"
      ? ["maj","min","min","maj","maj","min","dim"]
      : ["min","dim","maj","min","min","maj","maj"];
  }
  function relMajorFromMinor(minKey){
    const pref = preferAccidentals(minKey);
    return semiToNote(NOTE_TO_SEMI[minKey]+3, pref);
  }
  function relMinorFromMajor(majKey){
    const pref = preferAccidentals(majKey);
    return semiToNote(NOTE_TO_SEMI[majKey]+9, pref);
  }
  function dominant(key){
    const pref = preferAccidentals(key);
    return semiToNote(NOTE_TO_SEMI[key]+7, pref);
  }
  function subdominant(key){
    const pref = preferAccidentals(key);
    return semiToNote(NOTE_TO_SEMI[key]+5, pref);
  }
  function chordNotes(root, qual){
    const pref = preferAccidentals(root);
    const r = NOTE_TO_SEMI[root];
    const ints = qual==="maj" ? [0,4,7] : qual==="min" ? [0,3,7] : [0,3,6];
    return ints.map(i => semiToNote(r+i, pref));
  }

function dualLabel(note, pref){
  const enh = {
    "C#":"Db","Db":"C#",
    "D#":"Eb","Eb":"D#",
    "F#":"Gb","Gb":"F#",
    "G#":"Ab","Ab":"G#",
    "A#":"Bb","Bb":"A#"
  };
  if (!enh[note]) return note;
  return pref === "sharp"
    ? `${note}/${enh[note]}`
    : `${enh[note]}/${note}`;
}


  function ensureAudio(){
    if (toneReady) return Promise.resolve(true);
    return Tone.start().then(() => {
      synth = new Tone.PolySynth(Tone.Synth, {
        oscillator:{type:"triangle8"},
        envelope:{attack:0.005, decay:0.12, sustain:0.22, release:0.6}
      }).toDestination();
      toneReady = true;
      return true;
    }).catch(() => false);
  }

  async function playChord(root, qual){
    const ok = await ensureAudio();
    if (!ok || !synth) return;
    const notes = chordNotes(root, qual).map(n => n + (parseInt(octSel.value,10)));
    synth.triggerAttackRelease(notes, "8n");
  }

  async function playScale(root, quality){
    const ok = await ensureAudio();
    if (!ok || !synth) return;

    const pref = preferAccidentals(root);
    const rootSemi = NOTE_TO_SEMI[root];
    const semis = scaleSemis(quality); // e.g. [0,2,4,5,7,9,11]

    const bpm = parseInt(bpmEl.value,10);
    Tone.Transport.bpm.value = bpm;
    Tone.Transport.stop();
    Tone.Transport.cancel();

    // Auto base octave: C..F => 4, else => 3
    const baseOct = (rootSemi <= NOTE_TO_SEMI["F"]) ? 4 : 3;

    // Build strictly ascending MIDI sequence + include final tonic
    const seqMidi = [];
    let prev = null;
    for (let i=0;i<semis.length;i++){
      let midi = (rootSemi + semis[i]) + baseOct*12;
      while (prev !== null && midi <= prev) midi += 12;
      seqMidi.push(midi);
      prev = midi;
    }

// stoppknapp 

const panicBtn = document.getElementById("panicBtn");

panicBtn.addEventListener("click", () => {
  // stopp alle timeouts
  scheduledTimeouts.forEach(id => clearTimeout(id));
  scheduledTimeouts.length = 0;

  // stopp alle aktive toner
  if (synth) synth.releaseAll();
});

window.addEventListener("keydown", e => {
  if (e.key === "Escape") panicBtn.click();
});

    // Add top tonic (octave)
    let top = rootSemi + baseOct*12;
    while (prev !== null && top <= prev) top += 12;
    seqMidi.push(top);

    const seqNotes = seqMidi.map(m => Tone.Frequency(m, "midi").toNote());

    const step = (60 / bpm) * 0.5; // 8th-ish feel
const now = Tone.now();

seqNotes.forEach((n, i) => {
  const id = setTimeout(() => {
    synth.triggerAttackRelease(n, "16n");
  }, i * step * 1000);
  scheduledTimeouts.push(id);
});
  }

function setHighlights(){
  if (!wedges.length) return;

  const wheelKey = currentKey;
  const idx = FIFTHS.indexOf(wheelKey);
  if (idx === -1) return;

  const dom = FIFTHS[(idx + 1) % 12];
  const sub = FIFTHS[(idx + 11) % 12];

  wedges.forEach(w => {
    const k = w.dataset.key;
    w.classList.toggle("isSelected", k === wheelKey);
    w.classList.toggle("isDomSub", k === dom || k === sub);
    w.classList.remove("isRelated");
    w.classList.remove("isParallel");
  });

  if (typeof updateDimBadge === "function") updateDimBadge();
}


  
  function updateInfo(){
    // currentKey is always the selected MAJOR-column on the wheel.
    // Display + theory follow currentQuality:
    // - maj: currentKey is tonic
    // - min: relative minor of currentKey is tonic
    const wheelKey = currentKey;
    const tonic = (currentQuality === "maj") ? wheelKey : relMinorFromMajor(wheelKey);

const pref = preferAccidentals(wheelKey); // venstre = flat, høyre = sharp

const tonicSemi = NOTE_TO_SEMI[tonic];
const key = dualLabelSemi(tonicSemi, pref);
const qual = currentQuality;

const title = (qual==="maj") ? `${key} major` : `${key} minor`;
const rel = (qual === "maj")
  ? `${dualLabelSemi(tonicSemi + 9, pref)} minor`
  : `${dualLabelSemi(tonicSemi + 3, pref)} major`;
  
// Dominant/Subdominant som tone (med riktig ♭/♯ rekkefølge)
let dom = dualLabelSemi(tonicSemi + 7, pref);
let sub = dualLabelSemi(tonicSemi + 5, pref);

// Når Moll er valgt: vis dem som moll-akkorder i infoboksen
if (qual === "min"){
  dom += "m";
  sub += "m";
}

    const rootSemi = NOTE_TO_SEMI[tonic];
    const semis = scaleSemis(qual);
    const scale = semis.map(s => semiToNote(rootSemi+s, pref));

    const chordQuals = diatonicChords(qual);
    const chords = scale.map((n,i) => {
      const q = chordQuals[i];
      if (q === "dim") return `${n}°`;
      if (q === "min") return `${n}m`;
      return `${n}`;
    });

    const relLabel = qual==="maj" ? "Relativ moll" : "Relativ dur";

    // Dim degree (matches your diatonic mapping): maj -> vii°, min -> ii°
    const dimIndex = (qual === "maj") ? 6 : 1;
const dimChord = `${dualLabel(scale[dimIndex], pref)}°`;


    infoPanel.innerHTML = `
      <div class="infoTitle">${title}</div>
      <div class="infoRow"><span>${relLabel}:</span> <strong>${rel}</strong></div>
      <div class="infoRow"><span>Dominant:</span> <strong>${dom}</strong></div>
      <div class="infoRow"><span>Subdominant:</span> <strong>${sub}</strong></div>
      <div class="infoRow"><span>Dim:</span> <strong>${dimChord}</strong></div>

      <div class="hr"></div>
      <div class="infoSub">Akkorder i tonearten</div>
      <div class="chips">${chords.map(c=>`<span class="chip">${c}</span>`).join("")}</div>

      <div class="hr"></div>
      <div class="infoSub">${qual==="maj"?"Durskala":"Naturlig moll"}</div>
      <div class="infoRow"><span>Toner:</span> <strong>${scale.join(" ")}</strong></div>
    `;
  }


  function polar(cx, cy, r, a){ return {x: cx + r*Math.cos(a), y: cy + r*Math.sin(a)}; }
  function arcPath(cx, cy, r0, r1, a0, a1){
    const p0 = polar(cx,cy,r1,a0), p1 = polar(cx,cy,r1,a1), p2 = polar(cx,cy,r0,a1), p3 = polar(cx,cy,r0,a0);
    const large = (a1-a0) > Math.PI ? 1 : 0;
    return `M ${p0.x.toFixed(3)} ${p0.y.toFixed(3)} A ${r1} ${r1} 0 ${large} 1 ${p1.x.toFixed(3)} ${p1.y.toFixed(3)} L ${p2.x.toFixed(3)} ${p2.y.toFixed(3)} A ${r0} ${r0} 0 ${large} 0 ${p3.x.toFixed(3)} ${p3.y.toFixed(3)} Z`;
  }

  function renderWheel(){
    const wrap = document.getElementById("wheelWrap");
    wrap.innerHTML = "";
    wedges = [];

    const size = 700, cx = size/2, cy = size/2, outerR = 320, innerR = 140;
    wheelGeom = { cx, cy, innerR };
    midAngleByKey = {};

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
    svg.setAttribute("width","100%");
    svg.setAttribute("height","100%");

    const plate = document.createElementNS(svgNS,"rect");
    plate.setAttribute("x","20"); plate.setAttribute("y","20");
    plate.setAttribute("width", (size-40).toString());
    plate.setAttribute("height",(size-40).toString());
    plate.setAttribute("rx","22");
    plate.setAttribute("fill","rgba(0,0,0,.22)");
    plate.setAttribute("stroke","rgba(255,92,122,.28)");
    plate.setAttribute("stroke-width","2");
    svg.appendChild(plate);

    const group = document.createElementNS(svgNS,"g");
    svg.appendChild(group);

    const step = (Math.PI*2)/12;
    const start = -Math.PI/2 - step/2;

    for (let i=0;i<12;i++){
      const a0 = start + i*step, a1 = a0 + step;
      const path = document.createElementNS(svgNS,"path");
      path.setAttribute("class","wedge");
      path.setAttribute("d", arcPath(cx,cy,innerR,outerR,a0,a1));
      const hue = (i*360/12);
      path.setAttribute("fill", `hsla(${hue}, 85%, 60%, 0.14)`);
      path.dataset.key = FIFTHS[i];
      group.appendChild(path);

      const mid = (a0+a1)/2;

      const pMaj = polar(cx,cy,(innerR+outerR)/2 + 35, mid);
      const tMaj = document.createElementNS(svgNS,"text");
      const k = FIFTHS[i];
      midAngleByKey[k] = mid;
      tMaj.setAttribute("x", pMaj.x.toFixed(3));
      tMaj.setAttribute("y", pMaj.y.toFixed(3));
      tMaj.setAttribute("text-anchor","middle");
      tMaj.setAttribute("dominant-baseline","middle");
      tMaj.setAttribute("class","wedgeTextMajor");
      tMaj.setAttribute("fill", `hsla(${hue}, 85%, 72%, 0.95)`);
      tMaj.textContent = keyLabel(FIFTHS[i]);
      group.appendChild(tMaj);

      const pMin = polar(cx,cy,(innerR+outerR)/2 - 20, mid);
      const tMin = document.createElementNS(svgNS,"text");
      tMin.setAttribute("x", pMin.x.toFixed(3));
      tMin.setAttribute("y", pMin.y.toFixed(3));
      tMin.setAttribute("text-anchor","middle");
      tMin.setAttribute("dominant-baseline","middle");
      tMin.setAttribute("class","wedgeTextMinor");
      tMin.setAttribute("fill", `hsla(${hue}, 70%, 84%, 0.8)`);
      tMin.textContent = minorLabelFromMajorKey(k);
      group.appendChild(tMin);

      wedges.push(path);
    }
// --- DIM BADGE (circle + text) ---
dimBadgeCircle = document.createElementNS(svgNS,"circle");
dimBadgeCircle.setAttribute("r","18");
dimBadgeCircle.setAttribute("fill","rgba(255,255,255,.06)");
dimBadgeCircle.setAttribute("stroke","rgba(255,255,255,.18)");
dimBadgeCircle.setAttribute("stroke-width","1.5");
dimBadgeCircle.setAttribute("style","pointer-events:none");
group.appendChild(dimBadgeCircle);

dimBadgeText = document.createElementNS(svgNS,"text");
dimBadgeText.setAttribute("text-anchor","middle");
dimBadgeText.setAttribute("dominant-baseline","middle");
dimBadgeText.setAttribute("class","wedgeTextMajor");
dimBadgeText.setAttribute("fill","rgba(234,240,255,.92)");
dimBadgeText.setAttribute("style","pointer-events:none");
group.appendChild(dimBadgeText);

    const disk = document.createElementNS(svgNS,"circle");
    disk.setAttribute("cx", cx.toString());
    disk.setAttribute("cy", cy.toString());
    disk.setAttribute("r", (innerR-20).toString());
    disk.setAttribute("fill","rgba(6,9,20,.85)");
    disk.setAttribute("stroke","rgba(255,255,255,.12)");
    disk.setAttribute("stroke-width","2");
    group.appendChild(disk);

    const centerTitle = document.createElementNS(svgNS,"text");
    centerTitle.setAttribute("x", cx.toString());
    centerTitle.setAttribute("y", (cy-8).toString());
    centerTitle.setAttribute("text-anchor","middle");
    centerTitle.setAttribute("class","wedgeTextMajor");
    centerTitle.setAttribute("fill","rgba(234,240,255,.9)");
    centerTitle.textContent = "PARALLELL MOLL";
    group.appendChild(centerTitle);

    const centerSub = document.createElementNS(svgNS,"text");
    centerSub.setAttribute("x", cx.toString());
    centerSub.setAttribute("y", (cy+18).toString());
    centerSub.setAttribute("text-anchor","middle");
    centerSub.setAttribute("class","wedgeTextMinor");
    centerSub.setAttribute("fill","rgba(169,182,216,.85)");
    centerSub.textContent = "Shift+klikk for parallel";
    group.appendChild(centerSub);

    wedges.forEach((w) => {
      w.addEventListener("click", async (e) => {

        hideProBox();
        const k = w.dataset.key;

        // Shift+click: momentary parallel minor chord (does NOT lock mode)
        if (e.shiftKey){
          await playChord(relMinorFromMajor(k), "min");
          return;
        }

        // Normal click: select the column key (major ring), then play the active chord for the current mode
        currentKey = k;
        await playChord(getActiveRoot(), getActiveQual());

        setHighlights();
        updateInfo();
        updateDimBadge();
      }, {passive:true});
    });

wrap.appendChild(svg);
setHighlights();
updateDimBadge();
}

segBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    hideProBox();
    const box = document.getElementById("proBox");
    if (box) box.style.display = "none";
      currentQuality = (btn.dataset.quality === "min") ? "min" : "maj";
      segBtns.forEach(b => b.classList.toggle("isOn", b === btn));

      // Mode styling hook (major vs minor row emphasis)
      const wrap = document.getElementById("wheelWrap");
      if (wrap) wrap.classList.toggle("modeMin", currentQuality === "min");

      setHighlights();
      updateInfo();
      updateDimBadge();

// 🔊 spill akkord automatisk
playChord(
  currentQuality === "maj"
    ? currentKey
    : relMinorFromMajor(currentKey),
  currentQuality === "maj" ? "maj" : "min"
);
      
    });
  });

bpmEl.addEventListener("input", () => bpmVal.textContent = bpmEl.value);

playChordBtn.addEventListener("click", async () => {
  hideProBox();
  await playChord(getActiveRoot(), getActiveQual());
});
playScaleBtn.addEventListener("click", async () => {
  hideProBox();
  if (!IS_PRO) {
    showProNotice(getActiveRoot());
    return;
  }
  await playScale(getActiveRoot(), currentQuality);
});

function hideProBox(){
  const box = document.getElementById("proBox");
  if (box) box.style.display = "none";
}

function showProNotice(name){
  let box = document.getElementById("proBox");
  if (!box){
    box = document.createElement("a");
    box.id = "proBox";
    box.href = "/members/upgrade.php";
    box.className = "pro-cta";
    box.style.display = "none";

    const host = document.getElementById("wheelWrap") || document.body;
    host.parentNode.insertBefore(box, host);
  }

  box.innerHTML = `
 <strong>Tilgjengelig for VIP-medlemmer:</strong> <strong>${name}</strong>.
<span class="pro-cta-sub">Oppgrader for å få tilgang til alle funksjoner</span>.
  `;
  box.style.display = "block";
  box.scrollIntoView({ behavior:"smooth", block:"center" });
}


function updateDimBadge(){
  if (!wheelGeom || !dimBadgeCircle || !dimBadgeText) return;

  const wheelKey = currentKey;
  const mid = midAngleByKey[wheelKey];
  if (mid == null) return;

  // Tonic depends on mode (maj = wheelKey, min = relative minor)
  const tonic = (currentQuality === "maj") ? wheelKey : relMinorFromMajor(wheelKey);

  // Dim degree: maj -> vii°, min (natural) -> ii°
const pref = preferAccidentals(wheelKey);
  const rootSemi = NOTE_TO_SEMI[tonic];
  const semis = scaleSemis(currentQuality);
  const dimIndex = (currentQuality === "maj") ? 6 : 1;
  const dimRoot = semiToNote(rootSemi + semis[dimIndex], pref);

  // Position: slightly inside the inner ring (tuned by you)
  const r = wheelGeom.innerR + 30;
  const p = polar(wheelGeom.cx, wheelGeom.cy, r, mid);

  dimBadgeCircle.setAttribute("cx", p.x.toFixed(3));
  dimBadgeCircle.setAttribute("cy", p.y.toFixed(3));
  dimBadgeText.setAttribute("x", p.x.toFixed(3));
  dimBadgeText.setAttribute("y", (p.y + 4).toFixed(3));
  dimBadgeText.textContent = `${dimRoot}°`;
}


  renderWheel();
  const wrap = document.getElementById("wheelWrap");
  if (wrap) wrap.classList.toggle("modeMin", currentQuality === "min");
  updateInfo();
  updateDimBadge();
})();