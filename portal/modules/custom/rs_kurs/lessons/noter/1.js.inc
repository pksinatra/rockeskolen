/* Noter, leksjon 1. */
(function(K){
  const {h,shuffle,choiceTasks}=K;
  const {LETTERS,letter,midi,staff,tone}=K.noter;

  function lesson1(root,i){
    root.append(
      h('h2',{},'Notelinjer og G-nøkkel'),
      h('p',{class:'intro'},'Notelinjene har fem linjer og fire mellomrom. Jo høyere noten står, jo lysere klinger den. G-nøkkelen slynger seg rundt nest nederste linje og viser at den linjen er G. Derfra teller du bokstavene opp eller ned, linje og mellomrom annenhver gang: nederste linje er E, og mellomrommene nedenfra er F – A – C – E. Toner utenfor de fem linjene får hjelpelinjer, som C rett under notelinjene.')
    );
    const ps=shuffle([-2,-1,0,1,2,3,4,5,6,7,8,9,10]).slice(0,6);
    choiceTasks(root,i,ps.map(p=>({
      q:'Hvilken tone er dette?',
      show:x=>{ x.append(staff(p)); tone(midi(p)); },
      opts:[...LETTERS], right:letter(p),
      why:`Noten står ${p%2===0?'på en linje':'i et mellomrom'} og er ${letter(p)}.`,
      hint:'Start fra G-linjen (nest nederst) og tell bokstavene opp eller ned.'
    })),'Alle notene er lest.');
  }

  K.register(1,lesson1);
})(RSKurs);
