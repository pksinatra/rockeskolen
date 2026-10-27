/* Intervaller, leksjon 3. */
(function(K){
  const {h,shuffle,markDone,completeBox}=K;
  const {note,name,above,tone,keyboard,QUAL,NUM}=K.int;

  function lesson3(root,i){
    root.append(
      h('h2',{},'Bygg intervallet'),
      h('p',{class:'intro'},'Nå snur vi det: du får en tone og et intervall, og finner den øverste tonen selv. Tell først bokstavtrinnene for størrelsen, og juster så med halvtoner for kvaliteten.')
    );
    const tasks=shuffle([['D4',3,'M'],['A4',3,'m'],['E4',5,'P'],['F4',4,'P'],['G4',6,'M'],['C4',7,'m'],['B4',2,'m'],['D4',6,'m']]).slice(0,6)
      .map(([a,n,q])=>{ const lo=note(a); return {lo,n,q,hi:above(lo,n,q)}; });
    let t=0;
    const task=h('div',{class:'task'}); const fb=h('p',{class:'fb'});
    const kb=keyboard(60,83,onKey);
    root.append(h('h3',{},'Prøv selv'),task,kb.el,fb);

    function label(c){ return `${QUAL[c.q]} ${NUM[c.n]}`; }
    function show(){
      const c=tasks[t];
      kb.clear('ref'); kb.set(c.lo.midi,'ref');
      task.replaceChildren(`Trykk tonen som ligger en ${label(c)} over ${name(c.lo)}.`,h('small',{},`Oppgave ${t+1} av ${tasks.length}. Den markerte tangenten er ${name(c.lo)}.`));
      fb.textContent='';
    }
    function onKey(m){
      if(t>=tasks.length) return;
      const c=tasks[t];
      if(m===c.hi.midi){
        kb.flash(m,'good',700);
        tone(c.lo.midi,0.35,1.1); tone(c.hi.midi,0.35,1.1);
        fb.className='fb ok'; fb.textContent=`Riktig: ${name(c.hi)} ligger en ${label(c)} over ${name(c.lo)}.`;
        t++;
        if(t<tasks.length) setTimeout(show,1400);
        else { kb.clear('ref'); task.replaceChildren('Alle oppgavene er løst.'); markDone(i); root.append(completeBox(i,'Leksjonen er fullført.')); }
      } else {
        kb.flash(m,'bad',600);
        const semis=c.hi.midi-c.lo.midi;
        fb.className='fb no'; fb.textContent=m<=c.lo.midi
          ? `Tonen skal ligge over ${name(c.lo)}.`
          : `Ikke helt. En ${label(c)} er ${semis} halvtoner over ${name(c.lo)}.`;
      }
    }
    show();
  }

  K.register(3,lesson3);
})(RSKurs);
