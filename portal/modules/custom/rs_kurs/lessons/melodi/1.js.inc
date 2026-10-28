/* Melodi, leksjon 1. */
(function(K){
  const {h,shuffle,markDone,completeBox}=K;
  const {playMelody,contourSvg,signsOf,contourLabel,keyboard}=K.mel;

  function lesson1(root,i){
    root.append(
      h('h2',{},'Melodiens retning'),
      h('p',{class:'intro'},'En melodi er toner etter hverandre som beveger seg opp, ned eller står stille. Formen den tegner kalles melodikurven. Mange melodier stiger mot et høydepunkt og faller tilbake, som en bue. Hør melodien og velg kurven som passer.')
    );
    const WHITE=[60,62,64,65,67,69,71,72];
    function melody(){
      // Fire toner uten gjentakelse, alle innenfor C4–C5.
      for(;;){ const ms=[0,1,2,3].map(()=>WHITE[Math.floor(Math.random()*WHITE.length)]); if(ms.every((m,k)=>k===0||m!==ms[k-1])) return ms; }
    }
    const ALL=[];
    for(let a of [1,-1]) for(let b of [1,-1]) for(let c of [1,-1]) ALL.push([a,b,c]);
    const tasks=[0,1,2,3,4].map(()=>{
      const ms=melody(), signs=signsOf(ms), key=signs.join();
      return {ms,signs,opts:shuffle([signs,...shuffle(ALL.filter(s=>s.join()!==key)).slice(0,2)])};
    });
    let t=0, busy=false;
    const task=h('div',{class:'task'}); const fb=h('p',{class:'fb'});
    const kb=keyboard(60,72);
    const playBtn=h('button',{class:'btn primary',type:'button',onclick:()=>playMelody(tasks[t].ms,{onStep:m=>kb.flash(m,'on',300)})},'Hør melodien');
    const ch=h('div',{class:'choices contour-choices'});
    root.append(h('h3',{},'Prøv selv'),task,h('div',{class:'btns'},playBtn),ch,kb.el,fb);

    function show(){
      busy=false; fb.textContent='';
      task.replaceChildren('Hør melodien. Hvilken kurve passer?',h('small',{},`Melodi ${t+1} av ${tasks.length}. Fire toner. Tangentene lyser mens melodien spilles.`));
      ch.replaceChildren(...tasks[t].opts.map((s,k)=>{
        const b=h('button',{class:'choice',type:'button','aria-label':`Kurve ${k+1}: ${contourLabel(s)}`,onclick:()=>answer(s,b)},contourSvg(s,contourLabel(s)));
        return b;
      }));
    }
    function answer(s,b){
      if(busy) return;
      const x=tasks[t];
      if(s.join()===x.signs.join()){
        busy=true; b.classList.add('right'); fb.className='fb ok'; fb.textContent=`Riktig: ${contourLabel(x.signs)}.`;
        t++;
        if(t<tasks.length) setTimeout(show,1400);
        else { task.replaceChildren('Alle melodiene er løst.'); markDone(i); root.append(completeBox(i,'Leksjonen er fullført.')); }
      } else {
        b.classList.add('wrong'); fb.className='fb no'; fb.textContent='Ikke helt. Hør igjen, og følg med på tangentene: går hver ny tone opp eller ned?';
      }
    }
    show();
  }

  K.register(1,lesson1);
})(RSKurs);
