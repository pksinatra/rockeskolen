/* Musikkproduksjon, leksjon 3. */
(function(K){
  const {h,markDone,completeBox}=K;
  const {playMix}=K.prod;

  function lesson3(root,i){
    root.append(
      h('h2',{},'Stereobildet'),
      h('p',{class:'intro'},'Med panorering plasserer du hvert instrument fra venstre til høyre i stereobildet. Et vanlig utgangspunkt er å holde stortromme, bass og vokal i midten, fordi de bærer låten. Instrumenter som spiller samme rolle, som to gitarer, legges gjerne på hver sin side. Da får alt plass. Bruk hodetelefoner for å høre det best.')
    );
    const INSTR=[['kick','Stortromme'],['bass','Bass'],['vokal','Vokal'],['gitar1','Gitar 1'],['gitar2','Gitar 2']];
    const POS=[[-0.8,'Venstre'],[0,'Midten'],[0.8,'Høyre']];
    const pans={kick:-0.8,bass:0.8,vokal:-0.8,gitar1:0,gitar2:0};
    const rows=h('div',{class:'pan-rows'});
    INSTR.forEach(([k,label])=>{
      const btns=POS.map(([v,name])=>{ const b=h('button',{class:'btn toggle',type:'button','aria-pressed':String(pans[k]===v),onclick:()=>{ pans[k]=v; btns.forEach((x,j)=>x.setAttribute('aria-pressed',String(POS[j][0]===v))); }},name); return b; });
      rows.append(h('div',{class:'pan-row'},h('span',{class:'lbl'},label),h('span',{class:'pair'},...btns)));
    });
    const fb=h('p',{class:'fb'});
    let solved=false;
    const play=h('button',{class:'btn primary',type:'button',onclick:()=>playMix(pans)},'Spill miksen');
    const check=h('button',{class:'btn',type:'button',onclick:verify},'Sjekk plasseringen');
    root.append(h('h3',{},'Plasser instrumentene'),h('p',{style:'margin:0 0 .5rem'},'Nå er alt plassert feil. Flytt instrumentene etter tommelfingerregelen, og hør forskjellen.'),rows,h('div',{class:'btns'},play,check),fb);

    function verify(){
      const out=[];
      ['kick','bass','vokal'].forEach(k=>{ if(pans[k]!==0) out.push(`${INSTR.find(x=>x[0]===k)[1]} skal i midten.`); });
      if(pans.gitar1===0||pans.gitar2===0||pans.gitar1===pans.gitar2) out.push('Legg gitarene på hver sin side.');
      if(out.length){ fb.className='fb no'; fb.textContent='Ikke helt: '+out.join(' '); return; }
      fb.className='fb ok'; fb.textContent='Riktig. Spill miksen igjen: nå står bunnen og vokalen støtt i midten, og gitarene fyller ut på sidene.';
      if(!solved){ solved=true; markDone(i); root.append(completeBox(i,'Leksjonen er fullført.')); }
    }
  }

  K.register(3,lesson3);
})(RSKurs);
