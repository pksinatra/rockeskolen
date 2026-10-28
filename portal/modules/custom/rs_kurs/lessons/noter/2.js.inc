/* Noter, leksjon 2. */
(function(K){
  const {h,shuffle,choiceTasks}=K;

  function lesson2(root,i){
    root.append(
      h('h2',{},'Noteverdier og pauser'),
      h('p',{class:'intro'},'Noteverdien viser hvor lenge en tone varer. I 4/4-takt varer en helnote fire slag, en halvnote to slag og en firedelsnote ett slag. To åttendedelsnoter deler ett slag. Hver noteverdi har en pause med samme varighet: helpause, halvpause, firedelspause og åttendedelspause. Pausen er stillhet, men den teller like mye som tonene.')
    );
    const T=[
      ['Hvor mange slag varer en halvpause i 4/4-takt?',['1 slag','2 slag','4 slag'],'2 slag','En halvpause varer like lenge som en halvnote.'],
      ['Hva varer like lenge som en helnote?',['Helpause','Halvpause','Firedelspause'],'Helpause','Helpausen er stille i fire slag.'],
      ['En takt i 4/4 har en halvnote og en firedelsnote. Hvilken pause fyller takten?',['Firedelspause','Halvpause','Helpause'],'Firedelspause','2 + 1 slag er 3. Det mangler ett slag.'],
      ['En takt i 4/4 har en firedelsnote og en firedelspause. Hvilken pause fyller resten?',['Halvpause','Firedelspause','Åttendedelspause'],'Halvpause','1 + 1 slag er 2. Det mangler to slag.'],
      ['Hvor mange åttendedelsnoter varer like lenge som én firedelsnote?',['2','3','4'],'2','To åttendeler deler ett slag i to.'],
      ['Hvor mange firedelsnoter varer like lenge som én helnote?',['2','4','8'],'4','En helnote varer fire slag.']
    ];
    choiceTasks(root,i,shuffle(T).slice(0,5).map(([q,opts,right,why])=>({q,opts:shuffle(opts),right,why,hint:'Tell slagene: helnote 4, halvnote 2, firedelsnote 1.'})));
  }

  K.register(2,lesson2);
})(RSKurs);
