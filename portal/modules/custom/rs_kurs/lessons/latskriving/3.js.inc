/* Låtskriving, leksjon 3. */
(function(K){
  const {h,shuffle,markDone,completeBox}=K;
  const {playNotes}=K.ls;

  function lesson3(root,i){
    root.append(
      h('h2',{},'Ord og stavelser'),
      h('p',{class:'intro'},'Teksten skal sitte på melodien. En enkel regel er én stavelse per tone, så linjen og melodien bør ha like mange. Tell stavelsene ved å klappe mens du sier linjen. Rim binder linjene sammen: ord rimer når de låter likt fra den siste trykksterke vokalen, som natt og hatt.')
    );
    // Egne linjer. Stavelsene er talt på bokmål.
    const LINES=[['Jeg går hjem i kveld',5],['Du er alt jeg vil ha',6],['Vi danser til det blir lyst',7],['Hør på regnet mot ruta',7],['Når morgenen kommer',6],['Sommeren er her',5],['Vi synger hele natten',7]];
    const MELODY={5:[64,62,60,62,64],6:[67,67,65,64,62,60],7:[60,62,64,65,67,65,64]};
    const syll=[5,6,7].map(n=>{
      const right=shuffle(LINES.filter(l=>l[1]===n))[0];
      const others=[5,6,7].filter(x=>x!==n).map(x=>shuffle(LINES.filter(l=>l[1]===x))[0]);
      return {kind:'syll',n,q:`Melodien har ${n} toner. Hvilken linje passer?`,right:right[0],opts:shuffle([right,...others]).map(l=>l[0]),why:`«${right[0]}» har ${n} stavelser.`};
    });
    const RHYMES=[['natt',['hatt','nett','kalt']],['sol',['stol','sal','sjel']],['hjem',['frem','hjelp','hemme']],['by',['fly','bølge','bake']],['dag',['slag','tak','dans']]];
    const rhyme=shuffle(RHYMES).slice(0,3).map(([w,[r,...x]])=>({kind:'rhyme',q:`Hvilket ord rimer på «${w}»?`,right:r,opts:shuffle([r,...x]),why:`«${w}» og «${r}» låter likt fra vokalen og ut.`}));
    const tasks=shuffle(syll).slice(0,2).concat(rhyme);
    let t=0, busy=false;
    const task=h('div',{class:'task'}); const ch=h('div',{class:'choices'}); const fb=h('p',{class:'fb'});
    const play=h('button',{class:'btn primary',type:'button',onclick:()=>playNotes(MELODY[tasks[t].n],0.42)},'Hør melodien');
    const playRow=h('div',{class:'btns'},play);
    root.append(h('h3',{},'Prøv selv'),task,playRow,ch,fb);

    function show(){
      const x=tasks[t]; busy=false; fb.textContent='';
      playRow.hidden=x.kind!=='syll';
      task.replaceChildren(x.q,h('small',{},`Oppgave ${t+1} av ${tasks.length}.`));
      ch.replaceChildren(...x.opts.map(o=>{ const b=h('button',{class:'choice',type:'button',onclick:()=>answer(o,b)},o); return b; }));
    }
    function answer(o,b){
      if(busy) return;
      const x=tasks[t];
      if(o===x.right){
        busy=true; b.classList.add('right'); fb.className='fb ok'; fb.textContent=`Riktig. ${x.why}`;
        t++;
        if(t<tasks.length) setTimeout(show,1500);
        else { playRow.hidden=true; task.replaceChildren('Alle oppgavene er løst.'); markDone(i); root.append(completeBox(i,'Leksjonen er fullført.')); }
      } else {
        b.classList.add('wrong'); fb.className='fb no';
        fb.textContent=x.kind==='syll'?'Ikke helt. Klapp stavelsene mens du sier linjen, og sammenlign med antall toner.':'Ikke helt. Si ordene høyt og hør på slutten fra vokalen og ut.';
      }
    }
    show();
  }

  K.register(3,lesson3);
})(RSKurs);
