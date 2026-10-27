/* Intervaller, leksjon 4. */
(function(K){
  const {h,markDone,completeBox,go}=K;
  const {tone,stop,keyboard}=K.int;

  function lesson4(root,i){
    root.append(
      h('h2',{},'Hør intervallet'),
      h('p',{class:'intro'},'Du hører to toner etter hverandre og så samtidig. Hvilket intervall er det? Svar riktig på minst seks av åtte for å fullføre leksjonen.')
    );
    const SET=[[3,'liten ters'],[4,'stor ters'],[5,'ren kvart'],[7,'ren kvint'],[12,'oktav']];
    const ROUNDS=8, PASS=6;
    let round=0, results=[], cur=null, answered=false;
    const status=h('div',{class:'task'});
    const dots=h('div',{class:'score','aria-hidden':'true'});
    const kb=keyboard(60,83);
    const playBtn=h('button',{class:'btn primary',type:'button',onclick:play},'Spill intervallet');
    const choices=h('div',{class:'btns'},...SET.map(([s,label])=>h('button',{class:'btn',type:'button',onclick:()=>answer(s)},label)));
    const nextBtn=h('button',{class:'btn',type:'button',onclick:next},'Neste');
    const fb=h('p',{class:'fb'});
    root.append(status,dots,h('div',{class:'btns'},playBtn,nextBtn),choices,kb.el,fb);

    function newRound(){
      const [semis,label]=SET[Math.floor(Math.random()*SET.length)];
      const lo=60+Math.floor(Math.random()*10);
      cur={lo,hi:lo+semis,semis,label}; answered=false;
      status.replaceChildren(`Runde ${round+1} av ${ROUNDS}`,h('small',{},'Trykk «Spill intervallet» og lytt.'));
      [...choices.children].forEach(b=>b.disabled=false); nextBtn.disabled=true; fb.textContent='';
      kb.clear('good'); kb.clear('bad'); drawDots();
    }
    function drawDots(){ dots.replaceChildren(...Array.from({length:ROUNDS},(_,k)=>h('i',{class:results[k]===true?'r':results[k]===false?'x':''}))); }
    function play(){
      stop(); tone(cur.lo,0,0.8); tone(cur.hi,0.7,0.8); tone(cur.lo,1.6,1.3); tone(cur.hi,1.6,1.3);
    }
    function answer(s){
      if(answered) return; answered=true;
      const ok=s===cur.semis; results.push(ok); drawDots();
      [...choices.children].forEach(b=>b.disabled=true); nextBtn.disabled=false;
      kb.set(cur.lo,'good'); kb.set(cur.hi,'good');
      fb.className=ok?'fb ok':'fb no';
      fb.textContent=(ok?'Riktig. ':'Ikke denne gangen. ')+`Det var en ${cur.label} (${cur.semis} halvtoner).`;
      if(results.length===ROUNDS) finish();
    }
    function next(){ round++; if(round<ROUNDS) newRound(); }
    function finish(){
      nextBtn.disabled=true;
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
