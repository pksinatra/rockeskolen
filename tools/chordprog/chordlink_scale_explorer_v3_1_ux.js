const NOTE_NAMES_SHARP = ["C","C♯","D","D♯","E","F","F♯","G","G♯","A","A♯","B"];
const NOTE_NAMES_FLAT  = ["C","D♭","D","E♭","E","F","G♭","G","A♭","A","B♭","B"];

const SCALES = {
  major:{group:"common", name:"Major", intervals:[0,2,4,5,7,9,11], degrees:['1','2','3','4','5','6','7']},
  nat_minor:{group:"common", name:"Natural minor", intervals:[0,2,3,5,7,8,10], degrees:['1','2','b3','4','5','b6','b7']},
  harm_minor:{group:"common", name:"Harmonic minor", intervals:[0,2,3,5,7,8,11], degrees:['1','2','b3','4','5','b6','7']},
  mel_minor:{group:"common", name:"Melodic minor (ascending)", intervals:[0,2,3,5,7,9,11], degrees:['1','2','b3','4','5','6','7']},

  dorian:{group:"modes", name:"Dorian", intervals:[0,2,3,5,7,9,10], degrees:['1','2','b3','4','5','6','b7']},
  phrygian:{group:"modes", name:"Phrygian", intervals:[0,1,3,5,7,8,10], degrees:['1','b2','b3','4','5','b6','b7']},
  lydian:{group:"modes", name:"Lydian", intervals:[0,2,4,6,7,9,11], degrees:['1','2','3','#4','5','6','7']},
  mixolydian:{group:"modes", name:"Mixolydian", intervals:[0,2,4,5,7,9,10], degrees:['1','2','3','4','5','6','b7']},
  locrian:{group:"modes", name:"Locrian", intervals:[0,1,3,5,6,8,10], degrees:['1','b2','b3','4','b5','b6','b7']},

  major_pent:{group:"pent", name:"Major pentatonic", intervals:[0,2,4,7,9], degrees:['1','2','3','5','6']},
  minor_pent:{group:"pent", name:"Minor pentatonic", intervals:[0,3,5,7,10], degrees:['1','b3','4','5','b7']},
  pent_blues:{group:"pent", name:"Minor blues", intervals:[0,3,5,6,7,10], degrees:['1','b3','4','b5','5','b7']},
  major_blues:{group:"pent", name:"Major blues", intervals:[0,2,3,4,7,9], degrees:['1','2','#2','3','5','6']},

  half_whole_dim:{group:"sym", name:"Half–whole diminished", intervals:[0,1,3,4,6,7,9,10]},
  whole_half_dim:{group:"sym", name:"Whole–half diminished", intervals:[0,2,3,5,6,8,9,11]},
  whole_tone:{group:"sym", name:"Whole tone", intervals:[0,2,4,6,8,10]},

  overtone:{group:"melmm", name:"Lydian dominant", intervals:[0,2,4,6,7,9,10]},
  altered:{group:"melmm", name:"Super Locrian (altered)", intervals:[0,1,3,4,6,8,10]},

  romanian_minor:{group:"world", name:"Romanian minor", intervals:[0,2,3,6,7,9,10]},
  phrygian_dom:{group:"world", name:"Phrygian dominant", intervals:[0,1,4,5,7,8,10]},
  double_harmonic:{group:"world", name:"Double harmonic major", intervals:[0,1,4,5,7,8,11]},
  pelog:{group:"world", name:"Pelog", intervals:[0,1,3,6,10,11]},
  enigmatic:{group:"world", name:"Enigmatic", intervals:[0,1,4,6,8,10,11]},
};

const QUAL = {
  maj:{iv:[0,4,7]},
  min:{iv:[0,3,7]},
  dim:{iv:[0,3,6]},
  "7":{iv:[0,4,7,10]},
  m7:{iv:[0,3,7,10]},
  maj7:{iv:[0,4,7,11]},
  m7b5:{iv:[0,3,6,10]},
  dim7:{iv:[0,3,6,9]},
  mMaj7:{iv:[0,3,7,11]},
  add9:{iv:[0,4,7,14]},
  madd9:{iv:[0,3,7,14]},
};

let PROGS = [
  { id:"P1", name:"Classic pop", tag:"Pop", roman:["I","V","vi","IV"], vibe:"Uplifting / familiar", seed:["major","lydian","mixolydian"] },
  { id:"P2", name:"Minor-first pop", tag:"Pop", roman:["vi","IV","I","V"], vibe:"Melancholic / open", seed:["major","nat_minor","dorian"] },
  { id:"P3", name:"50s pop", tag:"Classic", roman:["I","vi","IV","V"], vibe:"Traditional / pop", seed:["major","mixolydian"] },
  { id:"P4", name:"Anthem rock", tag:"Rock", roman:["I","IV","V","IV"], vibe:"Driving / chorus", seed:["major","mixolydian"] },
  { id:"P5", name:"Mixolydian rock", tag:"Rock", roman:["I","bVII","IV"], vibe:"Raw / earthy", seed:["mixolydian","major","dorian"] },
  { id:"P6", name:"Cinematic pop", tag:"Rock", roman:["I","bVII","bVI","bVII"], vibe:"Cinematic / post-rock", seed:["mixolydian","romanian_minor","nat_minor"] },

  { id:"M1", name:"Nordic modal", tag:"Modal", roman:["i","bVII","IV"], vibe:"Open / driving", seed:["dorian","nat_minor","mixolydian"] },
  { id:"M2", name:"Indie-drift", tag:"Modal", roman:["i","IV","bVII"], vibe:"Indie / bevegelse", seed:["dorian","nat_minor"] },
  { id:"M3", name:"Epic minor", tag:"Minor", roman:["i","bVI","bVII"], vibe:"Epic / expansive", seed:["nat_minor","harm_minor"] },
  { id:"M4", name:"Pure minor", tag:"Minor", roman:["i","iv","v"], vibe:"Compact / dark", seed:["nat_minor","harm_minor"] },
  { id:"M5", name:"Heavy Phrygian", tag:"World", roman:["i","bII"], vibe:"Heavy / dramatic", seed:["phrygian","phrygian_dom"] },

  { id:"J1", name:"ii–V–I", tag:"Jazz", roman:["ii","V","I"], vibe:"Clear harmonic function", seed:["dorian","mixolydian","major","lydian","altered","half_whole_dim"] },
  { id:"J2", name:"Turnaround", tag:"Jazz", roman:["I","vi","ii","V"], vibe:"Standard", seed:["major","altered"] },
  { id:"J3", name:"Long turnaround", tag:"Jazz", roman:["iii","vi","ii","V"], vibe:"Mer bevegelse", seed:["major","mel_minor","altered"] },
  { id:"J4", name:"Minor cadence", tag:"Jazz", roman:["ii°","V","i"], vibe:"Minor cadence", seed:["locrian","altered","nat_minor","mel_minor"] },

  { id:"B1", name:"Blues core", tag:"Blues", roman:["I7","IV7","V7"], vibe:"Blues / soul", seed:["mixolydian","pent_blues","minor_pent","half_whole_dim"] },
  { id:"A1", name:"Drone/ambient", tag:"Ambient", roman:["I","I","IV","I"], vibe:"Spacious / slow", seed:["major","lydian","mixolydian","major_pent"] },
  { id:"W1", name:"Byzantine drama", tag:"World", roman:["I","bII","V"], vibe:"Spanish / Middle Eastern", seed:["phrygian_dom","double_harmonic","enigmatic"] },
];


