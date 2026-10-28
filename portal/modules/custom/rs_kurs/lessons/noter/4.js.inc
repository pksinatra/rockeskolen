/* Noter, leksjon 4. */
(function(K){
  const {h,scoredQuiz}=K;
  const {LETTERS,letter,midi,staff,tone}=K.noter;

  function lesson4(root,i){
    root.append(
      h('h2',{},'Lesetest'),
      h('p',{class:'intro'},'Nå leser du ti noter på rad, med hjelpelinjer både under og over. Svar riktig på minst åtte av ti for å fullføre leksjonen.')
    );
    let last=null;
    scoredQuiz(root,i,{rounds:10,pass:8,playLabel:'Hør tonen',make:()=>{
      let p; do { p=-2+Math.floor(Math.random()*13); } while(p===last); last=p;
      return {q:'Hvilken tone er dette?',show:x=>x.append(staff(p)),play:()=>tone(midi(p)),opts:[...LETTERS],right:letter(p),why:`Det var ${letter(p)}.`};
    }});
  }

  K.register(4,lesson4);
})(RSKurs);
