/* Tonearter og kvintsirkelen, leksjon 1. */
(function(K){
  const {h,shuffle,markDone,completeBox}=K;
  const {note,name,names,scale,keyName,signature,sigText,playSeq,keyboard}=K.ta;

  function lesson1(root,i){
    root.append(
      h('h2',{},'Fortegn i dur'),
      h('p',{class:'intro'},'Alle durskalaer følger mønsteret hel, hel, halv, hel, hel, hel, halv. Starter du på C, treffer du bare hvite tangenter. Starter du på en annen tone, må noen toner heves eller senkes for at mønsteret skal stemme. Disse tonene er toneartens fortegn, og de skrives i starten av hver notelinje.')
    );
    const kb=keyboard(60,83);
    const shown=h('div',{class:'steps','aria-live':'polite'});
    function view(s){
      const tonic=note(s), sc=scale(tonic), ms=sc.map(n=>n.midi).concat(tonic.midi+12);
      kb.clear('ref'); sc.forEach(n=>kb.set(n.midi,'ref'));
      shown.replaceChildren(h('span',{class:'gap'},keyName(tonic)+':'),...sc.map(n=>h('span',{class:'n'+(n.acc?' lit':'')},name(n))),h('span',{class:'gap'},sigText(signature(tonic))));
      playSeq(ms,0.32,m=>kb.flash(m,'on',300));
    }
    root.append(h('div',{class:'btns'},...['C4','G4','D4','F4','Bb4'].map(s=>h('button',{class:'btn',type:'button',onclick:()=>view(s)},keyName(note(s))))),kb.el,shown);

    root.append(h('h3',{},'Finn fortegnene'),h('p',{style:'margin:0 0 .5rem'},'Velg alle fortegnene tonearten har, og trykk «Sjekk». Bygg skalaen i hodet: hel, hel, halv, hel, hel, hel, halv.'));
    const SHARPS=['F','C','G','D','A','E','B'].map(l=>({letter:l,acc:1}));
    const FLATS=['B','E','A','D','G','C','F'].map(l=>({letter:l,acc:-1}));
    const tasks=shuffle(['G4','D4','A4','F4','Bb4','Eb4']).slice(0,5).map(note);
    let t=0, picked=new Set();
    const task=h('div',{class:'task'}); const fb=h('p',{class:'fb'});
    const toggles=[];
    const row=list=>h('div',{class:'btns'},...list.map(n=>{
      const b=h('button',{class:'btn toggle',type:'button','aria-pressed':'false',onclick:()=>{ const k=name(n); picked.has(k)?picked.delete(k):picked.add(k); b.setAttribute('aria-pressed',String(picked.has(k))); }},name(n));
      toggles.push(b); return b;
    }));
    const check=h('button',{class:'btn primary',type:'button',onclick:verify},'Sjekk');
    root.append(task,row(SHARPS),row(FLATS),h('div',{class:'btns'},check),fb);

    function show(){
      picked=new Set(); toggles.forEach(b=>b.setAttribute('aria-pressed','false'));
      task.replaceChildren(`Hvilke fortegn har ${keyName(tasks[t])}?`,h('small',{},`Oppgave ${t+1} av ${tasks.length}.`));
      fb.textContent=''; check.disabled=false;
    }
    function verify(){
      if(t>=tasks.length) return;
      const tonic=tasks[t], sig=signature(tonic), want=new Set(sig.map(name));
      const same=want.size===picked.size&&[...want].every(x=>picked.has(x));
      if(same){
        fb.className='fb ok'; fb.textContent=`Riktig: ${keyName(tonic)} har ${sigText(sig)}: ${sig.map(name).join(', ')}. Skalaen er ${names(scale(tonic))}.`;
        t++; check.disabled=true;
        if(t<tasks.length) setTimeout(show,2000);
        else { check.disabled=true; toggles.forEach(b=>b.disabled=true); task.replaceChildren('Alle oppgavene er løst.'); markDone(i); root.append(completeBox(i,'Leksjonen er fullført.')); }
      } else {
        fb.className='fb no';
        fb.textContent=picked.size!==want.size
          ? `Ikke helt. ${keyName(tonic)} har ${sigText(sig)}.`
          : 'Riktig antall, men ikke de riktige fortegnene. Gå gjennom skalaen trinn for trinn.';
      }
    }
    show();
  }

  K.register(1,lesson1);
})(RSKurs);
