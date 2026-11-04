/* Rockeskolen – Akkorder og harmoni: akkorder på noter og piano, på mørk bakgrunn, med lyd.
 *
 * Akkordtonene staves ut fra bokstavtrinn (ters = to bokstaver opp), slik at Cdim blir C – E♭ – G♭ og ikke C – D♯ – F♯.
 * Akkordsymboler skrives med vanlige tegn (Bb, F#m), enkelttoner med ♭/♯.
 *
 * URL-parametere:
 *   mode     chord | build | resolve | degrees       (standard: chord)
 *   chord    akkordsymbol for mode=chord, f.eks. C, Am, Cdim, Caug, Csus4, Cadd9, Emaj7, C9, C11, C13 (standard: C)
 *   compare  akkord å sammenligne med; tonene som er ulike, blir røde (mode=chord)
 *   root     grunntone for mode=build (C D E F G A B, standard: C)
 *   quality  dur | moll for mode=build (standard: dur)
 *   key      toneart for mode=degrees (C G D F Bb, standard: C)
 *   title    egen overskrift
 *   lang     no | en
 */
(function () {
  const { t, h, audio, seg, params, note } = RS;
  const VF = Vex.Flow;
  const app = document.getElementById('app');
  const mode = ['chord', 'build', 'resolve', 'degrees'].includes(params.get('mode')) ? params.get('mode') : 'chord';
  const INK = '#f2f2f5', MUTED = '#6f6f7c', SOFT = '#a3a3b0', HOT = '#ff2a5f';

  app.append(h('style', { text: `
    .score { position:relative; border:1px solid var(--line); border-radius:18px; background:radial-gradient(120% 90% at 50% 0%,#1b1018 0%,#0e0e13 55%,#0a0a0e 100%); overflow:hidden; touch-action:manipulation; }
    .score svg { display:block; }
    .score.tap { cursor:pointer; }
    .score .hot path, .score .hot rect { fill:${HOT} !important; stroke:${HOT} !important; }
    .score .hot text { fill:${HOT} !important; }
    .kb { border:1px solid var(--line); border-radius:18px; background:#0e0e13; padding:12px 12px 10px; }
    .kb svg { display:block; width:100%; height:auto; }
    .pair { display:grid; grid-template-columns:1.1fr 1fr; gap:12px; align-items:stretch; }
    .pair > * { min-width:0; }
    .pair .kb { display:flex; align-items:center; }
    .chips { display:flex; flex-wrap:wrap; gap:6px; }
    .chip { display:inline-flex; align-items:baseline; gap:7px; padding:6px 11px; border:1px solid var(--line); border-radius:999px; background:var(--panel); font-size:13px; color:var(--muted); }
    .chip b { color:var(--text); font-size:15px; }
    .chip i { font-style:normal; color:var(--text); font-weight:800; }
    .chip.hot { border-color:rgba(255,42,95,.7); background:rgba(255,42,95,.12); }
    .chip.hot b, .chip.hot i { color:#ff8aa6; }
    .legend { display:grid; gap:6px; margin:0; padding:0; list-style:none; font-size:14px; color:var(--muted); }
    .legend b { color:#ff8aa6; margin-right:6px; }
    @media (max-width:640px) { .pair { grid-template-columns:1fr; } }
  ` }));

  // ---------- tonenavn og akkorder ----------
  const LET = ['C', 'D', 'E', 'F', 'G', 'A', 'B'], NAT = [0, 2, 4, 5, 7, 9, 11];
  const SIGN = { '-2': '𝄫', '-1': '♭', 0: '', 1: '♯', 2: '𝄪' }, VFACC = { '-2': 'bb', '-1': 'b', 0: '', 1: '#', 2: '##' }, PLAIN = { '-1': 'b', 0: '', 1: '#' };
  // li = bokstavtrinn regnet fra C-1 (C4 = 35). Gir navn, VexFlow-nøkkel og fortegn for en bestemt midi-tone.
  function tone(li, midi) {
    const L = ((li % 7) + 7) % 7, oct = Math.floor(li / 7) - 1, acc = midi - (NAT[L] + 12 * (oct + 1));
    return { li, midi, acc, letter: LET[L], name: LET[L] + SIGN[acc], plain: LET[L] + PLAIN[acc], key: LET[L].toLowerCase() + VFACC[acc] + '/' + oct };
  }
  const R = [0, 0, '1'], M3 = [2, 4, '3'], m3 = [2, 3, '♭3'], P5 = [4, 7, '5'], b7 = [6, 10, '♭7'], N9 = [8, 14, '9'];
  const TYPES = {
    '': [R, M3, P5], m: [R, m3, P5], dim: [R, m3, [4, 6, '♭5']], aug: [R, M3, [4, 8, '♯5']],
    sus2: [R, [1, 2, '2'], P5], sus4: [R, [3, 5, '4'], P5], add9: [R, M3, P5, N9], 5: [R, P5],
    7: [R, M3, P5, b7], maj7: [R, M3, P5, [6, 11, '7']], m7: [R, m3, P5, b7],
    9: [R, M3, P5, b7, N9], 11: [R, M3, P5, b7, N9, [10, 17, '11']], 13: [R, M3, P5, b7, N9, [12, 21, '13']],
  };
  const DEG = {
    1: t('grunntone', 'root'), 3: t('stor ters', 'major third'), '♭3': t('liten ters', 'minor third'), 5: t('ren kvint', 'perfect fifth'),
    '♭5': t('forminsket kvint', 'diminished fifth'), '♯5': t('forstørret kvint', 'augmented fifth'), 2: t('stor sekund', 'major second'),
    4: t('ren kvart', 'perfect fourth'), '♭7': t('liten septim', 'minor seventh'), 7: t('stor septim', 'major seventh'),
    9: t('none', 'ninth'), 11: t('undesim', 'eleventh'), 13: t('tredesim', 'thirteenth'),
  };
  function parse(sym) {
    const m = /^([A-G])(#|b)?(.*)$/.exec(sym || '');
    if (!m || !TYPES[m[3]]) return null;
    const L = LET.indexOf(m[1]), acc = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0, li = 35 + L, midi = 60 + NAT[L] + acc;
    return { sym, root: m[1] + (m[2] || ''), type: m[3], tones: TYPES[m[3]].map(([dl, s, deg]) => ({ ...tone(li + dl, midi + s), deg })) };
  }
  function longName(c) {
    const q = { '': t(`${c.root}-dur`, `${c.root} major`), m: t(`${c.root}-moll`, `${c.root} minor`), dim: t('forminsket', 'diminished'), aug: t('forstørret', 'augmented'),
      sus2: t('sus-akkord', 'suspended'), sus4: t('sus-akkord', 'suspended'), add9: t('add-akkord', 'added ninth'), 5: t('kvintakkord', 'power chord'),
      7: t('septimakkord', 'seventh chord'), maj7: t('stor septimakkord', 'major seventh'), m7: t('mollseptimakkord', 'minor seventh'),
      9: t('nier-akkord', 'ninth chord'), 11: t('elleve-akkord', 'eleventh chord'), 13: t('tretten-akkord', 'thirteenth chord') }[c.type];
    return c.type === '' || c.type === 'm' ? q : `${c.sym} – ${q}`;
  }
  const list = arr => arr.join(' – ');

  // ---------- tegning ----------
  // Boks med VexFlow-SVG som tegnes på nytt når bredden endres. draw(ctx, L, H) får logisk bredde.
  function mount(host, height, draw) {
    const box = h('div', { class: 'score' }); host.append(box);
    let lastW = 0;
    function render() {
      const W = box.clientWidth; if (!W || W === lastW) return; lastW = W;
      box.innerHTML = '';
      const s = Math.max(1, Math.min(1.4, W / 520)), L = W / s, H = typeof height === 'function' ? height(L) : height;
      const r = new VF.Renderer(box, VF.Renderer.Backends.SVG); r.resize(W, H * s);
      const ctx = r.getContext(); ctx.scale(s, s); ctx.setFillStyle(INK); ctx.setStrokeStyle(INK);
      box.s = s; box.L = L;
      draw(ctx, L, H);
    }
    new ResizeObserver(render).observe(box);
    box.redraw = () => { lastW = 0; render(); };
    return box;
  }
  let uid = 0;
  // Tegner akkorder (helnoter) på bestemte x-posisjoner. chords: [{tones, x, color(i), accidentals}]. Returnerer notene med el.
  function drawChords(ctx, stave, chords) {
    const notes = chords.map(c => {
      const n = new VF.StaveNote({ keys: c.tones.map(x => x.key), duration: 'w', clef: 'treble' });
      c.tones.forEach((x, i) => {
        const col = c.color ? c.color(x, i) : INK;
        if (x.acc && c.accidentals !== false) { const a = new VF.Accidental(VFACC[x.acc]); a.setStyle({ fillStyle: col, strokeStyle: col }); n.addModifier(a, i); }
        n.setKeyStyle(i, { fillStyle: col, strokeStyle: col });
      });
      n.setLedgerLineStyle({ strokeStyle: SOFT, fillStyle: SOFT });
      n.setAttribute('id', 'c' + (++uid));
      return n;
    });
    const voice = new VF.Voice({ num_beats: 4 * notes.length, beat_value: 4 }).setMode(VF.Voice.Mode.SOFT).addTickables(notes);
    new VF.Formatter().joinVoices([voice]).format([voice], Math.max(40, stave.getNoteEndX() - stave.getNoteStartX() - 20));
    notes.forEach((n, i) => n.getTickContext().setX(chords[i].x - stave.getNoteStartX()));
    voice.draw(ctx, stave);
    return notes.map(n => ({ note: n, el: document.getElementById('vf-' + n.getAttribute('id')), x: n.getAbsoluteX(), ys: n.getYs() }));
  }
  function label(ctx, text, x, y, { size = 13, color = SOFT, weight = 'bold', align = 'center' } = {}) {
    const g = ctx.openGroup('lbl');
    ctx.setFont('Inter, system-ui, sans-serif', size, weight); ctx.setFillStyle(color);
    const w = ctx.measureText(text).width;
    ctx.fillText(text, align === 'center' ? x - w / 2 : x, y);
    ctx.setFillStyle(INK); ctx.closeGroup();
    return g;
  }
  const hot = (el, on) => el && el.classList.toggle('hot', !!on);

  // Pianotangenter som SVG. set(marks): Map midi → {name, on, hot, num}.
  function keyboard(lo, hi) {
    const el = h('div', { class: 'kb' });
    const isWhite = m => NAT.includes(((m % 12) + 12) % 12);
    function set(marks = new Map()) {
      const KW = 30, KH = 112, BW = 18, BH = 70;
      const whites = []; for (let m = lo; m <= hi; m++) if (isWhite(m)) whites.push(m);
      let svg = `<svg viewBox="0 0 ${whites.length * KW + 2} ${KH + 2}" role="img" aria-label="${t('Piano', 'Piano')}">`;
      const txt = (x, y, s, fill, size = 11) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="${size}" font-weight="800" fill="${fill}">${s}</text>`;
      whites.forEach((m, i) => {
        const k = marks.get(m), x = 1 + i * KW;
        const fill = k && k.on ? (k.soft ? '#b8325a' : HOT) : '#ececf1';
        svg += `<rect x="${x}" y="1" width="${KW - 2}" height="${KH}" rx="5" fill="${fill}"/>`;
        if (k && k.on) svg += txt(x + KW / 2 - 1, KH - 10, k.name, '#fff');
        else if (k && k.num) svg += txt(x + KW / 2 - 1, KH - 10, k.num, '#8e8e9c', 10);
        if (m % 12 === 0 && !(k && k.on)) svg += txt(x + KW / 2 - 1, KH - 26, 'C' + (Math.floor(m / 12) - 1), '#b4b4c0', 8);
      });
      for (let m = lo; m <= hi; m++) {
        if (isWhite(m)) continue;
        const k = marks.get(m), x = 1 + whites.filter(w => w < m).length * KW - BW / 2 - 1;
        const fill = k && k.on ? (k.soft ? '#b8325a' : HOT) : '#17171d';
        svg += `<rect x="${x}" y="1" width="${BW}" height="${BH}" rx="3" fill="${fill}" stroke="#0b0b10"/>`;
        if (k && k.on) svg += txt(x + BW / 2, BH - 9, k.name, '#fff', 9);
        else if (k && k.num) svg += txt(x + BW / 2, BH - 9, k.num, '#9a9aa8', 9);
      }
      el.innerHTML = svg + '</svg>';
    }
    set();
    return { el, set };
  }
  function header(eyebrow, title, ...right) {
    return h('header', {}, h('div', {}, h('p', { class: 'eyebrow', text: eyebrow }), h('h1', { text: params.get('title') || title })), right.length ? h('div', { class: 'row' }, ...right) : null);
  }
  // Spiller en akkord: brutt (arp) eller samlet, med grunntonen en oktav under som bass.
  function play(tones, { time, arp = false, dur = 1.6, bass = true } = {}) {
    audio();
    const t0 = time ?? RS.now() + 0.03, step = arp ? 0.28 : 0;
    if (bass) note(tones[0].midi - 12, { time: t0, dur: dur + tones.length * step, vel: 0.32 });
    tones.forEach((x, i) => note(x.midi, { time: t0 + i * step, dur: dur + (tones.length - i) * step, vel: 0.4 }));
    if (arp) tones.forEach(x => note(x.midi, { time: t0 + tones.length * step + 0.2, dur, vel: 0.36 }));
    return t0 + (arp ? tones.length * step + 0.2 : 0) + dur;
  }

  // ======================================================================
  // Én akkord, eventuelt sammenlignet med en annen: tonene som er ulike, blir røde.
  function chordView() {
    const main = parse(params.get('chord')) || parse('C'), other = parse(params.get('compare'));
    let cur = main;
    const chips = h('div', { class: 'chips' }), status = h('p', { class: 'status', role: 'status' });
    const kb = keyboard(60, 83);
    const playBtn = h('button', { type: 'button', class: 'primary', on: { click: () => play(cur.tones) } }, t('▶ Spill', '▶ Play'));
    const arpBtn = h('button', { type: 'button', on: { click: () => play(cur.tones, { arp: true }) } }, t('Brutt', 'Broken'));
    const title = h('h1');
    app.append(h('header', {}, h('div', {}, h('p', { class: 'eyebrow', text: t('Akkord', 'Chord') }), title), h('div', { class: 'row' }, playBtn, arpBtn)));
    const diff = c => (other ? c.tones.filter(x => !(c === main ? other : main).tones.some(y => y.name === x.name)) : []);
    const pair = h('div', { class: 'pair' }); app.append(pair);
    const box = mount(pair, 170, (ctx, L) => {
      const stave = new VF.Stave(8, 34, L - 16).addClef('treble');
      stave.setContext(ctx).draw();
      const changed = diff(cur), x = (stave.getNoteStartX() + stave.getNoteEndX()) / 2 - 6;
      drawChords(ctx, stave, [{ tones: cur.tones, x, color: v => (changed.includes(v) ? HOT : INK) }]);
      label(ctx, cur.sym, x + 6, 20, { size: 15, color: INK, weight: '800' });
    });
    pair.append(kb.el);
    if (other) {
      const cmp = seg(t('Sammenlign', 'Compare'), [[other.sym, other.sym], [main.sym, main.sym]], main.sym, v => { cur = v === main.sym ? main : other; update(); play(cur.tones); });
      app.append(h('div', { class: 'row' }, cmp, h('span', { class: 'small muted', text: t('Bytt og hør forskjellen.', 'Switch and hear the difference.') })));
    }
    app.append(chips, status);
    function update() {
      const changed = diff(cur);
      title.textContent = params.get('title') || longName(cur);
      kb.set(new Map(cur.tones.map(x => [x.midi, { name: x.name, on: true, soft: other && !changed.includes(x) }])));
      chips.replaceChildren(...cur.tones.map(x => h('span', { class: 'chip' + (changed.includes(x) ? ' hot' : '') }, h('b', { text: x.name }), h('i', { text: x.deg }), DEG[x.deg])));
      const base = cur === main ? other : main;
      if (!other) status.textContent = `${cur.sym} = ${list(cur.tones.map(x => x.name))}.`;
      else if (cur === other) status.textContent = `${cur.sym} = ${list(cur.tones.map(x => x.name))}. ${t(`Bytt til ${main.sym} og hør hva som endrer seg.`, `Switch to ${main.sym} and hear what changes.`)}`;
      else {
        const gone = base.tones.filter(x => !cur.tones.some(y => y.name === x.name));
        const parts = changed.map((x, i) => (gone[i] && cur.tones.length === base.tones.length ? t(`${gone[i].name} blir ${x.name}`, `${gone[i].name} becomes ${x.name}`) : t(`${x.name} kommer i tillegg`, `${x.name} is added`)));
        status.textContent = `${cur.sym} = ${list(cur.tones.map(x => x.name))}. ${t('Forskjellen fra', 'Compared with')} ${base.sym}: ${parts.join(', ')}.`;
      }
      box.redraw();
    }
    update();
  }

  // ======================================================================
  // Bygg en treklang: annenhver tone i skalaen, 1 – 3 – 5.
  function buildView() {
    let root = LET.includes(params.get('root')) ? params.get('root') : 'C', q = params.get('quality') === 'moll' ? 'moll' : 'dur', on = { 3: false, 5: false }, notes = [];
    const SCALE = { dur: [0, 2, 4, 5, 7, 9, 11, 12], moll: [0, 2, 3, 5, 7, 8, 10, 12] };
    const scale = () => { const L = LET.indexOf(root), li = 35 + L, m = 60 + NAT[L]; return SCALE[q].map((s, i) => tone(li + i, m + s)); };
    const chord = () => { const s = scale(); return [s[0], on[3] && s[2], on[5] && s[4]].filter(Boolean); };
    const status = h('p', { class: 'status', role: 'status' }), kb = keyboard(60, 83);
    const playBtn = h('button', { type: 'button', class: 'primary', on: { click: () => play(chord(), { arp: chord().length > 1 }) } }, t('▶ Spill', '▶ Play'));
    const tog = deg => h('button', { type: 'button', 'aria-pressed': 'false', on: { click: e => { on[deg] = !on[deg]; e.currentTarget.setAttribute('aria-pressed', String(on[deg])); update(); if (on[deg]) { const s = scale(); play([s[deg - 1]], { dur: 0.7, bass: false }); setTimeout(() => play(chord(), { dur: 1.2 }), 650); } } } },
      deg === 3 ? t('+ ters (3)', '+ third (3)') : t('+ kvint (5)', '+ fifth (5)'));
    const t3 = tog(3), t5 = tog(5);
    app.append(header(t('Treklangen', 'The triad'), t('Bygg en treklang', 'Build a triad'), playBtn));
    const box = mount(app, 175, (ctx, L) => {
      const stave = new VF.Stave(8, 34, L - 16).addClef('treble');
      stave.setContext(ctx).draw();
      const s = scale(), c = chord(), x0 = stave.getNoteStartX() + 14, x1 = stave.getNoteEndX(), split = x0 + (x1 - x0) * 0.72, step = (split - x0 - 24) / 7;
      const pick = new Set(c.map(x => x.name));
      const scaleNotes = drawChords(ctx, stave, s.map((x, i) => ({ tones: [x], x: x0 + i * step, color: () => (pick.has(x.name) && i < 7 ? HOT : MUTED) })));
      const yNum = stave.getYForLine(4) + 40;
      scaleNotes.forEach((n, i) => label(ctx, String(i === 7 ? 1 : i + 1), n.x + 6, yNum, { size: 12, color: pick.has(s[i].name) && i < 7 ? HOT : SOFT }));
      ctx.save(); ctx.setStrokeStyle('rgba(255,255,255,.18)'); ctx.beginPath(); ctx.moveTo(split - 10, stave.getYForLine(0)); ctx.lineTo(split - 10, stave.getYForLine(4)); ctx.stroke(); ctx.restore();
      notes = drawChords(ctx, stave, [{ tones: c, x: split + (x1 - split) / 2 - 12 }]);
      label(ctx, c.length === 3 ? `${root}${q === 'moll' ? 'm' : ''}` : c.length === 2 && on[5] ? `${root}5` : '', split + (x1 - split) / 2 - 6, 20, { size: 15, color: INK, weight: '800' });
      label(ctx, q === 'dur' ? t(`${root}-durskala`, `${root} major scale`) : t(`${root}-mollskala`, `${root} minor scale`), x0 - 4, 20, { size: 12, align: 'left' });
    });
    const rootSeg = seg(t('Grunntone', 'Root'), LET.map(l => [l, l]), root, v => { root = v; update(); play(chord(), { dur: 1.1 }); });
    rootSeg.classList.add('wrap');
    const qSeg = seg(t('Dur eller moll', 'Major or minor'), [['dur', t('Dur', 'Major')], ['moll', t('Moll', 'Minor')]], q, v => { q = v; update(); play(chord(), { dur: 1.1 }); });
    app.append(h('div', { class: 'pair' }, h('div', { style: 'display:grid;gap:10px;align-content:center' },
      h('div', { class: 'row' }, h('button', { type: 'button', 'aria-pressed': 'true', on: { click: () => play([scale()[0]], { dur: 0.9, bass: false }) } }, t('1 grunntone', '1 root')), t3, t5),
      h('div', { class: 'row' }, qSeg), rootSeg), kb.el), status);
    function update() {
      const s = scale(), c = chord(), names = new Set(c.map(x => x.name));
      const marks = new Map(s.slice(0, 7).map((x, i) => [x.midi, { num: String(i + 1), name: x.name, on: names.has(x.name) }]));
      kb.set(marks);
      const [a, b, d] = c, semi = (x, y) => y.midi - x.midi;
      const third = x => (semi(a, x) === 4 ? t('stor ters', 'major third') : t('liten ters', 'minor third'));
      if (c.length === 1) status.textContent = t(`Grunntonen ${a.name}. Legg til tersen: tonen to trinn opp i skalaen (trinn 3).`, `The root ${a.name}. Add the third: two steps up the scale (degree 3).`);
      else if (c.length === 2 && on[3]) status.textContent = t(`${a.name} og ${b.name}: en ${third(b)} (${semi(a, b)} halvtoner). Legg til kvinten, to trinn til opp (trinn 5).`, `${a.name} and ${b.name}: a ${third(b)} (${semi(a, b)} semitones). Add the fifth, two more steps up (degree 5).`);
      else if (c.length === 2) status.textContent = t(`${a.name} og ${b.name}: en ren kvint uten ters. Det er verken dur eller moll – en kvintakkord (${root}5), mye brukt i rock.`, `${a.name} and ${b.name}: a perfect fifth without a third. Neither major nor minor – a power chord (${root}5), common in rock.`);
      else status.textContent = t(`${root}${q === 'moll' ? '-moll' : '-dur'} = ${list(c.map(x => x.name))}: ${third(b)} (${semi(a, b)} halvtoner) + ${semi(b, d) === 4 ? 'stor ters' : 'liten ters'} (${semi(b, d)} halvtoner) = ren kvint (7 halvtoner).`,
        `${root} ${q === 'moll' ? 'minor' : 'major'} = ${list(c.map(x => x.name))}: ${third(b)} (${semi(a, b)} semitones) + ${semi(b, d) === 4 ? 'major third' : 'minor third'} (${semi(b, d)} semitones) = perfect fifth (7 semitones).`);
      box.redraw();
    }
    update();
  }

  // ======================================================================
  // Spenning og oppløsning: G7 går til C. Ledetonen går opp, septimen går ned.
  function resolveView() {
    const G7 = [tone(34, 59), tone(36, 62), tone(38, 65), tone(39, 67)], C = [tone(35, 60), tone(37, 64), tone(39, 67)];
    let els = [];
    const status = h('p', { class: 'status', role: 'status' });
    const light = i => els.forEach((e, k) => hot(e, k === i));
    function run(which) {
      audio(); const t0 = RS.now() + 0.05;
      if (which !== 'C') { play(G7, { time: t0, dur: which === 'G7' ? 2.2 : 1.3 }); light(0); }
      if (which !== 'G7') { const t1 = which === 'C' ? t0 : t0 + 1.45; play(C, { time: t1, dur: 2.2 }); setTimeout(() => light(1), (t1 - t0) * 1000); }
      setTimeout(() => light(-1), (which === 'both' ? 3.7 : 2.3) * 1000);
      status.textContent = which === 'G7' ? t('G7 alene: hører du at den vil videre? Den står og venter.', 'G7 alone: can you hear that it wants to move on? It is waiting.')
        : which === 'C' ? t('C alene: rolig og stabil – her kan musikken stoppe.', 'C alone: calm and stable – the music can stop here.')
          : t('Spenning, så hvile: B går et halvt trinn opp til C, og F går et halvt trinn ned til E.', 'Tension, then rest: B moves a half step up to C, and F moves a half step down to E.');
    }
    app.append(header(t('Spenning og oppløsning', 'Tension and resolution'), t('G7 vil hjem til C', 'G7 wants to go home to C'),
      h('button', { type: 'button', class: 'primary', on: { click: () => run('both') } }, t('▶ G7 → C', '▶ G7 → C')),
      h('button', { type: 'button', on: { click: () => run('G7') } }, t('Bare G7', 'G7 only')),
      h('button', { type: 'button', on: { click: () => run('C') } }, t('Bare C', 'C only'))));
    mount(app, 190, (ctx, L) => {
      const stave = new VF.Stave(8, 44, L - 16).addClef('treble');
      stave.setContext(ctx).draw();
      const x0 = stave.getNoteStartX(), w = stave.getNoteEndX() - x0, xa = x0 + w * 0.22, xb = x0 + w * 0.68;
      const lead = v => v.name === 'B' || v.name === 'F';
      const [a, b] = drawChords(ctx, stave, [{ tones: G7, x: xa, color: v => (lead(v) ? HOT : INK) }, { tones: C, x: xb, color: v => (v.name === 'C' || v.name === 'E' ? HOT : INK) }]);
      els = [a.el, b.el];
      // Stemmeføring: B → C og F → E i rødt, D → C og G → G svakt.
      const moves = [[0, 0, true], [2, 1, true], [1, 0, false], [3, 2, false]];
      moves.forEach(([i, j, strong]) => {
        ctx.save(); ctx.setStrokeStyle(strong ? HOT : 'rgba(255,255,255,.22)'); ctx.setLineWidth(strong ? 2 : 1.2);
        ctx.beginPath(); ctx.moveTo(xa + 38, a.ys[i]); ctx.lineTo(xb - 14, b.ys[j]); ctx.stroke(); ctx.restore();
      });
      label(ctx, 'G7', xa + 6, 22, { size: 16, color: INK, weight: '800' });
      label(ctx, 'C', xb + 6, 22, { size: 16, color: INK, weight: '800' });
      label(ctx, t('spenning', 'tension'), xa + 6, stave.getYForLine(4) + 50, { size: 12 });
      label(ctx, t('hvile', 'rest'), xb + 6, stave.getYForLine(4) + 50, { size: 12 });
    });
    app.append(h('ul', { class: 'legend' },
      h('li', {}, h('b', { text: 'B → C' }), t('Ledetonen ligger et halvt trinn under grunntonen og vil opp.', 'The leading note sits a half step below the root and wants to rise.')),
      h('li', {}, h('b', { text: 'F → E' }), t('Septimen vil et halvt trinn ned.', 'The seventh wants to fall a half step.')),
      h('li', {}, h('b', { text: 'B – F' }), t('Sammen danner de en tritonus, og det er den som gir G7 spenningen.', 'Together they form a tritone, which gives G7 its tension.'))), status);
    status.textContent = t('Trykk på G7 → C. Se de røde linjene: to toner flytter seg bare et halvt trinn.', 'Press G7 → C. Watch the red lines: two notes move only a half step.');
  }

  // ======================================================================
  // Én akkord på hvert trinn i durskalaen: I ii iii IV V vi vii°.
  function degreesView() {
    const KEYS = ['C', 'G', 'D', 'F', 'Bb'];
    let key = KEYS.includes(params.get('key')) ? params.get('key') : 'C', recs = [], chords = [];
    const ROM = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
    const status = h('p', { class: 'status', role: 'status' });
    function build() {
      // Bb starter en oktav lavere, så de øverste akkordene ikke havner langt over notelinjene.
      const L = LET.indexOf(key[0]), acc = key[1] === 'b' ? -1 : 0, low = key === 'Bb' ? 7 : 0, li = 35 + L - low, m = 60 + NAT[L] + acc - (low ? 12 : 0);
      const sc = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21].map((s, i) => tone(li + i, m + s));
      chords = ROM.map((r, i) => {
        const tones = [sc[i], sc[i + 2], sc[i + 4]], third = tones[1].midi - tones[0].midi, fifth = tones[2].midi - tones[0].midi;
        const type = fifth === 6 ? 'dim' : third === 3 ? 'm' : '';
        return { tones, type, sym: tones[0].plain + type, rom: type === '' ? r : r.toLowerCase() + (type === 'dim' ? '°' : ''),
          q: type === '' ? t('dur', 'major') : type === 'm' ? t('moll', 'minor') : t('forminsket', 'diminished') };
      });
    }
    function pick(i, quiet) {
      recs.forEach((r, k) => hot(r.el, k === i));
      if (i < 0) return;
      const c = chords[i];
      if (!quiet) play(c.tones, { dur: 1.3 });
      status.textContent = `${c.rom} = ${c.sym}: ${list(c.tones.map(x => x.name))} (${c.q}).`;
    }
    const allBtn = h('button', { type: 'button', class: 'primary', on: { click: () => {
      audio(); const t0 = RS.now() + 0.05;
      [0, 1, 2, 3, 4, 5, 6, 0].forEach((i, k) => { play(chords[i].tones, { time: t0 + k * 0.62, dur: 0.55 }); setTimeout(() => pick(i, true), k * 620 + 50); });
      setTimeout(() => pick(-1), 8 * 620 + 300);
    } } }, t('▶ Spill alle trinn', '▶ Play every degree'));
    app.append(header(t('Akkorder i tonearten', 'Chords in the key'), t('Én akkord på hvert trinn', 'One chord on every degree'), allBtn));
    const box = mount(app, 205, (ctx, L) => {
      const stave = new VF.Stave(8, 58, L - 16).addClef('treble').addKeySignature(key);
      stave.setContext(ctx).draw();
      const x0 = stave.getNoteStartX() + 10, step = (stave.getNoteEndX() - x0 - 16) / 7;
      recs = drawChords(ctx, stave, chords.map((c, i) => ({ tones: c.tones, x: x0 + i * step, accidentals: false })));
      recs.forEach((r, i) => {
        r.x0 = x0 + i * step - step / 2 + 8; r.x1 = r.x0 + step;
        label(ctx, chords[i].sym, r.x + 6, 22, { size: step < 46 ? 11 : 13, color: INK, weight: '800' });
        label(ctx, chords[i].rom, r.x + 6, stave.getYForLine(4) + 52, { size: step < 46 ? 12 : 14, color: chords[i].type === '' ? HOT : SOFT, weight: '800' });
      });
    });
    box.classList.add('tap');
    box.addEventListener('pointerdown', e => {
      const x = (e.clientX - box.getBoundingClientRect().left) / box.s;
      const i = recs.findIndex(r => x >= r.x0 && x < r.x1);
      if (i >= 0) pick(i);
    });
    const keySeg = seg(t('Toneart', 'Key'), KEYS.map(k => [k, k + t('-dur', ' major')]), key, v => { key = v; build(); box.redraw(); status.textContent = t(`Samme mønster i ${key}-dur: I, IV og V er dur, ii, iii og vi er moll, vii° er forminsket.`, `Same pattern in ${key} major: I, IV and V are major, ii, iii and vi are minor, vii° is diminished.`); });
    keySeg.classList.add('wrap');
    app.append(h('div', { class: 'row spread' }, keySeg, h('span', { class: 'small muted', text: t('Store romertall = dur, små = moll, ° = forminsket.', 'Upper case = major, lower case = minor, ° = diminished.') })), status);
    build(); box.redraw();
    status.textContent = t('Trykk på en akkord for å høre den. I, IV og V er durakkordene i tonearten.', 'Tap a chord to hear it. I, IV and V are the major chords in the key.');
  }

  ({ chord: chordView, build: buildView, resolve: resolveView, degrees: degreesView })[mode]();
})();
