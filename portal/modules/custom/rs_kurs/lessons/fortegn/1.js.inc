/* Fortegn og andre tegn, leksjon 1. */
(function(K){
  const {h,shuffle,markDone,completeBox}=K;
  const {pc,keyboard}=K.ft;

  function lesson1(root,i){
    root.append(
      h('h2',{},'♯, ♭ og ♮'),
      h('p',{class:'intro'},'Et fortegn foran en note endrer tonehøyden. ♯ (kryss) hever tonen en halvtone, ♭ (b) senker den en halvtone, og ♮ (oppløsningstegn) gjør tonen til stamtone igjen. En halvtone er avstanden fra én tangent til den nærmeste, hvit eller svart. Mellom E og F og mellom B og C er det ingen svart tangent.')
    );
    const tasks=shuffle(['F♯','B♭','E♭','C♯','A♭','G♯']).slice(0,5);
    let t=0, busy=false;
    const task=h('div',{class:'task'}); const fb=h('p',{class:'fb'});
    const kb=keyboard(60,71,onKey);
    root.append(h('h3',{},'Finn tonen'),task,kb.el,fb);
    function show(){
      busy=false; fb.textContent=''; const n=tasks[t];
      kb.clear('ref'); kb.set(60+pc(n[0]),'ref');
      task.replaceChildren(`Trykk ${n}.`,h('small',{},`Oppgave ${t+1} av ${tasks.length}. Stamtonen ${n[0]} er markert.`));
    }
    function onKey(m){
      if(busy||t>=tasks.length) return;
      const n=tasks[t], want=60+pc(n);
      if(m===want){
        busy=true; kb.flash(m,'good',800); fb.className='fb ok';
        fb.textContent=`Riktig: ${n} er ${n[0]} ${n[1]==='♯'?'hevet':'senket'} en halvtone.`;
        t++;
        if(t<tasks.length) setTimeout(show,1300);
        else { kb.clear('ref'); task.replaceChildren('Alle tonene er funnet.'); markDone(i); root.append(completeBox(i,'Leksjonen er fullført.')); }
      } else {
        kb.flash(m,'bad',500); fb.className='fb no';
        fb.textContent=`Ikke helt. Start på ${n[0]} og gå én tangent ${n[1]==='♯'?'til høyre':'til venstre'}.`;
      }
    }
    show();
  }

  K.register(1,lesson1);
})(RSKurs);
