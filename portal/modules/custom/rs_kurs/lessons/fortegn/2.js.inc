/* Fortegn og andre tegn, leksjon 2. */
(function(K){
  const {h,shuffle,choiceTasks}=K;
  const {ENH}=K.ft;

  function lesson2(root,i){
    root.append(
      h('h2',{},'Samme tangent, to navn'),
      h('p',{class:'intro'},'Den svarte tangenten mellom C og D kan hete både C♯ og D♭. Tonene klinger likt, men skrives forskjellig. Det kalles enharmoniske toner. Hvilket navn som er riktig, avhenger av tonearten: skalaen skal ha én tone på hver bokstav.')
    );
    const names=shuffle(['C♯','F♯','B♭','E♭','G♯','D♭']).slice(0,5);
    const wrongs=n=>{ const L='CDEFGAB', k=L.indexOf(n[0]); return [L[(k+6)%7]+n[1], n[0]+(n[1]==='♯'?'♭':'♯')]; };
    choiceTasks(root,i,names.map(n=>({
      q:`Hva er det andre navnet på ${n}?`,
      opts:shuffle([ENH[n],...wrongs(n).filter(w=>w!==ENH[n])]).slice(0,3),
      right:ENH[n],
      why:`${n} og ${ENH[n]} er samme tangent.`,
      hint:`Finn tangenten for ${n}, og se hvilken stamtone som ligger på den andre siden.`
    })));
  }

  K.register(2,lesson2);
})(RSKurs);
