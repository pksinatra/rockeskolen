/* Redigering av lærertester: spørsmål, svar, bilder og toner. Testen lagres som JSON til serveren. */
(function(M){
  const S=window.drupalSettings.rsQuizEditor, root=document.getElementById('rs-quiz-editor');
  if(!S||!root) return;
  // G-nøkkel og fortegn tegnes med fonten Noto Music.
  if(!document.getElementById('rs-noto-music')){
    const l=document.createElement('link'); l.id='rs-noto-music'; l.rel='stylesheet';
    l.href='https://fonts.googleapis.com/css2?family=Noto+Music&display=swap'; document.head.appendChild(l);
  }
  const h=(tag,props={},...kids)=>{
    const e=document.createElement(tag);
    Object.entries(props).forEach(([k,v])=>{ if(k==='class') e.className=v; else if(k.startsWith('on')) e.addEventListener(k.slice(2),v); else if(k==='value') e.value=v; else if(k==='checked') e.checked=v; else if(v!==false&&v!=null) e.setAttribute(k,v===true?'':v); });
    kids.flat().forEach(c=>{ if(c!=null) e.append(c.nodeType?c:document.createTextNode(c)); });
    return e;
  };
  const blank=()=>({type:'choice',text:'',options:['',''],right:0,image:null,notes:'',play:'none',staff:false});
  const quiz=S.quiz?JSON.parse(JSON.stringify(S.quiz)):{id:null,code:null,title:'',intro:'',open:true,questions:[]};
  if(!quiz.questions.length) quiz.questions.push(blank());
  let dirty=false;
  const touch=()=>{ dirty=true; };
  window.addEventListener('beforeunload',e=>{ if(dirty){ e.preventDefault(); e.returnValue=''; } });

  const field=(label,input,help)=>h('div',{class:'rsq-field'},h('label',{},label),input,help?h('p',{class:'rsq-small'},help):null);
  const status=h('span',{role:'status'});

  function render(){
    const share=quiz.code?h('div',{class:'rsq-share'},
      h('p',{},'Kode til elevene: ',h('code',{},quiz.code)),
      h('p',{},'Lenke: ',h('a',{href:S.testBase+quiz.code,target:'_blank'},S.testBase+quiz.code)),
      h('p',{class:'rsq-small'},`Elevene kan også skrive koden på ${S.testBase.replace(/\/$/,'')}. `,
        h('a',{href:S.adminBase+quiz.id+'/resultater'},`Se resultatene (${S.results})`))):null;
    const warn=S.results?h('p',{class:'rsq-small'},`Testen har ${S.results} resultater. Endrer du spørsmålene, passer de gamle resultatene ikke lenger helt med testen.`):null;
    root.replaceChildren(...[
      share,
      field('Tittel',h('input',{type:'text',maxlength:200,value:quiz.title,oninput:e=>{ quiz.title=e.target.value; touch(); }})),
      field('Innledning',h('textarea',{maxlength:2000,oninput:e=>{ quiz.intro=e.target.value; touch(); }},quiz.intro),'Vises før eleven starter. Kan stå tom.'),
      h('div',{class:'rsq-field'},h('label',{class:'rsq-check'},h('input',{type:'checkbox',checked:quiz.open,onchange:e=>{ quiz.open=e.target.checked; touch(); }}),'Åpen for elevene')),
      warn,
      ...quiz.questions.map(question),
      h('p',{},h('button',{type:'button',class:'button',onclick:()=>{ quiz.questions.push(blank()); touch(); render(); }},'+ Legg til spørsmål')),
      h('div',{class:'rsq-bar'},
        h('button',{type:'button',class:'button button--primary',onclick:save},'Lagre'),
        h('a',{href:S.listUrl,class:'button'},'Tilbake til listen'),
        quiz.id?h('button',{type:'button',class:'rsq-btn-link',onclick:remove},'Slett testen'):null,
        status)].filter(Boolean));
  }

  function question(q,k){
    const n=quiz.questions.length;
    const move=d=>{ const a=quiz.questions; [a[k],a[k+d]]=[a[k+d],a[k]]; touch(); render(); };
    const head=h('div',{class:'rsq-q-head'},h('h3',{},`Spørsmål ${k+1}`),h('div',{},
      h('button',{type:'button',class:'button button--small',disabled:k===0,onclick:()=>move(-1),'aria-label':'Flytt opp'},'↑'),
      h('button',{type:'button',class:'button button--small',disabled:k===n-1,onclick:()=>move(1),'aria-label':'Flytt ned'},'↓'),
      h('button',{type:'button',class:'button button--small button--danger',disabled:n===1,onclick:()=>{ if(confirm('Slette spørsmål '+(k+1)+'?')){ quiz.questions.splice(k,1); touch(); render(); } }},'Slett')));
    const type=h('select',{onchange:e=>{ q.type=e.target.value; if(q.type==='truefalse'){ q.options=['Sant','Usant']; q.right=Math.min(q.right,1); } else if(q.options[0]==='Sant'&&q.options[1]==='Usant') q.options=['','']; touch(); render(); }},
      h('option',{value:'choice'},'Flervalg'),h('option',{value:'truefalse'},'Sant eller usant'));
    type.value=q.type;
    return h('fieldset',{class:'rsq-q'},head,
      h('div',{class:'rsq-grid'},field('Type',type)),
      field('Spørsmål',h('textarea',{maxlength:500,oninput:e=>{ q.text=e.target.value; touch(); }},q.text)),
      answersBox(q,k),
      imageBox(q),
      notesBox(q));
  }

  function answersBox(q,k){
    const name='rsq-right-'+k+'-'+Math.random().toString(36).slice(2,7);
    const radio=j=>h('input',{type:'radio',name,checked:q.right===j,'aria-label':'Riktig svar',onchange:()=>{ q.right=j; touch(); }});
    if(q.type==='truefalse') return field('Riktig svar',h('div',{},...['Sant','Usant'].map((o,j)=>h('label',{class:'rsq-check'},radio(j),o))));
    const rows=q.options.map((o,j)=>h('div',{class:'rsq-row'},radio(j),
      h('input',{type:'text',maxlength:200,value:o,placeholder:'Svar '+(j+1),oninput:e=>{ q.options[j]=e.target.value; touch(); }}),
      q.options.length>2?h('button',{type:'button',class:'button button--small','aria-label':'Fjern svar '+(j+1),onclick:()=>{ q.options.splice(j,1); if(q.right>=j&&q.right>0) q.right--; touch(); render(); }},'×'):null));
    return field('Svar (merk det riktige)',h('div',{},...rows,
      q.options.length<6?h('button',{type:'button',class:'button button--small',onclick:()=>{ q.options.push(''); touch(); render(); }},'+ Legg til svar'):null));
  }

  function imageBox(q){
    if(q.image) return field('Bilde',h('div',{},
      h('img',{src:q.image.url,alt:'',class:'rsq-img'}),
      h('input',{type:'text',maxlength:200,value:q.image.alt||'',placeholder:'Beskriv bildet for skjermlesere',oninput:e=>{ q.image.alt=e.target.value; touch(); }}),
      h('p',{},h('button',{type:'button',class:'rsq-btn-link',onclick:()=>{ q.image=null; touch(); render(); }},'Fjern bildet'))));
    if(quiz.questions.filter(x=>x.image).length>=20) return field('Bilde',h('p',{class:'rsq-small'},'En test kan ha høyst 20 bilder.'));
    const msg=h('p',{class:'rsq-small'},'PNG, JPEG, GIF eller WebP. Store bilder gjøres mindre før opplasting. Kan stå tomt.');
    const input=h('input',{type:'file',accept:'image/png,image/jpeg,image/gif,image/webp',onchange:e=>{
      const f=e.target.files[0]; if(!f) return;
      msg.className='rsq-small'; msg.textContent='Laster opp …';
      shrink(f)
        .then(b=>{ const data=new FormData(); data.append('file',b,'bilde'); return fetch(S.uploadUrl,{method:'POST',credentials:'same-origin',headers:{'X-CSRF-Token':S.csrf},body:data}); })
        .then(r=>r.json().catch(()=>({})).then(d=>{ if(!r.ok) throw new Error(d.error||r.status); return d; }))
        .then(d=>{ q.image={fid:d.fid,url:d.url,alt:''}; touch(); render(); })
        .catch(err=>{ msg.className='rsq-err'; msg.textContent='Bildet ble ikke lastet opp. '+err.message; });
    }});
    return field('Bilde',h('div',{},input,msg));
  }

  // Skalerer bildet ned til høyst 1600 piksler på lengste side. Serveren godtar høyst 3 MB.
  const MAX_SIDE=1600, MAX_BYTES=3*1024*1024;
  function shrink(f){
    if(f.size>40*1024*1024) return Promise.reject(new Error('Bildet er for stort (høyst 40 MB før nedskalering).'));
    // GIF kan være animert, så den sendes som den er.
    if(f.type==='image/gif') return f.size<=MAX_BYTES?Promise.resolve(f):Promise.reject(new Error('GIF-bilder kan være høyst 3 MB.'));
    return createImageBitmap(f).then(img=>{
      const k=Math.min(1,MAX_SIDE/Math.max(img.width,img.height));
      if(k===1&&f.size<=MAX_BYTES/4) return f;
      const c=document.createElement('canvas'); c.width=Math.round(img.width*k); c.height=Math.round(img.height*k);
      c.getContext('2d').drawImage(img,0,0,c.width,c.height);
      const blob=(type,quality)=>new Promise(r=>c.toBlob(r,type,quality));
      // PNG beholdes for tegninger og noter. Blir den for stor, brukes JPEG.
      return blob(f.type==='image/png'?'image/png':'image/jpeg',0.85)
        .then(b=>b&&b.size<=MAX_BYTES?b:blob('image/jpeg',0.8))
        .then(b=>{ if(!b||b.size>MAX_BYTES) throw new Error('Bildet ble ikke mindre enn 3 MB.'); return b; });
    },()=>{ throw new Error('Fant ikke ut av bildet. Bruk PNG, JPEG, GIF eller WebP.'); });
  }

  function notesBox(q){
    const preview=h('div'), err=h('p',{class:'rsq-small'});
    const play=h('select',{onchange:e=>{ q.play=e.target.value; touch(); draw(); }},
      h('option',{value:'none'},'Ingen lyd'),h('option',{value:'melodic'},'Spill tonene etter hverandre'),h('option',{value:'harmonic'},'Spill tonene samtidig'));
    play.value=q.play;
    const staff=h('input',{type:'checkbox',checked:q.staff,onchange:e=>{ q.staff=e.target.checked; touch(); draw(); }});
    function draw(){
      preview.replaceChildren(); err.className='rsq-small';
      err.textContent='Skriv tonenavn med oktav, for eksempel C4 E4 G4, F#4 eller Bb3. B er B, ikke H. Kan stå tomt.';
      if(!q.notes.trim()) return;
      const ns=M.parse(q.notes);
      if(!ns){ err.className='rsq-err'; err.textContent='Ett av tonenavnene er ugyldig. Skriv for eksempel C4, F#4 eller Bb3.'; return; }
      if(ns.length>8){ err.className='rsq-err'; err.textContent='Bruk høyst 8 toner.'; return; }
      if(q.staff&&!M.onStaff(ns)){ err.className='rsq-err'; err.textContent='Notelinjen med G-nøkkel viser toner fra G3 til C6.'; return; }
      if(q.staff) preview.append(M.staff(ns,q.play==='harmonic'));
      preview.append(h('button',{type:'button',class:'button button--small',onclick:()=>M.play(ns,q.play==='harmonic'?'harmonic':'melodic')},'Prøv lyden'));
    }
    const notes=h('input',{type:'text',value:q.notes,placeholder:'C4 E4 G4',autocomplete:'off',spellcheck:'false',oninput:e=>{ q.notes=e.target.value; touch(); draw(); }});
    draw();
    return h('div',{},
      field('Toner',notes,null),err,
      h('div',{class:'rsq-grid'},field('Lyd',play),h('div',{class:'rsq-field'},h('label',{},'Notelinje'),h('label',{class:'rsq-check'},staff,'Vis tonene på notelinje'))),
      preview);
  }

  function save(){
    status.className=''; status.textContent='Lagrer …';
    const body={id:quiz.id,title:quiz.title,intro:quiz.intro,open:quiz.open,questions:quiz.questions};
    fetch(S.saveUrl,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','Accept':'application/json','X-CSRF-Token':S.csrf},body:JSON.stringify(body)})
      .then(r=>r.json().then(d=>{ if(!r.ok) throw new Error(d.error||r.status); return d; }))
      .then(d=>{
        const isNew=!quiz.id;
        Object.assign(quiz,d.quiz); dirty=false;
        if(isNew) history.replaceState(null,'',S.adminBase+quiz.id+'/rediger');
        render(); status.className='rsq-ok'; status.textContent='Lagret.';
        if(isNew) root.scrollIntoView({block:'start'});
      })
      .catch(e=>{ status.className='rsq-err'; status.textContent='Ikke lagret. '+e.message; });
  }

  function remove(){
    if(!confirm(`Slette «${quiz.title}» og alle ${S.results} resultatene? Dette kan ikke angres.`)) return;
    fetch(S.adminBase+quiz.id+'/slett',{method:'POST',credentials:'same-origin',headers:{'X-CSRF-Token':S.csrf}})
      .then(r=>{ if(!r.ok) throw new Error(r.status); dirty=false; location.href=S.listUrl; })
      .catch(e=>{ status.className='rsq-err'; status.textContent='Ble ikke slettet. '+e.message; });
  }

  render();
})(window.RSQuizMusic);