function parseSlotString(str){
  const s = (str||"").trim();
  if(!s) return null;
  const parts = s.split(/[\s,|]+/).map(x=>x.trim()).filter(Boolean);
  const ids = new Set(PROGS.map(p=>p.id));
  const hasId = parts.some(t => ids.has(t));
  if(hasId){
    const progIds = parts.filter(t => ids.has(t));
    return { type:"progIds", value: progIds };
  }
  return { type:"roman", value: parts };
}
function firstEmptySlot(){
  const slots = [slot1, slot2, slot3, slot4].filter(Boolean);
  for(const s of slots){
    if(!(s.value||"").trim()) return s;
  }
  return slots[0] || null;
}
function addSelectedProgToSlot(){
  const p = PROGS.find(x=>x.id===selectedId);
  if(!p) return;
  const target = firstEmptySlot();
  if(!target) return;
  const cur = (target.value||"").trim();
  target.value = cur ? (cur + " " + p.id) : p.id;
}
function gatherSlots(){
  const slots = [slot1, slot2, slot3, slot4].filter(Boolean);
  return slots.map((el,i)=>({slot:i+1, raw:(el.value||"").trim(), parsed: parseSlotString(el.value)}))
              .filter(x=>x.parsed && x.parsed.value && x.parsed.value.length);
}



function preferFlatFromKeyLabel(label){ return label.includes("♭"); }
function normalizePrefer(preferAcc, keyLabel, romanList=[]){
  if(preferAcc==="sharp" || preferAcc==="flat") return preferAcc;
  if(romanList.some(symbol=>symbol.includes("♭") || symbol.startsWith("b"))) return "flat";
  return preferFlatFromKeyLabel(keyLabel) ? "flat" : "sharp";
}
function pcToName(pc, prefer){
  pc = (pc%12+12)%12;
  return (prefer==="flat") ? NOTE_NAMES_FLAT[pc] : NOTE_NAMES_SHARP[pc];
}

// Scale degrees determine letter names; a flat Roman numeral does not
// make every accidental in the key a flat (E minor still has F sharp).
function spelledScaleNotes(scaleId, keyPc, keyLabel, preferAcc, prefer){
  const scale = SCALES[scaleId];
  const tones = scaleTones(scaleId, keyPc);
  if(preferAcc === "sharp" || preferAcc === "flat" || !scale.degrees){
    return tones.map(pc=>pcToName(pc, prefer));
  }
  const letters = "CDEFGAB";
  const naturals = [0,2,4,5,7,9,11];
  const tonicLabel = keyLabel.includes("/")
    ? keyLabel.split("/")[prefer === "flat" ? 1 : 0] : keyLabel;
  const tonicLetter = letters.indexOf(tonicLabel[0]);
  return tones.map((pc,i)=>{
    const degree = Number(scale.degrees[i].replace(/[^0-9]/g,""));
    const letterIndex = (tonicLetter + degree - 1) % 7;
    let alteration = (pc - naturals[letterIndex] + 12) % 12;
    if(alteration > 6) alteration -= 12;
    return letters[letterIndex] + (alteration < 0 ? "♭".repeat(-alteration) : "♯".repeat(alteration));
  });
}

function parseRoman(r){
  let s = r.trim();
  let acc = 0;
  while(s.startsWith("b") || s.startsWith("♭") || s.startsWith("#") || s.startsWith("♯")){
    if(s.startsWith("b") || s.startsWith("♭")) { acc -= 1; s = s.slice(1); }
    else { acc += 1; s = s.slice(1); }
  }
  const slashParts = s.split("/");
  s = slashParts[0];
  const isHalfDim = /ø7$/i.test(s);
  const isDim7 = /dim7$|°7$/i.test(s);
  const isDim = isHalfDim || isDim7 || /dim$|°$/i.test(s);
  const isMaj7 = /maj7$/i.test(s);
  const isAdd9 = /add9$/i.test(s);
  const isMinMaj7 = /\(maj7\)$/i.test(s);
  const isSeven = !isMaj7 && !isMinMaj7 && /7$/i.test(s);
  s = s.replace(/\(maj7\)|maj7|add9|m7|ø7|dim7|°7|dim|°|7$/ig,"");
  const isMinor = (s.toLowerCase() === s);
  const core = s.toUpperCase();
  const map = { "I":1,"II":2,"III":3,"IV":4,"V":5,"VI":6,"VII":7 };
  const deg = map[core] || 1;
  return {deg, acc, isMinor, isDim, isHalfDim, isDim7, isMaj7, isAdd9, isMinMaj7, isSeven, bassRoman:slashParts[1] || null, raw:r};
}

const MAJOR_SCALE = [0,2,4,5,7,9,11];
const MINOR_SCALE = [0,2,3,5,7,8,10];

function degreeToPc(keyPc, mode, deg, acc){
  const scale = (mode==="minor") ? MINOR_SCALE : MAJOR_SCALE;
  const idx = (deg-1) % 7;
  return (keyPc + scale[idx] + acc + 1200) % 12;
}
function defaultQualityFromRoman(p){
  if(p.isHalfDim) return "m7b5";
  if(p.isDim7) return "dim7";
  if(p.isDim) return "dim";
  if(p.isMinMaj7) return "mMaj7";
  if(p.isMaj7) return "maj7";
  if(p.isAdd9) return p.isMinor ? "madd9" : "add9";
  if(p.isSeven && !p.isMinor) return "7";
  if(p.isSeven && p.isMinor) return "m7";
  return p.isMinor ? "min" : "maj";
}
function chordTones(rootPc, quality){
  const q = QUAL[quality] || QUAL.maj;
  return q.iv.map(iv => (rootPc + iv) % 12);
}
function buildChordEventFromRoman(r, keyPc, mode){
  const p = parseRoman(r);
  const rootPc = degreeToPc(keyPc, mode, p.deg, p.acc);
  const quality = defaultQualityFromRoman(p);
  return { roman:r, rootPc, quality, tones: chordTones(rootPc, quality) };
}
function scaleTones(scaleId, rootPc){
  const sc = SCALES[scaleId];
  if(!sc) return [];
  return sc.intervals.map(i => (rootPc + i) % 12);
}
function uniq(arr){ return [...new Set(arr.map(x => ((x%12)+12)%12))].sort((a,b)=>a-b); }

