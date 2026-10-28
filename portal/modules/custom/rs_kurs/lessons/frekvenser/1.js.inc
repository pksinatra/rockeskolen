/* Frekvenser, leksjon 1. */
(function(K){
  const {h,shuffle,choiceTasks}=K;
  const {hz,pair,stop}=K.fq;

  function lesson1(root,i){
    root.append(
      h('h2',{},'Frekvens og tonehøyde'),
      h('p',{class:'intro'},'Frekvens er hvor mange ganger lyden vibrerer i sekundet, målt i hertz (Hz). Lav frekvens gir en dyp tone, høy frekvens gir en lys tone. Stemmetonen A er vanligvis 440 Hz: lyden vibrerer 440 ganger i sekundet. Hør A på 220, 440 og 880 Hz.'),
      h('div',{class:'btns'},...[220,440,880].map(f=>h('button',{class:'btn',type:'button',onclick:()=>{ stop(); hz(f); }},`${f} Hz`)))
    );
    const listen=(a,b)=>({
      q:'Hvilken tone er lysest?',
      show:x=>x.append(h('div',{class:'btns'},h('button',{class:'btn primary',type:'button',onclick:()=>pair(a,b)},'Spill tonene'))),
      opts:['Tone 1','Tone 2'], right:a>b?'Tone 1':'Tone 2',
      why:`Tone ${a>b?1:2} hadde høyest frekvens: ${Math.max(a,b)} Hz mot ${Math.min(a,b)} Hz.`,
      hint:'Spill tonene igjen. Den lyseste tonen har høyest frekvens.'
    });
    const tasks=[
      {q:'Hva måles frekvens i?',opts:shuffle(['Hertz (Hz)','Desibel (dB)','Slag i minuttet (BPM)']),right:'Hertz (Hz)',why:'Hertz er antall svingninger i sekundet.',hint:'Tenk på svingninger per sekund.'},
      {q:'En tone har høyere frekvens enn en annen. Hvordan klinger den?',opts:shuffle(['Lysere','Mørkere','Sterkere']),right:'Lysere',why:'Høyere frekvens gir lysere tone. Styrken er noe annet.',hint:'Frekvens handler om tonehøyde, ikke styrke.'},
      ...shuffle([[440,330],[262,392],[523,440],[294,247]]).slice(0,3).map(([a,b])=>listen(a,b))
    ];
    choiceTasks(root,i,tasks);
  }

  K.register(1,lesson1);
})(RSKurs);
