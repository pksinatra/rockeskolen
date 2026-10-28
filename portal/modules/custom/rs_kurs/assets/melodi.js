/* Melodi: tonenavn, lyd, klaviatur og melodikurver som leksjonene deler.
 * Alle melodiene ligger i C-dur, så tonene er de hvite tangentene. */
(function(K){
  const NAMES=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
  const nm=m=>NAMES[((m%12)+12)%12];
  const isBlack=m=>[1,3,6,8,10].includes(((m%12)+12)%12);
  // Bokstavtrinn i C-dur (hvite tangenter): C=0, D=1 … B=6, pluss oktaver.
  const WHITE=[0,2,4,5,7,9,11];
  const degree=m=>{ const pc=((m%12)+12)%12, k=WHITE.indexOf(pc); return k<0?null:k+7*Math.floor(m/12); };

  /* ---------- lyd ---------- */
  let out=null;
  function master(c){
    if(!out){ const comp=c.createDynamicsCompressor(); comp.threshold.value=-14; out=c.createGain(); out.gain.value=0.65; out.connect(comp); comp.connect(c.destination); }
    return out;
  }
  function tone(m,delay=0,dur=0.6,vol=0.3){
    const c=K.ac(); if(!c) return;
    const t=c.currentTime+0.03+delay, f=440*Math.pow(2,(m-69)/12);
    const g=c.createGain(); g.connect(master(c));
    g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(vol,t+0.015);
    g.gain.exponentialRampToValueAtTime(0.0008,t+dur);
    [['triangle',1,1],['sine',2,0.2],['sine',3,0.06]].forEach(([type,mult,v])=>{
      const o=c.createOscillator(), og=c.createGain();
      o.type=type; o.frequency.value=f*mult; og.gain.value=v;
      o.connect(og).connect(g); o.start(t); o.stop(t+dur+0.05);
    });
  }
  let timers=[];
  function stop(){ timers.forEach(clearTimeout); timers=[]; }
  // Spiller en melodi. Siste tone holdes lenger. opts.chord spiller C-dur først som tonal ramme.
  function playMelody(ms,opts={}){
    stop();
    const gap=opts.gap||0.38; let t0=0;
    if(opts.chord){ [48,60,64,67].forEach(m=>tone(m,0,1.1,0.16)); t0=1.3; }
    ms.forEach((m,k)=>{
      const last=k===ms.length-1;
      tone(m,t0+k*gap,last?1.2:gap*1.1);
      timers.push(setTimeout(()=>opts.onStep&&opts.onStep(m,k),(t0+k*gap)*1000));
    });
    const end=(t0+ms.length*gap+0.9)*1000;
    timers.push(setTimeout(()=>opts.onEnd&&opts.onEnd(),end));
    return end;
  }

  /* ---------- klaviatur ---------- */
  function keyboard(lo,hi,onPress){
    const wrap=document.createElement('div'); wrap.className='kb-wrap';
    const kb=document.createElement('div'); kb.className='kb';
    const keys={}; let wi=0;
    for(let m=lo;m<=hi;m++){
      const b=document.createElement('button'); b.type='button';
      b.className='key '+(isBlack(m)?'b':'w');
      b.setAttribute('aria-label',nm(m));
      if(isBlack(m)) b.style.setProperty('--i',wi-1);
      else { b.textContent=nm(m); wi++; }
      b.addEventListener('pointerdown',e=>{e.preventDefault(); press(m);});
      b.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault(); press(m);}});
      keys[m]=b; kb.appendChild(b);
    }
    kb.style.setProperty('--n',wi);
    wrap.appendChild(kb);
    function press(m){ tone(m,0,0.6); flash(m,'on',220); onPress&&onPress(m); }
    function flash(m,cls,ms){ const k=keys[m]; if(!k) return; k.classList.add(cls); setTimeout(()=>k.classList.remove(cls),ms); }
    return {
      el:wrap, flash,
      set(m,cls,on=true){ keys[m]&&keys[m].classList.toggle(cls,on); },
      clear(cls){ Object.values(keys).forEach(k=>k.classList.remove(cls)); }
    };
  }

  /* ---------- melodikurve ---------- */
  // signs: liste med +1 (opp) og -1 (ned). Tegnes med like store steg, så bare retningen avgjør.
  const NS='http://www.w3.org/2000/svg';
  function contourSvg(signs,label){
    const W=200, H=90, pad=14, n=signs.length+1;
    const ys=[0]; signs.forEach(s=>ys.push(ys[ys.length-1]+s));
    const lo=Math.min(...ys), hi=Math.max(...ys), span=Math.max(1,hi-lo);
    const pts=ys.map((y,k)=>[pad+k*(W-2*pad)/(n-1),H-pad-(y-lo)*(H-2*pad)/span]);
    const svg=document.createElementNS(NS,'svg');
    svg.setAttribute('viewBox',`0 0 ${W} ${H}`); svg.setAttribute('class','contour'); svg.setAttribute('role','img'); svg.setAttribute('aria-label',label);
    const pl=document.createElementNS(NS,'polyline'); pl.setAttribute('points',pts.map(p=>p.join(',')).join(' '));
    svg.append(pl);
    pts.forEach(([x,y])=>{ const c=document.createElementNS(NS,'circle'); c.setAttribute('cx',x); c.setAttribute('cy',y); c.setAttribute('r',6); svg.append(c); });
    return svg;
  }
  const signsOf=ms=>ms.slice(1).map((m,k)=>m>ms[k]?1:-1);
  const contourLabel=signs=>signs.map(s=>s>0?'opp':'ned').join(', ');

  K.onLeave(stop);
  K.mel={nm,degree,tone,playMelody,stop,keyboard,contourSvg,signsOf,contourLabel};
})(RSKurs);
