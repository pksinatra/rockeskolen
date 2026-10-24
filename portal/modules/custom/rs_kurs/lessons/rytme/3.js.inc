/* Rytme, leksjon 3. */
(function(K){
  const {h,markDone,completeBox}=K;
  const {VALUES,beatsOf,playRhythm,rhythmSvg}=K.rytme;

  function lesson3(root,i){
    const BPM=80;
    root.append(
      h('h2',{},'Notverdier'),
      h('p',{class:'intro'},'Notverdien viser hvor lenge en tone varer. I 4/4-takt varer en fjerdedelsnote ett slag, en halvnote to slag og en helnote fire slag. To åttendeler deler ett slag i to, og de bindes sammen med en bjelke. Hver takt i 4/4 rommer til sammen fire slag.')
    );
    const examples=[['w',['w']],['h',['h','h']],['q',['q','q','q','q']],['e',['e','e','e','e']]];
    const grid=h('div',{class:'values'});
    examples.forEach(([k,tokens])=>{
      const svg=rhythmSvg(tokens,{width:220});
      grid.append(h('div',{class:'value'},
        h('div',{class:'value-head'},h('strong',{},VALUES[k].name),h('span',{},k==='e'?'½ + ½ slag':(VALUES[k].beats===1?'1 slag':VALUES[k].beats+' slag'))),
        svg,
        h('button',{class:'btn',type:'button',onclick:()=>light(svg,tokens)},'Hør')));
    });
    root.append(grid);
    function light(svg,tokens){
      svg.notes.forEach(n=>n.classList.remove('on'));
      playRhythm(tokens,BPM,k=>{ svg.notes.forEach((n,j)=>n.classList.toggle('on',j===k)); },()=>svg.notes.forEach(n=>n.classList.remove('on')));
    }

    root.append(h('h3',{},'Bygg takten du hører'));
    const TASKS=[['h','h'],['q','q','h'],['q','e','q','e']];
    let t=0, built=[];
    const task=h('div',{class:'task'});
    const preview=h('div',{class:'built'});
    const fb=h('p',{class:'fb'});
    const palette=h('div',{class:'btns'});
    const keys={};
    ['w','h','q','e'].forEach(k=>{
      keys[k]=h('button',{class:'btn',type:'button',onclick:()=>add(k)},VALUES[k].name);
      palette.append(keys[k]);
    });
    const listen=h('button',{class:'btn primary',type:'button',onclick:()=>playRhythm(TASKS[t],BPM)},'Hør takten');
    const undo=h('button',{class:'btn',type:'button',onclick:()=>{ built.pop(); fb.textContent=''; draw(); }},'Angre');
    root.append(task,h('div',{class:'btns'},listen,undo),palette,preview,fb);

    function show(){
      built=[]; fb.textContent='';
      task.replaceChildren('Hør takten og bygg den med notverdiene under.',h('small',{},`Takt ${t+1} av ${TASKS.length}. Du hører fire innteller-slag først.`));
      draw();
    }
    function draw(){
      const used=beatsOf(built);
      preview.replaceChildren(rhythmSvg(built,{label:'Takten du har bygd'}),h('p',{class:'sum'},`${used} av 4 slag`));
      Object.entries(keys).forEach(([k,b])=>{ b.disabled=used+VALUES[k].beats>4; });
      undo.disabled=!built.length;
    }
    function add(k){
      if(t>=TASKS.length||beatsOf(built)+VALUES[k].beats>4) return;
      built.push(k); draw();
      if(beatsOf(built)<4) return;
      if(built.join()===TASKS[t].join()){
        fb.className='fb ok'; fb.textContent='Riktig.';
        t++;
        if(t<TASKS.length){ setTimeout(show,900); }
        else {
          task.replaceChildren('Alle tre taktene er riktige.');
          Object.values(keys).forEach(b=>b.disabled=true); listen.disabled=undo.disabled=true;
          markDone(i); root.append(completeBox(i,'Leksjonen er fullført.'));
        }
      } else {
        const wrongAt=built.findIndex((k2,j)=>k2!==TASKS[t][j]);
        let slag=0; for(let j=0;j<wrongAt;j++) slag+=VALUES[built[j]].beats;
        fb.className='fb no';
        fb.textContent=`Takten er full, men rytmen er en annen fra slag ${slag+1}. Hør igjen og prøv på nytt.`;
        built=built.slice(0,Math.max(0,wrongAt)); setTimeout(draw,1400);
      }
    }
    show();
  }

  K.register(3,lesson3);
})(RSKurs);