function scoreScaleForProgression(scaleId, progEvents, scaleRootPc){
  const scaleSet = new Set(scaleTones(scaleId, scaleRootPc));
  const chordToneSet = new Set();
  progEvents.forEach(ev => ev.tones.forEach(t => chordToneSet.add(t)));
  const chordTonesAll = [...chordToneSet];
  let missing = 0;
  chordTonesAll.forEach(t => { if(!scaleSet.has(t)) missing++; });
  const size = scaleSet.size || 12;
  const base = (chordTonesAll.length - missing) / Math.max(1, chordTonesAll.length);
  const score = base;
  return { scaleId, score, missing, scaleSize:size, chordTonesAll: chordTonesAll.sort((a,b)=>a-b), scaleTonesAll:[...scaleSet].sort((a,b)=>a-b) };
}
function categoryFromMissing(missing){
  if(missing===0) return {label:"Diatonic", cls:"ok"};
  if(missing===1) return {label:"Creative (1 outside note)", cls:"warn"};
  return {label:`Outside (${missing})`, cls:"bad"};
}
function qualitySuffix(q){
  if(q==="min") return "m";
  if(q==="dim") return "dim";
  if(q==="m7") return "m7";
  if(q==="7") return "7";
  if(q==="maj7") return "maj7";
  if(q==="m7b5") return "m7b5";
  if(q==="dim7") return "dim7";
  if(q==="mMaj7") return "m(maj7)";
  if(q==="add9") return "add9";
  if(q==="madd9") return "m(add9)";
  return "";
}

// UI state
const keySel = document.getElementById("keySel");
const preferAccEl = document.getElementById("preferAcc");
const timeSigEl = document.getElementById("timeSig");
const subdivEl = document.getElementById("subdiv");
const barsEl = document.getElementById("bars");
const chordsPerBarEl = document.getElementById("chordsPerBar");
const listEl = document.getElementById("list");
const detailEl = document.getElementById("detail");
const audioBtn = document.getElementById("audioBtn");
const randomBtn = document.getElementById("randomBtn");
const soundSel = document.getElementById("soundSel");
const playBtnTop = document.getElementById("playBtnTop");
const slot1 = document.getElementById("slot1");
const slot2 = document.getElementById("slot2");
const slot3 = document.getElementById("slot3");
const slot4 = document.getElementById("slot4");
const slotBeats = document.getElementById("slotBeats");
const loopSeq = document.getElementById("loopSeq");
const addSelToSlot = document.getElementById("addSelToSlot");
const playSlotsBtn = document.getElementById("playSlots");
const exportSeqBtn = document.getElementById("exportSeq");
const clearSlotsBtn = document.getElementById("clearSlots");
const exportOut = document.getElementById("exportOut");
const searchProg = document.getElementById("searchProg");
const categoryFilter = document.getElementById("categoryFilter");
const useFilter = document.getElementById("useFilter");
const resultCount = document.getElementById("resultCount");
const tempoControl = document.getElementById("tempoControl");
const tempoValue = document.getElementById("tempoValue");


const KEYS = [
  {label:"C", pc:0},{label:"C♯/D♭", pc:1},{label:"D", pc:2},{label:"D♯/E♭", pc:3},{label:"E", pc:4},
  {label:"F", pc:5},{label:"F♯/G♭", pc:6},{label:"G", pc:7},{label:"G♯/A♭", pc:8},{label:"A", pc:9},
  {label:"A♯/B♭", pc:10},{label:"B", pc:11},
];
KEYS.forEach(k=>{
  const opt = document.createElement("option");
  opt.value = k.pc;
  opt.textContent = k.label;
  if(k.label==="C") opt.selected = true;
  keySel.appendChild(opt);
});

let selectedId = PROGS[0].id;
let selectedScaleId = null;
let scaleSelectionProgression = null;
let guidedSection = "";
let guidedFeel = "";
let showAllResults = false;
let suggestionSignature = null;
let suggestionRanks = new Map();
let currentVariants = [];
let currentTempo = 100;
let scheduledOscillators = [];

function setTempo(bpm, play=false){
  currentTempo = Math.max(40, Math.min(220, Math.round(Number(bpm) || 100)));
  if(tempoControl) tempoControl.value = currentTempo;
  if(tempoValue) tempoValue.textContent = `${currentTempo} BPM`;
  document.querySelectorAll(".tempoButton").forEach(button=>button.classList.toggle("active", Number(button.dataset.bpm)===currentTempo));
  const song = document.getElementById("songJson");
  if(song){ try{ const value=JSON.parse(song.value); value.tempo=currentTempo; song.value=JSON.stringify(value,null,2); }catch(error){} }
  if(play) playSelected();
}
window.chooseTempo = bpm => setTempo(bpm,true);
window.openKeySettings = function(){
  const menu = document.getElementById("keyQuickMenu");
  if(!menu) return;
  menu.classList.toggle("open");
  if(menu.classList.contains("open")) menu.querySelector(".keyButton.active, .keyButton")?.focus();
};
window.chooseKey = function(pc){
  keySel.value=String(pc); keySel.dispatchEvent(new Event("change",{bubbles:true}));
};
let audioReady=false;
let synth=null;

