/* Rytme, leksjon 1. */
(function(K){
  const {h,markDone,completeBox}=K;
  const {metronome,stop}=K.rytme;

  function lesson1(root,i){
    const BPM=90, TARGET=60/BPM, NEED=8;
    root.append(
      h('h2',{},'Pulsen'),
      h('p',{class:'intro'},'Pulsen er de jevne slagene du tramper eller nikker til når du hører musikk. Tempoet sier hvor fort pulsen går, målt i slag i minuttet (BPM). Her går metronomen i 90 BPM, og det første slaget i hver takt har en lysere lyd.'),
      h('h3',{},'Slå pulsen')
    );
    const task=h('div',{class:'task'},'Start metronomen og slå med på «Slå» eller mellomromstasten.',h('small',{},`Slå ${NEED} jevne slag i samme tempo som metronomen.`));
    const beats=h('div',{class:'beats','aria-hidden':'true'},...Array.from({length:4},()=>h('i')));
    const taps=h('div',{class:'score','aria-hidden':'true'});
    const fb=h('p',{class:'fb'});
    let running=false, times=[], solved=false;
    const startBtn=h('button',{class:'btn primary',type:'button',onclick:toggle},'Start metronomen');
    const pad=h('button',{class:'pad',type:'button',onpointerdown:e=>{e.preventDefault(); tap();}},'Slå');
    root.append(task,h('div',{class:'btns'},startBtn),beats,pad,taps,fb);

    function toggle(){
      if(running){ stop(); running=false; startBtn.textContent='Start metronomen'; [...beats.children].forEach(d=>d.classList.remove('on')); return; }
      running=true; startBtn.textContent='Stopp metronomen'; times=[]; drawTaps();
      metronome(BPM,4,b=>{ [...beats.children].forEach((d,k)=>d.classList.toggle('on',k===b)); });
    }
    function drawTaps(marks=[]){ taps.replaceChildren(...Array.from({length:NEED},(_,k)=>h('i',{class:marks[k]||''}))); }
    function tap(){
      if(solved) return;
      if(!running){ fb.className='fb no'; fb.textContent='Start metronomen først, så slår du med.'; return; }
      const c=K.ac(); const now=c?c.currentTime:performance.now()/1000;
      times.push(now); if(times.length>NEED) times.shift();
      pad.classList.add('hit'); setTimeout(()=>pad.classList.remove('hit'),90);
      const gaps=times.slice(1).map((t,k)=>t-times[k]);
      // Hvert mellomrom må ligge innenfor 15 % av pulsen.
      const marks=['r',...gaps.map(g=>Math.abs(g-TARGET)<=TARGET*0.15?'r':'x')];
      drawTaps(marks);
      if(gaps.length && Math.abs(gaps[gaps.length-1]-TARGET)>TARGET*0.15){
        const g=gaps[gaps.length-1];
        fb.className='fb no';
        fb.textContent=g>TARGET*1.5?'Der ble det en pause. Hold pulsen gående uten å stoppe.':(g<TARGET?'Litt for tidlig. Lytt til metronomen og vent på slaget.':'Litt for sent. Hold samme fart som metronomen.');
        times=[now]; setTimeout(()=>{ if(!solved) drawTaps(['r']); },350);
        return;
      }
      fb.className='fb'; fb.textContent=times.length>1?`${times.length} av ${NEED} jevne slag.`:'';
      if(times.length===NEED){
        solved=true; stop(); running=false; startBtn.textContent='Start metronomen';
        const avg=gaps.reduce((s,g)=>s+g,0)/gaps.length;
        fb.className='fb ok'; fb.textContent=`Jevn puls. Du holdt ${Math.round(60/avg)} BPM.`;
        markDone(i); root.append(completeBox(i,'Leksjonen er fullført.'));
      }
    }
    function key(e){
      if(!document.body.contains(pad)){ document.removeEventListener('keydown',key); return; }
      if(e.code==='Space'){ e.preventDefault(); if(!e.repeat) tap(); }
    }
    document.addEventListener('keydown',key);
    // Mellomrom skal bare slå, ikke også trykke knappen som har fokus.
    document.addEventListener('keyup',e=>{ if(e.code==='Space'&&document.body.contains(pad)) e.preventDefault(); });
    drawTaps();
  }

  K.register(1,lesson1);
})(RSKurs);
