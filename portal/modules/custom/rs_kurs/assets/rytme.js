/* Rytme: lyd, metronom og rytmenotasjon som leksjonene deler. */
(function(K){
  // Notverdier i fjerdedeler. 'e' er to åttendeler med bjelke, til sammen ett slag.
  const VALUES={
    w:{beats:4,name:'Helnote'},
    h:{beats:2,name:'Halvnote'},
    q:{beats:1,name:'Fjerdedelsnote'},
    e:{beats:1,name:'To åttendeler'}
  };
  const beatsOf=tokens=>tokens.reduce((s,t)=>s+VALUES[t].beats,0);
  // Anslagstider i slag fra taktstart, med varighet.
  function onsets(tokens){
    const out=[]; let t=0;
    tokens.forEach(k=>{
      if(k==='e'){ out.push([t,0.5],[t+0.5,0.5]); t+=1; }
      else { out.push([t,VALUES[k].beats]); t+=VALUES[k].beats; }
    });
    return out;
  }

  /* ---------- lyd ---------- */
  function click(when,accent){
    const c=K.ac(); if(!c) return;
    const o=c.createOscillator(), g=c.createGain();
    o.type='square'; o.frequency.value=accent?1760:1100;
    o.connect(g); g.connect(c.destination);
    g.gain.setValueAtTime(0.0001,when);
    g.gain.exponentialRampToValueAtTime(accent?0.22:0.09,when+0.002);
    g.gain.exponentialRampToValueAtTime(0.0005,when+0.05);
    o.start(when); o.stop(when+0.06);
  }
  function drum(when,dur){
    const c=K.ac(); if(!c) return;
    const g=c.createGain(); g.connect(c.destination);
    g.gain.setValueAtTime(0.0001,when);
    g.gain.exponentialRampToValueAtTime(0.35,when+0.008);
    g.gain.exponentialRampToValueAtTime(0.12,when+0.08);
    g.gain.exponentialRampToValueAtTime(0.0008,when+Math.max(0.12,dur*0.92));
    [['triangle',392,1],['sine',784,0.25]].forEach(([type,f,vol])=>{
      const o=c.createOscillator(), og=c.createGain();
      o.type=type; o.frequency.value=f; og.gain.value=vol;
      o.connect(og).connect(g); o.start(when); o.stop(when+dur+0.05);
    });
  }

  /* ---------- avspilling ---------- */
  let timers=[], loop=null;
  function stop(){ timers.forEach(clearTimeout); timers=[]; if(loop){ clearInterval(loop); loop=null; } }
  // Kaller fn(i) omtrent når slag/anslag i høres.
  function at(c,when,fn){ timers.push(setTimeout(fn,Math.max(0,(when-c.currentTime)*1000))); }

  /**
   * Spiller bars takter med betoning på slag 1.
   */
  function playMeter(beatsPerBar,bars,bpm,onBeat,onEnd){
    stop(); const c=K.ac(); if(!c) return;
    const spb=60/bpm, t0=c.currentTime+0.12, n=beatsPerBar*bars;
    for(let i=0;i<n;i++){
      const when=t0+i*spb, b=i%beatsPerBar;
      click(when,b===0);
      if(onBeat) at(c,when,()=>onBeat(b,i));
    }
    at(c,t0+n*spb,()=>onEnd&&onEnd());
  }

  /**
   * Spiller fire innteller-slag og så én takt rytme, med svak metronom under.
   */
  function playRhythm(tokens,bpm,onNote,onEnd){
    stop(); const c=K.ac(); if(!c) return;
    const spb=60/bpm, t0=c.currentTime+0.12;
    for(let i=0;i<4;i++) click(t0+i*spb,i===0);
    const start=t0+4*spb;
    for(let i=0;i<4;i++) click(start+i*spb,i===0);
    onsets(tokens).forEach(([b,d],i)=>{
      drum(start+b*spb,d*spb);
      if(onNote) at(c,start+b*spb,()=>onNote(i));
    });
    at(c,start+4*spb,()=>onEnd&&onEnd());
  }

  /** Jevn metronom til stop(). onBeat(b, when) får lydtidspunktet. */
  function metronome(bpm,beatsPerBar,onBeat){
    stop(); const c=K.ac(); if(!c) return;
    const spb=60/bpm; let next=c.currentTime+0.15, i=0;
    function schedule(){
      while(next<c.currentTime+0.3){
        const b=i%beatsPerBar, when=next;
        click(when,b===0);
        if(onBeat) at(c,when,()=>onBeat(b,when));
        next+=spb; i++;
      }
    }
    schedule(); loop=setInterval(schedule,50);
  }

  /* ---------- notasjon ---------- */
  // Én takt på ettlinjesystem med 4/4-taktartsignatur. Avstand etter varighet.
  const NS='http://www.w3.org/2000/svg';
  function el(tag,attrs){ const e=document.createElementNS(NS,tag); Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v)); return e; }
  function rhythmSvg(tokens,opts={}){
    const W=opts.width||260, H=78, line=52, x0=40, x1=W-14, unit=(x1-x0-8)/4;
    const svg=el('svg',{viewBox:`0 0 ${W} ${H}`,class:'rhythm',role:'img','aria-label':opts.label||tokens.map(t=>VALUES[t].name.toLowerCase()).join(', ')});
    svg.append(el('line',{x1:6,y1:line,x2:x1,y2:line,class:'staff'}));
    [['4',line-6],['4',line+18]].forEach(([n,y])=>{ const t=el('text',{x:16,y,class:'ts'}); t.textContent=n; svg.append(t); });
    svg.append(el('line',{x1:x1,y1:line-14,x2:x1,y2:line+14,class:'bar'}));
    const notes=[];
    const head=(x,filled,whole)=>{
      const g=el('ellipse',{cx:x,cy:line,rx:whole?7.5:6.2,ry:whole?5:4.6,transform:whole?'':`rotate(-22 ${x} ${line})`,class:filled?'head filled':'head'});
      svg.append(g); return g;
    };
    const stem=(x)=>{ svg.append(el('line',{x1:x+5.6,y1:line-2,x2:x+5.6,y2:line-34,class:'stem'})); };
    let b=0;
    tokens.forEach(k=>{
      const x=x0+b*unit+8;
      if(k==='w'){ notes.push(head(x,false,true)); }
      else if(k==='h'){ notes.push(head(x,false)); stem(x); }
      else if(k==='q'){ notes.push(head(x,true)); stem(x); }
      else {
        const x2=x+unit/2;
        notes.push(head(x,true)); stem(x); notes.push(head(x2,true)); stem(x2);
        svg.append(el('rect',{x:x+5.6-0.8,y:line-34,width:x2-x+1.6,height:4.5,class:'beam'}));
      }
      b+=VALUES[k].beats;
    });
    svg.notes=notes;
    return svg;
  }

  K.onLeave(stop);
  K.rytme={VALUES,beatsOf,onsets,click,drum,stop,playMeter,playRhythm,metronome,rhythmSvg};
})(RSKurs);
