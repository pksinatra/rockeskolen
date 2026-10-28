/* Låtskriving, leksjon 4. */
(function(K){
  const {h,markDone,completeBox}=K;

  function lesson4(root,i){
    root.append(
      h('h2',{},'Bygg låtformen'),
      h('p',{class:'intro'},'Nå setter du sammen formen til din egen låt. Det finnes mange gode former, men denne oppgaven har noen regler som gir en klassisk poplåt: start med intro, ha minst to vers og minst tre refreng, legg C-delen etter andre refreng, la den følges av et refreng, og avslutt med outro.')
    );
    const PARTS=['Intro','Vers','Refreng','C-del','Outro'];
    let form=[], solved=false;
    const strip=h('div',{class:'steps','aria-live':'polite'});
    const pal=h('div',{class:'btns'},...PARTS.map(p=>h('button',{class:'btn',type:'button',onclick:()=>{ if(form.length<12){ form.push(p); draw(); } }},p)));
    const undo=h('button',{class:'btn',type:'button',onclick:()=>{ form.pop(); draw(); }},'Angre');
    const check=h('button',{class:'btn primary',type:'button',onclick:verify},'Sjekk formen');
    const fb=h('p',{class:'fb'});
    root.append(h('h3',{},'Din låt'),pal,strip,h('div',{class:'btns'},check,undo),fb);

    function draw(){
      strip.replaceChildren(...(form.length?form:['Tom']).map(p=>h('span',{class:'n'},p)));
      undo.disabled=!form.length;
    }
    function problems(){
      const n=p=>form.filter(x=>x===p).length;
      const out=[];
      if(form[0]!=='Intro') out.push('Start med intro.');
      if(form[form.length-1]!=='Outro') out.push('Avslutt med outro.');
      if(n('Intro')>1||n('Outro')>1) out.push('Intro og outro skal bare komme én gang.');
      if(n('Vers')<2) out.push('Ha minst to vers.');
      if(n('Refreng')<3) out.push('Ha minst tre refreng.');
      if(n('C-del')!==1) out.push('Ha nøyaktig én C-del.');
      else {
        const c=form.indexOf('C-del'), before=form.slice(0,c).filter(x=>x==='Refreng').length;
        if(before<2) out.push('Legg C-delen etter andre refreng.');
        if(form[c+1]!=='Refreng') out.push('La C-delen følges av et refreng.');
      }
      return out;
    }
    function verify(){
      const p=problems();
      if(p.length){ fb.className='fb no'; fb.textContent='Ikke helt ennå: '+p.join(' '); return; }
      fb.className='fb ok'; fb.textContent=`Formen fungerer: ${form.join(' – ')}.`;
      if(!solved){ solved=true; markDone(i); root.append(completeBox(i,'Leksjonen er fullført.')); }
    }
    draw();
  }

  K.register(4,lesson4);
})(RSKurs);
