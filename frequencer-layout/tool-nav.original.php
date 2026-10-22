<style>
  .fe-app-header{width:100%;margin:0;height:72px;border-bottom:1px solid rgba(255,255,255,.13);background:rgba(6,6,11,.9);backdrop-filter:blur(18px);position:relative;z-index:1000;font-family:"DM Sans",Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
  .fe-app-nav{width:min(1180px,calc(100% - 40px));height:100%;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:30px}
  .fe-app-brand{display:inline-flex;align-items:center;gap:11px;color:#f7f4ff!important;text-decoration:none!important;text-transform:uppercase;letter-spacing:.12em;font-size:.78rem!important;font-weight:700;white-space:nowrap}
  .fe-app-brand__mark{width:19px;height:19px;border:1px solid rgba(255,255,255,.7);border-radius:50%;display:inline-block;box-shadow:inset 7px 0 0 rgba(184,161,255,.5),0 0 22px rgba(184,161,255,.25)}
  .fe-app-links{display:flex;align-items:center;gap:30px}
  .fe-app-links a{color:#aaa8b8!important;text-decoration:none!important;font-size:.86rem!important;font-weight:400!important;transition:color .2s}
  .fe-app-links a:hover,.fe-app-links a:focus-visible,.fe-app-links a[aria-current="page"]{color:#f7f4ff!important}
  .fe-app-menu{display:none;border:1px solid rgba(255,255,255,.13)!important;background:transparent!important;color:#f7f4ff!important;min-height:36px!important;padding:7px 12px!important;border-radius:999px!important;font:inherit!important;font-size:.86rem!important}
  @media(max-width:760px){.fe-app-header{height:auto;min-height:64px}.fe-app-nav{min-height:64px;flex-wrap:wrap;padding:13px 0}.fe-app-menu{display:block}.fe-app-links{display:none;width:100%;align-items:flex-start;flex-direction:column;gap:2px;padding:12px 0}.fe-app-links.is-open{display:flex}.fe-app-links a{width:100%;padding:8px 0}}
</style>
<header class="fe-app-header">
  <nav class="fe-app-nav" aria-label="Frequency Etherea">
    <a class="fe-app-brand" href="/"><span class="fe-app-brand__mark" aria-hidden="true"></span><span>Frequency Etherea</span></a>
    <button class="fe-app-menu" type="button" aria-expanded="false" aria-controls="fe-app-main-menu">Menu</button>
    <div class="fe-app-links" id="fe-app-main-menu">
      <a href="/music">Music</a>
      <a href="/frequencies">Frequencies</a>
      <a href="/lab/" aria-current="page">Lab</a>
      <a href="/premium">Premium</a>
    </div>
  </nav>
</header>
<script>
(function(){
  var button=document.querySelector('.fe-app-menu'),links=document.getElementById('fe-app-main-menu');
  if(button&&links)button.addEventListener('click',function(){var open=button.getAttribute('aria-expanded')==='true';button.setAttribute('aria-expanded',String(!open));links.classList.toggle('is-open',!open);});
  function markExternal(root){(root||document).querySelectorAll('a[href]').forEach(function(link){try{var url=new URL(link.href,window.location.href);if((url.protocol==='http:'||url.protocol==='https:')&&url.origin!==window.location.origin){link.target='_blank';link.rel='noopener noreferrer';}}catch(error){}});}
  markExternal(document);
  new MutationObserver(function(){markExternal(document);}).observe(document.documentElement,{childList:true,subtree:true});
})();
</script>
