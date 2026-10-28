/* Fortegn og andre tegn: tonenavn med fortegn, lyd og klaviatur som leksjonene deler. */
(function(K){
  const PC={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
  const ACC={'♯':1,'♭':-1,'':0};
  // «F♯» → tonetrinn 0–11.
  const pc=n=>((PC[n[0]]+(ACC[n.slice(1)]||0))%12+12)%12;
  const isBlack=m=>[1,3,6,8,10].includes(((m%12)+12)%12);
  // Begge navn på de svarte tangentene.
  const ENH={'C♯':'D♭','D♭':'C♯','D♯':'E♭','E♭':'D♯','F♯':'G♭','G♭':'F♯','G♯':'A♭','A♭':'G♯','A♯':'B♭','B♭':'A♯'};
  function tone(m){
    const c=K.ac(); if(!c) return;
    const t=c.currentTime+0.03, g=c.createGain(); g.connect(c.destination);
    g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.3,t+0.02); g.gain.exponentialRampToValueAtTime(0.0008,t+0.9);
    [['triangle',1,1],['sine',2,0.18]].forEach(([type,mult,v])=>{ const o=c.createOscillator(), og=c.createGain(); o.type=type; o.frequency.value=440*Math.pow(2,(m-69)/12)*mult; og.gain.value=v; o.connect(og).connect(g); o.start(t); o.stop(t+0.95); });
  }
  const KEYNAMES=['C','C♯/D♭','D','D♯/E♭','E','F','F♯/G♭','G','G♯/A♭','A','A♯/B♭','B'];
  function keyboard(lo,hi,onPress){
    const wrap=document.createElement('div'); wrap.className='kb-wrap';
    const kb=document.createElement('div'); kb.className='kb';
    const keys={}; let wi=0;
    for(let m=lo;m<=hi;m++){
      const b=document.createElement('button'); b.type='button';
      b.className='key '+(isBlack(m)?'b':'w');
      b.setAttribute('aria-label',KEYNAMES[m%12]);
      if(isBlack(m)) b.style.setProperty('--i',wi-1);
      else { b.textContent=KEYNAMES[m%12]; wi++; }
      b.addEventListener('pointerdown',e=>{e.preventDefault(); press(m);});
      b.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault(); press(m);}});
      keys[m]=b; kb.appendChild(b);
    }
    kb.style.setProperty('--n',wi);
    wrap.appendChild(kb);
    function press(m){ tone(m); flash(m,'on',220); onPress&&onPress(m); }
    function flash(m,cls,ms){ const k=keys[m]; if(!k) return; k.classList.add(cls); setTimeout(()=>k.classList.remove(cls),ms); }
    return {el:wrap,flash,set(m,cls,on=true){ keys[m]&&keys[m].classList.toggle(cls,on); },clear(cls){ Object.values(keys).forEach(k=>k.classList.remove(cls)); }};
  }
  K.ft={pc,ENH,tone,keyboard};
})(RSKurs);