function renderList(){
  listEl.innerHTML = "";
  const keyPc = parseInt(keySel.value,10);
  const keyLabel = KEYS.find(k=>k.pc===keyPc)?.label || "C";

  const rawQuery = (searchProg?.value || "").trim().toLowerCase();
  const query = (window.CLChordProgLanguage?.queryToEnglish(rawQuery) || rawQuery).toLowerCase();
  const category = categoryFilter?.value || "";
  const use = useFilter?.value || "";
  const baseMatches = PROGS.filter(p=>{
    const haystack = [p.name, p.tag, p.roman.join(" "), p.vibe, ...(p.feel || []), ...(p.worksWellFor || [])].join(" ").toLowerCase();
    const translated = [p.name, p.tag, p.vibe, ...(p.feel || []), ...(p.worksWellFor || [])]
      .map(text => window.CLChordProgLanguage?.translate(text) || text).join(" ").toLowerCase();
    return (!query || haystack.includes(query) || translated.includes(rawQuery)) && (!category || p.tag === category) && (!use || (p.worksWellFor || []).includes(use));
  });
  const exactMatches = baseMatches.filter(p=>
    (!guidedSection || (p.worksWellFor || []).includes(guidedSection)) &&
    (!guidedFeel || (p.feel || []).includes(guidedFeel))
  );
  const nearby = !exactMatches.length && baseMatches.length > 0;
  const score = p => (guidedFeel && (p.feel || []).includes(guidedFeel) ? 2 : 0) +
    (guidedSection && (p.worksWellFor || []).includes(guidedSection) ? 1 : 0);
  const signature = JSON.stringify([guidedSection, guidedFeel, category, use, query, PROGS.length]);
  if(signature !== suggestionSignature){
    const shuffled = [...baseMatches];
    for(let i=shuffled.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [shuffled[i],shuffled[j]] = [shuffled[j],shuffled[i]];
    }
    suggestionRanks = new Map(shuffled.map((p,i)=>[p.id,i]));
    suggestionSignature = signature;
  }
  const byRelevance = (a,b) => score(b)-score(a) || suggestionRanks.get(a.id)-suggestionRanks.get(b.id);
  const matches = nearby
    ? [...baseMatches].sort(byRelevance).slice(0,6)
    : query ? exactMatches : [...exactMatches].sort(byRelevance);
  const isDirectBrowsing = query;
  const visible = showAllResults || isDirectBrowsing ? matches : matches.slice(0,6);
  if(resultCount) resultCount.textContent = nearby
    ? `No exact combination — ${matches.length} nearby ideas. Feel and song-section tags are suggestions, not rules; your style and search are kept.`
    : matches.length ? `${matches.length} matching progressions` : 'No results for this search or style. Clear the search or choose All styles.';
  if(matches.length && !matches.some(p=>p.id===selectedId)) {
    selectedId = matches[0].id;
    renderDetail();
  }
  visible.forEach(p=>{
    const prefer = normalizePrefer(preferAccEl.value, keyLabel, p.roman);
    const item = document.createElement("div");
    item.className = "item";
    item.style.borderColor = (p.id===selectedId) ? "rgba(255,55,95,.55)" : "var(--line)";

    const top = document.createElement("div");
    top.className = "top";
    const name = document.createElement("div");
    name.innerHTML = `<div class="name">${p.name}</div><div class="roman mono">${p.roman.join(" – ")}</div>`;
    const badge = document.createElement("div");
    badge.className="badge";
    badge.textContent = p.tag;
    top.appendChild(name);
    top.appendChild(badge);

    const events = p.roman.map(r => buildChordEventFromRoman(r, keyPc, "major"));
    const roots = events.map(ev => pcToName(ev.rootPc, prefer) + qualitySuffix(ev.quality)).join("  |  ");

    const line = document.createElement("div");
    line.className="mono";
    line.style.fontSize="12px";
    line.style.color="var(--muted)";
    line.textContent = roots;
    const why = document.createElement("div");
    why.className = "why";
    why.textContent = `${(p.feel || []).slice(0,3).join(" · ")}${p.worksWellFor?.length ? ` · Good for ${p.worksWellFor.slice(0,2).join(" / ")}` : ""}`;

    const btns = document.createElement("div");
    btns.className="btns";
    const openBtn = document.createElement("button");
    openBtn.textContent = "➜ Open";
    openBtn.onclick = ()=>{ selectedId = p.id; renderAll(); };
    const playBtn = document.createElement("button");
    playBtn.textContent = "▶ Play";
    playBtn.onclick = ()=>{ selectedId = p.id; renderAll(); playSelected(); };
    btns.appendChild(playBtn);
    btns.appendChild(openBtn);

    item.appendChild(top);
    item.appendChild(line);
    item.appendChild(why);
    item.appendChild(btns);
    listEl.appendChild(item);
  });
  if(matches.length > visible.length){
    const more = document.createElement("button"); more.textContent = `Show all ${matches.length} results`; more.onclick=()=>{showAllResults=true;renderList();}; listEl.appendChild(more);
  }
  if(!matches.length) listEl.innerHTML = '<div class="libraryIntro"><strong>No results for this search or style</strong>Clear the search or choose All styles. Your other choices can stay.</div>';
}

function variantIdeas(prog){
  const original = prog.roman;
  const result = [];
  const darker = original.map((r,i)=> i===original.length-1 && r==="IV" ? "iv" : r);
  if(darker.join()!==original.join()) result.push({name:"Make it bittersweet",roman:darker,why:"A minor iv at the end adds a darker pull back home."});
  const minorIndex = original.findIndex(r=>/^[vi]+$/.test(r) && r===r.toLowerCase());
  if(minorIndex>0) result.push({name:"Shift the perspective",roman:[...original.slice(minorIndex),...original.slice(0,minorIndex)],why:"Starting on the minor chord keeps the same harmony but changes the emotional centre."});
  const colour = original.map((r,i)=> i===0 && /^[IV]+$/.test(r) ? `${r}maj7` : (/^[iv]+$/.test(r) ? `${r}7` : r));
  result.push({name:"Add colour",roman:colour,why:"Sevenths soften the edges and create smoother voice leading."});
  const openEnding = [...original]; openEnding[openEnding.length-1] = "IV";
  if(openEnding.join()!==original.join()) result.push({name:"Open the ending",roman:openEnding,why:"Ending on IV avoids a full stop and gives the loop a wider, more open return."});
  const lift = [...original]; lift[lift.length-1] = "V";
  if(lift.join()!==original.join()) result.push({name:"Build more tension",roman:lift,why:"Ending on V makes the repeat feel more urgent and directional."});
  return result.filter((v,i,a)=>a.findIndex(x=>x.roman.join()===v.roman.join())===i).slice(0,3);
}

function theoryTextFor(prog, focusScore, scaleId){
  const sc = SCALES[scaleId];
  const degrees = sc.degrees ? sc.degrees.join(" ") : "—";
  const cat = categoryFromMissing(focusScore.missing);
  const centerTxt = (focusScore.center==="minor") ? "minor centre" : "major centre";
  let extra = "";
  const romanStr = prog.roman.join("-");
  if(romanStr === "I-bVII-IV" && (scaleId==="mixolydian")) extra = "This is close to the definition of Mixolydian rock: the flat seventh is its signature.";
  if(romanStr === "i-bVII-IV" && (scaleId==="dorian")) extra = "Dorian creates a brighter minor sound because scale degree 6 is natural rather than flat.";
  if(romanStr === "ii-V-I" && (scaleId==="altered")) extra = "The altered scale on V creates maximum tension before resolving to I.";
  if(romanStr === "i-bII" && (scaleId==="phrygian")) extra = "Phrygian contains a flat second, which creates its dark, heavy character.";
  const explanation = focusScore.missing === 0
    ? "All chord tones are contained in this scale."
    : "Some chord tones are outside this scale. This measures harmonic coverage, not whether the scale is a useful melody choice.";
  return `Chord-tone coverage: <b>${Math.round(focusScore.score*100)}%</b> · ${cat.label}. ${explanation}<br>
          <span class="mono">degrees:</span> ${degrees} · <span class="mono">interpretation:</span> ${centerTxt}. ${extra}`;
}

