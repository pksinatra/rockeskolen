/* Melodi, leksjon 4. */
(function(K){
  const {h,shuffle,markDone,completeBox}=K;
  const {nm,playMelody,keyboard}=K.mel;

  function lesson4(root,i){
    root.append(
      h('h2',{},'Spill etter gehør'),
      h('p',{class:'intro'},'Å spille etter gehør er å finne tonene du hører uten noter. Start på tonen du får oppgitt, og lytt: går neste tone opp eller ned, i trinn eller sprang? Spill hele melodien tone for tone. Bommer du, starter du fra første tone igjen.')
    );
    const POOL=[[60,62,64],[64,62,60],[60,64,67],[67,65,64,62],[64,65,67,64],[60,62,64,60],[67,64,62,60],[65,67,69,67]];
    const tasks=shuffle(POOL.filter(m=>m.length===3)).slice(0,2).concat(shuffle(POOL.filter(m=>m.length===4)).slice(0,2));
    let t=0, pos=0, busy=false;
    const task=h('div',{class:'task'}); const fb=h('p',{class:'fb'});
    const prog=h('div',{class:'score','aria-hidden':'true'});
    const kb=keyboard(60,72,onKey);
    const playBtn=h('button',{class:'btn primary',type:'button',onclick:()=>playMelody(tasks[t])},'Hør melodien');
    root.append(h('h3',{},'Prøv selv'),task,h('div',{class:'btns'},playBtn),prog,kb.el,fb);

    function draw(){ prog.replaceChildren(...tasks[t].map((_,k)=>h('i',{class:k<pos?'r':''}))); }
    function show(){
      pos=0; busy=false; fb.textContent=''; kb.clear('ref'); kb.set(tasks[t][0],'ref');
      task.replaceChildren(`Hør melodien og spill den. Den starter på ${nm(tasks[t][0])}.`,h('small',{},`Melodi ${t+1} av ${tasks.length}, ${tasks[t].length} toner.`));
      draw();
    }
    function onKey(m){
      if(busy||t>=tasks.length) return;
      const ms=tasks[t];
      if(m===ms[pos]){
        pos++; draw();
        if(pos<ms.length){ fb.className='fb'; fb.textContent=''; return; }
        busy=true; fb.className='fb ok'; fb.textContent=`Riktig: ${ms.map(nm).join(' – ')}.`;
        t++;
        if(t<tasks.length) setTimeout(show,1500);
        else { kb.clear('ref'); task.replaceChildren('Alle melodiene er spilt.'); markDone(i); root.append(completeBox(i,'Leksjonen er fullført.')); }
      } else {
        kb.flash(m,'bad',500);
        fb.className='fb no';
        fb.textContent=pos===0?`Start på den markerte tonen ${nm(ms[0])}.`:`Ikke den. Tone ${pos+1} går ${ms[pos]>ms[pos-1]?'opp':'ned'} fra ${nm(ms[pos-1])}. Start fra første tone igjen.`;
        pos=0; draw();
      }
    }
    show();
  }

  K.register(4,lesson4);
})(RSKurs);
