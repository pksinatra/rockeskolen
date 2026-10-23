/* Gi ut din egen musikk, leksjon 1. */
(function(K){
  const {h,shuffle,markDone,completeBox,go}=K;

  function note(m,delay,dur,type,vol){
    const c=K.ac(); if(!c) return;
    const t=c.currentTime+delay, f=440*Math.pow(2,(m-69)/12);
    const o=c.createOscillator(), g=c.createGain();
    o.type=type; o.frequency.value=f; o.connect(g); g.connect(c.destination);
    g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(vol,t+0.01);
    g.gain.exponentialRampToValueAtTime(0.0008,t+dur);
    o.start(t); o.stop(t+dur+0.05);
  }
  /* En enkel, egen melodi: samme verk, to innspillinger */
  const MELODY=[[67,1],[69,1],[71,2],[74,1],[72,1],[71,2],[69,1],[71,1],[72,1],[69,1],[67,4]];
  const BASS=[[43,4],[48,4],[50,4],[43,4]];
  function playVersion(v){
    const beat=v===1?0.34:0.24;
    let t=0;
    MELODY.forEach(([m,d])=>{
      if(v===1) note(m,t,d*beat*1.4,'triangle',0.3);
      else { note(m+12,t,d*beat*0.9,'square',0.07); note(m,t,d*beat*0.9,'sawtooth',0.05); }
      t+=d*beat;
    });
    if(v===2){
      let tb=0; BASS.forEach(([m,d])=>{ for(let k=0;k<d;k++){ note(m,tb,beat*0.8,'triangle',0.28); tb+=beat; } });
      for(let k=0;k<16;k++) note(k%2?84:96,k*beat,0.04,'square',0.03);
    }
  }

  function lesson1(root,i){
    root.append(
      h('h2',{},'Låten og innspillingen'),
      h('p',{class:'intro'},'Når du gir ut musikk, finnes det to ting som eies hver for seg. Verket er selve låten: melodien, akkordene og teksten. Innspillingen er lydfila, slik låten ble spilt inn, produsert og mikset. Hør den samme låten i to ulike innspillinger.'),
      h('div',{class:'btns'},
        h('button',{class:'btn',type:'button',onclick:()=>playVersion(1)},'Hør innspilling 1'),
        h('button',{class:'btn',type:'button',onclick:()=>playVersion(2)},'Hør innspilling 2')
      ),
      h('p',{class:'intro'},'Melodien er den samme, altså samme verk. Lyden, tempoet og arrangementet er forskjellig, altså to ulike innspillinger.'),
      h('h3',{},'Sorter: verket eller innspillingen?')
    );
    const items=shuffle([
      ['Melodien','v'],['Teksten','v'],['Akkordene i refrenget','v'],
      ['Lydfila du laster opp','i'],['Trommesporet slik det ble spilt inn','i'],['Miksen','i']
    ]);
    const fb=h('p',{class:'fb'}); const list=h('div',{class:'sort'});
    let correct=0, finished=false;
    items.forEach(([txt,ans])=>{
      const row=h('div',{class:'sort-row'});
      let locked=false;
      const pick=val=>{
        if(locked||finished) return;
        if(val===ans){ locked=true; row.className='sort-row right'; correct++; fb.className='fb ok'; fb.textContent=`Riktig: ${txt.toLowerCase()} hører til ${ans==='v'?'verket':'innspillingen'}.`; check(); }
        else { row.className='sort-row wrong'; fb.className='fb no'; fb.textContent= ans==='v' ? `${txt} er en del av selve låten, uansett hvem som spiller den inn.` : `${txt} finnes bare i denne bestemte innspillingen.`; }
      };
      row.append(h('span',{class:'lbl'},txt),h('span',{class:'pair'},
        h('button',{class:'btn',type:'button',onclick:()=>pick('v')},'Verket'),
        h('button',{class:'btn',type:'button',onclick:()=>pick('i')},'Innspillingen')));
      list.append(row);
    });
    function check(){ if(correct===items.length){ finished=true; markDone(i); root.append(completeBox(i,'Leksjonen er fullført.')); } }
    root.append(list,fb);
  }

  K.register(1,lesson1);
})(RSKurs);
