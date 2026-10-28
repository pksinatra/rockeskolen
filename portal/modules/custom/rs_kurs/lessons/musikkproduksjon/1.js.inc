/* Musikkproduksjon, leksjon 1. */
(function(K){
  const {h,markDone,completeBox}=K;
  const {DRUMS,runGrid,stop}=K.prod;

  function lesson1(root,i){
    const BPM=100;
    root.append(
      h('h2',{},'Lag en loop'),
      h('p',{class:'intro'},'En trommemaskin deler takten i 16 steg, fire per slag. Det grunnleggende rockebeatet har stortromme på slag 1 og 3, skarptromme på slag 2 og 4, og hi-hat på alle åttendeler: hvert andre steg. Programmer beatet, og trykk «Spill» for å høre loopen mens du jobber.')
    );
    const ROWS=[['hat','Hi-hat'],['snare','Skarptromme'],['kick','Stortromme']];
    const grid={kick:Array(16).fill(false),snare:Array(16).fill(false),hat:Array(16).fill(false)};
    const cells={};
    const table=h('div',{class:'seq',role:'grid','aria-label':'Trommemaskin med 16 steg'});
    table.append(h('span',{class:'seq-label'}),...Array.from({length:16},(_,k)=>h('span',{class:'seq-num'+(k%4===0?' beat':'')},k%4===0?String(k/4+1):'')));
    ROWS.forEach(([d,label])=>{
      table.append(h('span',{class:'seq-label'},label));
      cells[d]=Array.from({length:16},(_,k)=>{
        const b=h('button',{class:'seq-cell'+(k%4===0?' beat':''),type:'button','aria-pressed':'false','aria-label':`${label}, steg ${k+1}`,onclick:()=>{ grid[d][k]=!grid[d][k]; b.setAttribute('aria-pressed',String(grid[d][k])); if(grid[d][k]){ const c=K.ac(); c&&DRUMS[d](c.currentTime+0.01); } }});
        table.append(b); return b;
      });
    });
    let playing=false;
    const play=h('button',{class:'btn primary',type:'button',onclick:()=>{
      if(playing){ stop(); playing=false; play.textContent='Spill'; clearCur(); return; }
      playing=true; play.textContent='Stopp';
      runGrid(()=>grid,BPM,s=>{ clearCur(); ROWS.forEach(([d])=>cells[d][s].classList.add('cur')); });
    }},'Spill');
    const clearCur=()=>ROWS.forEach(([d])=>cells[d].forEach(c=>c.classList.remove('cur')));
    const check=h('button',{class:'btn',type:'button',onclick:verify},'Sjekk beatet');
    const fb=h('p',{class:'fb'});
    root.append(h('div',{class:'seq-wrap'},table),h('div',{class:'btns'},play,check),fb);

    const WANT={kick:[0,8],snare:[4,12],hat:[0,2,4,6,8,10,12,14]};
    let solved=false;
    function verify(){
      const NAMES={kick:'Stortrommen',snare:'Skarptrommen',hat:'Hi-haten'};
      const wrong=Object.keys(WANT).filter(d=>grid[d].some((on,k)=>on!==WANT[d].includes(k)));
      if(wrong.length){
        const tips={kick:'skal på slag 1 og 3 (steg 1 og 9)',snare:'skal på slag 2 og 4 (steg 5 og 13)',hat:'skal på hvert andre steg (1, 3, 5 …)'};
        fb.className='fb no'; fb.textContent='Ikke helt: '+wrong.map(d=>`${NAMES[d]} ${tips[d]}`).join('. ')+'.'; return;
      }
      fb.className='fb ok'; fb.textContent='Riktig: dette er grunnbeatet i rock og pop. Prøv gjerne å legge til en ekstra stortromme på steg 11 og hør hvordan det endrer følelsen.';
      if(!solved){ solved=true; markDone(i); root.append(completeBox(i,'Leksjonen er fullført.')); }
    }
  }

  K.register(1,lesson1);
})(RSKurs);
