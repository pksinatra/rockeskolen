/* Felles kursramme for Rockeskolens Musikkportal. Leksjonene lastes én og én fra serveren. */
window.RSKurs=(function(){
  const K={};
  let cfg=null, N=0, current=0;
  let state={done:0,scores:[]};
  const registered={};
  const leaveHooks=[];

  /* ---------- hjelpere ---------- */
  const h=(tag,props={},...kids)=>{
    const e=document.createElement(tag);
    Object.entries(props).forEach(([k,v])=>{ if(k==='class') e.className=v; else if(k.startsWith('on')) e.addEventListener(k.slice(2),v); else if(v!==false&&v!=null) e.setAttribute(k,v===true?'':v); });
    kids.flat().forEach(c=>{ if(c!=null) e.append(c.nodeType?c:document.createTextNode(c)); });
    return e;
  };
  const shuffle=a=>{a=a.slice(); for(let k=a.length-1;k>0;k--){const j=Math.floor(Math.random()*(k+1)); [a[k],a[j]]=[a[j],a[k]];} return a;};
  let ctx=null;
  function ac(){
    if(!ctx){const C=window.AudioContext||window.webkitAudioContext; if(!C) return null; ctx=new C();}
    if(ctx.state==='suspended') ctx.resume();
    return ctx;
  }
  const isDone=i=>!!(state.done&(1<<i));

  /* ---------- progresjon ---------- */
  // Samme regel som serveren: OR på fullførte leksjoner, høyeste resultat vinner.
  function mergeInto(s,i,score){
    s.done|=1<<i;
    const old=s.scores[i];
    if(old==null||score>old) s.scores[i]=score;
  }
  function emptyState(){ return {done:0,scores:Array(N).fill(null)}; }
  function readLocal(){
    const s=emptyState();
    try{
      const v=JSON.parse(localStorage.getItem('rs-kurs-'+cfg.id)||'null');
      if(v&&Number.isInteger(v.done)){
        s.done=v.done&((1<<N)-1);
        if(Array.isArray(v.scores)) v.scores.slice(0,N).forEach((x,k)=>{ if(Number.isInteger(x)&&x>=0&&x<=100) s.scores[k]=x; });
        return s;
      }
      // Eldre eksempelformat: en liste med true/false per leksjon.
      const old=JSON.parse(localStorage.getItem(cfg.storage)||'null');
      if(Array.isArray(old)) old.slice(0,N).forEach((d,k)=>{ if(d) mergeInto(s,k,100); });
    }catch(e){}
    return s;
  }
  function writeLocal(s){ try{ localStorage.setItem('rs-kurs-'+cfg.id,JSON.stringify(s)); }catch(e){} }
  function clearLocal(){ try{ localStorage.removeItem('rs-kurs-'+cfg.id); localStorage.removeItem(cfg.storage); }catch(e){} }
  function fromServer(r){
    const s=emptyState(); s.done=r.done|0;
    (r.scores||[]).slice(0,N).forEach((x,k)=>{ s.scores[k]=Number.isInteger(x)?x:null; });
    return s;
  }
  function api(path,body){
    const opts={credentials:'same-origin',headers:{'Accept':'application/json'}};
    if(body){ opts.method='POST'; opts.headers['Content-Type']='application/json'; opts.headers['X-CSRF-Token']=cfg.csrf; opts.body=JSON.stringify(body); }
    return fetch(cfg.api+path,opts).then(r=>{ if(!r.ok) throw new Error(r.status); return r.json(); });
  }
  function markDone(i,score=100){
    mergeInto(state,i,score);
    renderNav(); renderProgress();
    if(!cfg.loggedIn){ writeLocal(state); return; }
    api('',{lesson:i+1,score}).then(r=>{ state=fromServer(r); renderNav(); renderProgress(); })
      .catch(()=>{ const s=readLocal(); mergeInto(s,i,score); writeLocal(s); });
  }
  function load(){
    const local=readLocal();
    if(!cfg.loggedIn){ state=local; return Promise.resolve(); }
    // Progresjon fra før innlogging sendes én gang og slås sammen på serveren.
    const req=local.done?api('/sync',{done:local.done,scores:local.scores}).then(r=>{ clearLocal(); return r; }):api('');
    return req.then(r=>{ state=fromServer(r); }).catch(()=>{ state=local; });
  }

  /* ---------- visning ---------- */
  function completeBox(i,text){
    const next=i<N-1?h('button',{class:'btn primary',type:'button',onclick:()=>go(i+1)},'Neste leksjon'):h('span',{},'Modul 1 er fullført.');
    return h('div',{class:'complete'},h('p',{},text),next);
  }
  function lockBox(){
    return h('div',{class:'locked'},
      h('h2',{},'Denne leksjonen er med i VIP'),
      h('p',{},'VIP gir tilgang til alt innhold og alle verktøy for 39,90 kr/mnd eller 299 kr/år.'),
      h('div',{class:'btns'},
        h('a',{class:'btn primary',href:cfg.vipUrl},'Bli VIP'),
        cfg.loggedIn?null:h('a',{class:'btn',href:cfg.loginUrl},'Logg inn')));
  }
  const list=()=>document.getElementById('lessonList');
  const lessonEl=()=>document.getElementById('lesson');
  function renderNav(){
    list().replaceChildren(...cfg.lessons.map((L,k)=>{
      const b=h('button',{type:'button',class:isDone(k)?'done':(L.open?'':'vip'),onclick:()=>go(k)},
        h('span',{class:'num','aria-hidden':'true'},isDone(k)?'✓':String(k+1)),
        h('span',{},h('span',{class:'t'},L.title),h('span',{class:'s'},isDone(k)?'Fullført':(L.open?L.sub:'VIP')))
      );
      if(k===current) b.setAttribute('aria-current','step');
      return h('li',{},b);
    }));
  }
  function renderProgress(){
    let n=0; for(let k=0;k<N;k++) if(isDone(k)) n++;
    const pct=Math.round(n/N*100);
    document.getElementById('progText').textContent=`${n} av ${N} leksjoner fullført`;
    document.getElementById('progPct').textContent=`${pct} %`;
    document.getElementById('progBar').style.width=pct+'%';
  }
  function renderLesson(k){
    const root=lessonEl(); root.replaceChildren();
    if(!cfg.lessons[k].open){ root.append(lockBox()); return; }
    if(registered[k]){ registered[k](root,k); return; }
    const s=document.createElement('script');
    s.src=cfg.lessonUrl+(k+1);
    s.onload=()=>{ if(current===k&&registered[k]) registered[k](root,k); };
    s.onerror=()=>{ if(current===k) root.replaceChildren(lockBox()); };
    document.body.appendChild(s);
  }
  function go(k){
    leaveHooks.forEach(f=>f());
    current=k; renderNav(); renderLesson(k);
    if(location.hash!=='#leksjon-'+(k+1)) history.replaceState(null,'','#leksjon-'+(k+1));
    if(window.innerWidth<760) lessonEl().scrollIntoView({block:'start'});
  }

  function start(){
    cfg=JSON.parse(document.getElementById('rs-kurs-config').textContent);
    N=cfg.lessons.length; state=emptyState();
    load().then(()=>{
      const m=/^#leksjon-(\d+)$/.exec(location.hash);
      let first=-1; for(let k=0;k<N;k++) if(!isDone(k)){ first=k; break; }
      current=m&&Number(m[1])>=1&&Number(m[1])<=N?Number(m[1])-1:(first===-1?0:first);
      renderProgress(); renderNav(); renderLesson(current);
    });
  }

  Object.assign(K,{h,shuffle,ac,markDone,completeBox,go,start,
    register:(n,render)=>{ registered[n-1]=render; },
    onLeave:f=>leaveHooks.push(f)});
  return K;
})();
