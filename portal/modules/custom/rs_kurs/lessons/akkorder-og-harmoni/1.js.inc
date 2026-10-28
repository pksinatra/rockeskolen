/* Akkorder og harmoni, leksjon 1. */
(function(K){
  const {h,shuffle,markDone,completeBox}=K;
  const {note,name,names,triad,chordName,playChord,keyboard}=K.ak;

  function lesson1(root,i){
    root.append(
      h('h2',{},'Bygg en durakkord'),
      h('p',{class:'intro'},'En treklang er tre toner stablet i terser: grunntone, ters og kvint. I en durakkord ligger tersen en stor ters (fire halvtoner) over grunntonen, og kvinten en liten ters (tre halvtoner) over tersen. C-dur består av C – E – G.'),
      h('div',{class:'btns'},h('button',{class:'btn',type:'button',onclick:()=>playChord([60,64,67],ms=>kb.show(ms))},'Hør C-dur'))
    );
    const tasks=shuffle(['G4','F4','D4','A4','E4','Bb4']).slice(0,4).map(s=>{ const r=note(s); return {root:r,notes:triad(r,'maj')}; });
    let t=0, found=new Set(), busy=false;
    const task=h('div',{class:'task'}); const fb=h('p',{class:'fb'});
    const kb=keyboard(60,83,onKey);
    root.append(h('h3',{},'Prøv selv'),task,kb.el,fb);

    function show(){
      const c=tasks[t]; found=new Set(); busy=false;
      kb.clear('ref'); kb.clear('good'); kb.set(c.root.midi,'ref');
      task.replaceChildren(`Trykk de tre tonene i ${chordName(c.root,'maj')}-dur.`,h('small',{},`Akkord ${t+1} av ${tasks.length}. Grunntonen ${name(c.root)} er markert.`));
      fb.textContent='';
    }
    function onKey(m){
      if(busy||t>=tasks.length) return;
      const c=tasks[t], hit=c.notes.find(n=>((n.midi-m)%12+12)%12===0);
      if(!hit){
        kb.flash(m,'bad',600); fb.className='fb no';
        fb.textContent=found.size===0
          ? `Begynn med grunntonen ${name(c.root)}, og tell en stor ters opp til tersen.`
          : `Ikke med i ${chordName(c.root,'maj')}-dur. Tersen er fire halvtoner over grunntonen, kvinten sju.`;
        return;
      }
      kb.set(m,'good'); found.add(name(hit)); fb.className='fb'; fb.textContent=`${name(hit)} er med.`;
      if(found.size<3) return;
      busy=true; fb.className='fb ok'; fb.textContent=`Riktig: ${chordName(c.root,'maj')}-dur er ${names(c.notes)}.`;
      playChord(c.notes.map(n=>n.midi));
      t++;
      if(t<tasks.length) setTimeout(show,2200);
      else { task.replaceChildren('Alle akkordene er bygd.'); markDone(i); root.append(completeBox(i,'Leksjonen er fullført.')); }
    }
    show();
  }

  K.register(1,lesson1);
})(RSKurs);
