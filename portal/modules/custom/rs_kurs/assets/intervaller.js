/* Intervaller: stavede toner, intervallnavn, lyd og klaviatur som leksjonene deler.
 * Intervallet navngis ut fra bokstavtrinn og halvtoner, ikke bare antall halvtoner,
 * slik at for eksempel C–F♯ blir forstørret kvart og C–G♭ forminsket kvint. */
(function(K){
  const LETTERS='CDEFGAB';
  const PC={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
  const NUM={1:'prim',2:'sekund',3:'ters',4:'kvart',5:'kvint',6:'sekst',7:'septim',8:'oktav'};
  const QUAL={P:'ren',M:'stor',m:'liten',A:'forstørret',d:'forminsket'};
  const PERFECT={1:0,4:5,5:7,8:12};
  const MAJOR={2:2,3:4,6:9,7:11};
  const isBlack=m=>[1,3,6,8,10].includes(((m%12)+12)%12);

  // «Eb4» → {letter,acc,oct,midi}. b = ♭, # = ♯.
  function note(s){
    const r=/^([A-G])(bb|b|##|#)?(\d)$/.exec(s);
    const acc={bb:-2,b:-1,'#':1,'##':2}[r[2]||'']||0;
    const oct=Number(r[3]);
    return {letter:r[1],acc,oct,li:LETTERS.indexOf(r[1])+7*oct,midi:12*(oct+1)+PC[r[1]]+acc};
  }
  // Enkelttoner skrives med ♭/♯.
  const name=n=>n.letter+({'-2':'𝄫','-1':'♭',1:'♯',2:'𝄪'}[n.acc]||'');

  // Intervallet mellom to stavede toner (nederste først).
  function interval(lo,hi){
    const number=hi.li-lo.li+1, semis=hi.midi-lo.midi;
    let q=null;
    if(number in PERFECT) q={0:'P',1:'A','-1':'d'}[semis-PERFECT[number]];
    else if(number in MAJOR) q={0:'M','-1':'m',1:'A','-2':'d'}[semis-MAJOR[number]];
    return {number,semis,q,size:NUM[number],text:q?QUAL[q]+' '+NUM[number]:NUM[number]};
  }
  // Tonen som ligger et gitt intervall over en stavet tone.
  function above(lo,number,q){
    const li=lo.li+number-1, letter=LETTERS[li%7], oct=Math.floor(li/7);
    const semis=(number in PERFECT?PERFECT[number]:MAJOR[number])+({P:0,M:0,m:-1,A:1,d:number in PERFECT?-1:-2}[q]);
    const midi=lo.midi+semis, acc=midi-(12*(oct+1)+PC[letter]);
    return {letter,acc,oct,li,midi};
  }

  /* ---------- lyd ---------- */
  const ac=K.ac;
  let out=null;
  function master(c){
    if(!out){ const comp=c.createDynamicsCompressor(); comp.threshold.value=-14; out=c.createGain(); out.gain.value=0.7; out.connect(comp); comp.connect(c.destination); }
    return out;
  }
  function tone(m,delay=0,dur=0.9){
    const c=ac(); if(!c) return;
    const t=c.currentTime+0.03+delay, f=440*Math.pow(2,(m-69)/12);
    const g=c.createGain(); g.connect(master(c));
    g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(0.3,t+0.02);
    g.gain.exponentialRampToValueAtTime(0.0008,t+dur);
    [['triangle',1,1],['sine',2,0.18],['sine',3,0.05]].forEach(([type,mult,vol])=>{
      const o=c.createOscillator(), og=c.createGain();
      o.type=type; o.frequency.value=f*mult; og.gain.value=vol;
      o.connect(og).connect(g); o.start(t); o.stop(t+dur+0.05);
    });
  }
  let timers=[];
  function stop(){ timers.forEach(clearTimeout); timers=[]; }
  // Spiller to toner etter hverandre og så samtidig. onStep(midi) markerer tangentene.
  function playPair(lo,hi,onStep,harmonicToo=true){
    stop();
    tone(lo.midi,0,0.8); tone(hi.midi,0.7,0.8);
    timers.push(setTimeout(()=>onStep&&onStep([lo.midi]),0));
    timers.push(setTimeout(()=>onStep&&onStep([hi.midi]),700));
    if(harmonicToo){
      tone(lo.midi,1.6,1.3); tone(hi.midi,1.6,1.3);
      timers.push(setTimeout(()=>onStep&&onStep([lo.midi,hi.midi]),1600));
    }
  }

  /* ---------- klaviatur ---------- */
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
    function press(m){ tone(m,0,0.7); flash(m,'on',220); onPress&&onPress(m); }
    function flash(m,cls,ms){ const k=keys[m]; if(!k) return; k.classList.add(cls); setTimeout(()=>k.classList.remove(cls),ms); }
    return {
      el:wrap, flash,
      set(m,cls,on=true){ keys[m]&&keys[m].classList.toggle(cls,on); },
      clear(cls){ Object.values(keys).forEach(k=>k.classList.remove(cls)); },
      show(ms,cls='on',dur=650){ ms.forEach(m=>flash(m,cls,dur)); }
    };
  }

  K.onLeave(stop);
  K.int={note,name,interval,above,tone,playPair,stop,keyboard,NUM,QUAL};
})(RSKurs);
