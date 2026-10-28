/* Fortegn og andre tegn, leksjon 3. */
(function(K){
  const {h,shuffle,choiceTasks}=K;

  function lesson3(root,i){
    root.append(
      h('h2',{},'Faste og løse fortegn'),
      h('p',{class:'intro'},'Faste fortegn står rett etter nøkkelen i begynnelsen av hver notelinje. De viser tonearten og gjelder alle noter med samme navn, i alle oktaver, gjennom hele stykket. Et løst fortegn står rett foran én note. Det gjelder den noten og senere noter på samme linje eller mellomrom ut takten. Ved neste taktstrek gjelder de faste fortegnene igjen.')
    );
    // De fire første henger sammen og kommer i rekkefølge.
    const seq=[
      ['Stykket står i G-dur, som har F♯ som fast fortegn. I takt 1 står en F uten tegn. Hva spiller du?',['F♯','F','F♭'],'F♯','Det faste fortegnet gjelder alle F-er.'],
      ['Litt senere i takt 1 står ♮ foran en F. Hva spiller du?',['F','F♯','F♭'],'F','Oppløsningstegnet opphever F♯.'],
      ['Etter den kommer en ny F uten tegn, fortsatt i takt 1 og på samme linje. Hva spiller du?',['F','F♯','F♭'],'F','Det løse oppløsningstegnet gjelder ut takten.'],
      ['I takt 2 står en F uten tegn. Hva spiller du?',['F♯','F','F♭'],'F♯','Taktstreken opphever det løse fortegnet, og F♯ gjelder igjen.']
    ];
    const extra=shuffle([
      ['Stykket står i C-dur uten faste fortegn. I en takt står ♯ foran en C, og senere i samme takt en C uten tegn på samme linje. Hva spiller du på den andre C-en?',['C♯','C','C♭'],'C♯','Det løse krysset gjelder ut takten.'],
      ['Hvor står de faste fortegnene?',['Rett etter nøkkelen på hver notelinje','Foran hver note de gjelder','Bare i første takt'],'Rett etter nøkkelen på hver notelinje','Der viser de tonearten.']
    ]).slice(0,1);
    choiceTasks(root,i,seq.concat(extra).map(([q,opts,right,why])=>({q,opts:shuffle(opts),right,why,hint:'Faste fortegn gjelder hele stykket. Løse fortegn gjelder ut takten.'})));
  }

  K.register(3,lesson3);
})(RSKurs);
