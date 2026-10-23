/* Gi ut din egen musikk, leksjon 2. */
(function(K){
  const {h,shuffle,markDone,completeBox,go}=K;

  function lesson2(root,i){
    root.append(
      h('h2',{},'TONO og Gramo'),
      h('p',{class:'intro'},'TONO forvalter rettighetene til dem som har skrevet låten: komponister, tekstforfattere og musikkforlag. Gramo forvalter rettighetene til dem som har spilt inn musikken: utøverne og den som eier innspillingen, når innspillingen spilles på radio, TV eller offentlige steder. Inntektene fra strømming av selve innspillingen kommer via distributøren.'),
      h('h3',{},'Hvem betaler?')
    );
    const Q=shuffle([
      ['Du skrev teksten. Låten spilles på radio.','TONO','Teksten er en del av verket, og verket hører til TONO.'],
      ['Du spilte bass på innspillingen. Den spilles på radio.','Gramo','Du er utøver på innspillingen, og det hører til Gramo.'],
      ['Innspillingen strømmes på en strømmetjeneste. Hvem betaler ut for selve innspillingen?','Distributøren','Distributøren samler inn og betaler ut for innspillingen på strømmetjenestene.'],
      ['Et annet band spiller låten din på en konsert.','TONO','Ingen innspilling er involvert, bare verket. Det hører til TONO.'],
      ['Bandet eier masteren. Innspillingen spilles på et kjøpesenter.','Gramo','Offentlig avspilling av en innspilling hører til Gramo.']
    ]);
    const OPTS=['TONO','Gramo','Distributøren'];
    let k=0, score=0;
    const status=h('div',{class:'task'}); const dots=h('div',{class:'score','aria-hidden':'true'});
    const ch=h('div',{class:'choices'}); const fb=h('p',{class:'fb'});
    const nextBtn=h('button',{class:'btn',type:'button',onclick:()=>{k++; k<Q.length?show():finish();}},'Neste');
    const res=[];
    root.append(status,dots,ch,fb,h('div',{class:'btns'},nextBtn));
    function drawDots(){ dots.replaceChildren(...Q.map((_,n)=>h('i',{class:res[n]===true?'r':res[n]===false?'x':''}))); }
    function show(){
      const [q,ans,why]=Q[k]; let answered=false; nextBtn.disabled=true; fb.textContent='';
      status.replaceChildren(q,h('small',{},`Spørsmål ${k+1} av ${Q.length}`));
      ch.replaceChildren(...OPTS.map(o=>{
        const b=h('button',{class:'choice',type:'button',onclick:()=>{
          if(answered) return; answered=true;
          const ok=o===ans; res.push(ok); if(ok) score++;
          b.classList.add(ok?'right':'wrong');
          if(!ok) [...ch.children].find(x=>x.textContent===ans).classList.add('right');
          fb.className=ok?'fb ok':'fb no'; fb.textContent=(ok?'Riktig. ':`Riktig svar er ${ans}. `)+why;
          nextBtn.disabled=false; nextBtn.textContent=k===Q.length-1?'Se resultatet':'Neste'; drawDots();
        }},o);
        return b;
      }));
      drawDots();
    }
    function finish(){
      ch.replaceChildren(); fb.textContent=''; nextBtn.remove();
      if(score>=4){ status.replaceChildren(`${score} av ${Q.length} riktige.`); markDone(i,Math.round(score/Q.length*100)); root.append(completeBox(i,'Leksjonen er fullført.')); }
      else { status.replaceChildren(`${score} av ${Q.length} riktige. Du trenger 4 for å fullføre.`); root.append(h('div',{class:'btns'},h('button',{class:'btn primary',type:'button',onclick:()=>go(i)},'Prøv igjen'))); }
    }
    show();
  }

  K.register(2,lesson2);
})(RSKurs);
