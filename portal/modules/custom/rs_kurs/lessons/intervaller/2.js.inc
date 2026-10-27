/* Intervaller, leksjon 2. */
(function(K){
  const {h,shuffle,markDone,completeBox}=K;
  const {note,name,interval,playPair,keyboard}=K.int;

  function lesson2(root,i){
    root.append(
      h('h2',{},'Stor, liten eller ren?'),
      h('p',{class:'intro'},'Størrelsen sier hvor mange bokstavtrinn intervallet har. Kvaliteten sier hvor mange halvtoner det er. Prim, kvart, kvint og oktav er rene. Sekund, ters, sekst og septim er store eller små. Gjør du et rent intervall en halvtone større, blir det forstørret – en halvtone mindre, blir det forminsket.')
    );
    const tasks=shuffle([['C4','E4'],['C4','Eb4'],['D4','A4'],['F4','B4'],['B4','F5'],['E4','C5'],['C4','A4'],['D4','C5']]).slice(0,6)
      .map(([a,b])=>({lo:note(a),hi:note(b)}));
    const PERFECT=[1,4,5,8];
    let t=0;
    const task=h('div',{class:'task'}); const fb=h('p',{class:'fb'});
    const kb=keyboard(60,83);
    const play=h('button',{class:'btn primary',type:'button',onclick:()=>hear()},'Hør intervallet');
    const choices=h('div',{class:'btns'});
    root.append(h('h3',{},'Prøv selv'),task,h('div',{class:'btns'},play),kb.el,choices,fb);

    function hear(){ const c=tasks[t]; playPair(c.lo,c.hi,ms=>kb.show(ms)); }
    function show(){
      const c=tasks[t], iv=interval(c.lo,c.hi);
      kb.clear('ref'); kb.set(c.lo.midi,'ref'); kb.set(c.hi.midi,'ref');
      task.replaceChildren(`${name(c.lo)} opp til ${name(c.hi)} er en ${iv.size}. Hvilken ${iv.size}?`,h('small',{},`Oppgave ${t+1} av ${tasks.length}. Tell halvtonene på tangentene.`));
      const opts=PERFECT.includes(iv.number)?['ren','forstørret','forminsket']:['stor','liten'];
      choices.replaceChildren(...opts.map(q=>h('button',{class:'btn',type:'button',onclick:()=>answer(q)},`${q} ${iv.size}`)));
      fb.textContent='';
    }
    function rule(iv){
      const base={1:0,2:2,3:4,4:5,5:7,6:9,7:11,8:12}[iv.number];
      return PERFECT.includes(iv.number)
        ? `En ren ${iv.size} er ${base} halvtoner.`
        : `En stor ${iv.size} er ${base} halvtoner, en liten ${iv.size} er ${base-1}.`;
    }
    function answer(q){
      if(t>=tasks.length) return;
      const c=tasks[t], iv=interval(c.lo,c.hi), right=iv.text.split(' ')[0];
      if(q===right){
        fb.className='fb ok'; fb.textContent=`Riktig: ${name(c.lo)}–${name(c.hi)} er ${iv.semis} halvtoner, en ${iv.text}.`;
        t++;
        if(t<tasks.length) setTimeout(show,1100);
        else { kb.clear('ref'); choices.replaceChildren(); task.replaceChildren('Alle oppgavene er løst.'); markDone(i); root.append(completeBox(i,'Leksjonen er fullført.')); }
      } else {
        fb.className='fb no'; fb.textContent=`Ikke helt. ${name(c.lo)}–${name(c.hi)} er ${iv.semis} halvtoner. ${rule(iv)}`;
      }
    }
    show();
  }

  K.register(2,lesson2);
})(RSKurs);
