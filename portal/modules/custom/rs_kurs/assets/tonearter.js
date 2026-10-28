/* Tonearter og kvintsirkelen: stavede skalaer, fortegn, kvintsirkel, lyd og klaviatur som leksjonene deler.
 * Fortegnene regnes ut fra den stavede durskalaen, så G-dur får F♯ og F-dur får B♭.
 * Tonearter skrives med vanlige tegn (Bb-dur, F#-moll), enkelttoner med ♭/♯. */
(function(K){
  const LETTERS='CDEFGAB';
  const PC={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
  const isBlack=m=>[1,3,6,8,10].includes(((m%12)+12)%12);

  function note(s){
    const r=/^([A-G])(bb|b|##|#)?(\d)$/.exec(s);
    const acc={bb:-2,b:-1,'#':1,'##':2}[r[2]||'']||0;
    const oct=Number(r[3]);
    return {letter:r[1],acc,oct,li:LETTERS.indexOf(r[1])+7*oct,midi:12*(oct+1)+PC[r[1]]+acc};
  }
  const name=n=>n.letter+({'-2':'𝄫','-1':'♭',1:'♯',2:'𝄪'}[n.acc]||'');
  const names=ns=>ns.map(name).join(' – ');
  // Tonen et visst antall bokstavtrinn og halvtoner over en stavet tone.
  function step(lo,letters,semis){
    const li=lo.li+letters, letter=LETTERS[li%7], oct=Math.floor(li/7), midi=lo.midi+semis;
    return {letter,acc:midi-(12*(oct+1)+PC[letter]),oct,li,midi};
  }
  const MAJOR=[0,2,4,5,7,9,11], MINOR=[0,2,3,5,7,8,10];
  const scale=(tonic,minor=false)=>(minor?MINOR:MAJOR).map((s,k)=>step(tonic,k,s));
  // Tonearter skrives som akkordnavn: Bb-dur, F#-moll.
  const plain=n=>n.letter+({'-1':'b',1:'#'}[n.acc]||'');
  const keyName=(tonic,minor=false)=>plain(tonic)+(minor?'-moll':'-dur');
  // Fortegnene i tonearten, i fast rekkefølge (F C G D A E B for kryss, B E A D G C F for b-er).
  function signature(tonic,minor=false){
    const acc=scale(tonic,minor).filter(n=>n.acc!==0);
    if(!acc.length) return [];
    const order=acc[0].acc>0?'FCGDAEB':'BEADGCF';
    return acc.slice().sort((a,b)=>order.indexOf(a.letter)-order.indexOf(b.letter));
  }
  const count=n=>['ingen','ett','to','tre','fire','fem','seks','sju'][n];
  function sigText(sig){
    if(!sig.length) return 'ingen fortegn';
    const sharp=sig[0].acc>0;
    return sig.length===1?(sharp?'ett kryss':'én b'):`${count(sig.length)} ${sharp?'kryss':'b-er'}`;
  }
  // Parallelltonearten i moll ligger på 6. trinn i durskalaen.
  const relativeMinor=tonic=>scale(tonic)[5];

  /* ---------- kvintsirkelen ---------- */
  // Dur ytterst, parallell moll innerst. Nederst møtes kryss og b-er (F#/Gb).
  const CIRCLE=[
    ['C','Am'],['G','Em'],['D','Bm'],['A','F#m'],['E','C#m'],['B','G#m'],
    ['F#/Gb','D#m/Ebm'],['Db','Bbm'],['Ab','Fm'],['Eb','Cm'],['Bb','Gm'],['F','Dm']
  ];
  const NS='http://www.w3.org/2000/svg';
  function el(tag,attrs,text){ const e=document.createElementNS(NS,tag); Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v)); if(text!=null) e.textContent=text; return e; }
  function circleSvg(onPick,opts={}){
    const S=320, c=S/2, R=150, r=96, r0=52;
    const svg=el('svg',{viewBox:`0 0 ${S} ${S}`,class:'circle5',role:'group','aria-label':'Kvintsirkelen'});
    const seg=[];
    CIRCLE.forEach(([maj,min],k)=>{
      const a0=(k-0.5)*Math.PI/6-Math.PI/2, a1=(k+0.5)*Math.PI/6-Math.PI/2;
      const p=(rad,a)=>`${c+rad*Math.cos(a)} ${c+rad*Math.sin(a)}`;
      const d=`M ${p(R,a0)} A ${R} ${R} 0 0 1 ${p(R,a1)} L ${p(r0,a1)} A ${r0} ${r0} 0 0 0 ${p(r0,a0)} Z`;
      const g=el('g',{class:'seg',tabindex:onPick?0:-1,role:onPick?'button':'img','aria-label':`${maj.replace('/','-dur/')}-dur og ${min.replace(/m/g,'-moll')}`});
      g.append(el('path',{d}));
      const am=k*Math.PI/6-Math.PI/2;
      const hide=opts.hideIndex&&opts.hideIndex.includes(k);
      g.append(el('text',{x:c+(R+r)/2*Math.cos(am),y:c+(R+r)/2*Math.sin(am)+5,class:'maj'},hide?'?':maj));
      if(!opts.hideMinor){
        // Doble navn (D#m/Ebm) på to linjer, så de får plass i den indre ringen.
        const parts=min.split('/'), x=c+(r+r0)/2*Math.cos(am), y=c+(r+r0)/2*Math.sin(am)+4-(parts.length-1)*6;
        const tx=el('text',{x,y,class:'min'});
        parts.forEach((part,j)=>tx.append(el('tspan',{x,dy:j?12:0},part)));
        g.append(tx);
      }
      if(onPick){
        g.addEventListener('click',()=>onPick(k,g));
        g.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); onPick(k,g); } });
      }
      seg.push(g); svg.append(g);
    });
    if(!opts.hideMinor) svg.append(el('circle',{cx:c,cy:c,r,class:'ring'}));
    svg.append(el('circle',{cx:c,cy:c,r:r0-1,class:'hub'}));
    svg.seg=seg;
    return svg;
  }

  /* ---------- lyd ---------- */
  let out=null;
  function master(c){
    if(!out){ const comp=c.createDynamicsCompressor(); comp.threshold.value=-14; out=c.createGain(); out.gain.value=0.6; out.connect(comp); comp.connect(c.destination); }
    return out;
  }
  function tone(m,delay=0,dur=0.8,vol=0.26){
    const c=K.ac(); if(!c) return;
    const t=c.currentTime+0.03+delay, f=440*Math.pow(2,(m-69)/12);
    const g=c.createGain(); g.connect(master(c));
    g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(vol,t+0.02);
    g.gain.exponentialRampToValueAtTime(0.0008,t+dur);
    [['triangle',1,1],['sine',2,0.18],['sine',3,0.05]].forEach(([type,mult,v])=>{
      const o=c.createOscillator(), og=c.createGain();
      o.type=type; o.frequency.value=f*mult; og.gain.value=v;
      o.connect(og).connect(g); o.start(t); o.stop(t+dur+0.05);
    });
  }
  let timers=[];
  function stop(){ timers.forEach(clearTimeout); timers=[]; }
  function playSeq(ms,gap,onStep){
    stop();
    ms.forEach((m,k)=>{ tone(m,k*gap,0.65); timers.push(setTimeout(()=>onStep&&onStep(m,k),k*gap*1000)); });
  }
  // Akkorder med grunntonen i bassen. chords: lister med stavede toner.
  function playChords(chords,sec,onStep){
    stop();
    chords.forEach((ns,k)=>{
      const pcs=ns.map(n=>((n.midi%12)+12)%12);
      [48+pcs[0],...pcs.map(p=>60+p)].forEach(m=>tone(m,k*sec,sec*0.95,0.2));
      timers.push(setTimeout(()=>onStep&&onStep(k),k*sec*1000));
    });
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
      clear(cls){ Object.values(keys).forEach(k=>k.classList.remove(cls)); }
    };
  }

  K.onLeave(stop);
  K.ta={note,name,names,step,scale,plain,keyName,signature,sigText,relativeMinor,CIRCLE,circleSvg,tone,playSeq,playChords,stop,keyboard};
})(RSKurs);
