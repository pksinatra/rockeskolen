/* Rockeskolen – forteller artikkelen hvor høyt et innebygd element er.
 *
 * Sender {type: 'rs-embed-height', height} til foreldresiden når innholdet endrer høyde.
 * Musikkportalen tilpasser da iframe-høyden, så det ikke blir tom luft under elementet.
 * Høyden måles fra innholdet, ikke fra vinduet, slik at rammen også kan krympe.
 */
(function () {
  if (window.parent === window) return;
  let last = 0;
  function measure() {
    const body = document.body;
    if (!body) return 0;
    let bottom = 0;
    for (const el of body.children) {
      if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') continue;
      const r = el.getBoundingClientRect();
      if (r.height || r.width) bottom = Math.max(bottom, r.bottom + window.scrollY + parseFloat(getComputedStyle(el).marginBottom || 0));
    }
    return Math.ceil(bottom + parseFloat(getComputedStyle(body).paddingBottom || 0));
  }
  function send() {
    const height = measure();
    if (height > 50 && Math.abs(height - last) > 2) {
      last = height;
      window.parent.postMessage({ type: 'rs-embed-height', height }, '*');
    }
  }
  const start = () => {
    send();
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(send);
      for (const el of document.body.children) ro.observe(el);
    }
    // Noter og innhold som tegnes litt etter innlasting.
    [300, 1000, 2500].forEach(ms => setTimeout(send, ms));
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  addEventListener('load', send);
})();
