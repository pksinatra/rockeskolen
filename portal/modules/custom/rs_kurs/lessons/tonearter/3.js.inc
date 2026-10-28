/* Tonearter og kvintsirkelen, leksjon 3. */
(function(K){
  const {h,shuffle,markDone,completeBox}=K;
  const {note,name,names,scale,keyName,signature,sigText,relativeMinor,playSeq,keyboard}=K.ta;

  function lesson3(root,i){
    root.append(
      h('h2',{},'Parallelltonearter'),
      h('p',{class:'intro'},'Hver durtoneart har en parallelltoneart i moll med de samme fortegnene. Molltonearten starter på 6. trinn i durskalaen, en liten ters under durens grunntone. C-dur og A-moll har ingen fortegn og bruker de samme tonene, men A-moll har A som grunntone og klinger derfor annerledes.')
    );
    const kb=keyboard(57,83);
    const C=note('C4'), A=note('A3');
    const play=(tonic,minor)=>{ const sc=scale(tonic,minor); playSeq(sc.map(n=>n.midi).concat(tonic.midi+12),0.3,m=>kb.flash(m,'on',280)); };
    root.append(h('div',{class:'btns'},
      h('button',{class:'btn',type:'button',onclick:()=>play(C,false)},'Hør C-dur'),
      h('button',{class:'btn',type:'button',onclick:()=>play(A,true)},'Hør A-moll')),kb.el);

    root.append(h('h3',{},'Finn parallelltonearten'));
    const MAJORS=['G4','D4','F4','Bb4','A4','Eb4','E4'].map(note);
    const minorOf=t=>{ const m=relativeMinor(t); return {letter:m.letter,acc:m.acc}; };
    const tasks=shuffle(MAJORS).slice(0,6).map((tonic,k)=>{
      const rel=minorOf(tonic);
      if(k%2===0){
        // Fra dur til moll. Vanlig feil: moll på samme grunntone.
        const base=[keyName(rel,true),keyName(tonic,true)];
        const other=shuffle(MAJORS.map(x=>keyName(minorOf(x),true))).find(n=>!base.includes(n));
        return {q:`Hva er parallelltonearten til ${keyName(tonic)}?`,right:base[0],opts:shuffle([...base,other]),tonic,rel};
      }
      const base=[keyName(tonic),keyName(rel)];
      const other=shuffle(MAJORS.map(x=>keyName(x))).find(n=>!base.includes(n));
      return {q:`${keyName(rel,true)} er parallelltonearten til hvilken durtoneart?`,right:base[0],opts:shuffle([...base,other]),tonic,rel};
    });
    let t=0, busy=false;
    const task=h('div',{class:'task'}); const ch=h('div',{class:'choices'}); const fb=h('p',{class:'fb'});
    root.append(task,ch,fb);

    function show(){
      busy=false; fb.textContent='';
      task.replaceChildren(tasks[t].q,h('small',{},`Oppgave ${t+1} av ${tasks.length}.`));
      ch.replaceChildren(...tasks[t].opts.map(o=>{ const b=h('button',{class:'choice',type:'button',onclick:()=>answer(o,b)},o); return b; }));
    }
    function answer(o,b){
      if(busy) return;
      const x=tasks[t], sig=signature(x.tonic);
      if(o===x.right){
        busy=true; b.classList.add('right'); fb.className='fb ok';
        fb.textContent=`Riktig: ${keyName(x.tonic)} og ${keyName(x.rel,true)} har begge ${sigText(sig)}${sig.length?' ('+sig.map(name).join(', ')+')':''}.`;
        t++;
        if(t<tasks.length) setTimeout(show,2000);
        else { task.replaceChildren('Alle oppgavene er løst.'); markDone(i); root.append(completeBox(i,'Leksjonen er fullført.')); }
      } else {
        b.classList.add('wrong'); fb.className='fb no';
        fb.textContent=`Ikke helt. Parallelltonearten har samme fortegn, ikke samme grunntone. Molltonearten ligger en liten ters under durtonearten: ${names(scale(x.tonic))}, 6. trinn er ${name(scale(x.tonic)[5])}.`;
      }
    }
    show();
  }

  K.register(3,lesson3);
})(RSKurs);
