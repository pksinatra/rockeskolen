/* Form og struktur, leksjon 2. */
(function(K){
  const {h,markDone,completeBox,go}=K;
  const {PHRASES,playPhrases,stop}=K.form;

  function lesson2(root,i){
    const BPM=120, ROUNDS=6, PASS=5;
    root.append(
      h('h2',{},'Like eller ulike?'),
      h('p',{class:'intro'},'Form handler om gjentakelse og kontrast. Delene i musikken får bokstaver: den første delen er A. Kommer den igjen, er det A en gang til. Kommer det noe nytt, er det B. Du hører to fraser på to takter. Er de like (A – A) eller ulike (A – B)? Svar riktig på minst fem av seks for å fullføre leksjonen.')
    );
    let round=0, results=[], cur=null, answered=false;
    const status=h('div',{class:'task'}); const dots=h('div',{class:'score','aria-hidden':'true'});
    const parts=h('div',{class:'steps','aria-hidden':'true'});
    const playBtn=h('button',{class:'btn primary',type:'button',onclick:()=>playPhrases(cur.ids,BPM,p=>[...parts.children].forEach((s,k)=>s.classList.toggle('lit',k===p)))},'Spill frasene');
    const aSame=h('button',{class:'btn',type:'button',onclick:()=>answer(true)},'A – A');
    const aDiff=h('button',{class:'btn',type:'button',onclick:()=>answer(false)},'A – B');
    const nextBtn=h('button',{class:'btn',type:'button',onclick:next},'Neste');
    const fb=h('p',{class:'fb'});
    root.append(status,dots,h('div',{class:'btns'},playBtn,aSame,aDiff,nextBtn),parts,fb);

    function newRound(){
      const a=Math.floor(Math.random()*PHRASES.length), same=Math.random()<0.5;
      let b=a; while(!same&&b===a) b=Math.floor(Math.random()*PHRASES.length);
      cur={ids:[a,b],same}; answered=false;
      parts.replaceChildren(h('span',{class:'n'},'1'),h('span',{class:'n'},'2'));
      status.replaceChildren(`Runde ${round+1} av ${ROUNDS}`,h('small',{},'Trykk «Spill frasene» og lytt.'));
      aSame.disabled=aDiff.disabled=false; nextBtn.disabled=true; fb.textContent=''; drawDots();
    }
    function drawDots(){ dots.replaceChildren(...Array.from({length:ROUNDS},(_,k)=>h('i',{class:results[k]===true?'r':results[k]===false?'x':''}))); }
    function answer(same){
      if(answered) return; answered=true; stop();
      const ok=same===cur.same; results.push(ok); drawDots();
      aSame.disabled=aDiff.disabled=true; nextBtn.disabled=results.length===ROUNDS;
      fb.className=ok?'fb ok':'fb no';
      fb.textContent=(ok?'Riktig. ':'Ikke denne gangen. ')+(cur.same?'Frasene var like: A – A.':'Frasene var ulike: A – B.');
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
