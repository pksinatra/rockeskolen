/* Musikkteori fra bunnen, leksjon 1. */
(function(K){
  const {h,markDone,completeBox,go}=K;
  const {nm,MAJOR,keyboard,playSeq}=K.teori;

  function lesson1(root,i){
    root.append(
      h('h2',{},'Halvtoner og heltoner'),
      h('p',{class:'intro'},'Alle tangentene på pianoet, både hvite og svarte, ligger en halvtone fra naboen sin. To halvtoner blir en heltone. Mellom E og F, og mellom B og C, finnes det ingen svart tangent. Der er nabotonen hvit.'),
      h('div',{class:'btns'},
        h('button',{class:'btn',type:'button',onclick:()=>demo([64,65])},'Hør en halvtone (E–F)'),
        h('button',{class:'btn',type:'button',onclick:()=>demo([65,67])},'Hør en heltone (F–G)')
      )
    );
    const tasks=[
      {ref:64,ans:5,q:'Trykk tonen som ligger en halvtone over E.',hint:'En halvtone er nærmeste nabo. Fra E finnes det ingen svart tangent, så nabotonen er hvit.'},
      {ref:65,ans:7,q:'Trykk tonen som ligger en heltone over F.',hint:'En heltone er to halvtoner: hopp over den svarte tangenten rett over F.'},
      {ref:71,ans:0,q:'Trykk tonen som ligger en halvtone over B.',hint:'Mellom B og C er det ingen svart tangent.'}
    ];
    let t=0;
    const task=h('div',{class:'task'}); const fb=h('p',{class:'fb'});
    const kb=keyboard(60,76,onKey);
    root.append(h('h3',{},'Prøv selv'),task,kb.el,fb);
    function show(){
      kb.clear('ref'); kb.set(tasks[t].ref,'ref');
      task.replaceChildren(tasks[t].q,h('small',{},`Oppgave ${t+1} av ${tasks.length}. Den markerte tangenten er ${nm(tasks[t].ref)}.`));
    }
    function demo(ms){ playSeq(ms,0.55,m=>kb.flash(m,'on',450)); }
    function onKey(m){
      if(t>=tasks.length) return;
      const cur=tasks[t];
      if(m%12===cur.ans && m>cur.ref){
        kb.flash(m,'good',600); fb.className='fb ok'; fb.textContent=`Riktig, det er ${nm(m)}.`;
        t++;
        if(t<tasks.length) setTimeout(show,700);
        else { kb.clear('ref'); task.replaceChildren('Alle oppgavene er løst.'); markDone(i); root.append(completeBox(i,'Leksjonen er fullført.')); }
      } else {
        kb.flash(m,'bad',600); fb.className='fb no'; fb.textContent=`Det var ${nm(m)}. ${cur.hint}`;
      }
    }
    show();
  }

  K.register(1,lesson1);
})(RSKurs);
