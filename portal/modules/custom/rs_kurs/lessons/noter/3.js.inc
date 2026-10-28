/* Noter, leksjon 3. */
(function(K){
  const {h,shuffle,choiceTasks}=K;

  function lesson3(root,i){
    root.append(
      h('h2',{},'Takt og taktart'),
      h('p',{class:'intro'},'Taktstrekene deler musikken i takter. Taktarten står i begynnelsen av notebildet som to tall. Det øverste tallet sier hvor mange slag det er i hver takt. Det nederste sier hvilken noteverdi som er ett slag: 4 betyr firedelsnote, 8 betyr åttendedelsnote. I 3/4 er det tre firedeler i hver takt, og i 6/8 seks åttendeler.')
    );
    const T=[
      ['Hva sier det øverste tallet i 3/4?',['Hvor mange slag det er i takten','Hvilken noteverdi som er ett slag','Hvor fort musikken går'],'Hvor mange slag det er i takten','Tre slag i hver takt.'],
      ['Hva sier det nederste tallet i 3/4?',['Hvilken noteverdi som er ett slag','Hvor mange slag det er i takten','Hvor mange takter det er'],'Hvilken noteverdi som er ett slag','4 betyr at firedelsnoten er ett slag.'],
      ['Hvor mange firedelsnoter er det plass til i en takt i 3/4?',['2','3','4'],'3','Tre firedeler per takt.'],
      ['Hvor mange åttendedelsnoter er det plass til i en takt i 6/8?',['3','6','8'],'6','Seks åttendeler per takt.'],
      ['Hva skiller taktene fra hverandre i notebildet?',['Taktstreker','Hjelpelinjer','Fortegn'],'Taktstreker','Taktstreken er en loddrett strek gjennom notelinjene.'],
      ['En takt i 4/4 har en halvnote og en firedelsnote. Hvor mye mangler?',['Ett slag','To slag','Ingenting'],'Ett slag','2 + 1 slag er 3 av 4.']
    ];
    choiceTasks(root,i,shuffle(T).slice(0,5).map(([q,opts,right,why])=>({q,opts:shuffle(opts),right,why,hint:'Øverst: antall slag. Nederst: hvilken noteverdi som er ett slag.'})));
  }

  K.register(3,lesson3);
})(RSKurs);
