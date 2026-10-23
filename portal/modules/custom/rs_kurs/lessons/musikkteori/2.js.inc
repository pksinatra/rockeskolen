/* Musikkteori fra bunnen, leksjon 2. */
(function(K){
  const {h,markDone,completeBox,go}=K;
  const {nm,MAJOR,keyboard,playSeq}=K.teori;

  function lesson2(root,i){
    const scale=MAJOR.map(x=>60+x);
    root.append(
      h('h2',{},'Mønsteret i durskalaen'),
      h('p',{class:'intro'},'En durskala har sju toner før grunntonen kommer igjen. Avstanden mellom tonene følger alltid det samme mønsteret: hel, hel, halv, hel, hel, hel, halv. Spill C-dur og se hvor halvtonene havner.')
    );
    const kb=keyboard(60,76,null);
    const steps=h('div',{class:'steps','aria-label':'C-dur med avstander'});
    const gaps=['hel','hel','halv','hel','hel','hel','halv'];
    const nodes=scale.map(m=>h('span',{class:'n'},nm(m)));
    nodes.forEach((n,k)=>{ steps.append(n); if(k<gaps.length) steps.append(h('span',{class:'gap'+(gaps[k]==='halv'?' half':'')},gaps[k])); });
    const playBtn=h('button',{class:'btn primary',type:'button',onclick:()=>{
      nodes.forEach(n=>n.classList.remove('lit')); kb.clear('on');
      playSeq(scale,0.42,(m,k)=>{ kb.flash(m,'on',380); nodes[k].classList.add('lit'); });
    }},'Spill C-dur');
    root.append(h('div',{class:'btns'},playBtn),kb.el,steps);

    root.append(h('h3',{},'Spørsmål'),h('p',{style:'margin:0 0 .75rem'},'Mellom hvilke trinn i durskalaen ligger halvtonene?'));
    const opts=[['Mellom trinn 2–3 og 6–7',false],['Mellom trinn 3–4 og 7–8',true],['Mellom trinn 4–5 og 7–8',false]];
    const fb=h('p',{class:'fb'});
    const ch=h('div',{class:'choices'});
    let solved=false;
    opts.forEach(([txt,ok])=>{
      const b=h('button',{class:'choice',type:'button',onclick:()=>{
        if(solved) return;
        if(ok){ b.classList.add('right'); solved=true; fb.className='fb ok'; fb.textContent='Riktig. E–F og B–C er halvtoner i C-dur, og det er trinn 3–4 og 7–8.'; markDone(i); root.append(completeBox(i,'Leksjonen er fullført.')); }
        else { b.classList.add('wrong'); fb.className='fb no'; fb.textContent='Ikke helt. Spill skalaen igjen og se hvor det står «halv».'; }
      }},txt);
      ch.append(b);
    });
    root.append(ch,fb);
  }

  K.register(2,lesson2);
})(RSKurs);
