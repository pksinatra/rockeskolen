/* Musikkteori fra bunnen, leksjon 3. */
(function(K){
  const {h,markDone,completeBox,go}=K;
  const {nm,MAJOR,keyboard,playSeq}=K.teori;

  function lesson3(root,i){
    const target=MAJOR.map(x=>67+x);
    const gaps=['hel','hel','halv','hel','hel','hel','halv'];
    root.append(
      h('h2',{},'Bygg G-dur'),
      h('p',{class:'intro'},'Start på den markerte G-en og spill durskalaen tone for tone, med mønsteret hel, hel, halv, hel, hel, hel, halv. Ett av trinnene krever en svart tangent. Finn ut hvilket.')
    );
    let pos=0;
    const task=h('div',{class:'task'}); const fb=h('p',{class:'fb'});
    const kb=keyboard(60,84,onKey);
    const built=h('div',{class:'steps','aria-label':'Tonene du har spilt'});
    const restart=h('button',{class:'btn',type:'button',onclick:reset},'Begynn på nytt');
    root.append(task,h('div',{class:'btns'},restart),kb.el,built,fb);
    function reset(){
      pos=0; kb.clear('good'); kb.clear('ref'); kb.set(67,'ref'); built.replaceChildren(); fb.textContent=''; update();
    }
    function update(){
      if(pos===0) task.replaceChildren('Trykk G for å starte.',h('small',{},'Tone 1 av 8'));
      else if(pos<8) task.replaceChildren(`Neste steg er en ${gaps[pos-1]}tone opp fra ${nm(target[pos-1])}.`,h('small',{},`Tone ${pos+1} av 8`));
    }
    function onKey(m){
      if(pos>=8) return;
      if(m===target[pos]){
        kb.set(m,'good'); built.append(h('span',{class:'n lit'},nm(m))); fb.textContent='';
        pos++;
        if(pos===8){
          task.replaceChildren('G-dur er ferdig bygd.');
          fb.className='fb ok'; fb.textContent='Det svarte trinnet var F♯. Derfor har G-dur ett kryss.';
          setTimeout(()=>playSeq(target,0.38,mm=>kb.flash(mm,'on',340)),400);
          markDone(i); root.append(completeBox(i,'Leksjonen er fullført.'));
        } else update();
      } else {
        kb.flash(m,'bad',600); fb.className='fb no';
        fb.textContent= pos===0 ? `Det var ${nm(m)}. Start på den markerte G-en.` : `Det var ${nm(m)}. Fra ${nm(target[pos-1])} skal du gå en ${gaps[pos-1]}tone opp.`;
      }
    }
    reset();
  }

  K.register(3,lesson3);
})(RSKurs);
