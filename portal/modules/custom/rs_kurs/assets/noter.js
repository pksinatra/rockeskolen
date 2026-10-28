/* Noter: notelinjer med G-nøkkel, tonenavn og lyd som leksjonene deler.
 * Posisjon p teller linjer og mellomrom fra nederste linje (E4 = 0, F5 = 8). C4 = -2 og A5 = 10 får hjelpelinje. */
(function(K){
  // G-nøkkelen tegnes med fonten Noto Music, så den ser lik ut på alle maskiner.
  if(!document.getElementById('rs-noto-music')){
    const l=document.createElement('link'); l.id='rs-noto-music'; l.rel='stylesheet';
    l.href='https://fonts.googleapis.com/css2?family=Noto+Music&display=swap'; document.head.appendChild(l);
  }
  const LETTERS='CDEFGAB';
  const letter=p=>LETTERS[((p+2)%7+7)%7];
  const WHITE=[0,2,4,5,7,9,11];
  // MIDI-tall for posisjon p (E4 = 64).
  const midi=p=>{ const k=p+2+28, oct=Math.floor(k/7); return 12*(oct+1)+WHITE[k%7]; };
  const NS='http://www.w3.org/2000/svg';
  function el(tag,attrs,text){ const e=document.createElementNS(NS,tag); Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v)); if(text!=null) e.textContent=text; return e; }
  function staff(p){
    const W=200, H=130, gap=10, bottom=86, x=128;
    const y=q=>bottom-q*gap/2;
    const svg=el('svg',{viewBox:`0 0 ${W} ${H}`,class:'staff',role:'img','aria-label':'En note på notelinjene med G-nøkkel'});
    for(let k=0;k<5;k++) svg.append(el('line',{x1:8,x2:W-8,y1:y(2*k),y2:y(2*k),class:'line'}));
    // Fonten har skriftstørrelse = fire linjeavstander og grunnlinje på nederste linje.
    svg.append(el('text',{x:14,y:y(0),class:'clef'},'𝄞'));
    // Hjelpelinjer under (C4) og over (A5).
    for(let q=-2;q>=p;q-=2) svg.append(el('line',{x1:x-13,x2:x+13,y1:y(q),y2:y(q),class:'line'}));
    for(let q=10;q<=p;q+=2) svg.append(el('line',{x1:x-13,x2:x+13,y1:y(q),y2:y(q),class:'line'}));
    svg.append(el('ellipse',{cx:x,cy:y(p),rx:6.6,ry:4.8,transform:`rotate(-22 ${x} ${y(p)})`,class:'head'}));
    // Hals opp under midtlinjen, ned fra midtlinjen og oppover.
    if(p<4) svg.append(el('line',{x1:x+6,x2:x+6,y1:y(p)-1,y2:y(p)-35,class:'stem'}));
    else svg.append(el('line',{x1:x-6,x2:x-6,y1:y(p)+1,y2:y(p)+35,class:'stem'}));
    return svg;
  }
  function tone(m){
    const c=K.ac(); if(!c) return;
    const t=c.currentTime+0.03, g=c.createGain(); g.connect(c.destination);
    g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.3,t+0.02); g.gain.exponentialRampToValueAtTime(0.0008,t+1.1);
    [['triangle',1,1],['sine',2,0.18]].forEach(([type,mult,v])=>{ const o=c.createOscillator(), og=c.createGain(); o.type=type; o.frequency.value=440*Math.pow(2,(m-69)/12)*mult; og.gain.value=v; o.connect(og).connect(g); o.start(t); o.stop(t+1.15); });
  }
  K.noter={LETTERS,letter,midi,staff,tone};
})(RSKurs);