function renderDetail(){
  const prog = PROGS.find(p=>p.id===selectedId) || PROGS[0];
  const keyPc = parseInt(keySel.value,10);
  const keyLabel = KEYS.find(k=>k.pc===keyPc)?.label || "C";
  const prefer = normalizePrefer(preferAccEl.value, keyLabel, prog.roman);

  const progEventsMajor = prog.roman.map(r => buildChordEventFromRoman(r, keyPc, "major"));
  // Library Roman numerals already include alterations relative to major.
  // Reinterpreting bVI in minor lowers the root twice and changes the chords.
  const firstRoman = parseRoman(prog.roman[0]);
  const center = firstRoman.deg === 1 && firstRoman.isMinor ? "minor" : "major";
  const isBlues = prog.tag === "Blues";
  const preferred = isBlues ? ["pent_blues","minor_pent","major_blues","major_pent","mixolydian"]
    : center === "minor" ? ["nat_minor","dorian","harm_minor","phrygian","mel_minor","minor_pent"]
    : ["major","mixolydian","lydian","major_pent"];
  const preference = id=>{ const i=preferred.indexOf(id); return i<0 ? preferred.length : i; };
  const scored = Object.keys(SCALES).map(id=>({...scoreScaleForProgression(id,progEventsMajor,keyPc),center}))
    .sort((a,b)=>b.score-a.score || preference(a.scaleId)-preference(b.scaleId));

  const safe = scored.filter(s=>s.missing===0).slice(0,8);
  const musical = isBlues ? preferred.slice(0,4).map(id=>scored.find(s=>s.scaleId===id))
    : [safe[0] || scored[0], scored.find(s=>s.scaleId===(center === "minor" ? "minor_pent" : "major_pent")), ...safe, ...scored]
      .filter((s,i,all)=>all.findIndex(other=>other.scaleId===s.scaleId)===i).slice(0,4);
  if(scaleSelectionProgression !== prog.id){
    selectedScaleId = null;
    scaleSelectionProgression = prog.id;
  }
  const focus = scored.find(s=>s.scaleId===selectedScaleId) || musical[0];
  const focusScaleId = focus.scaleId;
  const focusScale = SCALES[focusScaleId];

  const focusScaleTones = scaleTones(focusScaleId, keyPc);
  const focusSet = new Set(focusScaleTones);
  const focusChordToneSet = new Set();
  const eventsForCenter = progEventsMajor;
  eventsForCenter.forEach(ev => ev.tones.forEach(t=>focusChordToneSet.add(t)));
  const focusNames = spelledScaleNotes(focusScaleId, keyPc, keyLabel, preferAccEl.value, prefer);
  const namesByPitch = new Map(focusScaleTones.map((pc,i)=>[pc,focusNames[i]]));
  const focusNoteName = pc=>namesByPitch.get(pc) || pcToName(pc,prefer);

  const chordRows = eventsForCenter.map((ev, idx)=>{
    const rootName = pcToName(ev.rootPc, prefer) + qualitySuffix(ev.quality);
    const pills = ev.tones.map(t=> `<span class="notePill ${focusSet.has(t)?'in':'out'}">${focusNoteName(t)}</span>`).join(" ");
    return `<tr><td class="mono">${idx+1}</td><td class="mono">${ev.roman}</td><td class="mono">${rootName}</td><td>${pills}</td></tr>`;
  }).join("");

  const scalePills = focusNames.map(name=> `<span class="notePill in">${name}</span>`).join(" ");
  const chordTonePills = uniq([...focusChordToneSet]).map(t=> `<span class="notePill ${focusSet.has(t)?'in':'out'}">${focusNoteName(t)}</span>`).join(" ");

  const renderScaleItem = (s)=>{
    const sc = SCALES[s.scaleId];
    const cat = categoryFromMissing(s.missing);
    const degrees = (sc.degrees && sc.degrees.length) ? sc.degrees.join(" ") : "—";
    const group = sc.group || "—";
    const scoreTxt = `${Math.round(s.score*100)}% · ${cat.label} · center=${s.center}`;
    return `
      <div class="scaleItem">
        <div class="head">
          <div class="scaleName"><b>${sc.name}</b> <span class="mono" style="color:var(--muted);">(${s.scaleId})</span></div>
          <div class="score mono">${scoreTxt}</div>
        </div>
        <div class="tagrow">
          <span class="tag ${cat.cls}">${cat.label}</span>
          <span class="tag">group: ${group}</span>
          <span class="tag">degrees: <span class="mono">${degrees}</span></span>
        </div>
        <div class="btnInline">
          <button onclick="applyScale('${s.scaleId}')">Use scale</button>
          <button onclick="applyScale('${s.scaleId}')">Explain</button>
        </div>
      </div>
    `;
  };

  const theory = theoryTextFor(prog, focus, focusScaleId);
  currentVariants = variantIdeas(prog);
  const melodyScale = focusScale;
  const melodyNotes = spelledScaleNotes(focusScaleId, keyPc, keyLabel, preferAccEl.value, prefer);
  const chordTargets = eventsForCenter.map(ev=>pcToName(ev.rootPc,prefer));

  detailEl.innerHTML = `
    <div class="companion">
      <div><div class="help">PROGRESSION ${String(prog.libraryId || prog.id).padStart(3,"0")} / ${prog.tag}</div><h3>${prog.name}</h3></div>
      <div class="v mono" style="font-size:24px;font-weight:800">${prog.roman.join("–")}</div>
      <div class="metaGrid">
        <div class="metaBox"><div class="k">Feel</div><div class="v">${(prog.feel || [prog.vibe]).filter(Boolean).join(" · ")}</div></div>
        <div class="metaBox"><div class="k">Works well for</div><div class="v">${(prog.worksWellFor || []).join(" · ") || "Songwriting"}</div></div>
        <div class="metaBox"><div class="k">Try it — choose and hear</div><div class="tempoSuggestions">${(prog.tryBpm || [90]).map(bpm=>`<button class="tempoButton ${Number(bpm)===currentTempo?'active':''}" data-bpm="${bpm}" onclick="chooseTempo(${bpm})" title="Play at ${bpm} BPM">▶ ${bpm}</button>`).join("")}</div></div>
      </div>
      ${prog.whyItWorks ? `<div><div class="help"><b>WHY IT WORKS</b></div><p>${prog.whyItWorks}</p></div>` : ""}
      ${prog.tryThis ? `<div><div class="help"><b>TRY THIS</b></div><p>${prog.tryThis}</p></div>` : ""}
    </div>
    <div class="mainActions">
      <button class="primary" onclick="playSelected()">▶ Hear this progression</button>
      <button onclick="openKeySettings()">Change key</button>
      <button onclick="document.getElementById('shapeSection').scrollIntoView({behavior:'smooth'})">Shape it</button>
    </div>
    <div id="keyQuickMenu" class="keyQuickMenu">
      <div class="help"><b>CHOOSE KEY</b> — the progression and melody guidance update immediately.</div>
      <div class="choiceRow">${KEYS.map(key=>`<button class="keyButton ${key.pc===keyPc?'active':''}" onclick="chooseKey(${key.pc})">${key.label}</button>`).join("")}</div>
    </div>
    <div class="grid2">
      <div class="bigline">
        <div class="k">Key</div>
        <div class="v mono">${pcToName(keyPc, prefer)} (${keyLabel})</div>
      </div>
      <div class="bigline">
        <div class="k">Chords (in order)</div>
        <div class="v mono">${eventsForCenter.map(ev => pcToName(ev.rootPc, prefer) + qualitySuffix(ev.quality)).join(" – ")}</div>
      </div>
    </div>

    <div id="shapeSection">
      <label>SHAPE IT — hear how one musical choice changes the feeling</label>
      <div class="variantGrid">${currentVariants.map((variant,index)=>`<div class="variantCard"><strong>${variant.name}</strong><div class="mono">${variant.roman.join("–")}</div><p>${variant.why}</p><button onclick="playVariant(${index})">▶ Hear variant</button></div>`).join("")}</div>
    </div>

    <div class="melodyBox">
      <h3>Write a melody over it</h3>
      <div>Suggested melody scale: <b>${pcToName(keyPc,prefer)} ${melodyScale.name}</b></div>
      <div class="help">${isBlues ? "Minor blues and minor pentatonic are traditional melody choices over dominant blues chords. Their minor third creates expressive tension against the major third in the chords. Major blues and major pentatonic offer a brighter alternative. These are melodic palettes, not scales containing every chord tone; follow the changing chords with your ear."
        : focus.missing === 0 ? "All chord tones are contained in this scale."
        : "Some chord tones are outside this scale. This measures harmonic coverage, not whether the scale is a useful melody choice."}</div>
      <label style="margin-top:10px">Musical melody choices</label>
      <div class="choiceRow">${musical.map(s=>`<button class="choice ${s.scaleId===focusScaleId?'active':''}" onclick="applyScale('${s.scaleId}')">${SCALES[s.scaleId].name}</button>`).join("")}</div>
      <div class="mono">${melodyNotes.join(" · ")}</div>
      <div class="melodyInstrument"><label for="melodyInstrument">Show written scale for</label><select id="melodyInstrument">
        <option value="C">C — Concert pitch / flute</option>
        <option value="Bb">B♭ — Trumpet / clarinet</option>
        <option value="Eb">E♭ — Alto sax</option>
        <option value="F">F — Horn</option>
      </select></div>
      <div class="scaleNotation"><div id="melodyNotation" role="img" aria-label="Suggested melody scale in staff notation"></div></div>
      <div id="melodyWrittenNotes" class="mono" aria-live="polite"></div>
      <div id="melodyTranspositionHelp" class="help"></div>
      <div class="help">Start by aiming for the chord roots as the harmony changes: <b>${chordTargets.join(" → ")}</b>. Use the other notes to connect them.</div>
    </div>

    <div class="grid2">
      <div class="bigline">
        <div class="k">Progression</div>
        <div class="v mono">${prog.roman.join(" – ")}</div>
        <div class="help mono" style="margin-top:6px;">${eventsForCenter.map(ev => pcToName(ev.rootPc, prefer) + qualitySuffix(ev.quality)).join(" – ")}</div>
      </div>
      <div class="bigline">
        <div class="k">Focus scale</div>
        <div class="v">${pcToName(keyPc, prefer)} ${focusScale.name} <span class="mono" style="color:var(--muted);">(${focusScaleId})</span></div>
      </div>
    </div>

    <div class="grid2">
      <div class="bigline">
        <div class="k">What is happening theoretically?</div>
        <div class="v" style="font-size:13px; line-height:1.35;">${theory}</div>
      </div>
      <div class="bigline">
        <div class="k">What can you do as a musician?</div>
        <div class="v" style="font-size:13px; line-height:1.35;">
          Play the chords and improvise with <b>${focusScale.name}</b>.
          Try resolving to <b>${pcToName(keyPc, prefer)}</b> as home, while noticing whether your ear is drawn towards another chord as the tonal centre.
        </div>
      </div>
    </div>

    <details class="advanced"><summary>Explore matching scales and chord tones</summary><div class="split">
      <div>
        <label>Full chord-tone coverage</label>
        <div class="scaleList">${safe.map(renderScaleItem).join("") || `<div class="help">No perfect match among the top results. See the creative options.</div>`}</div>
      </div>
      <div>
        <label>Other harmonic matches</label>
        <div class="scaleList">${scored.filter(s=>s.missing>0).slice(0,8).map(renderScaleItem).join("")}</div>
      </div>
    </div></details>

    <div>
      <label>Scale tones vs chord tones</label>
      <div class="notegrid">
        <div class="help"><b>Scale tones:</b></div>
        <div class="noteRow">${scalePills}</div>
        <div class="help"><b>Chord tones:</b> (red pills = outside the focus scale)</div>
        <div class="noteRow">${chordTonePills}</div>
      </div>
    </div>

    <div>
      <label>Chords and chord tones</label>
      <table class="table">
        <thead><tr><th>#</th><th>Roman</th><th>Chord</th><th>Chord tones</th></tr></thead>
        <tbody>${chordRows}</tbody>
      </table>
    </div>

    <div class="row">
      <button class="primary" onclick="playSelected()">▶ Play</button>
      <button onclick="copySong()">📋 Copy SongV1</button>
    </div>

    <div>
      <label>SongV1 (zero-based, song-level time signature/subdivision)</label>
      <textarea class="mono" id="songJson" spellcheck="false"></textarea>
      <div class="help">This prototype stores each chord as <span class="mono">rootPc + quality</span> rather than parsing a chord-name string.</div>
    </div>
  `;

  document.getElementById("songJson").value = JSON.stringify(buildSongV1(prog, keyPc, focusScaleId), null, 2);
  window.CLScaleNotation?.render(melodyNotes);
}

