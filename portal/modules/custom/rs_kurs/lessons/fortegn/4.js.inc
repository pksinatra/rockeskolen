/* Fortegn og andre tegn, leksjon 4. */
(function(K){
  const {h,shuffle,scoredQuiz}=K;
  const {pc,ENH,tone}=K.ft;

  function lesson4(root,i){
    root.append(
      h('h2',{},'Fortegnstest'),
      h('p',{class:'intro'},'Åtte spørsmål om å heve, senke og gi tonene riktig navn. Svar riktig på minst seks av åtte for å fullføre leksjonen.')
    );
    const L='CDEFGAB';
    const make=()=>{
      const kind=Math.floor(Math.random()*3);
      if(kind===0){
        // Hev en stamtone med kryss. E og B gir E♯ og B♯, som er gyldige navn.
        const s=L[Math.floor(Math.random()*7)], right=s+'♯', k=L.indexOf(s);
        return {q:`${s} heves en halvtone med ♯. Hva heter tonen?`,opts:shuffle([right,s+'♭',L[(k+1)%7]+'♯']),right,why:`${s} med kryss heter ${right}.`,play:()=>tone(60+pc(right))};
      }
      if(kind===1){
        const s=L[Math.floor(Math.random()*7)], right=s+'♭', k=L.indexOf(s);
        return {q:`${s} senkes en halvtone med ♭. Hva heter tonen?`,opts:shuffle([right,s+'♯',L[(k+6)%7]+'♭']),right,why:`${s} med b heter ${right}.`,play:()=>tone(60+pc(right))};
      }
      const n=shuffle(Object.keys(ENH))[0], right=ENH[n];
      return {q:`Hva er det andre navnet på ${n}?`,opts:shuffle([...new Set([right,n[0]+(n[1]==='♯'?'♭':'♯'),right[0]+(right[1]==='♯'?'♭':'♯')])]),right,why:`${n} og ${right} er samme tangent.`,play:()=>tone(60+pc(n))};
    };
    scoredQuiz(root,i,{rounds:8,pass:6,playLabel:'Hør tonen',make});
  }

  K.register(4,lesson4);
})(RSKurs);
