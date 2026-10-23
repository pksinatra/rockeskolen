/* Gi ut din egen musikk, leksjon 4. */
(function(K){
  const {h,shuffle,markDone,completeBox,go}=K;

  function lesson4(root,i){
    root.append(
      h('h2',{},'Lag en utgivelsesplan'),
      h('p',{class:'intro'},'En utgivelse tar flere uker å forberede. Sett først stegene i riktig rekkefølge. Velg deretter en dato, så får du en plan med datoer.'),
      h('h3',{},'Sett stegene i rekkefølge')
    );
    const STEPS=['Skriftlig avtale om fordelingen','Miks og master','Cover og metadata','Last opp til distributøren','Send låten til vurdering hos strømmetjenestene'];
    let pos=0;
    const picked=h('ol',{class:'picked'}); const fb=h('p',{class:'fb'});
    const order=h('div',{class:'order'});
    shuffle(STEPS).forEach(s=>{
      const b=h('button',{class:'btn',type:'button',onclick:()=>{
        if(b.classList.contains('placed')) return;
        if(s===STEPS[pos]){ b.classList.add('placed'); b.disabled=true; picked.append(h('li',{},s)); pos++; fb.textContent='';
          if(pos===STEPS.length){ fb.className='fb ok'; fb.textContent='Riktig rekkefølge.'; markDone(i); showPlan(); root.append(completeBox(i,'Leksjonen er fullført.')); } }
        else { fb.className='fb no'; fb.textContent= pos===0 ? 'Begynn med det som må være avklart før alt annet.' : `Hva må være ferdig rett etter «${STEPS[pos-1].toLowerCase()}»?`; }
      }},s);
      order.append(b);
    });
    root.append(order,picked,fb);

    function showPlan(){
      const d0=new Date(); d0.setDate(d0.getDate()+56+((5-d0.getDay()+7)%7));
      const iso=d=>d.toISOString().slice(0,10);
      const input=h('input',{type:'date',value:iso(d0),'aria-label':'Utgivelsesdato'});
      const tl=h('ol',{class:'timeline'}); const tip=h('p',{class:'fb'});
      const PLAN=[
        [56,'Bestem dato og skriv avtalen om fordelingen'],
        [42,'Miks og master er ferdig'],
        [35,'Cover og metadata er klart: artistnavn, låttittel og alle bidragsytere'],
        [28,'Last opp til distributøren'],
        [21,'Send låten til vurdering hos strømmetjenestene, senest sju dager før'],
        [14,'Meld verket til TONO'],
        [0,'Utgivelsesdag']
      ];
      const fmt=d=>d.toLocaleDateString('nb-NO',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
      function draw(){
        const r=new Date(input.value+'T12:00:00'); if(isNaN(r)) return;
        tl.replaceChildren(...PLAN.map(([off,txt])=>{ const d=new Date(r); d.setDate(d.getDate()-off);
          return h('li',{class:off===0?'release':''},h('time',{datetime:iso(d)},fmt(d)),h('span',{},txt)); }));
        tip.className='fb'; tip.textContent= r.getDay()===5 ? '' : 'Tips: Mange velger fredag som utgivelsesdag, fordi spillelister for ny musikk ofte oppdateres da.';
      }
      input.addEventListener('change',draw); draw();
      root.append(h('h3',{},'Din plan'),h('label',{},'Utgivelsesdato ',input),tl,tip);
    }
  }

  K.register(4,lesson4);
})(RSKurs);
