/* Låtskriving: akkorder i C-dur, lyd og loop som leksjonene deler. */
(function(K){
  // Trinnakkordene i C-dur (vii° er utelatt, den brukes sjelden i pop).
  const CHORDS={
    C:{roman:'I',notes:['C','E','G'],ms:[48,60,64,67]},
    Dm:{roman:'ii',notes:['D','F','A'],ms:[50,62,65,69]},
    Em:{roman:'iii',notes:['E','G','B'],ms:[52,64,67,71]},
    F:{roman:'IV',notes:['F','A','C'],ms:[53,60,65,69]},
    G:{roman:'V',notes:['G','B','D'],ms:[55,62,67,71]},
    Am:{roman:'vi',notes:['A','C','E'],ms:[57,60,64,69]}
  };
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
  function chord(name,when,dur){ CHORDS[name].ms.forEach((m,k)=>tone(m,when,dur,k?0.1:0.16,'sine')); }
  let timers=[];
  function stop(){ timers.forEach(clearTimeout); timers=[]; if(out){ out.disconnect(); out=null; } }
  const at=(sec,fn)=>timers.push(setTimeout(fn,(sec+0.05)*1000));
  /** Spiller akkordene som en loop, times ganger. onChord(k) markerer akkorden. */
  function playLoop(names,bpm,times,onChord,onEnd){
    stop(); const bar=4*60/bpm;
    for(let r=0;r<times;r++) names.forEach((n,k)=>{ const t=(r*names.length+k)*bar; chord(n,t,bar*0.95); if(onChord) at(t,()=>onChord(k)); });
    const end=times*names.length*bar;
    at(end,()=>onEnd&&onEnd());
  }
  function playNotes(ms,gap){ stop(); ms.forEach((m,k)=>tone(m,k*gap,gap*0.95,0.3)); }
  K.onLeave(stop);
  K.ls={CHORDS,chord,tone,playLoop,playNotes,stop};
})(RSKurs);
