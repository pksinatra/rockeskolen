/* Akkorder og harmoni, leksjon 2. */
(function(K){
  const {h,markDone,completeBox,go}=K;
  const {note,names,triad,chordName,playChord,stop,keyboard}=K.ak;

  function lesson2(root,i){
    root.append(
      h('h2',{},'Dur eller moll?'),
      h('p',{class:'intro'},'Forskjellen mellom dur og moll ligger i tersen. I moll ligger tersen en liten ters (tre halvtoner) over grunntonen, en halvtone lavere enn i dur. Grunntonen og kvinten er de samme. C-dur er C – E – G, og Cm er C – E♭ – G.')
    );
    const kb=keyboard(60,83);
    root.append(h('div',{class:'btns'},
      h('button',{class:'btn',type:'button',onclick:()=>playChord([60,64,67],ms=>kb.show(ms))},'Hør C-dur'),
      h('button',{class:'btn',type:'button',onclick:()=>playChord([60,63,67],ms=>kb.show(ms))},'Hør Cm')),kb.el);

    root.append(h('h3',{},'Lytteprøve'),h('p',{style:'margin:0'},'Hør akkorden og svar dur eller moll. Svar riktig på minst fem av seks for å fullføre leksjonen.'));
    const ROOTS=['C4','D4','E4','F4','G4','A4','Bb4'];
    const ROUNDS=6, PASS=5;
    let round=0, results=[], cur=null, answered=false;
    const status=h('div',{class:'task'}); const dots=h('div',{class:'score','aria-hidden':'true'});
    const playBtn=h('button',{class:'btn primary',type:'button',onclick:()=>playChord(cur.notes.map(n=>n.midi))},'Spill akkorden');
    const aMaj=h('button',{class:'btn',type:'button',onclick:()=>answer('maj')},'Dur');
    const aMin=h('button',{class:'btn',type:'button',onclick:()=>answer('min')},'Moll');
    const nextBtn=h('button',{class:'btn',type:'button',onclick:next},'Neste');
    const fb=h('p',{class:'fb'});
    root.append(status,dots,h('div',{class:'btns'},playBtn,aMaj,aMin,nextBtn),fb);

    function newRound(){
      const r=note(ROOTS[Math.floor(Math.random()*ROOTS.length)]), q=Math.random()<0.5?'maj':'min';
      cur={r,q,notes:triad(r,q)}; answered=false;
      status.replaceChildren(`Runde ${round+1} av ${ROUNDS}`,h('small',{},'Trykk «Spill akkorden» og lytt.'));
      aMaj.disabled=aMin.disabled=false; nextBtn.disabled=true; fb.textContent=''; drawDots();
    }
    function drawDots(){ dots.replaceChildren(...Array.from({length:ROUNDS},(_,k)=>h('i',{class:results[k]===true?'r':results[k]===false?'x':''}))); }
    function answer(q){
      if(answered) return; answered=true; stop();
      const ok=q===cur.q; results.push(ok); drawDots();
      aMaj.disabled=aMin.disabled=true; nextBtn.disabled=results.length===ROUNDS;
      const label=cur.q==='maj'?`${chordName(cur.r,'maj')}-dur`:chordName(cur.r,'min');
      fb.className=ok?'fb ok':'fb no';
      fb.textContent=(ok?'Riktig. ':'Ikke denne gangen. ')+`Det var ${label}: ${names(cur.notes)}.`;
      if(results.length===ROUNDS) finish();
    }
    function next(){ round++; if(round<ROUNDS) newRound(); }
    function finish(){
      const score=results.filter(Boolean).length;
      if(score>=PASS){
        status.replaceChildren(`${score} av ${ROUNDS} riktige.`);
        markDone(i,Math.round(score/ROUNDS*100)); root.append(completeBox(i,'Leksjonen er fullført.'));
      } else {
        status.replaceChildren(`${score} av ${ROUNDS} riktige. Du trenger ${PASS} for å fullføre.`);
        root.append(h('div',{class:'btns'},h('button',{class:'btn primary',type:'button',onclick:()=>go(i)},'Prøv igjen')));
      }
    }
    newRound();
  }

  K.register(2,lesson2);
})(RSKurs);
