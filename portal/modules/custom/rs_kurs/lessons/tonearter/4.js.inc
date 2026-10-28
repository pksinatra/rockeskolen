/* Tonearter og kvintsirkelen, leksjon 4. */
(function(K){
  const {h,markDone,completeBox,go}=K;
  const {note,names,step,plain,keyName,playChords,stop}=K.ta;

  function lesson4(root,i){
    const ROUNDS=6, PASS=5, SEC=1.0;
    const TONICS=['C4','D4','E4','F4','G4','A4'];
    // Treklang: grunntone, ters (3 eller 4 halvtoner) og ren kvint.
    const tri=(r,third)=>[r,step(r,2,third),step(r,4,7)];
    function cadence(t,minor){
      const iv=step(t,3,5), v=step(t,4,7);
      // I moll er V en durakkord med hevet ledetone (A-moll: E – G♯ – B).
      return minor?[tri(t,3),tri(iv,3),tri(v,4),tri(t,3)]:[tri(t,4),tri(iv,4),tri(v,4),tri(t,4)];
    }
    const chordName=ns=>plain(ns[0])+(ns[1].midi-ns[0].midi===3?'m':'');
    root.append(
      h('h2',{},'Hør tonearten'),
      h('p',{class:'intro'},'Tonearten høres tydeligst i en kadens: en kort akkordrekke som ender på grunntonen. I dur hører du I – IV – V – I, i moll i – iv – V – i. Legg merke til at V er en durakkord også i moll, fordi 7. trinn heves til ledetone. Hør kadensen og svar dur eller moll. Svar riktig på minst fem av seks for å fullføre leksjonen.')
    );
    let round=0, results=[], cur=null, answered=false;
    const status=h('div',{class:'task'}); const dots=h('div',{class:'score','aria-hidden':'true'});
    const lights=h('div',{class:'steps','aria-hidden':'true'});
    const playBtn=h('button',{class:'btn primary',type:'button',onclick:()=>playChords(cur.chords,SEC,k=>[...lights.children].forEach((s,j)=>s.classList.toggle('lit',j===k)))},'Spill kadensen');
    const aMaj=h('button',{class:'btn',type:'button',onclick:()=>answer(false)},'Dur');
    const aMin=h('button',{class:'btn',type:'button',onclick:()=>answer(true)},'Moll');
    const nextBtn=h('button',{class:'btn',type:'button',onclick:next},'Neste');
    const fb=h('p',{class:'fb'});
    root.append(status,dots,h('div',{class:'btns'},playBtn,aMaj,aMin,nextBtn),lights,fb);

    function newRound(){
      const t=note(TONICS[Math.floor(Math.random()*TONICS.length)]), minor=Math.random()<0.5;
      cur={t,minor,chords:cadence(t,minor)}; answered=false;
      status.replaceChildren(`Runde ${round+1} av ${ROUNDS}`,h('small',{},'Trykk «Spill kadensen» og lytt.'));
      lights.replaceChildren(...['1','2','3','4'].map(n=>h('span',{class:'n'},n)));
      aMaj.disabled=aMin.disabled=false; nextBtn.disabled=true; fb.textContent=''; drawDots();
    }
    function drawDots(){ dots.replaceChildren(...Array.from({length:ROUNDS},(_,k)=>h('i',{class:results[k]===true?'r':results[k]===false?'x':''}))); }
    function answer(minor){
      if(answered) return; answered=true; stop();
      const ok=minor===cur.minor; results.push(ok); drawDots();
      aMaj.disabled=aMin.disabled=true; nextBtn.disabled=results.length===ROUNDS;
      const v=cur.chords[2];
      fb.className=ok?'fb ok':'fb no';
      fb.textContent=(ok?'Riktig. ':'Ikke denne gangen. ')+`Det var ${keyName(cur.t,cur.minor)}: ${cur.chords.map(chordName).join(' – ')}. V-akkorden er ${names(v)}.`;
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