function parseTimeSig(ts){ const [n,d]=ts.split("/").map(x=>parseInt(x,10)); return {n,d}; }
function unitsPerBar(timeSig, subdiv){
  const {n,d} = parseTimeSig(timeSig);
  const subDen = parseInt(subdiv.split("/")[1],10);
  return n * (subDen / d);
}
function buildSongV1(prog, keyPc, scaleId){
  const bars = Math.max(4, Math.min(64, parseInt(barsEl.value,10)||8));
  const timeSignature = timeSigEl.value;
  const subdivision = subdivEl.value;
  const upb = unitsPerBar(timeSignature, subdivision);
  const chordsPerBar = Math.max(1, Math.min(4, parseInt(chordsPerBarEl.value,10)||1));
  const evLen = Math.floor(upb / chordsPerBar);

  const template = prog.roman.map(r => buildChordEventFromRoman(r, keyPc, "major"));
  let seqIndex = 0;
  const measures = [];
  for(let bar=0; bar<bars; bar++){
    const events = [];
    for(let s=0; s<chordsPerBar; s++){
      const ev = template[seqIndex % template.length];
      events.push({ startUnit:s*evLen, lenUnits:evLen, roman:ev.roman, rootPc:ev.rootPc, quality:ev.quality });
      seqIndex++;
    }
    const used = evLen * chordsPerBar;
    if(used < upb && events.length) events[events.length-1].lenUnits += (upb-used);
    measures.push({ index: bar, events });
  }

  return {
    schemaVersion:"ChordLink.SongV1",
    title:`${prog.roman.join("–")} (${prog.name})`,
    tempo:currentTempo,
    timeSignature,
    subdivision,
    unitsPerBar:upb,
    measures,
    meta:{ keyPc, scaleId, source:"Scale Explorer Prototype V2.2", progression:prog.roman, chordsPerBar },
    createdAt:new Date().toISOString()
  };
}

// actions
window.applyScale = function(scaleId){ selectedScaleId = scaleId; renderAll(); };
window.copySong = async function(){
  const txt = document.getElementById("songJson")?.value || "";
  try{ await navigator.clipboard.writeText(txt); alert(window.CLChordProgLanguage?.translate("SongV1 copied ✅") || "SongV1 copied ✅"); }
  catch(e){ alert(window.CLChordProgLanguage?.translate("Automatic copy failed — please copy it manually.") || "Automatic copy failed — please copy it manually."); }
};

function renderAll(){ renderList(); renderDetail(); }

function populateLibraryFilters(){
  const categories = [...new Set(PROGS.map(p=>p.tag))].sort();
  const uses = [...new Set(PROGS.flatMap(p=>p.worksWellFor || []))].sort();
  categoryFilter.innerHTML = '<option value="">All styles</option>' + categories.map(x=>`<option>${x}</option>`).join("");
  categoryFilter.value = '';
  useFilter.innerHTML = '<option value="">Any use</option>' + uses.map(x=>`<option>${x}</option>`).join("");
}

