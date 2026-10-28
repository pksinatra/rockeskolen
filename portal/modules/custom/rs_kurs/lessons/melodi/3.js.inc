/* Melodi, leksjon 3. */
(function(K){
  const {h,markDone,completeBox,go}=K;
  const {nm,playMelody,stop}=K.mel;

  function lesson3(root,i){
    root.append(
      h('h2',{},'Hør avslutningen'),
      h('p',{class:'intro'},'Grunntonen er tonen melodien hviler på. Ender en melodi i C-dur på C, høres den ferdig. Ender den på en annen tone, som D, G eller B, høres den åpen, som et spørsmål som venter på svar. Du hører først C-dur-akkorden og så melodien. Svar riktig på minst fem av seks for å fullføre leksjonen.')
    );
    // Egne motiver i C-dur, hver med en avsluttet og en åpen slutt.
    const PHRASES=[
      [[60,62,64,65,67,65,64,62],60,67],
      [[67,65,64,62,64,65,62],60,71],
      [[64,65,67,72,71,69,67,65],60,62],
      [[72,71,69,67,65,64,62,64],60,62],
      [[60,64,67,65,64,62,64,62],60,71]
    ];
    const ROUNDS=6, PASS=5;
    let round=0, results=[], cur=null, answered=false;
    const status=h('div',{class:'task'}); const dots=h('div',{class:'score','aria-hidden':'true'});
    const playBtn=h('button',{class:'btn primary',type:'button',onclick:()=>playMelody(cur.ms,{chord:true})},'Spill melodien');
    const aDone=h('button',{class:'btn',type:'button',onclick:()=>answer(true)},'Avsluttet');
    const aOpen=h('button',{class:'btn',type:'button',onclick:()=>answer(false)},'Åpen');
    const nextBtn=h('button',{class:'btn',type:'button',onclick:next},'Neste');
    const fb=h('p',{class:'fb'});
    root.append(status,dots,h('div',{class:'btns'},playBtn,aDone,aOpen,nextBtn),fb);

    function newRound(){
      const [body,closed,open]=PHRASES[Math.floor(Math.random()*PHRASES.length)], done=Math.random()<0.5;
      cur={ms:[...body,done?closed:open],done}; answered=false;
      status.replaceChildren(`Runde ${round+1} av ${ROUNDS}`,h('small',{},'Trykk «Spill melodien» og lytt til siste tone.'));
      aDone.disabled=aOpen.disabled=false; nextBtn.disabled=true; fb.textContent=''; drawDots();
    }
    function drawDots(){ dots.replaceChildren(...Array.from({length:ROUNDS},(_,k)=>h('i',{class:results[k]===true?'r':results[k]===false?'x':''}))); }
    function answer(done){
      if(answered) return; answered=true; stop();
      const ok=done===cur.done; results.push(ok); drawDots();
      aDone.disabled=aOpen.disabled=true; nextBtn.disabled=results.length===ROUNDS;
      const last=cur.ms[cur.ms.length-1];
      fb.className=ok?'fb ok':'fb no';
      fb.textContent=(ok?'Riktig. ':'Ikke denne gangen. ')+(cur.done?`Melodien endte på grunntonen ${nm(last)}.`:`Melodien endte på ${nm(last)}, ikke på grunntonen C.`);
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

  K.register(3,lesson3);
})(RSKurs);
