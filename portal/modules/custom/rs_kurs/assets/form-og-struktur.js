/* Form og struktur: lyd, takter og fraser som leksjonene deler.
 * Frasene er egne, korte motiver i C-dur: to takter melodi over én akkord per takt. */
(function(K){
  /* ---------- lyd ---------- */
  let out=null;
  function master(c){
    if(!out){ const comp=c.createDynamicsCompressor(); comp.threshold.value=-14; out=c.createGain(); out.gain.value=0.6; out.connect(comp); comp.connect(c.destination); }
    return out;
  }
  function tone(m,when,dur,vol=0.26,type='triangle'){
    const c=K.ac(); if(!c) return;
    const t=c.currentTime+0.05+when, f=440*Math.pow(2,(m-69)/12);
    const g=c.createGain(); g.connect(master(c));
    g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(vol,t+0.015);
    g.gain.exponentialRampToValueAtTime(0.0008,t+dur);
    const o=c.createOscillator(); o.type=type; o.frequency.value=f; o.connect(g); o.start(t); o.stop(t+dur+0.05);
  }
  function click(when,accent){
    const c=K.ac(); if(!c) return;
    const t=c.currentTime+0.05+when, o=c.createOscillator(), g=c.createGain();
    o.type='square'; o.frequency.value=accent?1760:1100; o.connect(g); g.connect(master(c));
    g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(accent?0.12:0.05,t+0.002); g.gain.exponentialRampToValueAtTime(0.0005,t+0.05);
    o.start(t); o.stop(t+0.06);
  }
  const CHORDS={C:[48,60,64,67],Dm:[50,62,65,69],Em:[52,64,67,71],F:[53,60,65,69],G:[55,62,67,71],Am:[57,60,64,69]};
  function chord(name,when,dur){ CHORDS[name].forEach((m,k)=>tone(m,when,dur,k?0.09:0.14,'sine')); }

  // Fem ulike fraser. mel: åtte fjerdedeler (to takter), chords: én akkord per takt.
  const PHRASES=[
    {mel:[64,64,65,67,67,65,64,62],chords:['C','G']},
    {mel:[72,71,69,67,65,67,69,67],chords:['F','G']},
    {mel:[60,62,64,60,69,67,64,62],chords:['Am','Dm']},
    {mel:[67,69,71,72,71,69,67,67],chords:['Em','Am']},
    {mel:[65,64,62,60,62,64,62,60],chords:['Dm','C']}
  ];

  let timers=[];
  // Kobler fra utgangen, så også toner som allerede er planlagt, stilner.
  function stop(){ timers.forEach(clearTimeout); timers=[]; if(out){ out.disconnect(); out=null; } }
  const at=(sec,fn)=>timers.push(setTimeout(fn,(sec+0.05)*1000));

  /** Spiller n takter med akkorder og metronom. onBar(k) ved hver takt. */
  function playBars(n,bpm,onBar){
    stop(); const spb=60/bpm, loop=['C','G','Am','F'];
    for(let b=0;b<n;b++){
      const t=b*4*spb;
      chord(loop[b%4],t,4*spb*0.95);
      for(let k=0;k<4;k++) click(t+k*spb,k===0);
      if(onBar) at(t,()=>onBar(b));
    }
    return n*4*spb;
  }

  /** Spiller fraser etter hverandre. ids: indekser i PHRASES. onPart(k) ved hver frase. */
  function playPhrases(ids,bpm,onPart){
    stop(); const spb=60/bpm;
    ids.forEach((id,p)=>{
      const p0=p*8*spb, ph=PHRASES[id];
      ph.chords.forEach((c,b)=>chord(c,p0+b*4*spb,4*spb*0.95));
      ph.mel.forEach((m,k)=>tone(m,p0+k*spb,spb*0.9,0.28));
      if(onPart) at(p0,()=>onPart(p));
    });
    return ids.length*8*spb;
  }

  K.onLeave(stop);
  K.form={PHRASES,playBars,playPhrases,stop};
})(RSKurs);
