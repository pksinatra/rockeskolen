/* Form og struktur, leksjon 3. */
(function(K){
  const {h,shuffle,markDone,completeBox}=K;

  function lesson3(root,i){
    root.append(
      h('h2',{},'Delene i en låt'),
      h('p',{class:'intro'},'En poplåt er satt sammen av deler med hver sin oppgave. Introen åpner låten. Versene forteller historien: samme melodi, ny tekst hver gang. Refrenget er låtens kjerne og kommer tilbake med samme tekst. C-delen, også kalt bro, gir kontrast én gang, ofte etter andre refreng. Outroen avslutter. En vanlig form er intro – vers – refreng – vers – refreng – C-del – refreng – outro.')
    );
    const PARTS=['Intro','Vers','Refreng','C-del','Outro'];
    const DEF={Intro:'introen',Vers:'verset',Refreng:'refrenget','C-del':'C-delen',Outro:'outroen'};
    const tasks=shuffle([
      ['Samme melodi, men ny tekst hver gang delen kommer.','Vers'],
      ['Kommer tilbake med samme tekst og er ofte delen folk husker og synger med på.','Refreng'],
      ['Kommer som regel bare én gang og gir kontrast med ny melodi og nye akkorder.','C-del'],
      ['Åpner låten, ofte uten sang, og setter stemningen.','Intro'],
      ['Avslutter låten, for eksempel ved å gjenta en del og tone ut.','Outro'],
      ['Forteller historien videre og leder fram mot refrenget.','Vers']
    ]).slice(0,5);
    let t=0, busy=false;
    const task=h('div',{class:'task'}); const fb=h('p',{class:'fb'});
    const ch=h('div',{class:'btns'},...PARTS.map(p=>h('button',{class:'btn',type:'button',onclick:()=>answer(p)},p)));
    root.append(h('h3',{},'Hvilken del er det?'),task,ch,fb);

    function show(){
      busy=false; fb.textContent='';
      task.replaceChildren(tasks[t][0],h('small',{},`Beskrivelse ${t+1} av ${tasks.length}.`));
    }
    function answer(p){
      if(busy) return;
      if(p===tasks[t][1]){
        busy=true; fb.className='fb ok'; fb.textContent=`Riktig: ${DEF[p]}.`;
        t++;
        if(t<tasks.length) setTimeout(show,1100);
        else { task.replaceChildren('Alle beskrivelsene er løst.'); [...ch.children].forEach(b=>b.disabled=true); markDone(i); root.append(completeBox(i,'Leksjonen er fullført.')); }
      } else {
        fb.className='fb no'; fb.textContent='Ikke helt. Tenk på hva som gjentas, og hva som er nytt.';
      }
    }
    show();
  }

  K.register(3,lesson3);
})(RSKurs);
