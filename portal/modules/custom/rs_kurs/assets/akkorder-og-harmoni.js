/* Akkorder og harmoni: stavede treklanger, akkordnavn, durskalaer, lyd og klaviatur som leksjonene deler.
 * Treklangene bygges som terser over en stavet grunntone, slik at for eksempel D-dur blir D – F♯ – A
 * og B♭-dur blir B♭ – D – F. Akkordnavn skrives med vanlig #/b (Bb, F#m), enkelttoner med ♯/♭. */
(function(K){
  const LETTERS='CDEFGAB';
  const PC={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
  const PERFECT={1:0,4:5,5:7,8:12};
  const MAJOR={2:2,3:4,6:9,7:11};
  const isBlack=m=>[1,3,6,8,10].includes(((m%12)+12)%12);

  // «Eb4» → {letter,acc,oct,li,midi}. b = ♭, # = ♯.
  function note(s){
    const r=/^([A-G])(bb|b|##|#)?(\d)$/.exec(s);
    const acc={bb:-2,b:-1,'#':1,'##':2}[r[2]||'']||0;
    const oct=Number(r[3]);
    return {letter:r[1],acc,oct,li:LETTERS.indexOf(r[1])+7*oct,midi:12*(oct+1)+PC[r[1]]+acc};
  }
  const name=n=>n.letter+({'-2':'𝄫','-1':'♭',1:'♯',2:'𝄪'}[n.acc]||'');
  const names=ns=>ns.map(name).join(' – ');

  // Tonen som ligger et gitt intervall over en stavet tone.
  function above(lo,number,q){
    const li=lo.li+number-1, letter=LETTERS[li%7], oct=Math.floor(li/7);
    const semis=(number in PERFECT?PERFECT[number]:MAJOR[number])+({P:0,M:0,m:-1,A:1,d:number in PERFECT?-1:-2}[q]);
    const midi=lo.midi+semis, acc=midi-(12*(oct+1)+PC[letter]);
    return {letter,acc,oct,li,midi};
  }

  /* ---------- treklanger ---------- */
  const QUAL={
    maj:{label:'dur',suffix:'',third:'M',fifth:'P',thirds:'stor ters + liten ters'},
    min:{label:'moll',suffix:'m',third:'m',fifth:'P',thirds:'liten ters + stor ters'},
    dim:{label:'forminsket',suffix:'dim',third:'m',fifth:'d',thirds:'liten ters + liten ters'},
    aug:{label:'forstørret',suffix:'aug',third:'M',fifth:'A',thirds:'stor ters + stor ters'}
  };
  const triad=(root,q)=>[root,above(root,3,QUAL[q].third),above(root,5,QUAL[q].fifth)];
  // Akkordnavn: Bb, F#m, Bdim.
  const chordName=(root,q)=>root.letter+({'-1':'b',1:'#'}[root.acc]||'')+QUAL[q].suffix;
  // Kvaliteten ut fra halvtonene over grunntonen.
  function quality(ns){
    const t=ns[1].midi-ns[0].midi, f=ns[2].midi-ns[0].midi;
    return {'4,7':'maj','3,7':'min','3,6':'dim','4,8':'aug'}[t+','+f]||null;
  }

  /* ---------- durskalaen ---------- */
  const STEPS=[[1,'P'],[2,'M'],[3,'M'],[4,'P'],[5,'P'],[6,'M'],[7,'M']];
  const DEGREE_Q=['maj','min','min','maj','maj','min','dim'];
  const ROMAN=['I','ii','iii','IV','V','vi','vii°'];
  // Tonearter skrives som akkordnavn: Bb-dur, F#-dur.
  const keyName=tonic=>chordName(tonic,'maj')+'-dur';
  function scale(tonic){ return STEPS.map(([n,q])=>above(tonic,n,q)); }
  // Treklangen på trinn d (1–7), bygd med skalaens egne toner.
  function degreeChord(tonic,d){
    const sc=scale(tonic).concat(scale(above(tonic,8,'P')));
    const ns=[sc[d-1],sc[d+1],sc[d+3]];
    return {notes:ns,q:DEGREE_Q[d-1],roman:ROMAN[d-1],name:chordName(ns[0],DEGREE_Q[d-1])};
  }

  /* ---------- lyd ---------- */
  const ac=K.ac;
  let out=null;
  function master(c){
    if(!out){ const comp=c.createDynamicsCompressor(); comp.threshold.value=-14; out=c.createGain(); out.gain.value=0.6; out.connect(comp); comp.connect(c.destination); }
    return out;
  }
  function tone(m,delay=0,dur=0.9){
    const c=ac(); if(!c) return;
    const t=c.currentTime+0.03+delay, f=440*Math.pow(2,(m-69)/12);
    const g=c.createGain(); g.connect(master(c));
    g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(0.26,t+0.02);
    g.gain.exponentialRampToValueAtTime(0.0008,t+dur);
    [['triangle',1,1],['sine',2,0.18],['sine',3,0.05]].forEach(([type,mult,vol])=>{
      const o=c.createOscillator(), og=c.createGain();
      o.type=type; o.frequency.value=f*mult; og.gain.value=vol;
      o.connect(og).connect(g); o.start(t); o.stop(t+dur+0.05);
    });
  }
  let timers=[];
  function stop(){ timers.forEach(clearTimeout); timers=[]; }
  // Spiller tonene én og én og så samlet. ms er MIDI-tall. onStep(midi[]) markerer tangentene.
  function playChord(ms,onStep){
    stop();
    ms.forEach((m,k)=>{ tone(m,k*0.45,0.7); timers.push(setTimeout(()=>onStep&&onStep([m]),k*450)); });
    const at=ms.length*0.45+0.2;
    ms.forEach(m=>tone(m,at,1.5));
    timers.push(setTimeout(()=>onStep&&onStep(ms),at*1000));
  }
  // Legger akkorden innenfor klaviaturet.
  function fit(ms,lo=60,hi=83){ let r=ms.slice(); while(Math.max(...r)>hi&&Math.min(...r)-12>=lo) r=r.map(m=>m-12); return r; }

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
  K.ak={note,name,names,above,triad,chordName,quality,QUAL,keyName,scale,degreeChord,tone,playChord,fit,stop,keyboard};
})(RSKurs);
