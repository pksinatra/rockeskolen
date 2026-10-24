/* Rytme, leksjon 2. */
(function(K){
  const {h,markDone,completeBox,go}=K;
  const {playMeter,stop}=K.rytme;

  function lesson2(root,i){
    root.append(
      h('h2',{},'Takt og betoning'),
      h('p',{class:'intro'},'Pulsen deles inn i takter. Det første slaget i hver takt er betont, altså tyngst. I 4/4-takt teller du 1 2 3 4, og i 3/4-takt teller du 1 2 3. 4/4 er vanligst i pop og rock, mens 3/4 kjenner du fra valsen.')
    );
    const count=h('div',{class:'steps','aria-hidden':'true'});
    function showCount(n){ count.replaceChildren(...Array.from({length:n},(_,k)=>h('span',{class:'n'},String(k+1)))); }
    function demo(n){
      showCount(n);
      playMeter(n,3,96,b=>{ [...count.children].forEach((s,k)=>s.classList.toggle('lit',k===b)); },()=>[...count.children].forEach(s=>s.classList.remove('lit')));
    }
    root.append(h('div',{class:'btns'},
      h('button',{class:'btn',type:'button',onclick:()=>demo(4)},'Hør 4/4'),
      h('button',{class:'btn',type:'button',onclick:()=>demo(3)},'Hør 3/4')),count);
    showCount(4);

    root.append(h('h3',{},'Lytteprøve'),h('p',{style:'margin:0'},'Du hører tolv slag. Tell fra det betonte slaget: kommer det igjen etter tre eller fire slag? Svar riktig på minst fire av fem.'));
    const ROUNDS=5, PASS=4;
    let round=0, results=[], cur=null, answered=false;
    const status=h('div',{class:'task'}); const dots=h('div',{class:'score','aria-hidden':'true'});
    const pulse=h('div',{class:'beats single','aria-hidden':'true'},h('i'));
    const playBtn=h('button',{class:'btn primary',type:'button',onclick:play},'Spill slagene');
    const a3=h('button',{class:'btn',type:'button',onclick:()=>answer(3)},'3/4');
    const a4=h('button',{class:'btn',type:'button',onclick:()=>answer(4)},'4/4');
    const nextBtn=h('button',{class:'btn',type:'button',onclick:next},'Neste');
    const fb=h('p',{class:'fb'});
    root.append(status,dots,h('div',{class:'btns'},playBtn,a3,a4,nextBtn),pulse,fb);

    function newRound(){
      cur={n:Math.random()<0.5?3:4,bpm:84+Math.floor(Math.random()*5)*9}; answered=false;
      status.replaceChildren(`Runde ${round+1} av ${ROUNDS}`,h('small',{},'Trykk «Spill slagene» og lytt etter det betonte slaget.'));
      a3.disabled=a4.disabled=false; nextBtn.disabled=true; fb.textContent=''; drawDots();
    }
    function drawDots(){ dots.replaceChildren(...Array.from({length:ROUNDS},(_,k)=>h('i',{class:results[k]===true?'r':results[k]===false?'x':''}))); }
    function play(){
      const dot=pulse.firstChild;
      // Alle slag blinker likt, så det er øret som avgjør.
      playMeter(cur.n,12/cur.n,cur.bpm,()=>{ dot.className='soft'; setTimeout(()=>dot.className='',120); });
    }
    function answer(n){
      if(answered) return; answered=true; stop();
      const ok=n===cur.n; results.push(ok); drawDots();
      a3.disabled=a4.disabled=true; nextBtn.disabled=results.length===ROUNDS;
      fb.className=ok?'fb ok':'fb no';
      fb.textContent=(ok?'Riktig. ':'Ikke denne gangen. ')+`Det var ${cur.n}/4: det betonte slaget kom hvert ${cur.n===3?'tredje':'fjerde'} slag.`;
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
