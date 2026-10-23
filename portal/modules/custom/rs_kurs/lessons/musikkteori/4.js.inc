/* Musikkteori fra bunnen, leksjon 4. */
(function(K){
  const {h,markDone,completeBox,go}=K;
  const {nm,MAJOR,keyboard,playSeq}=K.teori;

  function lesson4(root,i){
    root.append(
      h('h2',{},'Hør forskjellen'),
      h('p',{class:'intro'},'Du hører en skala. Er det en riktig durskala, eller er én av tonene senket en halvtone? Svar riktig på minst fire av fem for å fullføre leksjonen.')
    );
    const ROUNDS=5, PASS=4;
    let round=0, results=[], cur=null, answered=false;
    const status=h('div',{class:'task'});
    const dots=h('div',{class:'score','aria-hidden':'true'});
    const kb=keyboard(60,84,null,{labels:true});
    const playBtn=h('button',{class:'btn primary',type:'button',onclick:play},'Spill skalaen');
    const yes=h('button',{class:'btn',type:'button',onclick:()=>answer(false)},'Riktig durskala');
    const no=h('button',{class:'btn',type:'button',onclick:()=>answer(true)},'En tone er feil');
    const nextBtn=h('button',{class:'btn',type:'button',onclick:next},'Neste');
    const fb=h('p',{class:'fb'});
    root.append(status,dots,h('div',{class:'btns'},playBtn,yes,no,nextBtn),kb.el,fb);

    function newRound(){
      const root0=[60,62,65,67][Math.floor(Math.random()*4)];
      const altered=Math.random()<0.5;
      const degree=[2,5,6][Math.floor(Math.random()*3)];
      const notes=MAJOR.map((x,k)=>root0+x-(altered&&k===degree?1:0));
      cur={root0,altered,degree,notes}; answered=false;
      status.replaceChildren(`Runde ${round+1} av ${ROUNDS}`,h('small',{},'Trykk «Spill skalaen» og lytt.'));
      yes.disabled=no.disabled=false; nextBtn.disabled=true; fb.textContent=''; kb.clear('good'); kb.clear('bad');
      drawDots();
    }
    function drawDots(){ dots.replaceChildren(...Array.from({length:ROUNDS},(_,k)=>h('i',{class:results[k]===true?'r':results[k]===false?'x':''}))); }
    function play(){ kb.clear('on'); playSeq(cur.notes,0.42,m=>kb.flash(m,'on',360)); }
    function answer(saysAltered){
      if(answered) return; answered=true;
      const ok=saysAltered===cur.altered; results.push(ok); drawDots();
      yes.disabled=no.disabled=true; nextBtn.disabled=false;
      const name=nm(cur.root0)+'-dur';
      if(cur.altered){
        const wrongNote=cur.notes[cur.degree], rightNote=wrongNote+1;
        kb.set(wrongNote,'bad'); kb.set(rightNote,'good');
        fb.className=ok?'fb ok':'fb no';
        fb.textContent=(ok?'Riktig. ':'Ikke denne gangen. ')+`Trinn ${cur.degree+1} var senket: ${nm(wrongNote)} i stedet for ${nm(rightNote)} i ${name}.`;
      } else {
        cur.notes.forEach(m=>kb.set(m,'good'));
        fb.className=ok?'fb ok':'fb no';
        fb.textContent=(ok?'Riktig. ':'Ikke denne gangen. ')+`Det var en riktig ${name}.`;
      }
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
