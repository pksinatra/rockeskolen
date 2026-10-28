/* Tonearter og kvintsirkelen, leksjon 2. */
(function(K){
  const {h,shuffle,markDone,completeBox}=K;
  const {note,name,scale,keyName,signature,sigText,circleSvg,playSeq}=K.ta;

  function lesson2(root,i){
    const TONICS=['C4','G4','D4','A4','E4','B3','F#4','Db4','Ab3','Eb4','Bb3','F4'].map(note);
    root.append(
      h('h2',{},'Kvintsirkelen'),
      h('p',{class:'intro'},'Går du en ren kvint opp fra C, kommer du til G-dur med ett kryss. En ny kvint opp gir D-dur med to kryss, og slik fortsetter det med ett kryss til for hver kvint. Går du en kvint ned fra C, kommer du til F-dur med én b, og for hver kvint nedover kommer en b til. Nederst i sirkelen møtes de: F#-dur og Gb-dur klinger likt. Inne i sirkelen står parallelltonearten i moll, som har de samme fortegnene.'),
      h('p',{class:'intro'},'Trykk på en toneart for å høre skalaen og se fortegnene.')
    );
    const info=h('p',{class:'fb','aria-live':'polite'});
    function describe(k){
      const tonic=TONICS[k], sig=signature(tonic);
      let text=`${keyName(tonic)}: ${sigText(sig)}${sig.length?' ('+sig.map(name).join(', ')+')':''}.`;
      if(k===6){ const gb=note('Gb4'), s2=signature(gb); text+=` Samme tangenter som ${keyName(gb)}: ${sigText(s2)} (${s2.map(name).join(', ')}).`; }
      return text;
    }
    const explore=circleSvg((k,g)=>{
      explore.seg.forEach(s=>s.classList.remove('on')); g.classList.add('on');
      info.className='fb'; info.textContent=describe(k);
      const sc=scale(TONICS[k]); playSeq(sc.map(n=>n.midi).concat(TONICS[k].midi+12),0.28);
    });
    root.append(explore,info);

    root.append(h('h3',{},'Finn tonearten i sirkelen'));
    const Q=shuffle([[1,1],[2,1],[3,1],[4,1],[5,1],[1,-1],[2,-1],[3,-1],[4,-1],[5,-1]]).slice(0,6);
    let t=0, busy=false;
    const task=h('div',{class:'task'}); const fb=h('p',{class:'fb'});
    const quiz=circleSvg((k,g)=>answer(k,g),{hideMinor:true});
    root.append(task,quiz,fb);

    const wantIndex=([n,dir])=>dir>0?n:12-n;
    function show(){
      busy=false; quiz.seg.forEach(s=>s.classList.remove('right','wrong'));
      const [n,dir]=Q[t];
      task.replaceChildren(`Hvilken durtoneart har ${sigText(Array(n).fill({acc:dir}))}?`,h('small',{},`Oppgave ${t+1} av ${Q.length}. Trykk på tonearten i sirkelen.`));
      fb.textContent='';
    }
    function answer(k,g){
      if(busy||t>=Q.length) return;
      const want=wantIndex(Q[t]);
      if(k===want){
        busy=true; g.classList.add('right'); fb.className='fb ok'; fb.textContent=`Riktig. ${describe(k)}`;
        t++;
        if(t<Q.length) setTimeout(show,1800);
        else { task.replaceChildren('Alle oppgavene er løst.'); markDone(i); root.append(completeBox(i,'Leksjonen er fullført.')); }
      } else {
        g.classList.add('wrong'); setTimeout(()=>g.classList.remove('wrong'),700);
        const [, dir]=Q[t];
        fb.className='fb no';
        fb.textContent=`Ikke helt. ${describe(k)} Tell ${dir>0?'med klokka fra C: én kvint opp':'mot klokka fra C: én kvint ned'} for hvert fortegn.`;
      }
    }
    show();
  }

  K.register(2,lesson2);
})(RSKurs);