async function loadProgressionLibrary(){
  try{
    const response = await fetch("progressions.json?v=20260812-4");
    if(!response.ok) throw new Error(`Library request failed: ${response.status}`);
    const rows = await response.json();
    PROGS = rows.map(row=>({
      id:`CL${row.id}`, libraryId:row.id, name:row.title, tag:row.category,
      roman:row.numerals.split(/[–—−-]/).map(x=>x.trim()).filter(Boolean),
      vibe:(row.feel || []).join(" / "), feel:row.feel || [], worksWellFor:row.works_well_for || [],
      tryBpm:row.try_bpm || [], whyItWorks:row.why_it_works || "", tryThis:row.try_this || "",
      referenceChords:row.reference_chords || ""
    }));
    selectedId = PROGS[0].id;
    populateLibraryFilters();
    renderAll();
  }catch(error){
    console.error(error);
    if(resultCount) resultCount.textContent = "Using the compact built-in library; the full library could not be loaded.";
  }
}

// audio (WebAudio, no external libs)
let audioRequest = 0;
let audioCtx = null;
let masterGain = null;

function hzFromMidi(m){ return 440 * Math.pow(2, (m-69)/12); }

function ensureCtx(){
  if(!audioCtx){
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.7;
    masterGain.connect(audioCtx.destination);
  }
  return audioCtx;
}

async function ensureAudio(){
  const ctx = ensureCtx();
  if(ctx.state !== "running"){
    await ctx.resume();
  }
  audioReady = true;
  audioBtn.textContent = "✅ Sound enabled";
  return true;
}

function makeVoice(kind, freq, t0, dur){
  const ctx = ensureCtx();

  const oscA = ctx.createOscillator();
  const oscB = ctx.createOscillator();
  const g = ctx.createGain();
  const filt = ctx.createBiquadFilter();

  // Defaults (piano-ish)
  let waveA = "sine", waveB = "triangle";
let a = 0.002, d = 0.2, s = 0.3, r = 0.4;


  let peak = 0.12;
  filt.type = "lowpass"; filt.frequency.value = 5200; filt.Q.value = 0.8;

  if(kind==="pad"){
    waveA="sawtooth"; waveB="triangle";
    a=0.14; d=0.7; s=0.55; r=1.2;
    peak=0.10;
    filt.frequency.value = 2400; filt.Q.value = 0.9;
  } else if(kind==="pluck"){
    waveA="square"; waveB="triangle";
    a=0.001; d=0.08; s=0.0; r=0.10;
    peak=0.09;
    filt.frequency.value = 4200; filt.Q.value = 1.2;
  }

  oscA.type = waveA;
  oscB.type = waveB;

  oscA.frequency.setValueAtTime(freq, t0);
  oscB.frequency.setValueAtTime(freq*2, t0); // light harmonic

  // Envelope
  const susLevel = Math.max(0.0001, peak * s);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + a);
  g.gain.exponentialRampToValueAtTime(susLevel, t0 + a + d);

  const tRelease = t0 + Math.max(0.05, dur);
  g.gain.setValueAtTime(susLevel, tRelease);
  g.gain.exponentialRampToValueAtTime(0.0001, tRelease + r);

  oscA.connect(filt);
  oscB.connect(filt);
  filt.connect(g);
  g.connect(masterGain);

  oscA.start(t0);
  oscB.start(t0);
  oscA.stop(tRelease + r + 0.05);
  oscB.stop(tRelease + r + 0.05);
  scheduledOscillators.push(oscA,oscB);
  oscA.addEventListener("ended",()=>{scheduledOscillators=scheduledOscillators.filter(x=>x!==oscA);},{once:true});
  oscB.addEventListener("ended",()=>{scheduledOscillators=scheduledOscillators.filter(x=>x!==oscB);},{once:true});
}

function panicPlayback(){
  audioRequest += 1;
  stopPlayback();
  const ctx = audioCtx;
  audioCtx = null;
  masterGain = null;
  audioReady = false;
  if(ctx && ctx.state !== "closed") ctx.close().catch(()=>{});
}

function stopPlayback(){
  const now=audioCtx?.currentTime || 0;
  scheduledOscillators.forEach(osc=>{try{osc.stop(now);}catch(error){}});
  scheduledOscillators=[];
}

function pcsToMidi(pcs, baseMidi=60){
  const basePc = (baseMidi%12+12)%12;
  let root = baseMidi + ((pcs[0]-basePc+12)%12);
  if(root - baseMidi > 6) root -= 12;
  const notes = [root];
  for(let i=1;i<pcs.length;i++){
    let n = root + ((pcs[i]-pcs[0]+12)%12);
    if(n<=root) n += 12;
    notes.push(n);
  }
  return notes;
}

window.playSelected = async function(){
  const prog = PROGS.find(p=>p.id===selectedId) || PROGS[0];
  const keyPc = parseInt(keySel.value,10);
  const request = ++audioRequest;
  const ok = await ensureAudio(); if(!ok || request !== audioRequest) return;

  stopPlayback();
  const bpm = currentTempo;
  const stepSec = 60 / bpm; // quarter note
  const kind = soundSel?.value || "piano";
  const events = prog.roman.map(r => buildChordEventFromRoman(r, keyPc, "major"));
  const t0 = ensureCtx().currentTime + 0.06;

  events.forEach((ev, i)=>{
    const pcs = chordTones(ev.rootPc, ev.quality);
    const midis = pcsToMidi(pcs, 60);
    const start = t0 + i*stepSec;
    const dur = stepSec * 1.0; // avoid overlap for piano/pluck
    midis.map(hzFromMidi).forEach(f => makeVoice(kind, f, start, dur));
  });
};

async function playRomanList(romanList){
  const prog = PROGS.find(p=>p.id===selectedId) || PROGS[0];
  const keyPc = parseInt(keySel.value,10);
  const request = ++audioRequest;
  await ensureAudio();
  if(request !== audioRequest) return;
  stopPlayback();
  const bpm = currentTempo, stepSec=60/bpm, kind=soundSel?.value||"piano", t0=ensureCtx().currentTime+.06;
  romanList.map(r=>buildChordEventFromRoman(r,keyPc,"major")).forEach((ev,i)=>{
    pcsToMidi(chordTones(ev.rootPc,ev.quality),60).map(hzFromMidi).forEach(f=>makeVoice(kind,f,t0+i*stepSec,stepSec));
  });
}
window.playVariant = index => currentVariants[index] && playRomanList(currentVariants[index].roman);


