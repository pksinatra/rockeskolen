/* Musikkproduksjon, leksjon 2. */
(function(K){
  const {h,markDone,completeBox,go}=K;
  const {BANDS,eqSound,stop}=K.prod;

  function lesson2(root,i){
    const ROUNDS=6, PASS=4;
    root.append(
      h('h2',{},'Bass, mellomtone og diskant'),
      h('p',{class:'intro'},'En equalizer (EQ) forsterker eller demper deler av frekvensområdet. Bassen (rundt 100 Hz) gir tyngde og varme. Mellomtonen (rundt 1000 Hz) gir kropp og kan låte nasal. Diskanten (rundt 6000 Hz) gir luft og skarphet. Hør lyden uten EQ, og deretter med hvert område forsterket.')
    );
    root.append(h('div',{class:'btns'},
      h('button',{class:'btn',type:'button',onclick:()=>eqSound(null)},'Uten EQ'),
      ...Object.entries(BANDS).map(([k,b])=>h('button',{class:'btn',type:'button',onclick:()=>eqSound(k)},`${b.label} forsterket`))));
    root.append(h('h3',{},'Lytteprøve'),h('p',{style:'margin:0'},'Hvilket område er forsterket? Sammenlign gjerne med lyden uten EQ. Svar riktig på minst fire av seks for å fullføre leksjonen.'));
    let round=0, results=[], cur=null, answered=false;
    const status=h('div',{class:'task'}); const dots=h('div',{class:'score','aria-hidden':'true'});
    const playBtn=h('button',{class:'btn primary',type:'button',onclick:()=>eqSound(cur)},'Spill lyden');
    const flat=h('button',{class:'btn',type:'button',onclick:()=>eqSound(null)},'Uten EQ');
    const ch=h('div',{class:'btns'},...Object.entries(BANDS).map(([k,b])=>h('button',{class:'btn',type:'button',onclick:()=>answer(k)},b.label)));
    const nextBtn=h('button',{class:'btn',type:'button',onclick:next},'Neste');
    const fb=h('p',{class:'fb'});
    root.append(status,dots,h('div',{class:'btns'},playBtn,flat,nextBtn),ch,fb);

    function newRound(){
      const keys=Object.keys(BANDS); cur=keys[Math.floor(Math.random()*keys.length)]; answered=false;
      status.replaceChildren(`Runde ${round+1} av ${ROUNDS}`,h('small',{},'Trykk «Spill lyden» og lytt.'));
      [...ch.children].forEach(b=>b.disabled=false); nextBtn.disabled=true; fb.textContent=''; drawDots();
    }
    function drawDots(){ dots.replaceChildren(...Array.from({length:ROUNDS},(_,k)=>h('i',{class:results[k]===true?'r':results[k]===false?'x':''}))); }
    function answer(k){
      if(answered) return; answered=true; stop();
      const ok=k===cur; results.push(ok); drawDots();
      [...ch.children].forEach(b=>b.disabled=true); nextBtn.disabled=results.length===ROUNDS;
      fb.className=ok?'fb ok':'fb no';
      fb.textContent=(ok?'Riktig. ':'Ikke denne gangen. ')+`Det var ${BANDS[cur].label.toLowerCase()} (rundt ${BANDS[cur].f} Hz) som var forsterket.`;
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
