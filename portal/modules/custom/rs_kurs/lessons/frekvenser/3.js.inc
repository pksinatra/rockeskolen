/* Frekvenser, leksjon 3. */
(function(K){
  const {h,shuffle,choiceTasks}=K;
  const {hz,stop}=K.fq;

  function lesson3(root,i){
    root.append(
      h('h2',{},'Overtoner'),
      h('p',{class:'intro'},'En tone består vanligvis av mange frekvenser samtidig. Den dypeste er grunntonen, og den bestemmer tonehøyden vi hører. Over den ligger svakere overtoner. Er grunntonen 100 Hz, finner du overtoner på 200, 300, 400 og 500 Hz. Første overtone ligger en oktav over grunntonen. Hvor sterke overtonene er, gir klangen: derfor låter piano og trompet ulikt på samme tone.'),
      h('div',{class:'btns'},
        h('button',{class:'btn',type:'button',onclick:()=>{ stop(); hz(220,0,1.2,'sine'); }},'Uten overtoner (sinus)'),
        h('button',{class:'btn',type:'button',onclick:()=>{ stop(); hz(220,0,1.2,'sawtooth'); }},'Med mange overtoner (sagtann)'),
        h('button',{class:'btn',type:'button',onclick:()=>{ stop(); [1,2,3,4,5].forEach((n,k)=>hz(110*n,k*0.6,0.55)); }},'Overtonerekken på 110 Hz'))
    );
    const T=[
      ['Grunntonen er 100 Hz. Hvor ligger første overtone?',['200 Hz','150 Hz','101 Hz'],'200 Hz','Første overtone er dobbelt så høy, en oktav over.'],
      ['Grunntonen er 100 Hz. Hvor ligger andre overtone?',['300 Hz','400 Hz','200 Hz'],'300 Hz','Overtonene er 2, 3, 4 … ganger grunntonen.'],
      ['Grunntonen er 110 Hz. Hvor ligger første overtone?',['220 Hz','330 Hz','120 Hz'],'220 Hz','110 × 2 = 220.'],
      ['Hva bestemmer tonehøyden vi hører?',['Grunntonen','Den sterkeste overtonen','Antall overtoner'],'Grunntonen','Grunntonen er den dypeste og vanligvis tydeligste frekvensen.'],
      ['Piano og trompet spiller samme tone. Hvorfor låter de ulikt?',['Overtonene er forskjellige','Grunntonen er forskjellig','Den ene er sterkere'],'Overtonene er forskjellige','Overtonene gir klangen.']
    ];
    const listen={q:'Hvilken lyd har flest overtoner?',
      show:x=>x.append(h('div',{class:'btns'},h('button',{class:'btn primary',type:'button',onclick:()=>{ stop(); hz(220,0,1,lsA); hz(220,1.2,1,lsB); }},'Spill lydene'))),
      opts:['Lyd 1','Lyd 2'],right:null,why:'Sagtannbølgen har alle overtonene. Sinusbølgen har ingen.',hint:'Den rikeste, mest skarpe lyden har flest overtoner.'};
    const lsA=Math.random()<0.5?'sine':'sawtooth', lsB=lsA==='sine'?'sawtooth':'sine';
    listen.right=lsA==='sawtooth'?'Lyd 1':'Lyd 2';
    choiceTasks(root,i,shuffle(T).slice(0,4).map(([q,opts,right,why])=>({q,opts:shuffle(opts),right,why,hint:'Overtonene er 2, 3, 4 … ganger grunntonen.'})).concat(listen));
  }

  K.register(3,lesson3);
})(RSKurs);
