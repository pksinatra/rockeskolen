(() => {
  'use strict';
  const dictionary = /* DICTIONARY */;
  const lang = window.RS_LANG === 'en' ? 'en' : 'nb';
  const normalize = value => value.replace(/\s+/g, ' ').trim();
  const legacy = {'Spill skala':'Play scale','Feil ved lasting av data:':'Error loading data:','Kunne ikke laste skalaer fra Music API':'Could not load scale data','Kunne ikke finne akkorden':'Could not find chord'};
  function translate(value) {
    const key = normalize(value);
    let result = legacy[key] || key;
    if (lang === 'nb') {
      if (Object.hasOwn(dictionary, result)) result = dictionary[result];
      else {
        const suffix = result.match(/^(.*?)\s*(\(PRO\)|\(Pro\)|• Pro)$/);
        if (suffix) result = (dictionary[suffix[1].trim()] || suffix[1].trim()) + ' (VIP/PRO)';
        else {
          result = result.replace(/^Octave: (.*)$/, 'Oktav: $1')
            .replace(/ \(concert pitch\)/g, ' (kammertone)')
            .replace(/^Notes: /, 'Toner: ')
            .replace(/^Error loading data: /, 'Feil ved lasting av data: ')
            .replace(/\(position (\d+)\)/g, '(posisjon $1)')
            .replace(/^Intervals \(in semitones from the root\): /, 'Intervaller (halvtoner fra grunntonen): ')
            .replace(/^Also known as: /, 'Også kjent som: ')
            .replace(/^Intervals: /, 'Intervaller: ')
            .replace(/ – low reference$/, ' – dyp referansetone')
            .replace(/^(Guitar|Bass|Ukulele|Banjo|Violin|Viola|Cello|Instrument) model$/, (_,instrument) => (dictionary[instrument] || instrument) + 'modell')
            .replace(/^🔒 The (.*) scale is available for Pro members$/, '🔒 Skalaen $1 krever VIP/PRO');
        }
      }
      const scaleNames = Object.keys(dictionary).filter(name => /major|minor|pentatonic|Dorian|Phrygian|Lydian|Locrian|Mixolydian|scale|tone|diminished|Enigmatic|Prometheus/i.test(name) && name.length < 45).sort((a,b)=>b.length-a.length);
      for (const name of scaleNames) {
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        result = result.replace(new RegExp('(?<![A-Za-z])'+escaped+'(?![A-Za-z])','g'), dictionary[name]);
      }
    } else result = result.replace(/\(Pro\)/g, '(VIP/PRO)').replace(/• Pro/g, '• VIP/PRO');
    if (result === key) return value;
    return value.replace(/\S[\s\S]*\S|\S/, result);
  }
  const skip = node => node.parentElement?.closest('script,style,textarea,input,[contenteditable],.rs-language,code,pre');
  function text(node) {
    if (skip(node)) return;
    const next = translate(node.nodeValue);
    if (next !== node.nodeValue) node.nodeValue = next;
  }
  function attributes(el) {
    for (const attr of ['title', 'aria-label', 'placeholder']) {
      if (!el.hasAttribute(attr)) continue;
      const before = el.getAttribute(attr), after = translate(before);
      if (before !== after) el.setAttribute(attr, after);
    }
  }
  function visit(node) {
    if (node.nodeType === Node.TEXT_NODE) { text(node); return; }
    if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.DOCUMENT_NODE) return;
    if (node.nodeType === Node.ELEMENT_NODE) attributes(node);
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) text(n);
    node.querySelectorAll?.('[title],[aria-label],[placeholder]').forEach(attributes);
  }
  visit(document);
  new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'characterData') text(record.target);
      else if (record.type === 'attributes') attributes(record.target);
      else for (const node of record.addedNodes) visit(node);
    }
  }).observe(document.documentElement, {subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:['title','aria-label','placeholder']});
  window.RS_TRANSLATE = translate;
})();
