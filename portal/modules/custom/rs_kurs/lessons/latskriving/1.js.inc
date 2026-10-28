/* Låtskriving, leksjon 1. */
(function(K){
  const {h,markDone,completeBox}=K;
  const {CHORDS,chord,playLoop,stop}=K.ls;

  function lesson1(root,i){
    root.append(
      h('h2',{},'Akkordrekken'),
      h('p',{class:'intro'},'Mange låter starter med en akkordrekke på fire takter som gjentas som en loop. I C-dur har du seks akkorder å velge mellom. C (I) er hjemme, G (V) skaper spenning som vil hjem, F (IV) og Am (vi) gir farge. Lag din egen rekke på fire akkorder og hør den som loop. Det finnes ingen fasit, men prøv å starte på C eller Am.')
    );
    let prog=[], heard=false;
    const slots=h('div',{class:'steps','aria-live':'polite'});
    const pal=h('div',{class:'btns'},...Object.entries(CHORDS).map(([n,c])=>h('button',{class:'btn',type:'button',onclick:()=>add(n)},`${n} (${c.roman})`)));
    const undo=h('button',{class:'btn',type:'button',onclick:()=>{ prog.pop(); draw(); }},'Angre');
    const play=h('button',{class:'btn primary',type:'button',onclick:loop},'Spill loopen');
    const fb=h('p',{class:'fb'});
    root.append(h('h3',{},'Lag rekken'),pal,slots,h('div',{class:'btns'},play,undo),fb);

    function draw(){
      slots.replaceChildren(...[0,1,2,3].map(k=>h('span',{class:'n'},prog[k]||'–')));
      undo.disabled=!prog.length; play.disabled=prog.length<4;
      [...pal.children].forEach(b=>b.disabled=prog.length>=4);
    }
    function add(n){ if(prog.length>=4) return; prog.push(n); chord(n,0,1.2); draw(); }
    function loop(){
      if(prog.length<4) return;
      fb.className='fb'; fb.textContent='Loopen spilles to ganger.';
      playLoop(prog,120,2,k=>[...slots.children].forEach((s,j)=>s.classList.toggle('lit',j===k)),()=>{
        [...slots.children].forEach(s=>s.classList.remove('lit'));
        const tip=prog[3]==='G'?'Rekken ender på G (V), så den drar tilbake mot starten. Det gjør loopen sømløs.'
          :prog[0]===prog[3]?'Rekken starter og slutter på samme akkord. Den føles avsluttet hver gang, som en hel setning.'
          :'Prøv gjerne å bytte siste akkord til G (V) og hør hvordan loopen drar tilbake til starten.';
        fb.className='fb ok'; fb.textContent=`Din rekke: ${prog.join(' – ')} (${prog.map(n=>CHORDS[n].roman).join(' – ')}). ${tip}`;
        if(!heard){ heard=true; markDone(i); root.append(completeBox(i,'Leksjonen er fullført. Du kan fortsette å prøve nye rekker.')); }
      });
    }
    draw();
  }

  K.register(1,lesson1);
})(RSKurs);
