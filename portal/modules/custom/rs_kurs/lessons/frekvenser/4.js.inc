/* Frekvenser, leksjon 4. */
(function(K){
  const {h,scoredQuiz}=K;
  const {pair}=K.fq;

  function lesson4(root,i){
    root.append(
      h('h2',{},'Høyere eller lavere?'),
      h('p',{class:'intro'},'Du hører to toner. Er den andre tonen høyere eller lavere enn den første? Forskjellen blir mindre for hver runde: fra en heltone ned mot en kvart halvtone. Svar riktig på minst seks av åtte for å fullføre leksjonen.')
    );
    // Avstand i cent per runde (100 cent = en halvtone).
    const CENTS=[200,150,100,75,50,40,30,25];
    let round=0;
    scoredQuiz(root,i,{rounds:8,pass:6,playLabel:'Spill tonene',make:()=>{
      const base=300+Math.random()*300, up=Math.random()<0.5, c=CENTS[Math.min(round++,CENTS.length-1)];
      const f2=base*Math.pow(2,(up?c:-c)/1200);
      return {q:'Er den andre tonen høyere eller lavere?',play:()=>pair(base,f2),opts:['Høyere','Lavere'],right:up?'Høyere':'Lavere',
        why:`Den andre tonen var ${up?'høyere':'lavere'}: ${Math.round(base)} Hz til ${Math.round(f2)} Hz, ${c} cent.`};
    }});
  }

  K.register(4,lesson4);
})(RSKurs);
