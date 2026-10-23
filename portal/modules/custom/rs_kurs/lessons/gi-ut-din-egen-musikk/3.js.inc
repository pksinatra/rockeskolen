/* Gi ut din egen musikk, leksjon 3. */
(function(K){
  const {h,shuffle,markDone,completeBox,go}=K;

  function lesson3(root,i){
    root.append(
      h('h2',{},'Fordel låten'),
      h('p',{class:'intro'},'Før utgivelsen må dere bli enige om hvor stor del av verket hver låtskriver eier. Fordelingen bestemmer hvordan pengene fra TONO deles. Skriv den ned og meld den inn likt overalt.'),
      h('div',{class:'task'},'Ane skrev hele teksten. Ane og Jonas skrev melodien og akkordene sammen, like mye hver. Sara spilte trommer på innspillingen, men var ikke med og skrev låten. Bandet er enige om at tekst og musikk teller halvparten hver.',h('small',{},'Fordel verket mellom de tre.'))
    );
    const people=['Ane','Jonas','Sara']; const val={Ane:0,Jonas:0,Sara:0};
    const outs={}; const sum=h('p',{class:'sum'}); const fb=h('p',{class:'fb'});
    const grid=h('div',{class:'split'});
    people.forEach(p=>{
      const o=h('output',{'aria-live':'polite'},'0 %'); outs[p]=o;
      const ch=d=>{ val[p]=Math.max(0,Math.min(100,val[p]+d)); upd(); };
      grid.append(h('div',{class:'split-row'},h('span',{class:'lbl',style:'font-weight:700'},p),
        h('button',{class:'step-btn',type:'button','aria-label':`Mindre til ${p}`,onclick:()=>ch(-5)},'−'),o,
        h('button',{class:'step-btn',type:'button','aria-label':`Mer til ${p}`,onclick:()=>ch(5)},'+')));
    });
    let solved=false;
    const checkBtn=h('button',{class:'btn primary',type:'button',onclick:check},'Sjekk fordelingen');
    function upd(){ people.forEach(p=>outs[p].textContent=val[p]+' %'); const s=val.Ane+val.Jonas+val.Sara; sum.textContent=`Sum: ${s} %`; sum.style.color=s===100?'var(--ok)':'var(--muted)'; }
    function check(){
      if(solved) return;
      const s=val.Ane+val.Jonas+val.Sara;
      if(s!==100){ fb.className='fb no'; fb.textContent='Summen må bli nøyaktig 100 %.'; return; }
      if(val.Ane===75&&val.Jonas===25&&val.Sara===0){
        solved=true; fb.className='fb ok';
        fb.textContent='Riktig. Ane får hele tekstdelen (50 %) og halve musikkdelen (25 %), til sammen 75 %. Jonas får 25 %. Sara skrev ikke låten, men får sin del gjennom Gramo som utøver på innspillingen.';
        markDone(i); root.append(completeBox(i,'Leksjonen er fullført.'));
      } else if(val.Sara>0){ fb.className='fb no'; fb.textContent='Sara var ikke med og skrev låten. Hennes bidrag ligger i innspillingen, ikke i verket.'; }
      else { fb.className='fb no'; fb.textContent='Del først i to: teksten er 50 % og musikken 50 %. Fordel deretter hver halvdel på dem som skrev den.'; }
    }
    upd();
    root.append(grid,sum,h('div',{class:'btns'},checkBtn),fb,
      h('p',{class:'intro',style:'margin-top:1rem;font-size:.95rem;color:var(--muted)'},'Mange band avtaler også lik fordeling uansett hvem som skrev hva. Begge deler er greit. Det viktigste er at avtalen er skriftlig før utgivelsen.'));
  }

  K.register(3,lesson3);
})(RSKurs);
