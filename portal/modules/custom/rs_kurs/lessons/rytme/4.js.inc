/* Rytme, leksjon 4. */
(function(K){
  const {h,shuffle,markDone,completeBox,go}=K;
  const {playRhythm,rhythmSvg,stop}=K.rytme;

  function lesson4(root,i){
    const BPM=84, ROUNDS=5, PASS=4;
    const POOL=[
      ['q','q','q','q'],['h','q','q'],['q','q','h'],['h','h'],['w'],['q','h','q'],
      ['e','e','q','q'],['q','e','e','q'],['q','q','e','e'],['e','q','e','q'],['h','e','e'],['e','e','e','e']
    ];
    root.append(
      h('h2',{},'Hør rytmen'),
      h('p',{class:'intro'},'Du hører fire innteller-slag og deretter én takt rytme. Velg notebildet som passer. Tell slagene inni deg mens du lytter. Svar riktig på minst fire av fem for å fullføre leksjonen.')
    );
    let round=0, results=[], cur=null, answered=false;
    const status=h('div',{class:'task'}); const dots=h('div',{class:'score','aria-hidden':'true'});
    const playBtn=h('button',{class:'btn primary',type:'button',onclick:()=>playRhythm(cur.answer,BPM)},'Spill rytmen');
    const nextBtn=h('button',{class:'btn',type:'button',onclick:next},'Neste');
    const ch=h('div',{class:'choices rhythm-choices'}); const fb=h('p',{class:'fb'});
    root.append(status,dots,h('div',{class:'btns'},playBtn,nextBtn),ch,fb);

    function newRound(){
      const opts=shuffle(POOL).slice(0,3);
      cur={opts,answer:opts[Math.floor(Math.random()*3)]}; answered=false;
      status.replaceChildren(`Runde ${round+1} av ${ROUNDS}`,h('small',{},'Trykk «Spill rytmen», og velg deretter riktig notebilde.'));
      nextBtn.disabled=true; fb.textContent='';
      ch.replaceChildren(...opts.map((o,k)=>{
        const b=h('button',{class:'choice',type:'button','aria-label':`Alternativ ${k+1}`,onclick:()=>answer(o,b)},rhythmSvg(o,{width:240}));
        return b;
      }));
      drawDots();
    }
    function drawDots(){ dots.replaceChildren(...Array.from({length:ROUNDS},(_,k)=>h('i',{class:results[k]===true?'r':results[k]===false?'x':''}))); }
    function answer(o,b){
      if(answered) return; answered=true; stop();
      const ok=o===cur.answer; results.push(ok); drawDots();
      b.classList.add(ok?'right':'wrong');
      if(!ok) ch.children[cur.opts.indexOf(cur.answer)].classList.add('right');
      fb.className=ok?'fb ok':'fb no';
      fb.textContent=ok?'Riktig.':'Ikke denne gangen. Det grønne notebildet var rytmen du hørte. Trykk «Spill rytmen» og følg med i notene.';
      nextBtn.disabled=results.length===ROUNDS;
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

  K.register(4,lesson4);
})(RSKurs);
