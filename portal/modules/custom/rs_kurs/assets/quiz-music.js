/* Toner i lærertestene: stavede tonenavn, lyd og notelinje med G-nøkkel. Brukes både av eleven og i redigeringen.
 * Tonenavn skrives som C4, F#4, Bb3 (bokstav, fortegn, oktav). Posisjon p teller linjer og mellomrom fra nederste linje (E4 = 0). */
window.RSQuizMusic=(function(){
  const LETTERS='CDEFGAB', PC={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
  const ACC={'':0,'#':1,'##':2,'b':-1,'bb':-2};
  const GLYPH={1:'♯',2:'𝄪','-1':'♭','-2':'𝄫'};
  // Gir null hvis ett av navnene ikke er et tonenavn.
  function parse(s){
    const out=[];
    for(const t of String(s||'').trim().split(/\s+/).filter(Boolean)){
      const r=/^([A-G])(##|#|bb|b)?([2-6])$/.exec(t); if(!r) return null;
      const oct=+r[3], acc=ACC[r[2]||''];
      out.push({name:r[1]+(GLYPH[acc]||'')+oct,acc,midi:12*(oct+1)+PC[r[1]]+acc,p:LETTERS.indexOf(r[1])+7*oct-30});
    }
    return out;
  }
  const onStaff=ns=>ns.every(n=>n.p>=-5&&n.p<=12);

  /* ---------- lyd ---------- */
  let ctx=null;
  function ac(){
    if(!ctx){const C=window.AudioContext||window.webkitAudioContext; if(!C) return null; ctx=new C();}
    if(ctx.state==='suspended') ctx.resume();
    return ctx;
  }
  let out=null;
  function tone(m,delay,dur,vol){
    const c=ac(); if(!c) return;
    if(!out){ out=c.createGain(); out.gain.value=0.8; out.connect(c.destination); }
    const t=c.currentTime+0.03+delay, g=c.createGain(); g.connect(out);
    g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+0.02); g.gain.exponentialRampToValueAtTime(0.0008,t+dur);
    [['triangle',1,1],['sine',2,0.18],['sine',3,0.05]].forEach(([type,mult,v])=>{
      const o=c.createOscillator(), og=c.createGain();
      o.type=type; o.frequency.value=440*Math.pow(2,(m-69)/12)*mult; og.gain.value=v;
      o.connect(og).connect(g); o.start(t); o.stop(t+dur+0.05);
    });
  }
  // Kobler fra utgangen, så også toner som allerede er planlagt, stilner.
  function stop(){ if(out){ out.disconnect(); out=null; } }
  // Etter hverandre (melodic) eller samtidig (harmonic).
  function play(ns,how){
    stop();
    if(how==='harmonic') ns.forEach(n=>tone(n.midi,0,1.8,0.3/Math.sqrt(ns.length)));
    else ns.forEach((n,k)=>tone(n.midi,k*0.6,k===ns.length-1?1.2:0.65,0.3));
  }

  /* ---------- notelinje ---------- */
  const NS='http://www.w3.org/2000/svg';
  function el(tag,attrs,text){ const e=document.createElementNS(NS,tag); Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v)); if(text!=null) e.textContent=text; return e; }
  // Toner etter hverandre får hver sin plass. Samtidige toner står i én akkord.
  function staff(ns,harmonic){
    const gap=10, bottom=78, y=q=>bottom-q*gap/2, col=harmonic?70:44, x0=62;
    const groups=harmonic?[ns.slice().sort((a,b)=>a.p-b.p)]:ns.map(n=>[n]);
    const W=x0+groups.length*col+10, H=112;
    const svg=el('svg',{viewBox:`0 0 ${W} ${H}`,class:'staff qstaff',role:'img','aria-label':'Noter: '+ns.map(n=>n.name).join(', ')});
    svg.style.maxWidth=Math.min(W*1.3,620)+'px';
    for(let k=0;k<5;k++) svg.append(el('line',{x1:6,x2:W-6,y1:y(2*k),y2:y(2*k),class:'line'}));
    // Fonten har skriftstørrelse = fire linjeavstander og grunnlinje på nederste linje.
    svg.append(el('text',{x:12,y:y(0),class:'clef'},'𝄞'));
    groups.forEach((g,i)=>{
      const x=x0+i*col+col-22, lo=g[0].p, hi=g[g.length-1].p;
      const up=(lo+hi)/2<4;
      // Sekunder: den øverste av to nabotoner står alltid til høyre.
      const shift=g.map(()=>0);
      if(up){ for(let k=1;k<g.length;k++) if(g[k].p-g[k-1].p===1&&!shift[k-1]) shift[k]=1; }
      else { for(let k=g.length-2;k>=0;k--) if(g[k+1].p-g[k].p===1&&!shift[k+1]) shift[k]=-1; }
      for(let q=-2;q>=lo;q-=2) svg.append(el('line',{x1:x-13,x2:x+13+(shift.includes(1)?12:0),y1:y(q),y2:y(q),class:'line'}));
      for(let q=10;q<=hi;q+=2) svg.append(el('line',{x1:x-13-(shift.includes(-1)?12:0),x2:x+13+(shift.includes(1)?12:0),y1:y(q),y2:y(q),class:'line'}));
      // Fortegn til venstre, med grunnlinjen en halv linjeavstand under tonen. Står de tett, flyttes annethvert lenger ut.
      let last=null, lane=0;
      for(let k=g.length-1;k>=0;k--){
        const n=g[k]; if(!n.acc) continue;
        lane=last!==null&&last-n.p<6?lane+1:0; last=n.p;
        svg.append(el('text',{x:x-22-(shift.includes(-1)?12:0)-lane*11,y:y(n.p)+gap/2,class:'acc','text-anchor':'middle'},GLYPH[n.acc]));
      }
      g.forEach((n,k)=>{ const cx=x+shift[k]*12.5; svg.append(el('ellipse',{cx,cy:y(n.p),rx:6.6,ry:4.8,transform:`rotate(-22 ${cx} ${y(n.p)})`,class:'head'})); });
      if(up) svg.append(el('line',{x1:x+6,x2:x+6,y1:y(lo)-1,y2:y(hi)-35,class:'stem'}));
      else svg.append(el('line',{x1:x-6,x2:x-6,y1:y(hi)+1,y2:y(lo)+35,class:'stem'}));
    });
    return svg;
  }

  return {parse,onStaff,play,stop,staff};
})();
