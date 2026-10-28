/* Frekvenser: toner med valgfri frekvens og bølgeform som leksjonene deler. */
(function(K){
  let out=null;
  function master(c){ if(!out){ out=c.createGain(); out.gain.value=0.5; out.connect(c.destination); } return out; }
  function stop(){ if(out){ out.disconnect(); out=null; } }
  // Spiller en tone på f Hz. type: sine (ingen overtoner), triangle, square eller sawtooth (mange overtoner).
  function hz(f,delay=0,dur=0.9,type='sine'){
    const c=K.ac(); if(!c) return;
    const t=c.currentTime+0.04+delay, o=c.createOscillator(), g=c.createGain();
    o.type=type; o.frequency.value=f; o.connect(g); g.connect(master(c));
    const v=type==='sine'?0.35:type==='triangle'?0.3:0.12;
    g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(v,t+0.03); g.gain.setValueAtTime(v,t+dur-0.1); g.gain.exponentialRampToValueAtTime(0.0008,t+dur);
    o.start(t); o.stop(t+dur+0.02);
  }
  function pair(f1,f2,type='sine'){ stop(); hz(f1,0,0.8,type); hz(f2,1.0,0.8,type); }
  K.onLeave(stop);
  K.fq={hz,pair,stop};
})(RSKurs);
