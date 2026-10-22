(function () {

  const SCALES_JSON_URL = "https://www.chordlink.net/assets/data/scales.json";


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
    const k = s.length>1 ? s[0].toUpperCase()+s[1].toUpperCase() : s[0].toUpperCase();
    return map[k] ?? 0;
  }

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
    const j = await r.json();
    return j.scales || j;
  }

  function initScaleEmbed(el){

    const rootStr = el.dataset.root || "C";
    const scaleKey = el.dataset.scale || "major";
    const acc = el.dataset.acc === "flat" ? "flat" : "sharp";
    const pcName = pc => (acc==="flat"?N_FLAT:N_SHARP)[pc];

    el.innerHTML = `
      <div class="cl-mini">
        <div class="cl-mini-top">
          <div class="cl-mini-title"></div>
          <button class="primary">Play</button>
        </div>
        <div class="piano"></div>
      </div>
    `;

    const titleEl = el.querySelector(".cl-mini-title");
    const playBtn = el.querySelector("button");
    const pianoEl = el.querySelector(".piano");

    const WHITE = [0,2,4,5,7,9,11];
    const BLACK = {0:1,2:3,5:6,7:8,9:10};

    function renderOct(o){
      const d=document.createElement("div");
      d.className="oct";
      const w=document.createElement("div"); w.className="whites";
      const b=document.createElement("div"); b.className="blacks";

      WHITE.forEach((pc,i)=>{
        const k=document.createElement("div");
        k.className="white"; k.dataset.m=(o+1)*12+pc;
        if(pc===0) k.innerHTML=`<div class="lab">C${o}</div>`;
        k.onclick=()=>playNote(+k.dataset.m);
        w.appendChild(k);

        if(BLACK[pc]!=null){
          const bk=document.createElement("div");
          bk.className="black"; bk.dataset.m=(o+1)*12+BLACK[pc];
          bk.style.left=((i+1)*34-11)+"px";
          bk.onclick=()=>playNote(+bk.dataset.m);
          b.appendChild(bk);
        }
      });
      d.append(w,b); return d;
    }

    pianoEl.append(renderOct(4),renderOct(5));

    loadScales().then(scales=>{
      const scale = scales[scaleKey] || scales.major;
      const rootPc = rootToPc(rootStr);
      titleEl.textContent = pcName(rootPc)+" "+(scale.name||scaleKey);

      const mids=[];
      const base=60+rootPc;
      scale.intervals.forEach(i=>mids.push(base+i));
      mids.push(base+12);

      el.querySelectorAll(".white,.black").forEach(k=>{
        const m=+k.dataset.m;
        if(mids.includes(m)){
          k.classList.add("active");
          k.innerHTML+=`<div class="mark">${pcName(mod(m,12))}</div>`;
        }
      });

      playBtn.onclick=async()=>{
        if(AudioCtx.state!=="running") await AudioCtx.resume();
        mids.filter(m=>m>=60&&m<=84).forEach((m,i)=>playNote(m,i*0.25));
      };
    });
  }

  document.addEventListener("DOMContentLoaded",()=>{
    document.querySelectorAll(".scale-embed").forEach(initScaleEmbed);
  });

})();
