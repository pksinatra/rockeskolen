/* Akkorder og harmoni, leksjon 4. */
(function(K){
  const {h,markDone,completeBox,go}=K;
  const {note,keyName,degreeChord,tone,stop}=K.ak;

  function lesson4(root,i){
    const PROGS=[[1,5,6,4],[1,4,5,1],[6,4,1,5],[1,6,4,5]];
    const KEYS=['C4','G4','F4','D4'];
    const ROUNDS=5, PASS=4, SEC=1.1;
    root.append(
      h('h2',{},'Hør akkordrekken'),
      h('p',{class:'intro'},'De fleste poplåter bruker noen få trinnakkorder: I, IV, V og vi. Du hører fire akkorder med grunntonen i bassen. Lytt etter hvor rekken starter og hvor den lander, og velg riktig rekke. Svar riktig på minst fire av fem for å fullføre leksjonen.')
    );
    let round=0, results=[], cur=null, answered=false, timers=[];
    const status=h('div',{class:'task'}); const dots=h('div',{class:'score','aria-hidden':'true'});
    const lights=h('div',{class:'steps','aria-hidden':'true'});
    const playBtn=h('button',{class:'btn primary',type:'button',onclick:play},'Spill akkordrekken');
    const nextBtn=h('button',{class:'btn',type:'button',onclick:next},'Neste');
    const ch=h('div',{class:'choices'}); const fb=h('p',{class:'fb'});
    root.append(status,dots,h('div',{class:'btns'},playBtn,nextBtn),lights,ch,fb);
    K.onLeave(()=>{ timers.forEach(clearTimeout); timers=[]; });

    // Grunntonen i bassen under C4, treklangen samlet mellom C4 og B4.
    function voicing(c){
      const bass=48+((c.notes[0].midi%12)+12)%12;
      return [bass,...c.notes.map(n=>60+((n.midi%12)+12)%12)];
    }
    const label=(prog,tonic)=>{
      const cs=prog.map(d=>degreeChord(tonic,d));
      return `${cs.map(c=>c.roman).join(' – ')}  (${cs.map(c=>c.name).join(' – ')})`;
    };
    function newRound(){
      const tonic=note(KEYS[Math.floor(Math.random()*KEYS.length)]);
      const prog=PROGS[Math.floor(Math.random()*PROGS.length)];
      cur={tonic,prog}; answered=false;
      status.replaceChildren(`Runde ${round+1} av ${ROUNDS}: ${keyName(tonic)}`,h('small',{},'Trykk «Spill akkordrekken» og velg rekken du hører.'));
      lights.replaceChildren(...[1,2,3,4].map(n=>h('span',{class:'n'},String(n))));
      ch.replaceChildren(...PROGS.map(p=>h('button',{class:'choice',type:'button',onclick:e=>answer(p,e.currentTarget)},label(p,tonic))));
      nextBtn.disabled=true; fb.textContent=''; drawDots();
    }
    function drawDots(){ dots.replaceChildren(...Array.from({length:ROUNDS},(_,k)=>h('i',{class:results[k]===true?'r':results[k]===false?'x':''}))); }
    function play(){
      stop(); timers.forEach(clearTimeout); timers=[];
      cur.prog.forEach((d,k)=>{
        voicing(degreeChord(cur.tonic,d)).forEach(m=>tone(m,k*SEC,SEC*0.95));
        timers.push(setTimeout(()=>[...lights.children].forEach((s,j)=>s.classList.toggle('lit',j===k)),k*SEC*1000));
      });
      timers.push(setTimeout(()=>[...lights.children].forEach(s=>s.classList.remove('lit')),4*SEC*1000));
    }
    function answer(p,b){
      if(answered) return; answered=true;
      const ok=p===cur.prog; results.push(ok); drawDots();
      b.classList.add(ok?'right':'wrong');
      if(!ok) ch.children[PROGS.indexOf(cur.prog)].classList.add('right');
      fb.className=ok?'fb ok':'fb no';
      fb.textContent=(ok?'Riktig. ':'Ikke denne gangen. ')+`Rekken var ${label(cur.prog,cur.tonic)}.`;
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
