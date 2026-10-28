/* Lærertest: eleven svarer på ett spørsmål om gangen. Er eleven logget inn, lagres resultatet på kontoen. */
(function(K,M){
  const cfg=JSON.parse(document.getElementById('rs-quiz-config').textContent);
  const root=document.getElementById('quiz'), h=K.h, N=cfg.questions.length;
  let i=0, answers=[];

  function welcome(){
    if(!cfg.found||!cfg.open){
      root.replaceChildren(
        h('h2',{},cfg.found?'Testen er stengt':'Fant ikke testen'),
        h('p',{class:'intro'},cfg.found?'Læreren har stengt denne testen.':'Sjekk at koden er riktig.'),
        h('div',{class:'btns'},h('a',{class:'btn primary',href:cfg.entryUrl},'Skriv inn en kode')));
      return;
    }
    const who=cfg.loggedIn
      ?h('p',{},`Du er logget inn som ${cfg.name}. Resultatet lagres på kontoen din.`)
      :h('div',{class:'task'},'Logg inn før du starter, så lagres resultatet på kontoen din.',h('small',{},'Uten innlogging ser bare du resultatet.'));
    root.replaceChildren(
      cfg.intro?h('p',{class:'intro'},cfg.intro):null,
      h('p',{},`${N} spørsmål.`),
      who,
      h('div',{class:'btns'},
        cfg.loggedIn?null:h('a',{class:'btn primary',href:cfg.loginUrl},'Logg inn'),
        h('button',{class:cfg.loggedIn?'btn primary':'btn',type:'button',onclick:()=>{ i=0; answers=[]; show(); }},cfg.loggedIn?'Start testen':'Start uten å logge inn')));
  }

  function media(q){
    const box=h('div',{class:'qmedia'});
    if(q.image) box.append(h('img',{src:q.image.url,alt:q.image.alt||'',class:'qimg'}));
    const ns=M.parse(q.notes);
    if(ns&&ns.length){
      if(q.staff) box.append(M.staff(ns,q.play==='harmonic'));
      if(q.play!=='none') box.append(h('div',{class:'btns'},h('button',{class:'btn primary',type:'button',onclick:()=>M.play(ns,q.play)},'Spill')));
    }
    return box;
  }

  function show(){
    M.stop();
    const q=cfg.questions[i];
    const dots=h('div',{class:'score','aria-hidden':'true'},...Array.from({length:N},(_,k)=>h('i',{class:k<answers.length?(answers[k]===cfg.questions[k].right?'r':'x'):''})));
    const fb=h('p',{class:'fb'}), after=h('div');
    const ch=h('div',{class:'choices'+(q.options.every(o=>o.length<=3)?' short':'')});
    q.options.forEach((o,k)=>ch.append(h('button',{class:'choice',type:'button',onclick:()=>answer(k)},o)));
    function answer(k){
      M.stop(); answers.push(k);
      const ok=k===q.right, bs=[...ch.children];
      bs.forEach(b=>b.disabled=true);
      bs[k].classList.add(ok?'right':'wrong');
      if(!ok) bs[q.right].classList.add('right');
      dots.children[i].className=ok?'r':'x';
      fb.className=ok?'fb ok':'fb no'; fb.textContent=ok?'Riktig.':`Ikke helt. Riktig svar er «${q.options[q.right]}».`;
      const last=i===N-1;
      after.replaceChildren(h('div',{class:'btns'},h('button',{class:'btn primary',type:'button',onclick:()=>{ if(last) finish(); else { i++; show(); } }},last?'Se resultatet':'Neste')));
    }
    root.replaceChildren(h('div',{class:'task'},q.text,h('small',{},`Spørsmål ${i+1} av ${N}`)),dots,media(q),ch,fb,after);
  }

  function finish(){
    const score=answers.filter((a,k)=>a===cfg.questions[k].right).length;
    const saved=h('p',{class:'fb'});
    root.replaceChildren(
      h('h2',{},`${score} av ${N} riktige`),
      saved,
      h('div',{class:'btns'},h('button',{class:'btn',type:'button',onclick:()=>{ i=0; answers=[]; show(); }},'Ta testen på nytt')));
    if(!cfg.loggedIn){ saved.textContent='Resultatet er ikke lagret, fordi du ikke er logget inn.'; return; }
    saved.textContent='Lagrer …';
    fetch(cfg.api,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','Accept':'application/json','X-CSRF-Token':cfg.csrf},body:JSON.stringify({answers})})
      .then(r=>r.json().then(d=>{ if(!r.ok) throw new Error(d.error||r.status); return d; }))
      .then(()=>{ saved.className='fb ok'; saved.textContent='Resultatet er lagret på kontoen din.'; })
      .catch(e=>{ saved.className='fb no'; saved.textContent='Resultatet ble ikke lagret. '+(e.message||''); });
  }

  welcome();
})(RSKurs,RSQuizMusic);