function buildSequenceFromSlots(){
  const keyPc = parseInt(keySel.value,10);
  const bpm = currentTempo;
  const beatSec = 60 / bpm;
  const beatsPerStep = parseInt(slotBeats?.value || "1",10) || 1;
  const stepSec = beatSec * beatsPerStep;

  const slotData = gatherSlots();
  const steps = [];

  function appendRoman(romanList, slotIndex){
    romanList.forEach((r, idx)=>{
      const ev = buildChordEventFromRoman(r, keyPc, "major");
      steps.push({
        slot: slotIndex,
        stepIndex: steps.length,
        localIndex: idx,
        roman: ev.roman,
        rootPc: ev.rootPc,
        quality: ev.quality,
        durationBeats: beatsPerStep
      });
    });
  }

  slotData.forEach(sd=>{
    if(sd.parsed.type==="progIds"){
      sd.parsed.value.forEach(pid=>{
        const p = PROGS.find(x=>x.id===pid);
        if(p) appendRoman(p.roman, sd.slot);
      });
    } else {
      appendRoman(sd.parsed.value, sd.slot);
    }
  });

  const events = steps.map((s,i)=>{
    const t = i * stepSec;
    return {
      t, dur: stepSec,
      slot: s.slot,
      roman: s.roman,
      chord: { rootPc: s.rootPc, quality: s.quality }
    };
  });

  return {
    schemaVersion: "ChordLink.SequenceV1",
    title: "ChordLink Step Sequencer",
    bpm,
    beatsPerStep,
    stepSec,
    keyPc,
    sound: (soundSel?.value || "piano"),
    slots: slotData.map(x=>({slot:x.slot, raw:x.raw})),
    events,
    createdAt: new Date().toISOString()
  };
}

function exportJAMS(sequence){
  return {
    jams_version: "0.3",
    file_metadata: {
      title: sequence.title,
      duration: sequence.events.length ? (sequence.events[sequence.events.length-1].t + sequence.events[sequence.events.length-1].dur) : 0
    },
    annotations: [
      {
        namespace: "chord",
        data: sequence.events.map(ev => ({
          time: ev.t,
          duration: ev.dur,
          value: ev.roman,
          confidence: 1.0,
          extra: { slot: ev.slot, rootPc: ev.chord.rootPc, quality: ev.chord.quality }
        }))
      }
    ]
  };
}

function exportBundle(){
  const seq = buildSequenceFromSlots();
  const jams = exportJAMS(seq);
  const bundle = { bundleVersion:"ChordLink.BundleV1", sequence: seq, jams };
  if(exportOut) exportOut.value = JSON.stringify(bundle, null, 2);
}

async function playSequenceFromSlots(){
  const seq = buildSequenceFromSlots();
  if(!seq.events.length){
    alert(window.CLChordProgLanguage?.translate("No events found. Fill at least one slot (for example P1 or Roman numerals: I V vi IV).") || "No events found. Fill at least one slot (for example P1 or Roman numerals: I V vi IV).");
    return;
  }
  const request = ++audioRequest;
  const ok = await ensureAudio(); if(!ok || request !== audioRequest) return;
  const kind = soundSel?.value || "piano";
  const ctx = ensureCtx();
  const t0 = ctx.currentTime + 0.06;

  function scheduleOnce(offsetSec){
    seq.events.forEach(ev => {
      const pcs = chordTones(ev.chord.rootPc, ev.chord.quality);
      const midis = pcsToMidi(pcs, 60);
      const freqs = midis.map(hzFromMidi);
      const start = t0 + offsetSec + ev.t;
      const dur = ev.dur * 0.95;
      freqs.forEach(f => makeVoice(kind, f, start, dur));
    });
  }

  scheduleOnce(0);

  if(loopSeq?.value === "on"){
    const total = seq.events[seq.events.length-1].t + seq.events[seq.events.length-1].dur;
    scheduleOnce(total);
  }
}




function downloadProgressionMidi(useSlots=false){
  const beatSec = 60/currentTempo;
  let timeline;
  if(useSlots){
    const seq = buildSequenceFromSlots();
    if(!seq.events.length){ alert("Fill at least one slot before exporting MIDI."); return; }
    timeline = seq.events.map(ev=>({startBeat:ev.t/beatSec,durationBeats:ev.dur*.95/beatSec,
      notes:pcsToMidi(chordTones(ev.chord.rootPc,ev.chord.quality),60)}));
    if(loopSeq?.value === "on"){
      const end = seq.events[seq.events.length-1];
      const offset = (end.t+end.dur)/beatSec;
      timeline = timeline.concat(timeline.map(ev=>({...ev,startBeat:ev.startBeat+offset})));
    }
  } else {
    const prog = PROGS.find(p=>p.id===selectedId) || PROGS[0];
    const keyPc = parseInt(keySel.value,10);
    timeline = prog.roman.map((roman,index)=>{
      const chord = buildChordEventFromRoman(roman,keyPc,"major");
      return {startBeat:index,durationBeats:1,notes:pcsToMidi(chordTones(chord.rootPc,chord.quality),60)};
    });
  }
  const bytes = new Uint8Array(createMidiFile(timeline,currentTempo));
  const url = URL.createObjectURL(new Blob([bytes],{type:"audio/midi"}));
  const link = document.createElement("a");
  link.href = url;
  link.download = `rockeskolen-${useSlots ? "slots" : String(selectedId).replace(/[^a-z0-9-]/gi,"-")}-key${keySel.value}-${currentTempo}bpm.mid`;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

// events
document.getElementById("midiSelected").addEventListener("click",()=>downloadProgressionMidi());
document.getElementById("midiSlots").addEventListener("click",()=>downloadProgressionMidi(true));
document.getElementById("panicButton").addEventListener("click",panicPlayback);
document.addEventListener("keydown",event=>{if(event.key==="Escape") panicPlayback();});
[keySel, preferAccEl, timeSigEl, subdivEl, barsEl, chordsPerBarEl].forEach(el=> el.addEventListener("change", ()=>renderAll()));
[searchProg, categoryFilter, useFilter].forEach(el=>el?.addEventListener(el===searchProg ? "input" : "change", ()=>renderList()));
document.querySelectorAll("#sectionChoices .choice").forEach(button=>button.addEventListener("click",()=>{document.querySelectorAll("#sectionChoices .choice").forEach(x=>x.classList.remove("active"));button.classList.add("active");guidedSection=button.dataset.value;showAllResults=false;renderList();}));
document.querySelectorAll("#feelChoices .choice").forEach(button=>button.addEventListener("click",()=>{document.querySelectorAll("#feelChoices .choice").forEach(x=>x.classList.remove("active"));button.classList.add("active");guidedFeel=button.dataset.value;showAllResults=false;renderList();}));
document.getElementById("findProgressions")?.addEventListener("click",()=>{showAllResults=false;suggestionSignature=null;renderList();});
audioBtn.addEventListener("click", async ()=>{ await ensureAudio(); });
randomBtn.addEventListener("click", ()=>{ selectedId = PROGS[Math.floor(Math.random()*PROGS.length)].id; renderAll(); });
if(addSelToSlot) addSelToSlot.addEventListener("click", ()=>addSelectedProgToSlot());
if(playSlotsBtn) playSlotsBtn.addEventListener("click", ()=>playSequenceFromSlots());
if(exportSeqBtn) exportSeqBtn.addEventListener("click", ()=>exportBundle());
if(clearSlotsBtn) clearSlotsBtn.addEventListener("click", ()=>{ [slot1,slot2,slot3,slot4].forEach(s=>{ if(s) s.value=""; }); if(exportOut) exportOut.value=""; });

if(playBtnTop) playBtnTop.addEventListener("click", ()=>playSelected());
if(soundSel) soundSel.addEventListener("change", stopPlayback);
if(tempoControl) tempoControl.addEventListener("input",()=>setTempo(tempoControl.value,false));

renderAll();
loadProgressionLibrary();
setTempo(100,false);
