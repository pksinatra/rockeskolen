const SCALE_API_URL = "/api/scales/piano.php";

const SCALE_NAME_NO = {

  major: "Dur",
  nat_minor: "Naturlig moll",
  harmonic_minor: "Harmonisk moll",
  melodic_minor: "Melodisk moll",

  ionian: "Ionisk",
  dorian: "Dorisk",
  phrygian: "Frygisk",
  lydian: "Lydisk",
  mixolydian: "Miksolydisk",
  aeolian: "Eolisk",
  locrian: "Lokrisk",

  major_pent: "Pentaton dur",
  minor_pent: "Pentaton moll",
  pent_blues: "Blues-pentaton",

  whole: "Heltone",
  chromatic: "Kromatisk",
  diminished: "Diminuert",
  augmented_hex: "Augmentert hexatonisk",

  phrygian_dom: "Spansk sigøynerskala",

  hungarian_minor: "Ungarsk moll",
  arabian: "Arabisk",
  persian: "Persisk",

};


const N_SHARP=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const N_FLAT =["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];
const mod=(n,m)=>((n%m)+m)%m;
let accPref='sharp';
const pcName = pc => (accPref==='flat' ? N_FLAT[pc] : N_SHARP[pc]);
const noteName = m => pcName(mod(m,12)) + (Math.floor(m/12)-1);

const SCALE_GROUPS = [
  {id:"common", label:"Vanlige skalaer"},
  {id:"modes",  label:"Kirketonearter / modale"},
  {id:"pent",   label:"Pentatoniske"},
  {id:"sym",    label:"Symmetriske / formiskede / heltone"},
  {id:"melmm",  label:"Melodisk moll & jazz-moduser"},
  {id:"world",  label:"World / eksotisk"},
  {id:"other",  label:"Andre / eksperimentelle"},
  {id:"chrom",  label:"Kromatisk"}
];

let SCALES = {};
let currentRootPc = 0;
let currentScaleKey = null;      // ingen skala valgt ved start


const MIN_MIDI=48, MAX_MIDI=84;
const AC = new (window.AudioContext||window.webkitAudioContext)();
const midiToFreq = m => 440*Math.pow(2,(m-69)/12);
function ping(m,offset=0){
  const t=AC.currentTime+offset;
  const o=AC.createOscillator();
  const g=AC.createGain();
  o.type='triangle';
  o.frequency.value=midiToFreq(m);
  o.connect(g); g.connect(AC.destination);
  g.gain.setValueAtTime(0,t);
  g.gain.linearRampToValueAtTime(0.22,t+0.01);
  g.gain.linearRampToValueAtTime(0.12,t+0.18);
  g.gain.exponentialRampToValueAtTime(0.0008,t+0.70);
  o.start(t); o.stop(t+0.72);
}

// Piano
const WHITE_W=44, BLACK_W=28;
const WHITE_PCS=[0,2,4,5,7,9,11];
const BLACK_AFTER={0:1,2:3,4:null,5:6,7:8,9:10,11:null};

function renderOctave(oct){
  const octWrap=document.createElement('div'); octWrap.className='oct';
  const whites=document.createElement('div'); whites.className='whites';
  const blacks=document.createElement('div'); blacks.className='blacks';
  for(let wi=0; wi<WHITE_PCS.length; wi++){
    const pc=WHITE_PCS[wi];
    const white=document.createElement('div'); white.className='white'; white.dataset.pc=pc; white.dataset.oct=oct;
    const midi=(oct+1)*12+pc; white.dataset.m=midi;
    if(pc===0){
      const lab=document.createElement('div'); lab.className='lab'; lab.textContent='C'+oct; white.appendChild(lab);
    }
    white.addEventListener('click',()=> ping(midi,0));
    whites.appendChild(white);
    const bpc=BLACK_AFTER[pc];
    if(bpc!=null){
      const black=document.createElement('div'); black.className='black'; black.dataset.pc=bpc; black.dataset.oct=oct;
      const bm=(oct+1)*12+bpc; black.dataset.m=bm;
      black.style.left=((wi+1)*WHITE_W - (BLACK_W/2))+'px';
      black.addEventListener('click',()=> ping(bm,0));
      blacks.appendChild(black);
    }
  }
  octWrap.appendChild(whites); octWrap.appendChild(blacks); return octWrap;
}


function scaleName(sc, key){
  return SCALE_NAME_NO[key] || sc.name;
}


function renderTailC(oct){
  const octWrap=document.createElement('div');
  octWrap.className='oct tail';
  const whites=document.createElement('div'); whites.className='whites';
  const white=document.createElement('div'); white.className='white'; white.dataset.pc=0; white.dataset.oct=oct;
  const midi=(oct+1)*12; // C of this octave
  white.dataset.m=midi;
  const lab=document.createElement('div'); lab.className='lab'; lab.textContent='C'+oct; white.appendChild(lab);
  white.addEventListener('click',()=> ping(midi,0));
  whites.appendChild(white);
  octWrap.appendChild(whites);
  return octWrap;
}


function renderPiano(){
  const piano=document.getElementById('piano'); piano.innerHTML='';
  const row=document.createElement('div'); row.style.display='flex'; row.style.gap='0px'; row.style.justifyContent='center';
  // 3 full octaves: C3..B5
  [3,4,5].forEach(o=> row.appendChild(renderOctave(o)));
  // Tail key: add the top C (C6) without adding a full 4th octave
  row.appendChild(renderTailC(6));
  piano.appendChild(row);
}

function buildRootSelector(){
  const rootSel=document.getElementById('root');
  const ALL=[
    {n:'C',pc:0},{n:'C#/Db',pc:1},{n:'D',pc:2},{n:'D#/Eb',pc:3},
    {n:'E',pc:4},{n:'F',pc:5},{n:'F#/Gb',pc:6},{n:'G',pc:7},
    {n:'G#/Ab',pc:8},{n:'A',pc:9},{n:'A#/Bb',pc:10},{n:'B',pc:11}
  ];
  rootSel.innerHTML='';
  ALL.forEach(it=>{
    const o=document.createElement('option');
    o.value=it.pc; o.textContent=it.n;
    rootSel.appendChild(o);
  });
  rootSel.value='0';
}

function getRootMidiAroundC4(){
  const anchorOct=4;
  const REF=(anchorOct+1)*12;
  const below=REF - mod(REF-currentRootPc,12);
  const above=below+12;
  return (Math.abs(REF-above)<Math.abs(REF-below))?above:below;
}
function buildScaleMidisOneOct(){
  const sc=SCALES[currentScaleKey];
  if(!sc) return [];
  const rootMidi=getRootMidiAroundC4();
  const out=[];
  sc.intervals.forEach(iv=>{
    const m=rootMidi+iv;
    if(m>=MIN_MIDI && m<=MAX_MIDI) out.push(m);
  });
  const top=rootMidi+12;
  if(top>=MIN_MIDI && top<=MAX_MIDI) out.push(top);
  return out;
}
function buildScaleMidiForPlay(){
  const sc=SCALES[currentScaleKey];
  if(!sc) return [];
  const rootMidi=getRootMidiAroundC4();
  const arr=sc.intervals.map(iv=>rootMidi+iv);
  arr.push(rootMidi+12);
  return arr.filter(m=>m>=MIN_MIDI && m<=MAX_MIDI);
}
function buildScaleMidiWholeKeyboard(){
  const sc=SCALES[currentScaleKey];
  if(!sc) return [];
  const pcsSet=new Set(sc.intervals.map(iv=>mod(currentRootPc+iv,12)));
  const out=[];
  for(let m=MIN_MIDI;m<=MAX_MIDI;m++){
    if(pcsSet.has(mod(m,12))) out.push(m);
  }
  return out;
}

function clearHighlights(){
  document.querySelectorAll('.white,.black').forEach(el=>{
    el.classList.remove('active');
    const mark=el.querySelector('.mark');
    if(mark) mark.remove();
  });
}
function highlightCurrentScale(){
  clearHighlights();
  const showAll=document.getElementById('showAll').checked;
  const keys=document.querySelectorAll('.white,.black');
  if(showAll){
    const sc=SCALES[currentScaleKey];
    if(!sc) return;
    const pcsSet=new Set(sc.intervals.map(iv=>mod(currentRootPc+iv,12)));
    keys.forEach(el=>{
      const pc=parseInt(el.dataset.pc,10);
      const midi=parseInt(el.dataset.m,10);
      if(pcsSet.has(pc)){
        el.classList.add('active');
        let tag=el.querySelector('.mark');
        if(!tag){ tag=document.createElement('div'); tag.className='mark'; el.appendChild(tag); }
        tag.textContent=noteName(midi);
      }
    });
  } else {
    const midisSet=new Set(buildScaleMidisOneOct());
    keys.forEach(el=>{
      const midi=parseInt(el.dataset.m,10);
      if(midisSet.has(midi)){
        el.classList.add('active');
        let tag=el.querySelector('.mark');
        if(!tag){ tag=document.createElement('div'); tag.className='mark'; el.appendChild(tag); }
        tag.textContent=noteName(midi);
      }
    });
  }
}



function updateScale(){
  const infoEl = document.getElementById('scaleInfo'); // hvis du har en slik

  if (!currentScaleKey) {
    // Ingen skala valgt → tøm keyboard og info
    clearHighlights();
    if (infoEl) infoEl.textContent = "";
    return;
  }

  const rootSel=document.getElementById('root');
  const scaleNameEl=document.getElementById('scaleName');
  const noteBadgesEl=document.getElementById('noteBadges');
  const degreeInfoEl=document.getElementById('degreeInfo');
  const aliasInfoEl=document.getElementById('aliasInfo');

  currentRootPc=parseInt(rootSel.value,10)||0;
  const sc = SCALES[currentScaleKey];
  const rootName=pcName(currentRootPc);

if (!currentScaleKey) {
  scaleNameEl.textContent = "";
  return;
}
  const rootMidi=getRootMidiAroundC4();
  const baseMidis=(sc?.intervals||[]).map(iv=>rootMidi+iv).filter(m=>m>=MIN_MIDI && m<=MAX_MIDI);
  const displayMidis=[...baseMidis];
  const topMidi=rootMidi+12;
  if(topMidi>=MIN_MIDI && topMidi<=MAX_MIDI) displayMidis.push(topMidi);

  const baseDegrees=sc?.degrees || [];
  const displayDegrees=[...baseDegrees];
  if(displayMidis.length>baseDegrees.length) displayDegrees.push("8");

  noteBadgesEl.innerHTML = displayMidis.map((m,i)=>{
    const deg=displayDegrees[i] || (i+1);
    return `<span class="badge">${deg}: ${noteName(m)}</span>`;
  }).join('');

  degreeInfoEl.textContent = sc
    ? `Intervaller (i halvtoner fra grunntone): ${sc.intervals.join(", ")}`
    : "";

  if(sc?.aliases && sc.aliases.length){
    aliasInfoEl.textContent = "Også kjent som: " + sc.aliases.join(", ");
  } else {
    aliasInfoEl.textContent = "";
  }

  highlightCurrentScale();
}

function updateScaleToggleLabel() {
  const lbl = document.getElementById('scaleToggleLabel');
  if (!lbl) return;

  if (!currentScaleKey) {
    lbl.textContent = "Select scale type";
    return;
  }

  const sc = SCALES[currentScaleKey];
  lbl.textContent = sc ? sc.name : currentScaleKey;
}




function playCurrentScale(){
  const upDownEl=document.getElementById('playUpDown');
  const showAllEl=document.getElementById('showAll');
  const upDown=upDownEl && upDownEl.checked;
  const showAll=showAllEl && showAllEl.checked;

  let seq = showAll ? buildScaleMidiWholeKeyboard() : buildScaleMidiForPlay();
  if(!seq.length) return;
  if(upDown){
    const down=seq.slice(0,-1).slice().reverse();
    seq = seq.concat(down);
  }
  highlightCurrentScale();
  let t=0, step=0.25;
  seq.forEach(m=>{ ping(m,t); t+=step; });
}

function updateScaleToggleLabel() {
  const lbl = document.getElementById('scaleToggleLabel');
  if (!lbl) return;

  if (!currentScaleKey) {
    lbl.textContent = "Select scale type";
    return;
  }

  const sc = SCALES[currentScaleKey];
  if (sc) {
    lbl.textContent = sc.name;
  } else {
    lbl.textContent = currentScaleKey;
  }
}
const CL_IS_PRO = window.CL_IS_PRO === true;

const FREE_SCALE_KEYS = [
  "major",        // Dur
  "major_pent",   // Pentaton dur
  "nat_minor",    // Naturlig moll
  "phrygian",   // Frygisk
  "phrygian_dom",   // Spansk sigøynerskala
  "augmented_hex",   // Augmented hexatonic
  "minor_pent",   // Pentaton moll
  "major_pent",   // Pentaton dur
  "pent_blues"    // Pentaton blues phrygian_dom
];

function isScaleAllowed(scaleKey){
  return window.CL_IS_PRO || FREE_SCALE_KEYS.includes(scaleKey);
}

function buildScaleMenu(){
  const menu=document.getElementById('scaleMenu');
  const hidden=document.getElementById('scaleType');
  menu.innerHTML='';

  SCALE_GROUPS.forEach(group=>{
    const det=document.createElement('details');
    det.className='scale-group';
    det.open = true;
    const sum=document.createElement('summary');
    sum.textContent=group.label;
    det.appendChild(sum);

    Object.entries(SCALES).forEach(([key,sc])=>{
      if(sc.group!==group.id) return;

      const btn=document.createElement('button');
      btn.type='button';
      btn.className='scale-item';
      if(key===currentScaleKey) btn.classList.add('active');
      btn.dataset.key=key;
      


      const allowed = isScaleAllowed(key);

      if (!allowed) {
        // Låst for Free-brukere
        btn.classList.add('locked-scale');
        btn.textContent = sc.name + " (Pro)";
btn.addEventListener('click', () => {
  const el = document.getElementById("scaleProMsg");
  if (!el) return;

  el.innerHTML = `
<a class="pro-cta" href="/members/upgrade.php">
  <strong>Kun for medlemmer:</strong> <strong>${scaleName(sc, key)}</strong> er tilgjengelig med VIP medlemskap.<br>
  <span class="pro-cta-sub">Se medlemskap</span>
</a>
  `;
  el.style.display = "block";

  menu.classList.remove('open');   // 👈 DENNE
  el.scrollIntoView({ behavior: "smooth", block: "center" });
});


      } else {
        // Tilgjengelig for Free + Pro
        btn.textContent = scaleName(sc, key);
        btn.addEventListener('click',()=>{

          const proMsg = document.getElementById("scaleProMsg");
          if (proMsg) proMsg.style.display = "none";


          currentScaleKey=key;
          hidden.value=key;
          updateScaleToggleLabel();
          updateScale();
          menu.querySelectorAll('.scale-item').forEach(it=>it.classList.remove('active'));
          btn.classList.add('active');
          menu.classList.remove('open');
        });
      }

      det.appendChild(btn);
    });

    menu.appendChild(det);
  });
}

async function loadScalesFromApi(){
  const res = await fetch(SCALE_API_URL + "?action=list");
  const data = await res.json();
  SCALES = data.scales || {};
}

document.addEventListener('DOMContentLoaded', async ()=>{
  buildRootSelector();
  renderPiano();

  try {
    await loadScalesFromApi();
  } catch(e){
    console.error("Klarte ikke å laste skalaer fra API", e);
  }

  // Sjekk bare at vi faktisk har noen skalaer
  if (!SCALES || !Object.keys(SCALES).length) {
    alert("Klarte ikke å laste skala-definisjoner fra serveren.");
    return;
  }

  // Bygg menyen nå som SCALES er på plass
  buildScaleMenu();

  // Ingen skala valgt ennå → label: "Velg skalatype"
  updateScaleToggleLabel();


clearHighlights(); // 👈 LEGG TIL DENNE


  // Viktig: IKKE kall updateScale() her.
  // Keyboardet skal være tomt til bruker velger en skala.
});

function clearKeyboardHighlights(){
  document.querySelectorAll('.white,.black').forEach(el=>{
    el.classList.remove('active','bass');
    const mark = el.querySelector('.mark');
    if (mark) mark.remove();
  });
}

  const rootSel=document.getElementById('root');
  const sharpBtn=document.getElementById('sharpBtn');
  const flatBtn=document.getElementById('flatBtn');
  const playBtn=document.getElementById('playScale');
  const clearBtn=document.getElementById('clear');
  const showAll=document.getElementById('showAll');
  const toggle=document.getElementById('scaleToggle');
  const menu=document.getElementById('scaleMenu');
  const picker=document.getElementById('scalePicker');

  rootSel.addEventListener('change', updateScale);

  if(sharpBtn && flatBtn){
    sharpBtn.addEventListener('click',()=>{
      accPref='sharp';
      sharpBtn.classList.add('acc-active');
      flatBtn.classList.remove('acc-active');
      updateScale();
    });
    flatBtn.addEventListener('click',()=>{
      accPref='flat';
      flatBtn.classList.add('acc-active');
      sharpBtn.classList.remove('acc-active');
      updateScale();
    });
  }

  if(showAll) showAll.addEventListener('change', highlightCurrentScale);
  if(playBtn) playBtn.addEventListener('click', playCurrentScale);
  if(clearBtn) clearBtn.addEventListener('click', clearHighlights);

  if(toggle){
    toggle.addEventListener('click', (e)=>{
      e.stopPropagation();
      menu.classList.toggle('open');
    });
  }
  document.addEventListener('click', (e)=>{
    if(!picker.contains(e.target)){
      menu.classList.remove('open');
    }
  });



/* ===== Embedded scale demos (merged from former scale-embed.js) =====
   - Runs only if .scale-demo exists on the page
   - Uses SCALE_API_URL + existing ping()/AC
*/
function initScaleEmbeds(){
  const demos = document.querySelectorAll('.scale-demo');
  if(!demos.length) return;

  // Minimal scoped styling (only for embeds)
  if(!document.getElementById('scale-embed-styles')){
    const css = `
      .scale-demo{margin:12px 0;padding:8px;border-radius:10px;
        background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);
        max-width:260px;font-family:system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;}
      .scale-demo-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;}
      .scale-demo-label{font-size:13px;color:#e8eeff;}
      .scale-demo-meta{font-size:11px;color:#9fb1cf;}
      .scale-demo button.play-scale{font-size:12px;padding:4px 8px;border-radius:8px;
        border:1px solid rgba(255,255,255,0.10);cursor:pointer;
        background:rgba(255,255,255,0.06);color:#e8eeff;font-weight:600;}
      .scale-demo button.play-scale:active{transform:translateY(1px);}
      .se-keyboard{position:relative;width:210px;height:70px;margin-top:6px;}
      .se-whites{display:flex;height:70px;}
      .se-white{flex:1 0 auto;position:relative;background:#fff;border:1px solid #cfd5e6;
        box-sizing:border-box;border-bottom-left-radius:4px;border-bottom-right-radius:4px;}
      .se-white-label{position:absolute;bottom:3px;left:0;right:0;font-size:9px;color:#111;text-align:center;}
      .se-blacks{position:absolute;inset:0;pointer-events:none;}
      .se-black{position:absolute;top:0;width:18px;height:42px;background:#111;border:1px solid #222;
        border-bottom-left-radius:4px;border-bottom-right-radius:4px;pointer-events:auto;
        box-shadow:inset 0 -4px 0 rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.10);}
      .se-white.active{background:linear-gradient(135deg,var(--gradA),var(--gradB),var(--gradC));
        box-shadow:0 0 12px rgba(178,139,255,0.40);}
      .se-black.active{background:linear-gradient(135deg,var(--gradB),var(--gradC));}
      .se-note-dot{position:absolute;top:4px;left:50%;transform:translateX(-50%);
        background:rgba(0,0,0,0.78);color:#fff;font-size:9px;padding:1px 4px;border-radius:999px;}
    `;
    const style = document.createElement('style');
    style.id='scale-embed-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  // Mini keyboard helpers
  const WHITE_PCS_EMB = [0,2,4,5,7,9,11];
  const BLACK_AFTER_EMB = {0:1,2:3,4:null,5:6,7:8,9:10,11:null};
  const N_SHARP_EMB = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

  function buildMiniKeyboard(container, octave, activePcs){
    container.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'se-keyboard';
    const whites = document.createElement('div');
    whites.className = 'se-whites';
    const blacks = document.createElement('div');
    blacks.className = 'se-blacks';

    const whiteWidth = 210 / 7;
    const blackWidth = 18;

    WHITE_PCS_EMB.forEach((pc, idx)=>{
      const w=document.createElement('div');
      w.className='se-white';
      const label=document.createElement('div');
      label.className='se-white-label';
      label.textContent = N_SHARP_EMB[pc] + octave;
      w.appendChild(label);

      if(activePcs.has(pc)){
        w.classList.add('active');
        const dot=document.createElement('div');
        dot.className='se-note-dot';
        dot.textContent='●';
        w.appendChild(dot);
      }
      whites.appendChild(w);

      const bpc = BLACK_AFTER_EMB[pc];
      if(bpc!==null && bpc!==undefined){
        const b=document.createElement('div');
        b.className='se-black';
        b.style.left = ((idx+1)*whiteWidth - (blackWidth/2)) + 'px';
        if(activePcs.has(bpc)) b.classList.add('active');
        blacks.appendChild(b);
      }
    });

    wrap.appendChild(whites);
    wrap.appendChild(blacks);
    container.appendChild(wrap);
  }

  for(const box of demos){
    const root  = (box.dataset.root || 'C').toUpperCase();
    const scale = (box.dataset.scale || 'major');
    const oct   = (box.dataset.oct || '4');
    const label = (box.dataset.label || '');

    // Build DOM (only if empty to avoid duplicating if called twice)
    if(!box.dataset.built){
      const header=document.createElement('div');
      header.className='scale-demo-header';

      const labelEl=document.createElement('div');
      labelEl.className='scale-demo-label';
      labelEl.textContent = label || `${root} ${scale}`;

      const btn=document.createElement('button');
      btn.type='button';
      btn.className='play-scale';
      btn.textContent='Spill skala';

      header.appendChild(labelEl);
      header.appendChild(btn);

      const keyboardHost=document.createElement('div');
      keyboardHost.className='se-kb-host';

      const metaEl=document.createElement('div');
      metaEl.className='scale-demo-meta';

      box.appendChild(header);
      box.appendChild(keyboardHost);
      box.appendChild(metaEl);

      box._se = { btn, keyboardHost, metaEl, notes:null };
      box.dataset.built='1';

      async function loadScale(){
        const url = `${SCALE_API_URL}?root=${encodeURIComponent(root)}&scale=${encodeURIComponent(scale)}&oct=${encodeURIComponent(oct)}`;
        const res = await fetch(url);
        const data = await res.json();
        if(data.error){
          metaEl.textContent = data.error;
          return null;
        }
        const notes = data.notes || [];
        metaEl.textContent = `${data.scaleName} • oktav ${data.octave}`;
        const pcs = new Set(notes.map(n => ((n.midi % 12) + 12) % 12));
        buildMiniKeyboard(keyboardHost, parseInt(oct,10), pcs);
        return notes;
      }

      btn.addEventListener('click', async ()=>{
        if(!box._se.notes){
          box._se.notes = await loadScale();
        }
        if(!box._se.notes || !box._se.notes.length) return;
        let t=0;
        const step=0.25;
        box._se.notes.forEach(n=>{ ping(n.midi, t); t += step; });
      });

      // Preload quietly (but don't throw console noise)
      loadScale().then(n=>{ box._se.notes = n; }).catch(()=>{});
    }
  }
}

