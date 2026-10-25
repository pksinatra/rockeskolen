/**
 * @file
 * Fits embedded Rockeskolen elements to their content height.
 *
 * Embeds on rockeskolen.com send {type: 'rs-embed-height', height} (see
 * /embed/autoheight.js). The iframe's height attribute stays as a fallback.
 */
(function () {
  'use strict';

  const origins = ['https://rockeskolen.com', 'https://www.rockeskolen.com'];

  window.addEventListener('message', (event) => {
    const data = event.data;
    if (!origins.includes(event.origin) || !data || data.type !== 'rs-embed-height') {
      return;
    }
    const height = Math.round(Number(data.height));
    if (!height || height < 80 || height > 3000) {
      return;
    }
    for (const frame of document.querySelectorAll('iframe')) {
      if (frame.contentWindow === event.source) {
        frame.style.height = height + 'px';
        break;
      }
    }
  });
})();
