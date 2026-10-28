/* Musikkproduksjon, leksjon 4. */
(function(K){
  const {h,shuffle,markDone,completeBox}=K;

  function lesson4(root,i){
    root.append(
      h('h2',{},'Signalkjeden'),
      h('p',{class:'intro'},'Når du tar opp sang eller et instrument, går lyden gjennom en kjede. Mikrofonen gjør lyd om til et svakt elektrisk signal. Mikrofonforsterkeren løfter signalet, og den er ofte bygd inn i lydkortet. Lydkortet gjør signalet om til digitale tall. Opptaksprogrammet (DAW) tar opp og redigerer. Til slutt går lyden tilbake gjennom lydkortet til hodetelefoner eller høyttalere.')
    );
    const STEPS=['Mikrofon','Mikrofonforsterker','Lydkort: analogt til digitalt','Opptaksprogram (DAW)','Lydkort: digitalt til analogt','Hodetelefoner eller høyttalere'];
    let pos=0;
    const picked=h('ol',{class:'picked'}); const fb=h('p',{class:'fb'});
    const order=h('div',{class:'order'});
    shuffle(STEPS).forEach(s=>{
      const b=h('button',{class:'btn',type:'button',onclick:()=>{
        if(b.disabled) return;
        if(s===STEPS[pos]){
          b.classList.add('placed'); b.disabled=true; picked.append(h('li',{},s)); pos++; fb.textContent='';
          if(pos===STEPS.length){ fb.className='fb ok'; fb.textContent='Riktig rekkefølge: fra lyd i rommet, via tall i datamaskinen, tilbake til lyd i ørene.'; markDone(i); root.append(completeBox(i,'Leksjonen er fullført.')); }
        } else {
          fb.className='fb no'; fb.textContent=pos===0?'Begynn der lyden fanges opp.':`Hva skjer med signalet rett etter «${STEPS[pos-1].toLowerCase()}»?`;
        }
      }},s);
      order.append(b);
    });
    root.append(h('h3',{},'Sett kjeden i rekkefølge'),order,picked,fb);
  }

  K.register(4,lesson4);
})(RSKurs);
