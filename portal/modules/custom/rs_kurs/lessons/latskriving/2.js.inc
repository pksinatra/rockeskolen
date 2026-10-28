/* Låtskriving, leksjon 2. */
(function(K){
  const {h,shuffle,markDone,completeBox}=K;
  const {CHORDS,chord,tone}=K.ls;

  function lesson2(root,i){
    root.append(
      h('h2',{},'Melodi over akkordene'),
      h('p',{class:'intro'},'En melodi høres stabil når de viktige tonene, særlig de som faller på slag 1 og de som holdes lenge, er akkordtoner. Akkordtonene er de tre tonene i akkorden: i C er det C, E og G. Andre toner fungerer fint som gjennomgangstoner på vei mellom akkordtonene.')
    );
    const SCALE=[['C',60],['D',62],['E',64],['F',65],['G',67],['A',69],['B',71]];
    const tasks=shuffle(['C','Am','F','G','Dm']).slice(0,4);
    let t=0, picked=new Set(), busy=false;
    const task=h('div',{class:'task'}); const fb=h('p',{class:'fb'});
    const toggles=SCALE.map(([n,m])=>{
      const b=h('button',{class:'btn toggle',type:'button','aria-pressed':'false',onclick:()=>{ picked.has(n)?picked.delete(n):picked.add(n); b.setAttribute('aria-pressed',String(picked.has(n))); chord(tasks[t],0,1.0); tone(m+12,0.05,0.9,0.3); }},n);
      return b;
    });
    const check=h('button',{class:'btn primary',type:'button',onclick:verify},'Sjekk');
    root.append(h('h3',{},'Finn akkordtonene'),task,h('div',{class:'btns'},...toggles),h('div',{class:'btns'},check),fb);

    function show(){
      busy=false; picked=new Set(); toggles.forEach(b=>b.setAttribute('aria-pressed','false')); fb.textContent='';
      task.replaceChildren(`Hvilke tre toner er akkordtoner i ${tasks[t]}?`,h('small',{},`Akkord ${t+1} av ${tasks.length}. Trykk en tone for å høre den over akkorden.`));
    }
    function verify(){
      if(busy) return;
      const want=CHORDS[tasks[t]].notes;
      if(picked.size===3&&want.every(n=>picked.has(n))){
        busy=true; fb.className='fb ok'; fb.textContent=`Riktig: ${tasks[t]} består av ${want.join(' – ')}.`;
        t++;
        if(t<tasks.length) setTimeout(show,1400);
        else { check.disabled=true; toggles.forEach(b=>b.disabled=true); task.replaceChildren('Alle akkordene er løst.'); markDone(i); root.append(completeBox(i,'Leksjonen er fullført.')); }
      } else {
        fb.className='fb no'; fb.textContent=picked.size!==3?'Velg nøyaktig tre toner.':`Ikke helt. Start på grunntonen ${want[0]} og stable to terser: hopp over annenhver tone i skalaen.`;
      }
    }
    show();
  }

  K.register(2,lesson2);
})(RSKurs);
