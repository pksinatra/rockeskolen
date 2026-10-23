/* Rockeskolen – intervall-embed for artikler.
 *
 * URL-parametere:
 *   mode   inversion | compare | ear   (standard: inversion)
 *   pairs  inversion/compare: kommaliste med tonepar, f.eks. "C4-E4,C4-G4,F4-B4" (b = ♭, # = ♯;
 *          skriv # som %23 i adressen, ellers tolkes resten som anker)
 *   set    ear: intervallene som øves, f.eks. "m2,M2,m3,M3,P4,TT,P5,M6,P8"
 *   title  egen overskrift
 *   lang   no | en
 * Intervallnavnet regnes ut fra notenavnene (bokstavtrinn + halvtoner), ikke bare fra antall halvtoner.
 */
(function () {
  const app = document.querySelector('.interval');
  const lang = app.dataset.lang === 'no' ? 'no' : 'en';
  const no = lang === 'no';
  const params = new URLSearchParams(location.search);
  const mode = ['inversion', 'compare', 'ear'].includes(params.get('mode')) ? params.get('mode') : 'inversion';

  // ---------- musikkteori ----------
  const LETTERS = 'CDEFGAB';
  const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const NUM = no
    ? { 1: 'prim', 2: 'sekund', 3: 'ters', 4: 'kvart', 5: 'kvint', 6: 'sekst', 7: 'septim', 8: 'oktav' }
    : { 1: 'unison', 2: 'second', 3: 'third', 4: 'fourth', 5: 'fifth', 6: 'sixth', 7: 'seventh', 8: 'octave' };
  const QUAL = no
    ? { P: 'ren', M: 'stor', m: 'liten', A: 'forstørret', d: 'forminsket' }
    : { P: 'perfect', M: 'major', m: 'minor', A: 'augmented', d: 'diminished' };
  const PERFECT_BASE = { 1: 0, 4: 5, 5: 7, 8: 12 };
  const MAJOR_BASE = { 2: 2, 3: 4, 6: 9, 7: 11 };

  function parse(name) {
    const m = /^([A-G])(bb|b|##|#)?(-?\d)$/.exec(name.trim());
    if (!m) return null;
    const acc = { bb: -2, b: -1, '#': 1, '##': 2 }[m[2] || ''] || 0;
    const oct = Number(m[3]);
    return { letter: m[1], acc, oct, li: LETTERS.indexOf(m[1]) + 7 * oct, midi: 12 * (oct + 1) + PC[m[1]] + acc };
  }
  const pretty = n => n.letter + ({ '-2': '𝄫', '-1': '♭', 1: '♯', 2: '𝄪' }[n.acc] || '');
  const label = n => pretty(n) + n.oct;

  // Navngi intervallet mellom to stavede toner (nederste først).
  function nameOf(lo, hi) {
    const number = hi.li - lo.li + 1;
    const semis = hi.midi - lo.midi;
    const simple = number === 8 ? 8 : ((number - 1) % 7) + 1;
    const octaves = number === 8 ? 0 : Math.floor((number - 1) / 7);
    let q;
    if (simple in PERFECT_BASE) {
      const diff = semis - PERFECT_BASE[simple] - 12 * octaves;
      q = { 0: 'P', 1: 'A', '-1': 'd' }[diff];
    } else {
      const diff = semis - MAJOR_BASE[simple] - 12 * octaves;
      q = { 0: 'M', '-1': 'm', 1: 'A', '-2': 'd' }[diff];
    }
    if (!q) return null;
    return { q, simple, number, semis, text: `${QUAL[q]} ${NUM[simple]}`, cat: category(q, simple) };
  }
  function category(q, simple) {
    if (q === 'P' && [1, 5, 8].includes(simple)) return 'perfect';
    if (q === 'P' && simple === 4) return 'middle';
    if ((q === 'M' || q === 'm') && [3, 6].includes(simple)) return 'imperfect';
    return 'dissonant';
  }
  const CAT = no
    ? { perfect: 'Fullkommen konsonans', imperfect: 'Ufullkommen konsonans', middle: 'Mellomstilling – avhenger av sammenhengen', dissonant: 'Dissonans' }
    : { perfect: 'Perfect consonance', imperfect: 'Imperfect consonance', middle: 'In between – depends on context', dissonant: 'Dissonance' };
  const capital = s => s.charAt(0).toUpperCase() + s.slice(1);
  const isTritone = n => (n.q === 'A' && n.simple === 4) || (n.q === 'd' && n.simple === 5);

  // Stav en tone et gitt intervall over en grunntone, f.eks. ('m3', D4) -> F4.
  function above(root, code) {
    const m = /^(P|M|m|A|d)(\d)$/.exec(code === 'TT' ? 'A4' : code);
    const q = m[1], num = Number(m[2]);
    const li = root.li + num - 1;
    const letter = LETTERS[((li % 7) + 7) % 7], oct = Math.floor(li / 7);
    const base = num in PERFECT_BASE ? PERFECT_BASE[num] : MAJOR_BASE[num];
    const want = root.midi + base + ({ P: 0, M: 0, m: -1, A: 1, d: num in PERFECT_BASE ? -1 : -2 }[q]);
    const natural = 12 * (oct + 1) + PC[letter];
    const acc = want - natural;
    return parse(letter + ({ '-2': 'bb', '-1': 'b', 0: '', 1: '#', 2: '##' }[acc]) + oct);
  }

  // ---------- lyd ----------
  let ctx = null;
  function audio() { if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); return ctx; }
  function note(midi, t, dur) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
    const f = 440 * Math.pow(2, (midi - 69) / 12);
    o.type = 'triangle'; o.frequency.value = f; o2.type = 'sine'; o2.frequency.value = f * 2;
    const g2 = ctx.createGain(); g2.gain.value = 0.18;
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.28, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }
  let harmonic = mode === 'compare';
  function playPair(lo, hi, forceHarmonic) {
    audio();
    const t = ctx.currentTime + 0.03;
    if (harmonic || forceHarmonic) { note(lo.midi, t, 1.6); note(hi.midi, t, 1.6); }
    else { note(lo.midi, t, 0.9); note(hi.midi, t + 0.75, 1.2); }
    renderPiano([lo.midi, hi.midi]);
  }

  // ---------- piano ----------
  function renderPiano(active = []) {
    const piano = document.getElementById('piano');
    piano.innerHTML = '';
    for (let midi = 48; midi <= 83; midi++) {
      const black = [1, 3, 6, 8, 10].includes(midi % 12);
      const key = document.createElement('div');
      key.className = `key ${black ? 'black' : 'white'}${active.includes(midi) ? ' active' : ''}`;
      if (!black && midi % 12 === 0) key.innerHTML = `<span class="key-label">C${Math.floor(midi / 12) - 1}</span>`;
      piano.append(key);
    }
  }

  // ---------- grensesnitt ----------
  const $ = id => document.getElementById(id);
  const titles = {
    inversion: no ? 'Snu intervallet' : 'Invert the interval',
    compare: no ? 'Hør forskjellen' : 'Hear the difference',
    ear: no ? 'Gjett intervallet' : 'Guess the interval',
  };
  $('title').textContent = (params.get('title') || '').trim() || titles[mode];
  const setHarmonic = h => { harmonic = h; $('melodic').setAttribute('aria-pressed', String(!h)); $('harmonic').setAttribute('aria-pressed', String(h)); };
  $('melodic').onclick = () => setHarmonic(false);
  $('harmonic').onclick = () => setHarmonic(true);
  setHarmonic(harmonic);
  const button = (text, onclick, cls = '') => { const b = document.createElement('button'); b.type = 'button'; b.textContent = text; b.className = cls; b.onclick = onclick; return b; };

  const pairs = (params.get('pairs') || (mode === 'compare' ? 'C4-G4,C4-E4,C4-F4,C4-D4,C4-B4,F4-B4' : 'C4-E4,C4-G4,D4-F4,F4-B4,C4-B4'))
    .split(',').map(p => p.split('-').map(parse)).filter(p => p.length === 2 && p[0] && p[1] && p[1].li > p[0].li);

  if (mode === 'inversion') {
    let i = 0;
    const show = () => {
      const [lo, hi] = pairs[i];
      const inv = [hi, parse(lo.letter + ({ '-2': 'bb', '-1': 'b', 0: '', 1: '#', 2: '##' }[lo.acc]) + (lo.oct + 1))];
      const a = nameOf(lo, hi), b = nameOf(inv[0], inv[1]);
      $('presets').innerHTML = '';
      pairs.forEach(([l, h], k) => $('presets').append(button(`${pretty(l)}–${pretty(h)}`, () => { i = k; show(); }, 'preset' + (k === i ? ' active' : ''))));
      $('cards').innerHTML =
        `<button type="button" class="card" data-k="0"><small>${no ? 'Intervall' : 'Interval'}</small><strong>${capital(a.text)}</strong><span>${label(lo)} → ${label(hi)}${isTritone(a) ? ' · tritonus' : ''}</span></button>` +
        `<button type="button" class="card" data-k="1"><small>${no ? 'Omvending' : 'Inversion'}</small><strong>${capital(b.text)}</strong><span>${label(inv[0])} → ${label(inv[1])}${isTritone(b) ? ' · tritonus' : ''}</span></button>` +
        `<div class="card"><small>${no ? 'Regelen' : 'The rule'}</small><span class="sum">${a.simple} + ${b.simple} = 9</span><span>${QUAL[a.q]} → ${QUAL[b.q]}</span></div>`;
      $('cards').querySelectorAll('button.card').forEach(c => c.onclick = () => {
        $('cards').querySelectorAll('.card').forEach(x => x.classList.toggle('active', x === c));
        const p = c.dataset.k === '0' ? [lo, hi] : inv;
        playPair(p[0], p[1]);
        $('status').textContent = c.querySelector('strong').textContent;
      });
      renderPiano([lo.midi, hi.midi]);
      $('status').textContent = no ? 'Trykk på et kort for å høre det.' : 'Tap a card to hear it.';
    };
    $('transport').append(button(no ? '▶ Spill begge' : '▶ Play both', () => {
      const cards = $('cards').querySelectorAll('button.card');
      cards[0].click(); setTimeout(() => cards[1].click(), harmonic ? 1900 : 2300);
    }));
    show();
  }

  if (mode === 'compare') {
    $('cards').innerHTML = pairs.map(([lo, hi], k) => {
      const n = nameOf(lo, hi);
      return `<button type="button" class="card" data-k="${k}"><small>${pretty(lo)}–${pretty(hi)}</small><strong>${capital(n.text)}${isTritone(n) ? ' (tritonus)' : ''}</strong><span class="cat ${n.cat}">${CAT[n.cat]}</span></button>`;
    }).join('');
    $('cards').querySelectorAll('.card').forEach(c => c.onclick = () => {
      $('cards').querySelectorAll('.card').forEach(x => x.classList.toggle('active', x === c));
      const [lo, hi] = pairs[Number(c.dataset.k)];
      playPair(lo, hi);
      $('status').textContent = c.querySelector('strong').textContent;
    });
    renderPiano();
    $('status').textContent = no ? 'Trykk på et intervall for å høre det.' : 'Tap an interval to hear it.';
  }

  if (mode === 'ear') {
    const SONGS = no
      ? { m2: 'temaet fra «Haisommer»', M2: '«Lisa gikk til skolen»', m3: 'riffet i «Smoke on the Water»', M3: '«When the Saints Go Marching In»', P4: 'brudemarsjen fra «Lohengrin»', TT: '«Maria» fra «West Side Story»', P5: '«Twinkle, Twinkle, Little Star»', M6: '«My Bonnie Lies Over the Ocean»', P8: '«Over the Rainbow»' }
      : { m2: 'the "Jaws" theme', M2: '"Happy Birthday"', m3: '"Smoke on the Water"', M3: '"When the Saints Go Marching In"', P4: 'the wedding march from "Lohengrin"', TT: '"Maria" from "West Side Story"', P5: '"Twinkle, Twinkle, Little Star"', M6: '"My Bonnie Lies Over the Ocean"', P8: '"Over the Rainbow"' };
    const codes = (params.get('set') || 'm2,M2,m3,M3,P4,TT,P5,M6,P8').split(',').map(s => s.trim()).filter(c => c === 'TT' || /^(P[1458]|[Mm][2367])$/.test(c));
    const roots = ['C4', 'D4', 'E4', 'F4', 'G4', 'A3', 'B3'].map(parse);
    const nameFor = c => c === 'TT' ? (no ? 'Tritonus' : 'Tritone') : capital(nameOf(parse('C4'), above(parse('C4'), c)).text);
    let current = null, right = 0, total = 0;
    $('cards').innerHTML = `<div class="card"><small>${no ? 'Oppgave' : 'Task'}</small><p class="feedback" id="feedback">${no ? 'Trykk «Nytt intervall» og lytt.' : 'Press "New interval" and listen.'}</p><div class="answers" id="answers"></div><span class="score" id="score"></span></div>`;
    codes.forEach(c => $('answers').append(button(nameFor(c), () => {
      if (!current || current.done) return;
      current.done = true; total++;
      const ok = c === current.code;
      if (ok) right++;
      const btns = [...$('answers').children];
      btns[codes.indexOf(current.code)].classList.add('right');
      if (!ok) btns[codes.indexOf(c)].classList.add('wrong');
      const n = nameFor(current.code);
      $('feedback').textContent = (ok ? (no ? 'Riktig! ' : 'Correct! ') : (no ? `Det var ${n.toLowerCase()}. ` : `That was ${n.toLowerCase()}. `))
        + `${label(current.lo)} → ${label(current.hi)}.` + (SONGS[current.code] ? (no ? ` Tenk på ${SONGS[current.code]}.` : ` Think of ${SONGS[current.code]}.`) : '');
      $('score').textContent = `${right} / ${total}`;
      renderPiano([current.lo.midi, current.hi.midi]);
    }, 'preset')));
    const next = () => {
      [...$('answers').children].forEach(b => b.classList.remove('right', 'wrong'));
      const code = codes[Math.floor(Math.random() * codes.length)];
      const lo = roots[Math.floor(Math.random() * roots.length)];
      current = { code, lo, hi: above(lo, code), done: false };
      $('feedback').textContent = no ? 'Hvilket intervall hørte du?' : 'Which interval did you hear?';
      renderPiano();
      playPair(current.lo, current.hi);
      renderPiano();
    };
    $('transport').append(button(no ? '🎲 Nytt intervall' : '🎲 New interval', next), button(no ? '↻ Spill igjen' : '↻ Play again', () => { if (current) { playPair(current.lo, current.hi); if (!current.done) renderPiano(); } }));
    renderPiano();
    $('status').textContent = no ? 'Stigende intervaller fra ulike grunntoner.' : 'Ascending intervals from different roots.';
  }
})();
