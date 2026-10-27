/* Intervaller, leksjon 1. */
(function(K){
  const {h,shuffle,markDone,completeBox}=K;
  const {note,name,interval,playPair,keyboard,NUM}=K.int;

  function lesson1(root,i){
    root.append(
      h('h2',{},'Tell trinnene'),
      h('p',{class:'intro'},'Et intervall er avstanden mellom to toner. Størrelsen finner du ved å telle bokstavene fra den nederste til den øverste tonen – begge regnes med. D – E – F er tre trinn, altså en ters. Fra samme tone til samme tone er en prim, og åtte trinn er en oktav.')
    );
    const tasks=shuffle([['D4','F4'],['C4','G4'],['E4','A4'],['F4','D5'],['G4','F5'],['A4','B4'],['C4','C5']]).slice(0,6)
      .map(([a,b])=>({lo:note(a),hi:note(b)}));
    let t=0;
    const task=h('div',{class:'task'}); const fb=h('p',{class:'fb'});
    const kb=keyboard(60,83);
    const play=h('button',{class:'btn primary',type:'button',onclick:()=>hear()},'Hør intervallet');
    const choices=h('div',{class:'btns'},...[2,3,4,5,6,7,8].map(n=>h('button',{class:'btn',type:'button',onclick:()=>answer(n)},NUM[n])));
    root.append(h('h3',{},'Prøv selv'),task,h('div',{class:'btns'},play),kb.el,choices,fb);

    function hear(){ const c=tasks[t]; playPair(c.lo,c.hi,ms=>kb.show(ms)); }
    function show(){
      const c=tasks[t];
      kb.clear('ref'); kb.set(c.lo.midi,'ref'); kb.set(c.hi.midi,'ref');
      const top=name(c.hi)===name(c.lo)?`neste ${name(c.hi)}`:name(c.hi);
      task.replaceChildren(`Hvor stort er intervallet fra ${name(c.lo)} opp til ${top}?`,h('small',{},`Oppgave ${t+1} av ${tasks.length}. Tell bokstavene, begge tonene regnes med.`));
      fb.textContent='';
    }
    function letters(c){
      const out=[]; for(let li=c.lo.li;li<=c.hi.li;li++) out.push('CDEFGAB'[li%7]);
      return out.join(' – ');
    }
    function answer(n){
      if(t>=tasks.length) return;
      const c=tasks[t], iv=interval(c.lo,c.hi);
      if(n===iv.number){
        fb.className='fb ok'; fb.textContent=`Riktig: ${letters(c)} er ${iv.number} trinn, en ${iv.size}.`;
        t++;
        if(t<tasks.length) setTimeout(show,900);
        else { kb.clear('ref'); task.replaceChildren('Alle oppgavene er løst.'); markDone(i); root.append(completeBox(i,'Leksjonen er fullført.')); }
      } else {
        fb.className='fb no'; fb.textContent=`Ikke helt. Tell bokstavene: ${letters(c)}.`;
      }
    }
    show();
  }

  K.register(1,lesson1);
})(RSKurs);
