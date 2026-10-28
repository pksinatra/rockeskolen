/* Musikkproduksjon: trommemaskin, EQ-lyd og panorering som leksjonene deler. Alt er syntetisert i nettleseren. */
(function(K){
  let out=null;
  function master(c){
    if(!out){ const comp=c.createDynamicsCompressor(); comp.threshold.value=-12; out=c.createGain(); out.gain.value=0.7; out.connect(comp); comp.connect(c.destination); }
    return out;
  }
  let noiseBuf=null;
  function noise(c){
    if(!noiseBuf){ noiseBuf=c.createBuffer(1,c.sampleRate,c.sampleRate); const d=noiseBuf.getChannelData(0); for(let k=0;k<d.length;k++) d[k]=Math.random()*2-1; }
    const s=c.createBufferSource(); s.buffer=noiseBuf; return s;
  }
  // Sender en lyd gjennom valgfri panorering til utgangen.
  function dest(c,pan=0){ if(!pan||!c.createStereoPanner) return master(c); const p=c.createStereoPanner(); p.pan.value=pan; p.connect(master(c)); return p; }

  /* ---------- trommer ---------- */
  function kick(t,pan=0){
    const c=K.ac(); if(!c) return;
    const o=c.createOscillator(), g=c.createGain(); o.connect(g); g.connect(dest(c,pan));
    o.frequency.setValueAtTime(150,t); o.frequency.exponentialRampToValueAtTime(45,t+0.12);
    g.gain.setValueAtTime(0.9,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.35);
    o.start(t); o.stop(t+0.36);
  }
  function snare(t,pan=0){
    const c=K.ac(); if(!c) return;
    const n=noise(c), f=c.createBiquadFilter(), g=c.createGain();
    f.type='highpass'; f.frequency.value=1200; n.connect(f); f.connect(g); g.connect(dest(c,pan));
    g.gain.setValueAtTime(0.5,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.18);
    n.start(t); n.stop(t+0.2);
    const o=c.createOscillator(), og=c.createGain(); o.frequency.value=190; o.connect(og); og.connect(dest(c,pan));
    og.gain.setValueAtTime(0.3,t); og.gain.exponentialRampToValueAtTime(0.001,t+0.1); o.start(t); o.stop(t+0.11);
  }
  function hat(t,pan=0){
    const c=K.ac(); if(!c) return;
    const n=noise(c), f=c.createBiquadFilter(), g=c.createGain();
    f.type='highpass'; f.frequency.value=7000; n.connect(f); f.connect(g); g.connect(dest(c,pan));
    g.gain.setValueAtTime(0.18,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.05);
    n.start(t); n.stop(t+0.06);
  }
  const DRUMS={kick,snare,hat};

  /* ---------- trommemaskin ---------- */
  let loop=null, timers=[];
  function stop(){
    if(loop){ clearInterval(loop); loop=null; }
    timers.forEach(clearTimeout); timers=[];
    if(out){ out.disconnect(); out=null; }
  }
  /** Spiller grid ({kick:[16],snare:[16],hat:[16]}) i loop til stop(). onStep(k) markerer steget. */
  function runGrid(grid,bpm,onStep){
    stop(); const c=K.ac(); if(!c) return;
    const sixteenth=60/bpm/4; let next=c.currentTime+0.1, step=0;
    function schedule(){
      while(next<c.currentTime+0.2){
        const s=step%16, when=next;
        Object.keys(DRUMS).forEach(d=>{ if(grid()[d][s]) DRUMS[d](when); });
        if(onStep) timers.push(setTimeout(()=>onStep(s),Math.max(0,(when-c.currentTime)*1000)));
        next+=sixteenth; step++;
      }
    }
    schedule(); loop=setInterval(schedule,40);
  }

  /* ---------- EQ ---------- */
  // En fyldig akkord i sagtann med valgfri forsterkning av ett frekvensområde (+12 dB).
  const BANDS={bass:{f:100,label:'Bass'},mid:{f:1000,label:'Mellomtone'},treble:{f:6000,label:'Diskant'}};
  function eqSound(band,dur=2.2){
    stop(); const c=K.ac(); if(!c) return;
    const t=c.currentTime+0.05;
    const eq=c.createBiquadFilter(); eq.type='peaking'; eq.Q.value=1.1;
    eq.frequency.value=band?BANDS[band].f:1000; eq.gain.value=band?12:0;
    const g=c.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.12,t+0.05); g.gain.setValueAtTime(0.12,t+dur-0.3); g.gain.exponentialRampToValueAtTime(0.0008,t+dur);
    eq.connect(g); g.connect(master(c));
    [36,48,55,60,64,67,72].forEach(m=>{ const o=c.createOscillator(); o.type='sawtooth'; o.frequency.value=440*Math.pow(2,(m-69)/12); o.connect(eq); o.start(t); o.stop(t+dur); });
    const n=noise(c), ng=c.createGain(); ng.gain.value=0.15; n.connect(ng); ng.connect(eq); n.start(t); n.stop(t+dur);
  }

  /* ---------- miks ---------- */
  // Kort miks der hvert instrument kan panoreres: pans = {kick, bass, vokal, gitar1, gitar2} fra -1 til 1.
  function playMix(pans,bpm=100){
    stop(); const c=K.ac(); if(!c) return;
    const beat=60/bpm, t0=c.currentTime+0.1;
    const synth=(m,t,dur,type,vol,pan)=>{ const o=c.createOscillator(), g=c.createGain(); o.type=type; o.frequency.value=440*Math.pow(2,(m-69)/12); o.connect(g); g.connect(dest(c,pan)); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+0.02); g.gain.exponentialRampToValueAtTime(0.0008,t+dur); o.start(t); o.stop(t+dur+0.05); };
    for(let b=0;b<8;b++){
      const t=t0+b*beat;
      if(b%2===0) kick(t,pans.kick);
      synth([36,36,41,43][Math.floor(b/2)],t,beat*0.9,'triangle',0.35,pans.bass);
      synth([60,64,67,64,65,69,67,71][b],t,beat*0.8,'square',0.07,pans.gitar1);
      synth([67,72,76,72,72,77,74,79][b],t+beat/2,beat*0.45,'sawtooth',0.04,pans.gitar2);
      if(b%2===0) synth([72,74,76,74][b/2],t,beat*1.8,'sine',0.18,pans.vokal);
    }
  }

  K.onLeave(stop);
  K.prod={DRUMS,runGrid,stop,BANDS,eqSound,playMix};
})(RSKurs);
