(function (Drupal, once) {

  // SETT DENNE RIKTIG (anbefaler B: lokal kopi i theme)
const SCALES_JSON_URL = "/modules/custom/scale_embed/data/scales.json";

  // evt: "https://www.chordlink.net/assets/data/scales.json";

  const N_SHARP = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  const N_FLAT  = ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];
  const mod = (n,m)=>((n%m)+m)%m;

  function rootToPc(r){
    const s = (r||"C").replace("♯","#").replace("♭","b");
    const map = {
      C:0,"B#":0,"C#":1,"DB":1,"D":2,"D#":3,"EB":3,
      E:4,"FB":4,"F":5,"E#":5,"F#":6,"GB":6,
      G:7,"G#":8,"AB":8,"A":9,"A#":10,"BB":10,"B":11,"CB":11
    };
    const k = s.length>1 ? (s[0].toUpperCase()+s[1].toUpperCase()) : s[0].toUpperCase();
    return map[k] ?? 0;
  }

  // Audio (shared)
  const AudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const midiToFreq = m => 440 * Math.pow(2,(m-69)/12);

  function playNote(m, t=0){
    const now = AudioCtx.currentTime + t;
    const o = AudioCtx.createOscillator();
    const g = AudioCtx.createGain();
    o.type="triangle";
    o.frequency.value=midiToFreq(m);
    o.connect(g); g.connect(AudioCtx.destination);
    g.gain.setValueAtTime(0,now);
    g.gain.linearRampToValueAtTime(0.25,now+0.02);
    g.gain.exponentialRampToValueAtTime(0.0008,now+0.7);
    o.start(now); o.stop(now+0.75);
  }

  async function loadScales(){
    const r = await fetch(SCALES_JSON_URL,{cache:"no-store"});
    if(!r.ok) throw new Error("Failed to load scales.json");
    const j = await r.json();
    return j.scales || j;
  }

  function initScaleEmbed(el){

    const rootStr  = el.dataset.root || "C";
    const scaleKey = el.dataset.scale || "major";
    const acc = (el.dataset.acc === "flat") ? "flat" : "sharp";
    const pcName = pc => (acc==="flat"?N_FLAT:N_SHARP)[pc];

    // Render base markup
    el.innerHTML = `
      <div class="cl-mini">
        <div class="cl-mini-top">
          <div class="cl-mini-title">Laster…</div>
          <button class="primary" type="button">Play</button>
        </div>
        <div class="piano"></div>
      </div>
    `;

    const titleEl = el.querySelector(".cl-mini-title");
    const playBtn = el.querySelector("button");
    const pianoEl = el.querySelector(".piano");

    // Helpers for key sizes (match CSS fallbacks)
    const whiteW = 34;
    const blackW = 21;

    const WHITE = [0,2,4,5,7,9,11];
    const BLACK_AFTER = {0:1,2:3,4:null,5:6,7:8,9:10,11:null};

    function renderOct(o){
      const wrap=document.createElement("div");
      wrap.className="oct";

      const whites=document.createElement("div");
      whites.className="whites";

      const blacks=document.createElement("div");
      blacks.className="blacks";

      WHITE.forEach((pc,i)=>{
        const k=document.createElement("div");
        k.className="white";
        k.dataset.m=(o+1)*12+pc;

        if(pc===0){
          const lab=document.createElement("div");
          lab.className="lab";
          lab.textContent="C"+o;
          k.appendChild(lab);
        }

        k.addEventListener("click",()=>playNote(+k.dataset.m,0));
        whites.appendChild(k);

        const bpc = BLACK_AFTER[pc];
        if(bpc!=null){
          const bk=document.createElement("div");
          bk.className="black";
          bk.dataset.m=(o+1)*12+bpc;
          bk.style.left = ((i+1)*whiteW - (blackW/2))+"px";
          bk.addEventListener("click",()=>playNote(+bk.dataset.m,0));
          blacks.appendChild(bk);
        }
      });

      wrap.append(whites,blacks);
      return wrap;
    }

    // Two octaves: C4..B5
    const row=document.createElement("div");
    row.style.display="flex";
    row.style.justifyContent="center";
    row.append(renderOct(4), renderOct(5));
    pianoEl.appendChild(row);

    // Load + highlight + play
    loadScales().then(scales=>{
      const scale = scales[scaleKey] || scales.major;
      const rootPc = rootToPc(rootStr);

      titleEl.textContent = pcName(rootPc) + " " + (scale.name || scaleKey);

      // Build midi set around C4 (60)
      const base = 60 + rootPc; // root near C4
      const mids = (scale.intervals || []).map(i=>base+i);
      mids.push(base+12);

      // Highlight
      el.querySelectorAll(".white,.black").forEach(k=>{
        const m = +k.dataset.m;
        if(mids.includes(m)){
          k.classList.add("active");
          const tag=document.createElement("div");
          tag.className="mark";
          tag.textContent = pcName(mod(m,12));
          k.appendChild(tag);
        }
      });

      // Play within C4..C6-ish
      playBtn.addEventListener("click", async ()=>{
        if(AudioCtx.state!=="running") await AudioCtx.resume();
        mids.filter(m=>m>=60 && m<=84).forEach((m,i)=>playNote(m,i*0.25));
      });

    }).catch(err=>{
      console.error(err);
      titleEl.textContent = "Kunne ikke laste scales.json";
    });
  }

  Drupal.behaviors.scaleEmbed = {
    attach(context){
      once('scale-embed', '.scale-embed', context).forEach(initScaleEmbed);
    }
  };

})(Drupal, once);
