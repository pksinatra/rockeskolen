/* Akkorder og harmoni, leksjon 3. */
(function(K){
  const {h,shuffle,markDone,completeBox}=K;
  const {note,names,keyName,degreeChord,playChord,fit,keyboard}=K.ak;

  function lesson3(root,i){
    const C=note('C4');
    root.append(
      h('h2',{},'Akkordene i tonearten'),
      h('p',{class:'intro'},'Bygger du en treklang på hvert trinn i durskalaen, med bare skalaens egne toner, får du sju trinnakkorder. Trinn I, IV og V blir dur. Trinn ii, iii og vi blir moll. Trinn vii° blir forminsket: to små terser. Store bokstaver betyr dur, små betyr moll. Hør akkordene i C-dur:')
    );
    const kb=keyboard(60,83);
    const row=h('div',{class:'btns'});
    for(let d=1;d<=7;d++){
      const c=degreeChord(C,d);
      row.append(h('button',{class:'btn',type:'button',title:names(c.notes),onclick:()=>playChord(fit(c.notes.map(n=>n.midi)),ms=>kb.show(ms))},`${c.roman}: ${c.name}`));
    }
    root.append(row,kb.el,h('h3',{},'Prøv selv'));

    const KEYS=['C4','G4','F4','D4','Bb4'];
    const tasks=shuffle(KEYS.flatMap(k=>[1,2,4,5,6].map(d=>[k,d]))).slice(0,6).map(([k,d])=>{
      const tonic=note(k), c=degreeChord(tonic,d);
      // To feil svar: andre trinnakkorder i samme toneart.
      const wrong=shuffle([1,2,3,4,5,6].filter(x=>x!==d)).slice(0,2).map(x=>degreeChord(tonic,x).name);
      return {tonic,d,c,opts:shuffle([c.name,...wrong])};
    });
    let t=0, busy=false;
    const task=h('div',{class:'task'}); const ch=h('div',{class:'choices'}); const fb=h('p',{class:'fb'});
    root.append(task,ch,fb);

    function show(){
      const x=tasks[t]; fb.textContent=''; busy=false;
      task.replaceChildren(`Hvilken akkord er ${x.c.roman} i ${keyName(x.tonic)}?`,h('small',{},`Oppgave ${t+1} av ${tasks.length}. Tell trinnene i skalaen fra grunntonen.`));
      ch.replaceChildren(...x.opts.map(o=>{
        const b=h('button',{class:'choice',type:'button',onclick:()=>answer(o,b)},o);
        return b;
      }));
    }
    function answer(o,b){
      if(busy) return;
      const x=tasks[t];
      if(o===x.c.name){
        busy=true; b.classList.add('right'); fb.className='fb ok';
        fb.textContent=`Riktig: ${x.c.roman} i ${keyName(x.tonic)} er ${x.c.name}, ${names(x.c.notes)}.`;
        playChord(fit(x.c.notes.map(n=>n.midi)),ms=>kb.show(ms));
        t++;
        if(t<tasks.length) setTimeout(show,2200);
        else { task.replaceChildren('Alle oppgavene er løst.'); markDone(i); root.append(completeBox(i,'Leksjonen er fullført.')); }
      } else {
        b.classList.add('wrong'); fb.className='fb no';
        fb.textContent=`Ikke helt. ${o} er en annen trinnakkord i ${keyName(x.tonic)}. Finn trinn ${x.d} i skalaen og bygg treklangen derfra.`;
      }
    }
    show();
  }

  K.register(3,lesson3);
})(RSKurs);
