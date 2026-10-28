/* Form og struktur, leksjon 1. */
(function(K){
  const {h,shuffle,markDone,completeBox}=K;
  const {playBars,stop}=K.form;

  function lesson1(root,i){
    const BPM=112;
    root.append(
      h('h2',{},'Tell takter'),
      h('p',{class:'intro'},'Musikk er bygd av takter, og taktene samles i fraser. I pop og rock er delene nesten alltid fire eller åtte takter lange. Tell «1 2 3 4» og hold styr på hvor mange ganger du kommer tilbake til 1. Det første slaget i hver takt har en lysere lyd, og akkorden skifter på det.')
    );
    const lights=h('div',{class:'steps','aria-hidden':'true'});
    const demo=h('button',{class:'btn',type:'button',onclick:()=>{ lights.replaceChildren(...[1,2,3,4].map(n=>h('span',{class:'n'},String(n)))); playBars(4,BPM,b=>[...lights.children].forEach((s,k)=>s.classList.toggle('lit',k===b))); }},'Hør fire takter med telling');
    root.append(h('div',{class:'btns'},demo),lights,h('h3',{},'Prøv selv'));
    const tasks=shuffle([2,4,8,4,8,2]).slice(0,4);
    let t=0, busy=false;
    const task=h('div',{class:'task'}); const fb=h('p',{class:'fb'});
    const playBtn=h('button',{class:'btn primary',type:'button',onclick:()=>{ lights.replaceChildren(); playBars(tasks[t],BPM); }},'Spill frasen');
    const ch=h('div',{class:'btns'},...[2,4,8].map(n=>h('button',{class:'btn',type:'button',onclick:()=>answer(n)},`${n} takter`)));
    root.append(task,h('div',{class:'btns'},playBtn),ch,fb);

    function show(){
      busy=false; fb.textContent='';
      task.replaceChildren('Hvor mange takter er frasen?',h('small',{},`Frase ${t+1} av ${tasks.length}. Du kan spille den så mange ganger du vil.`));
    }
    function answer(n){
      if(busy) return;
      if(n===tasks[t]){
        busy=true; stop(); fb.className='fb ok'; fb.textContent=`Riktig: ${n} takter, ${n*4} slag.`;
        t++;
        if(t<tasks.length) setTimeout(show,1200);
        else { task.replaceChildren('Alle frasene er talt.'); [...ch.children].forEach(b=>b.disabled=true); markDone(i); root.append(completeBox(i,'Leksjonen er fullført.')); }
      } else {
        fb.className='fb no'; fb.textContent=n<tasks[t]?'Den er lengre. Spill igjen og tell hver gang du kommer til 1.':'Den er kortere. Spill igjen og tell hver gang du kommer til 1.';
      }
    }
    show();
  }

  K.register(1,lesson1);
})(RSKurs);
