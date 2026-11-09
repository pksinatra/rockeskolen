/* Rockeskolen – Kvintsirkelen og beslektede tonearter.
 *
 * Ytre ring: de tolv durtoneartene, en ren kvint fra hverandre (med klokka opp, mot klokka ned).
 * Indre ring: parallelle molltonearter med samme fortegn. Trykk på en toneart for å se og høre
 * de nærmest beslektede: naboene, parallelltonearten og parallelltoneartene til naboene.
 * Toneartsnavn skrives med vanlige tegn (F#-dur, Bb-dur, F#m), enkelttoner med ♯/♭ (F♯, B♭).
 *
 * URL-parametere:
 *   key    toneart som er valgt fra start, f.eks. C, G, Bb, Am, F#m (standard: C)
 *   title  egen overskrift
 *   lang   no | en
 */
(function () {
  const { t, h, params, note } = RS;
  const VF = Vex.Flow;
  const app = document.getElementById('app');
  const HOT = '#ff2a5f', INK = '#f2f2f5', SOFT = '#a3a3b0';

  app.append(h('style', { text: `
    .wrap2 { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:14px; align-items:start; }
    .ring { border:1px solid var(--line); border-radius:18px; background:radial-gradient(120% 90% at 50% 0%,#1b1018 0%,#0e0e13 55%,#0a0a0e 100%); padding:10px; }
    .ring svg { display:block; width:100%; height:auto; max-width:440px; margin:0 auto; touch-action:manipulation; }
    .ring path { cursor:pointer; transition:fill .15s; }
    .ring text { font-family:Inter,system-ui,sans-serif; pointer-events:none; }
    .side { display:grid; gap:12px; }
    .staff { border:1px solid var(--line); border-radius:16px; background:#0e0e13; overflow:hidden; }
    .staff svg { display:block; }
    .sig { margin:0; font-size:15px; color:var(--muted); }
    .sig b { color:var(--text); }
    .rel { display:grid; gap:6px; margin:0; padding:0; list-style:none; }
    .rel button { width:100%; display:grid; grid-template-columns:auto 1fr; gap:2px 12px; align-items:baseline; text-align:left; border-radius:12px; padding:9px 12px; white-space:normal; }
    .rel strong { font-size:15px; }
    .rel span { color:var(--muted); font-size:13px; font-weight:600; }
    .rel em { grid-column:2; font-style:normal; color:#ff8aa6; font-size:13px; font-weight:600; }
    .rel button.on { border-color:${HOT}; background:rgba(255,42,95,.14); }
    @media (max-width:700px) { .wrap2 { grid-template-columns:1fr; } }
  ` }));

  // ---------- tonearter ----------
  const MAJ = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
  const MIN = ['A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'Bb', 'F', 'C', 'G', 'D'];
  const SHARPS = 'FCGDAEB', FLATS = 'BEADGCF';
  let enh = 'sharp';            // F#-dur/D#-moll eller Gb-dur/Eb-moll på klokka seks
  // Navn etter antall fortegn (+ = ♯, − = ♭), slik at en toneart alltid staves likt med fortegnene sine.
  const MAJ_BY = { 0: 'C', 1: 'G', 2: 'D', 3: 'A', 4: 'E', 5: 'B', 6: 'F#', 7: 'C#', '-1': 'F', '-2': 'Bb', '-3': 'Eb', '-4': 'Ab', '-5': 'Db', '-6': 'Gb', '-7': 'Cb' };
  const MIN_BY = { 0: 'A', 1: 'E', 2: 'B', 3: 'F#', 4: 'C#', 5: 'G#', 6: 'D#', 7: 'A#', '-1': 'D', '-2': 'G', '-3': 'C', '-4': 'F', '-5': 'Bb', '-6': 'Eb', '-7': 'Ab' };
  // Fortegnene til den valgte tonearten; klokka seks følger valgt skrivemåte.
  const selSig = () => (sel.i < 6 ? sel.i : sel.i > 6 ? sel.i - 12 : enh === 'flat' ? -6 : 6);
  // Fortegnene til en annen toneart, stavet nærmest den valgte (fra F#-dur er naboen C#-dur, ikke Db-dur).
  const sigNear = i => { const b = i <= 6 ? i : i - 12, s0 = selSig(); return [b, b + 12, b - 12].filter(x => Math.abs(x) <= 7).sort((x, y) => Math.abs(x - s0) - Math.abs(y - s0))[0]; };
  const nameBy = (ring, s) => (ring === 'maj' ? MAJ_BY : MIN_BY)[s];
  const label = (ring, s) => (ring === 'maj' ? t(`${nameBy(ring, s)}-dur`, `${nameBy(ring, s)} major`) : t(`${nameBy(ring, s)}-moll`, `${nameBy(ring, s)} minor`));
  const sym = (ring, s) => nameBy(ring, s) + (ring === 'min' ? 'm' : '');
  const accMap = s => { const m = {}; (s > 0 ? SHARPS : FLATS).slice(0, Math.abs(s)).split('').forEach(l => { m[l] = s > 0 ? 1 : -1; }); return m; };
  const tone = (l, a) => l + (a > 0 ? '♯' : a < 0 ? '♭' : '');
  const pc = (ring, i) => ((i * 7) % 12 + (ring === 'min' ? 9 : 0)) % 12;
  function triad(ring, i) {
    const r = pc(ring, i), root = 48 + r + (r > 7 ? 0 : 12);
    return [root - 12, root, root + (ring === 'min' ? 3 : 4), root + 7];
  }

  function parseKey(k) {
    const m = /^([A-G](?:#|b)?)(m?)$/.exec(k || '');
    if (!m) return { ring: 'maj', i: 0 };
    const ring = m[2] ? 'min' : 'maj', list = ring === 'maj' ? MAJ : MIN;
    let i = list.indexOf(m[1]);
    if (i < 0 && (m[1] === 'Gb' || m[1] === 'Eb')) { i = 6; enh = 'flat'; }
    return i < 0 ? { ring: 'maj', i: 0 } : { ring, i };
  }
  let sel = parseKey(params.get('key'));

  // De fem nærmest beslektede tonearter med forklaring.
  function related({ ring, i }) {
    const o = ring === 'maj' ? 'min' : 'maj', L = (i + 11) % 12, R = (i + 1) % 12;
    return [
      { ring, i: R, rel: t('nabo med klokka', 'neighbour clockwise') },
      { ring, i: L, rel: t('nabo mot klokka', 'neighbour anticlockwise') },
      { ring: o, i, rel: t('parallelltoneart', 'relative key') },
      { ring: o, i: R, rel: t('parallell til naboen med klokka', 'relative of the clockwise neighbour') },
      { ring: o, i: L, rel: t('parallell til naboen mot klokka', 'relative of the anticlockwise neighbour') },
    ];
  }
  // Hvilken tone er annerledes? Sammenligner fortegnene til den valgte tonearten og en annen.
  function difference(sb) {
    const ma = accMap(selSig()), mb = accMap(sb);
    const diff = [...SHARPS].filter(l => (ma[l] || 0) !== (mb[l] || 0));
    if (!diff.length) return t('samme fortegn – de samme sju tonene', 'same key signature – the same seven notes');
    return diff.map(l => t(`${tone(l, ma[l] || 0)} blir ${tone(l, mb[l] || 0)}`, `${tone(l, ma[l] || 0)} becomes ${tone(l, mb[l] || 0)}`)).join(', ');
  }

  // ---------- oppsett ----------
  const title = h('h1');
  const playBtn = h('button', { type: 'button', class: 'primary', on: { click: () => playOne(sel) } }, t('▶ Spill akkorden', '▶ Play the chord'));
  const tourBtn = h('button', { type: 'button', on: { click: tour } }, t('▶ Hør de beslektede', '▶ Hear the related keys'));
  app.append(h('header', {}, h('div', {}, h('p', { class: 'eyebrow', text: t('Kvintsirkelen', 'Circle of fifths') }), title), h('div', { class: 'row' }, playBtn, tourBtn)));
  const ring = h('div', { class: 'ring' }), staffBox = h('div', { class: 'staff' }), sigText = h('p', { class: 'sig' }), list = h('ul', { class: 'rel' });
  const enhSeg = RS.seg(t('Skrivemåte', 'Spelling'), [['sharp', ''], ['flat', '']], enh, v => { enh = v; render(); });
  const status = h('p', { class: 'status', role: 'status' });
  app.append(h('div', { class: 'wrap2' }, ring, h('div', { class: 'side' }, staffBox, sigText, enhSeg, list)), status);

  let lit = null;
  function svgRing() {
    const C = 200, rel = related(sel), on = new Set(rel.map(r => r.ring + r.i));
    const arc = (r1, r2, a0, a1) => {
      const p = (r, a) => `${(C + r * Math.cos(a)).toFixed(2)},${(C + r * Math.sin(a)).toFixed(2)}`;
      return `M${p(r2, a0)} A${r2},${r2} 0 0 1 ${p(r2, a1)} L${p(r1, a1)} A${r1},${r1} 0 0 0 ${p(r1, a0)} Z`;
    };
    let s = `<svg viewBox="0 0 400 400" role="img" aria-label="${t('Kvintsirkelen', 'Circle of fifths')}">`;
    [['maj', 122, 192, 15], ['min', 66, 122, 12]].forEach(([rg, r1, r2, size]) => {
      for (let i = 0; i < 12; i++) {
        const a0 = (i * 30 - 105) * Math.PI / 180, a1 = a0 + Math.PI / 6, mid = (a0 + a1) / 2, rm = (r1 + r2) / 2;
        const isSel = sel.ring === rg && sel.i === i, isRel = on.has(rg + i), isLit = lit && lit.ring === rg && lit.i === i;
        const fill = isLit || isSel ? HOT : isRel ? 'rgba(255,42,95,.28)' : rg === 'maj' ? '#18181f' : '#131319';
        s += `<path data-ring="${rg}" data-i="${i}" d="${arc(r1, r2, a0, a1)}" fill="${fill}" stroke="#0b0b10" stroke-width="2"/>`;
        const txt = i === 6 ? (rg === 'maj' ? 'F#/Gb' : 'D#m/Ebm') : (rg === 'maj' ? MAJ[i] : MIN[i] + 'm');
        const fs = i === 6 ? size - 3 : size;
        s += `<text x="${(C + rm * Math.cos(mid)).toFixed(1)}" y="${(C + rm * Math.sin(mid) + fs * 0.36).toFixed(1)}" text-anchor="middle" font-size="${fs}" font-weight="${isSel || isLit ? 800 : 700}" fill="${isSel || isLit || isRel ? '#fff' : rg === 'maj' ? INK : SOFT}">${txt}</text>`;
      }
    });
    const s0 = selSig();
    s += `<circle cx="${C}" cy="${C}" r="62" fill="#0e0e13" stroke="rgba(255,255,255,.1)"/>`;
    s += `<text x="${C}" y="${C - 4}" text-anchor="middle" font-size="22" font-weight="800" fill="${INK}">${sym(sel.ring, selSig())}</text>`;
    s += `<text x="${C}" y="${C + 18}" text-anchor="middle" font-size="12" font-weight="700" fill="${SOFT}">${s0 === 0 ? t('ingen fortegn', 'no accidentals') : `${Math.abs(s0)} ${s0 > 0 ? '♯' : '♭'}`}</text>`;
    ring.innerHTML = s + '</svg>';
  }
  ring.addEventListener('pointerdown', e => {
    const p = e.target.closest && e.target.closest('path[data-ring]');
    if (!p) return;
    sel = { ring: p.dataset.ring, i: Number(p.dataset.i) };
    render(); playOne(sel);
  });

  function drawStaff() {
    staffBox.innerHTML = '';
    const W = staffBox.clientWidth || 320, s = Math.max(1, Math.min(1.3, W / 360)), L = W / s;
    const r = new VF.Renderer(staffBox, VF.Renderer.Backends.SVG); r.resize(W, 104 * s);
    const ctx = r.getContext(); ctx.scale(s, s); ctx.setFillStyle(INK); ctx.setStrokeStyle(INK);
    const stave = new VF.Stave(8, -2, L - 16).addClef('treble').addKeySignature(sym(sel.ring, selSig()));
    stave.setContext(ctx).draw();
  }

  function render() {
    title.textContent = params.get('title') || label(sel.ring, selSig());
    svgRing(); drawStaff();
    const s0 = selSig(), m = accMap(s0);
    const tones = (s0 > 0 ? SHARPS : FLATS).slice(0, Math.abs(s0)).split('').map(l => tone(l, m[l]));
    sigText.innerHTML = s0 === 0 ? t('<b>Ingen fortegn.</b> Bare hvite tangenter.', '<b>No accidentals.</b> White keys only.')
      : t(`<b>${Math.abs(s0)} ${s0 > 0 ? 'kryss' : 'b-er'}:</b> ${tones.join(' – ')}`, `<b>${Math.abs(s0)} ${s0 > 0 ? 'sharps' : 'flats'}:</b> ${tones.join(' – ')}`);
    enhSeg.style.display = sel.i === 6 ? '' : 'none';
    if (sel.i === 6) {
      const b = enhSeg.querySelectorAll('button');
      b[0].textContent = sel.ring === 'maj' ? 'F#-dur' : 'D#-moll'; b[1].textContent = sel.ring === 'maj' ? 'Gb-dur' : 'Eb-moll';
      enhSeg.set(enh);
    }
    list.replaceChildren(...related(sel).map(r => {
      const sr = sigNear(r.i), plain = r.i <= 6 ? r.i : r.i - 12;
      // Stavet annerledes enn i sirkelen (C#-dur fra F#-dur): vis hva den klinger som.
      const also = sr !== plain && r.i !== 6 ? t(` · klinger som ${label(r.ring, plain)}`, ` · sounds like ${label(r.ring, plain)}`) : '';
      return h('li', {}, h('button', { type: 'button', class: lit && lit.ring === r.ring && lit.i === r.i ? 'on' : '', on: { click: () => { flash(r); playOne(r); } } },
        h('strong', { text: label(r.ring, sr) }), h('span', { text: r.rel + also }), h('em', { text: difference(sr) })));
    }));
    status.textContent = sel.i === 6
      ? t('F#-dur og Gb-dur klinger likt. De er enharmoniske tonearter.', 'F# major and Gb major sound the same. They are enharmonic keys.')
      : t('Naboer i sirkelen har seks av sju toner felles. Trykk på en toneart i sirkelen eller i listen.', 'Neighbours in the circle share six of seven notes. Tap a key in the circle or the list.');
  }

  // ---------- lyd ----------
  let timers = [];
  const clear = () => { timers.forEach(clearTimeout); timers = []; };
  function flash(k) { lit = k; render(); timers.push(setTimeout(() => { lit = null; render(); }, 900)); }
  function playOne(k, time) { RS.chord(triad(k.ring, k.i), { time, dur: 1.1, vel: 0.55 }); }
  function tour() {
    clear(); RS.audio();
    const seq = [sel, ...related(sel), sel], t0 = RS.now() + 0.05;
    seq.forEach((k, n) => {
      playOne(k, t0 + n * 1.0);
      timers.push(setTimeout(() => { lit = n === seq.length - 1 ? null : k; render(); status.textContent = `${label(k.ring, k === sel ? selSig() : sigNear(k.i))}${n && n < seq.length - 1 ? ' – ' + seq[n].rel : ''}`; }, n * 1000 + 30));
    });
    timers.push(setTimeout(() => { lit = null; render(); }, seq.length * 1000));
  }

  new ResizeObserver(() => drawStaff()).observe(staffBox);
  render();
})();
