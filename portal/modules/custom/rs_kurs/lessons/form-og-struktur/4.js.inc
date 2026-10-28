/* Form og struktur, leksjon 4. */
(function(K){
  const {h,shuffle,markDone,completeBox,go}=K;
  const {PHRASES,playPhrases,stop}=K.form;

  function lesson4(root,i){
    const BPM=132, ROUNDS=5, PASS=4;
    const FORMS=['AABA','ABAB','AABB','ABAC'];
    root.append(
      h('h2',{},'Hør formen'),
      h('p',{class:'intro'},'Nå hører du fire fraser etter hverandre. Gi hver frase en bokstav: A for den første, B for den neste nye, og så videre. Velg formen du hører. Svar riktig på minst fire av fem for å fullføre leksjonen.')
    );
    let round=0, results=[], cur=null, answered=false;
    const status=h('div',{class:'task'}); const dots=h('div',{class:'score','aria-hidden':'true'});
    const parts=h('div',{class:'steps','aria-hidden':'true'});
    const playBtn=h('button',{class:'btn primary',type:'button',onclick:()=>playPhrases(cur.ids,BPM,p=>[...parts.children].forEach((s,k)=>s.classList.toggle('lit',k===p)))},'Spill formen');
    const nextBtn=h('button',{class:'btn',type:'button',onclick:next},'Neste');
    const ch=h('div',{class:'btns'}); const fb=h('p',{class:'fb'});
    root.append(status,dots,h('div',{class:'btns'},playBtn,nextBtn),parts,ch,fb);

    function newRound(){
      const form=FORMS[Math.floor(Math.random()*FORMS.length)];
      const pick=shuffle(PHRASES.map((_,k)=>k)), map={A:pick[0],B:pick[1],C:pick[2]};
      cur={form,ids:[...form].map(l=>map[l])}; answered=false;
      parts.replaceChildren(...[1,2,3,4].map(n=>h('span',{class:'n'},String(n))));
      ch.replaceChildren(...FORMS.map(f=>h('button',{class:'btn',type:'button',onclick:e=>answer(f,e.currentTarget)},f.split('').join(' – '))));
      status.replaceChildren(`Runde ${round+1} av ${ROUNDS}`,h('small',{},'Trykk «Spill formen» og lytt.'));
      nextBtn.disabled=true; fb.textContent=''; drawDots();
    }
    function drawDots(){ dots.replaceChildren(...Array.from({length:ROUNDS},(_,k)=>h('i',{class:results[k]===true?'r':results[k]===false?'x':''}))); }
    function answer(f,b){
      if(answered) return; answered=true; stop();
      const ok=f===cur.form; results.push(ok); drawDots();
      [...ch.children].forEach(x=>x.disabled=true);
      fb.className=ok?'fb ok':'fb no';
      fb.textContent=(ok?'Riktig. ':'Ikke denne gangen. ')+`Formen var ${cur.form.split('').join(' – ')}.`;
      [...parts.children].forEach((s,k)=>{ s.textContent=cur.form[k]; s.classList.remove('lit'); });
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
