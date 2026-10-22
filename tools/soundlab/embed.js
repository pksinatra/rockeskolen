(()=>{
 if(window.rsSoundLabResize)return;window.rsSoundLabResize=true;
 window.addEventListener('message',event=>{
  if(!['https://rockeskolen.com','https://www.rockeskolen.com'].includes(event.origin)||event.data?.type!=='rs-soundlab-height')return;
  const height=event.data.height;if(!Number.isFinite(height)||height<200||height>6000)return;
  document.querySelectorAll('iframe').forEach(frame=>{
   if(frame.contentWindow!==event.source)return;
   const src=new URL(frame.src,location.href);
   if(['https://rockeskolen.com','https://www.rockeskolen.com'].includes(src.origin)&&src.pathname==='/tools/soundlab/')frame.style.height=Math.ceil(height)+'px';
  });
 });
})();
