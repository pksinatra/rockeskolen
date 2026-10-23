/* Musikkteori fra bunnen: tonenavn, lyd og klaviatur som leksjonene deler. */
(function(K){
  const NAMES=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
  const nm=m=>NAMES[m%12];
  const isBlack=m=>[1,3,6,8,10].includes(m%12);
  const MAJOR=[0,2,4,5,7,9,11,12];

  /* ---------- lyd ---------- */
  const ac=K.ac;
  function tone(m,delay=0,dur=0.7){
    const c=ac(); if(!c) return;
    const t=c.currentTime+delay, f=440*Math.pow(2,(m-69)/12);
    const g=c.createGain(); g.connect(c.destination);
    g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(0.32,t+0.012);
    g.gain.exponentialRampToValueAtTime(0.0008,t+dur);
    [[ 'triangle',1,1],['sine',2,0.18],['sine',3,0.06]].forEach(([type,mult,vol])=>{
      const o=c.createOscillator(), og=c.createGain();
      o.type=type; o.frequency.value=f*mult; og.gain.value=vol;
      o.connect(og).connect(g); o.start(t); o.stop(t+dur+0.05);
    });
  }
  let seqTimers=[];
  function stopSeq(){seqTimers.forEach(clearTimeout); seqTimers=[];}
  function playSeq(ms,gap,onStep,onEnd){
    stopSeq();
    ms.forEach((m,i)=>{
      tone(m,i*gap,0.65);
      seqTimers.push(setTimeout(()=>onStep&&onStep(m,i),i*gap*1000));
    });
    seqTimers.push(setTimeout(()=>onEnd&&onEnd(),ms.length*gap*1000+150));
  }

  /* ---------- klaviatur ---------- */
  function keyboard(lo,hi,onPress,opts={}){
    const wrap=document.createElement('div'); wrap.className='kb-wrap';
    const kb=document.createElement('div'); kb.className='kb';
    const keys={}; let wi=0;
    for(let m=lo;m<=hi;m++){
      const b=document.createElement('button'); b.type='button';
      b.className='key '+(isBlack(m)?'b':'w');
      b.setAttribute('aria-label',nm(m));
      if(isBlack(m)){ b.style.setProperty('--i',wi-1); }
      else { b.textContent=opts.labels===false?'':nm(m); wi++; }
      b.addEventListener('pointerdown',e=>{e.preventDefault(); press(m);});
      b.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault(); press(m);}});
      keys[m]=b; kb.appendChild(b);
    }
    kb.style.setProperty('--n',wi);
    wrap.appendChild(kb);
    function press(m){ tone(m); flash(m,'on',220); onPress&&onPress(m); }
    function flash(m,cls,ms){ const k=keys[m]; if(!k) return; k.classList.add(cls); setTimeout(()=>k.classList.remove(cls),ms); }
    return {
      el:wrap, flash,
      set(m,cls,on=true){ keys[m]&&keys[m].classList.toggle(cls,on); },
      clear(cls){ Object.values(keys).forEach(k=>k.classList.remove(cls)); }
    };
  }

  K.onLeave(stopSeq);
  K.teori={NAMES,nm,isBlack,MAJOR,tone,playSeq,stopSeq,keyboard};
})(RSKurs);
