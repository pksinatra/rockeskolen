/* Frekvenser, leksjon 2. */
(function(K){
  const {h,shuffle,choiceTasks}=K;
  const {hz,stop}=K.fq;

  function lesson2(root,i){
    root.append(
      h('h2',{},'Oktaven dobler frekvensen'),
      h('p',{class:'intro'},'Går du en oktav opp, dobles frekvensen. Går du en oktav ned, halveres den. A er 110, 220, 440 og 880 Hz i fire oktaver etter hverandre. Tonene låter så like at de har samme navn.'),
      h('div',{class:'btns'},h('button',{class:'btn',type:'button',onclick:()=>{ stop(); [110,220,440,880].forEach((f,k)=>hz(f,k*0.75,0.7)); }},'Hør A i fire oktaver'))
    );
    const T=[
      ['Hva er A én oktav over 440 Hz?',['880 Hz','660 Hz','452 Hz'],'880 Hz','440 × 2 = 880.'],
      ['Hva er A én oktav under 440 Hz?',['220 Hz','330 Hz','400 Hz'],'220 Hz','440 ÷ 2 = 220.'],
      ['Hva er A to oktaver over 110 Hz?',['440 Hz','220 Hz','330 Hz'],'440 Hz','110 × 2 × 2 = 440.'],
      ['En tone er 300 Hz. Hva er frekvensen én oktav over?',['600 Hz','450 Hz','900 Hz'],'600 Hz','300 × 2 = 600.'],
      ['En tone er 1000 Hz. Hva er frekvensen én oktav under?',['500 Hz','750 Hz','250 Hz'],'500 Hz','1000 ÷ 2 = 500.'],
      ['A4 er 440 Hz. Hva er A2, to oktaver lavere?',['110 Hz','220 Hz','55 Hz'],'110 Hz','440 ÷ 2 ÷ 2 = 110.']
    ];
    choiceTasks(root,i,shuffle(T).slice(0,5).map(([q,opts,right,why])=>({q,opts:shuffle(opts),right,why,hint:'Én oktav opp: gang med 2. Én oktav ned: del på 2.'})));
  }

  K.register(2,lesson2);
})(RSKurs);
