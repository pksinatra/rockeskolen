/* Melodi, leksjon 2. */
(function(K){
  const {h,shuffle,markDone,completeBox}=K;
  const {nm,degree,playMelody,keyboard}=K.mel;

  function lesson2(root,i){
    root.append(
      h('h2',{},'Trinn og sprang'),
      h('p',{class:'intro'},'Når melodien går til nabotonen i skalaen, er det et trinn: et sekundintervall, som C – D eller E – F. Hopper den over minst én skalatone, er det et sprang: en ters eller større, som C – E eller G – C. Melodier som er lette å synge, beveger seg mest i trinn, med noen få sprang som gir spenning.')
    );
    const POOL=[[60,62,64,67,65],[67,65,64,60,62],[64,65,67,72,71],[72,67,69,71,72],[62,64,60,65,64],[65,64,62,67,64]];
    const tasks=shuffle(POOL).slice(0,4);
    let t=0, marks=[];
    const task=h('div',{class:'task'}); const fb=h('p',{class:'fb'});
    const kb=keyboard(60,72);
    const row=h('div',{class:'motions'});
    const playBtn=h('button',{class:'btn primary',type:'button',onclick:()=>playMelody(tasks[t],{onStep:m=>kb.flash(m,'on',300)})},'Hør melodien');
    const check=h('button',{class:'btn',type:'button',onclick:verify},'Sjekk');
    root.append(h('h3',{},'Prøv selv'),task,h('div',{class:'btns'},playBtn),row,h('div',{class:'btns'},check),kb.el,fb);
    const kind=(a,b)=>Math.abs(degree(b)-degree(a))===1?'trinn':'sprang';

    function show(){
      const ms=tasks[t]; marks=Array(ms.length-1).fill(null); fb.textContent=''; check.disabled=false;
      task.replaceChildren('Er hver bevegelse et trinn eller et sprang?',h('small',{},`Melodi ${t+1} av ${tasks.length}. Velg for alle fire bevegelsene og trykk «Sjekk».`));
      row.replaceChildren(...ms.flatMap((m,k)=>{
        const n=h('span',{class:'n'},nm(m));
        if(k===ms.length-1) return [n];
        const pick=v=>{ marks[k]=v; [...sel.children].forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===v))); };
        const sel=h('span',{class:'motion'},
          h('button',{class:'btn toggle',type:'button','data-v':'trinn','aria-pressed':'false',onclick:()=>pick('trinn')},'trinn'),
          h('button',{class:'btn toggle',type:'button','data-v':'sprang','aria-pressed':'false',onclick:()=>pick('sprang')},'sprang'));
        return [n,sel];
      }));
    }
    function verify(){
      const ms=tasks[t];
      if(marks.includes(null)){ fb.className='fb no'; fb.textContent='Velg trinn eller sprang for alle bevegelsene først.'; return; }
      const wrong=marks.map((v,k)=>v===kind(ms[k],ms[k+1])?null:`${nm(ms[k])} – ${nm(ms[k+1])} er et ${kind(ms[k],ms[k+1])}`).filter(Boolean);
      if(!wrong.length){
        fb.className='fb ok'; fb.textContent='Riktig.'; check.disabled=true;
        t++;
        if(t<tasks.length) setTimeout(show,1200);
        else { task.replaceChildren('Alle melodiene er løst.'); markDone(i); root.append(completeBox(i,'Leksjonen er fullført.')); }
      } else {
        fb.className='fb no'; fb.textContent=`Ikke helt: ${wrong.join(', ')}. Tell bokstavene: nabobokstav er trinn.`;
      }
    }
    show();
  }

  K.register(2,lesson2);
})(RSKurs);
