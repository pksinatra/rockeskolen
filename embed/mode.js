/* Rockeskolen – skalaer og kirketonearter: noter, piano og lyd på mørk bakgrunn.
 *
 * URL-parametere:
 *   scales  kommaliste med grunntone:skala, f.eks. "F:ionian,F:lydian" eller "C:major,A:minor".
 *           Skalaer: ionian, dorian, phrygian, lydian, mixolydian, aeolian, locrian, major, minor (nat_minor),
 *           harmonic_minor (harm_minor), melodic_minor (mel_minor), phrygian_dominant, minor_blues (pent_blues),
 *           major_pent, minor_pent, whole_tone, half_whole_dim, whole_half_dim. Grunntone som C, F#, Bb (# skrives %23).
 *   sets    i stedet for scales: egne tonerekker, "Navn|C4-C%234-D4;Navn 2|E4-F4" (b = ♭, # = ♯, n = ♮, * etter tonen = rød)
 *   mark    diff | char | none. diff markerer tonene som skiller skalaene (to skalaer: hverandre;
 *           flere: mot den første). char markerer karaktertonen. Standard: diff ved samme grunntone, ellers char.
 *   chord   akkord som ligger under skalaen i f-nøkkel, f.eks. C, Am, Dm, G7, Bdim, Bm7b5, Fmaj7%2311
 *   view    full | staff | keys | steps   (staff/keys/steps er små widgets; standard: full)
 *   dir     up | down | both – retning fra start (direction= godtas også). Melodisk moll går ned som naturlig moll.
 *   oct     oktav for grunntonen (standard 4)
 *   drone   1 = borduntone på grunntonen er slått på fra start
 *   title   egen overskrift
 *   tempo   slag per minutt (standard 100)
 *   lang    no | en
 * Tonene staves fra grunntonens bokstav, så F-lydisk gir B (ikke C♭) og E-frygisk gir F (ikke E♯).
 * Fortegn gjelder ut takten, slik at E♮ etter E♭ og G♮ etter G♯ (melodisk moll nedover) får oppløsningstegn.
 */
(function () {
  const { t, h, seg, params, note } = RS;
  const VF = Vex.Flow;
  const app = document.getElementById('app');
  const INK = '#f2f2f5', SOFT = '#a3a3b0', HOT = '#ff2a5f', COOL = '#5b8cff';
  const view = ['full', 'staff', 'keys', 'steps'].includes(params.get('view')) ? params.get('view') : 'full';
  if (view !== 'full') document.body.classList.add('widget');

  app.append(h('style', { text: `
    .score { position:relative; border:1px solid var(--line); border-radius:18px; background:radial-gradient(120% 90% at 50% 0%,#1b1018 0%,#0e0e13 55%,#0a0a0e 100%); overflow:hidden; }
    .score svg { display:block; }
    .kb { border:1px solid var(--line); border-radius:18px; background:#0e0e13; padding:12px 12px 10px; }
    .kb svg { display:block; width:100%; height:auto; max-width:760px; margin:0 auto; }
    .kb rect[data-midi] { cursor:pointer; }
    .cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:8px; }
    .card { display:grid; gap:3px; text-align:left; border-radius:14px; padding:10px 13px; white-space:normal; }
    .card strong { font-size:15px; }
    .card span { color:var(--muted); font-size:12px; font-weight:600; letter-spacing:.02em; }
    .card[aria-pressed="true"] span { color:#ffe1e8; }
    .card b { color:#ff8aa6; }
    .card[aria-pressed="true"] b { color:#fff; text-decoration:underline; }
    .steps { display:flex; flex-wrap:wrap; align-items:center; gap:6px 4px; }
    .steps .n { min-width:34px; padding:6px 9px; border:1px solid var(--line); border-radius:999px; background:var(--panel); text-align:center; font-size:15px; font-weight:800; }
    .steps .n.mark { border-color:rgba(255,42,95,.75); background:rgba(255,42,95,.14); color:#ff8aa6; }
    .steps .n.play { border-color:${COOL}; background:rgba(91,140,255,.2); color:#fff; }
    .steps .s { padding:0 3px; color:var(--muted); font-size:11px; font-weight:800; letter-spacing:.04em; text-transform:uppercase; }
    .steps .s.half { color:#ff8aa6; }
    .steps .s.wide { color:#ffd27a; }
    body.widget .kb svg { max-width:520px; }
    body.widget .steps .n { min-width:40px; padding:8px 11px; font-size:17px; }
    .info { margin:0; color:var(--muted); font-size:14px; line-height:1.5; }
    .info b { color:#ff8aa6; }
    .legend { display:flex; flex-wrap:wrap; gap:6px 14px; font-size:13px; color:var(--muted); font-weight:600; }
    .legend i { display:inline-block; width:10px; height:10px; border-radius:3px; margin-right:6px; vertical-align:-1px; }
  ` }));

  // ---------- musikkteori ----------
  const LET = ['C', 'D', 'E', 'F', 'G', 'A', 'B'], NAT = [0, 2, 4, 5, 7, 9, 11], MAJOR = NAT;
  const SIGN = { '-2': '𝄫', '-1': '♭', 0: '', 1: '♯', 2: '𝄪' }, VFACC = { '-2': 'bb', '-1': 'b', 0: 'n', 1: '#', 2: '##' };
  // li = bokstavtrinn regnet fra C-1 (C4 = 35).
  function tone(li, midi) {
    const L = ((li % 7) + 7) % 7, oct = Math.floor(li / 7) - 1, acc = midi - (NAT[L] + 12 * (oct + 1));
    return { li, midi, acc, letter: LET[L], oct, name: LET[L] + SIGN[acc], key: LET[L].toLowerCase() + '/' + oct };
  }
  const MINOR = [0, 2, 3, 5, 7, 8, 10];
  const SCALES = {
    ionian:            { st: MAJOR, no: 'jonisk', en: 'Ionian', char: [3, 6] },
    major:             { st: MAJOR, no: 'dur', en: 'major', char: [] },
    dorian:            { st: [0, 2, 3, 5, 7, 9, 10], no: 'dorisk', en: 'Dorian', char: [5] },
    phrygian:          { st: [0, 1, 3, 5, 7, 8, 10], no: 'frygisk', en: 'Phrygian', char: [1] },
    lydian:            { st: [0, 2, 4, 6, 7, 9, 11], no: 'lydisk', en: 'Lydian', char: [3] },
    mixolydian:        { st: [0, 2, 4, 5, 7, 9, 10], no: 'mixolydisk', en: 'Mixolydian', char: [6] },
    aeolian:           { st: MINOR, no: 'eolisk', en: 'Aeolian', char: [5] },
    minor:             { st: MINOR, no: 'moll', en: 'minor', char: [] },
    locrian:           { st: [0, 1, 3, 5, 6, 8, 10], no: 'lokrisk', en: 'Locrian', char: [1, 4] },
    harmonic_minor:    { st: [0, 2, 3, 5, 7, 8, 11], name: r => t(`harmonisk ${r}-moll`, `${r} harmonic minor`), char: [6] },
    melodic_minor:     { st: [0, 2, 3, 5, 7, 9, 11], down: MINOR, name: r => t(`melodisk ${r}-moll`, `${r} melodic minor`), char: [5, 6] },
    phrygian_dominant: { st: [0, 1, 4, 5, 7, 8, 10], no: 'frygisk dominant', en: 'Phrygian dominant', char: [1, 2] },
    // Bluesskalaen har seks toner; ♭5 staves som eget bokstavtrinn (D♭ i G-blues, E♭ i A-blues).
    minor_blues:       { st: [0, 3, 5, 6, 7, 10], steps: [0, 2, 3, 4, 4, 6], name: r => t(`${r}-bluesskala (moll)`, `${r} blues scale`), char: [3] },
    major_pent:        { st: [0, 2, 4, 7, 9], steps: [0, 1, 2, 4, 5], name: r => t(`${r} dur-pentatonisk`, `${r} major pentatonic`), char: [] },
    minor_pent:        { st: [0, 3, 5, 7, 10], steps: [0, 2, 3, 4, 6], name: r => t(`${r} moll-pentatonisk`, `${r} minor pentatonic`), char: [] },
    whole_tone:        { st: [0, 2, 4, 6, 8, 10], name: r => t(`${r} heltoneskala`, `${r} whole-tone scale`), char: [] },
    // Åtte toner på sju bokstaver: én bokstav brukes to ganger (E♭ – E, F – F♯).
    half_whole_dim:    { st: [0, 1, 3, 4, 6, 7, 9, 10], steps: [0, 1, 2, 2, 3, 4, 5, 6], name: r => t(`${r} halv–hel dim`, `${r} half–whole diminished`), char: [] },
    whole_half_dim:    { st: [0, 2, 3, 5, 6, 8, 9, 11], steps: [0, 1, 2, 3, 3, 4, 5, 6], name: r => t(`${r} hel–halv dim`, `${r} whole–half diminished`), char: [] },
  };
  const ALIAS = { nat_minor: 'minor', harm_minor: 'harmonic_minor', mel_minor: 'melodic_minor', pent_blues: 'minor_blues' };
  // Hva karaktertonen heter, etter bokstavtrinn (0-basert) og halvtoner over grunntonen.
  const DEGREE_NAME = {
    '1:1': t('liten sekund', 'minor second'), '1:2': t('stor sekund', 'major second'), '2:3': t('liten ters', 'minor third'), '2:4': t('stor ters', 'major third'),
    '3:5': t('ren kvart', 'perfect fourth'), '3:6': t('forstørret kvart', 'augmented fourth'), '4:6': t('forminsket kvint', 'diminished fifth'), '4:7': t('ren kvint', 'perfect fifth'),
    '5:8': t('liten sekst', 'minor sixth'), '5:9': t('stor sekst', 'major sixth'), '6:10': t('liten septim', 'minor seventh'), '6:11': t('stor septim', 'major seventh'),
  };
  const oct0 = Math.max(2, Math.min(5, Number(params.get('oct')) || 4));

  function buildScale(root, type) {
    const def = SCALES[ALIAS[type] || type], r = /^([A-G])(b|#)?$/.exec(root || '');
    if (!def || !r) return null;
    const L = LET.indexOf(r[1]), li0 = 7 * (oct0 + 1) + L, m0 = 12 * (oct0 + 1) + NAT[L] + (r[2] === 'b' ? -1 : r[2] === '#' ? 1 : 0);
    const steps = def.steps || def.st.map((_, i) => i);
    const up = def.st.map((s, i) => ({ ...tone(li0 + steps[i], m0 + s), degree: i, semi: s, step: steps[i] }));
    up.push({ ...tone(li0 + 7, m0 + 12), degree: def.st.length, semi: 12, step: 7, octave: true });
    const down = def.down
      ? [up[up.length - 1], ...def.down.map((s, i) => ({ ...tone(li0 + i, m0 + s), degree: i, semi: s, step: i })).reverse()]
      : up.slice().reverse();
    const name = def.name ? def.name(root) : `${root}-${t(def.no, def.en)}`;
    return { kind: 'scale', root, def, up, down, name };
  }
  // Bokstavtrinn + halvtoner → formel som 1 2 ♭3 4 5 ♭6 ♭7.
  function formula(item) {
    return item.up.slice(0, -1).map(n => {
      const adj = n.semi - MAJOR[n.step];
      return (adj < 0 ? '♭'.repeat(-adj) : '♯'.repeat(adj)) + (n.step + 1);
    });
  }
  function parseNote(text) {
    const m = /^([A-G])(bb|b|##|#|n)?(\d)(\*)?$/.exec(text.trim());
    if (!m) return null;
    const acc = { bb: -2, b: -1, '#': 1, '##': 2 }[m[2] || ''] || 0, oct = Number(m[3]), L = LET.indexOf(m[1]);
    return { ...tone(7 * (oct + 1) + L, 12 * (oct + 1) + NAT[L] + acc), natural: m[2] === 'n', explicit: true, hot: !!m[4] };
  }
  const CHORDS = {
    '': [[0, 0], [2, 4], [4, 7]], m: [[0, 0], [2, 3], [4, 7]], dim: [[0, 0], [2, 3], [4, 6]], aug: [[0, 0], [2, 4], [4, 8]],
    7: [[0, 0], [2, 4], [4, 7], [6, 10]], maj7: [[0, 0], [2, 4], [4, 7], [6, 11]], m7: [[0, 0], [2, 3], [4, 7], [6, 10]],
    m7b5: [[0, 0], [2, 3], [4, 6], [6, 10]], 'maj7#11': [[0, 0], [2, 4], [4, 7], [6, 11], [10, 18]],
  };
  // Akkorden legges i f-nøkkel: C, D og E fra oktav 3, F–B fra oktav 2.
  function parseChord(sym) {
    const m = /^([A-G])(#|b)?(.*)$/.exec(sym || '');
    if (!m || !CHORDS[m[3]]) return null;
    const L = LET.indexOf(m[1]), oct = L < 3 ? 3 : 2, li0 = 7 * (oct + 1) + L, m0 = 12 * (oct + 1) + NAT[L] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    return { sym, tones: CHORDS[m[3]].map(([dl, s]) => tone(li0 + dl, m0 + s)) };
  }

  // ---------- data fra URL ----------
  let items;
  if (params.get('sets')) {
    items = params.get('sets').split(';').map(part => {
      const [label, list] = part.includes('|') ? part.split('|') : ['', part];
      const notes = (list || '').split('-').map(parseNote).filter(Boolean);
      return notes.length ? { kind: 'set', name: label.trim() || notes.map(n => n.name).join(' – '), up: notes, down: notes } : null;
    }).filter(Boolean);
  } else {
    items = (params.get('scales') || 'C:ionian').split(',').map(s => { const [root, type] = s.trim().split(':'); return buildScale(root, type || 'ionian'); }).filter(Boolean);
  }
  if (!items.length) items = [buildScale('C', 'ionian')];
  const scales = items.filter(i => i.kind === 'scale');
  const sameRoot = scales.length > 1 && scales.every(s => s.root === scales[0].root);
  const markMode = ['diff', 'char', 'none'].includes(params.get('mark')) ? params.get('mark') : (sameRoot ? 'diff' : 'char');
  items.forEach((item, idx) => {
    item.marks = new Set();
    if (item.kind !== 'scale' || markMode === 'none') return;
    if (markMode === 'char') { item.def.char.forEach(d => item.marks.add(d)); return; }
    const others = scales.length === 2 ? scales.filter(s => s !== item) : (idx === 0 ? [] : [scales[0]]);
    others.forEach(other => {
      const set = new Set(other.up.map(n => n.semi % 12));
      item.up.forEach(n => { if (!n.octave && !set.has(n.semi % 12)) item.marks.add(n.degree); });
    });
  });
  const marked = (item, n) => n.hot || item.kind === 'scale' && !n.octave && item.marks.has(n.degree) && item.up[n.degree].midi === n.midi;
  const chord = parseChord(params.get('chord'));
  const tempo = Math.max(40, Math.min(200, Number(params.get('tempo')) || 100));
  const dirParam = params.get('dir') || params.get('direction');
  let dir = ['up', 'down', 'both'].includes(dirParam) ? dirParam : 'up';
  let droneOn = params.get('drone') === '1', active = 0, playing = -1, chordLit = false;
  const seqOf = item => (item.kind === 'set' ? item.up : dir === 'up' ? item.up : dir === 'down' ? item.down : item.up.concat(item.down.slice(1)));
  const titleText = () => params.get('title') || (items.length === 1 ? items[0].name : items.map(i => i.name).join(t(' og ', ' and ')));

  // ---------- noter ----------
  function mount(host, height, draw) {
    const box = h('div', { class: 'score' }); host.append(box);
    let lastW = 0;
    function render() {
      const W = box.clientWidth; if (!W) return; lastW = W;
      box.innerHTML = '';
      const s = Math.max(0.72, Math.min(1.4, W / 560)), L = W / s, H = height;
      const r = new VF.Renderer(box, VF.Renderer.Backends.SVG); r.resize(W, H * s);
      const ctx = r.getContext(); ctx.scale(s, s); ctx.setFillStyle(INK); ctx.setStrokeStyle(INK);
      draw(ctx, L, H);
    }
    new ResizeObserver(() => { if (box.clientWidth !== lastW) render(); }).observe(box);
    box.redraw = render;
    return box;
  }
  function label(ctx, text, x, y, { size = 13, color = SOFT, weight = 'bold' } = {}) {
    ctx.save(); ctx.setFont('Inter, system-ui, sans-serif', size, weight); ctx.setFillStyle(color);
    ctx.fillText(text, x - ctx.measureText(text).width / 2, y); ctx.restore();
  }
  const paintNote = (n, col) => { n.setStyle({ fillStyle: col, strokeStyle: col }); n.setLedgerLineStyle({ strokeStyle: SOFT, fillStyle: SOFT }); };
  // Plasserer helnoter med notehodet på faste x-posisjoner; hver note får egen TickContext.
  function place(ctx, stave, notes, xs) {
    notes.forEach((n, i) => {
      n.setStave(stave).setContext(ctx);
      const tc = new VF.TickContext(); tc.addTickable(n).preFormat();
      tc.setX(xs[i] - stave.getNoteStartX());
      n.draw();
    });
  }
  function drawScore(ctx, L) {
    const item = items[active], seq = seqOf(item);
    const left = chord ? 26 : 8;
    const treble = new VF.Stave(left, -6, L - left - 8).addClef('treble').setContext(ctx).draw();
    let bass = null;
    if (chord) {
      bass = new VF.Stave(left, 92, L - left - 8).addClef('bass').setContext(ctx).draw();
      new VF.StaveConnector(treble, bass).setType('brace').setContext(ctx).draw();
      new VF.StaveConnector(treble, bass).setType('singleLeft').setContext(ctx).draw();
    }
    const x0 = treble.getNoteStartX() + 16, x1 = treble.getNoteEndX() - 30;
    const gap = seq.length > 1 ? Math.min(64, (x1 - x0) / (seq.length - 1)) : 0;
    const start = x0 + Math.max(0, (x1 - x0 - gap * (seq.length - 1)) / 2);
    const xs = seq.map((_, i) => start + i * gap);
    const shown = {};
    const notes = seq.map((n, i) => {
      const sn = new VF.StaveNote({ keys: [n.key], duration: 'w', clef: 'treble' });
      const col = i === playing ? COOL : marked(item, n) ? HOT : INK;
      // Skalaer: fortegn gjelder ut takten. Tonerekker (sets): fortegnene vises slik de er skrevet.
      const k = n.letter + n.oct, show = n.explicit ? (n.natural || n.acc !== 0) : (shown[k] ?? 0) !== n.acc;
      shown[k] = n.acc;
      if (show) { const a = new VF.Accidental(VFACC[n.acc]); a.setStyle({ fillStyle: col, strokeStyle: col }); sn.addModifier(a, 0); }
      paintNote(sn, col);
      return sn;
    });
    place(ctx, treble, notes, xs);
    if (bass) {
      const col = chordLit ? COOL : INK;
      const cn = new VF.StaveNote({ keys: chord.tones.map(x => x.key), duration: 'w', clef: 'bass' });
      chord.tones.forEach((x, i) => { if (x.acc) { const a = new VF.Accidental(VFACC[x.acc]); a.setStyle({ fillStyle: col, strokeStyle: col }); cn.addModifier(a, i); } });
      paintNote(cn, col);
      place(ctx, bass, [cn], [xs[0]]);
      label(ctx, chord.sym, xs[0] + 6, bass.getYForLine(4) + 44, { size: 15, color: chordLit ? COOL : INK, weight: '800' });
    }
  }

  // ---------- piano ----------
  function keyboard() {
    const el = h('div', { class: 'kb' });
    const isWhite = m => NAT.includes(((m % 12) + 12) % 12);
    el.addEventListener('pointerdown', e => { const m = e.target.getAttribute && e.target.getAttribute('data-midi'); if (m) note(Number(m), { dur: 0.7, vel: 0.5 }); });
    function set() {
      const item = items[active], seq = seqOf(item), marks = new Map();
      if (chord) chord.tones.forEach(x => marks.set(x.midi, { name: x.name, st: chordLit ? 'play' : 'chord' }));
      seq.forEach(n => { if (!marks.has(n.midi) || marks.get(n.midi).st === 'chord') marks.set(n.midi, { name: n.name, st: marked(item, n) ? 'mark' : 'scale' }); });
      if (playing >= 0) marks.set(seq[playing].midi, { name: seq[playing].name, st: 'play' });
      const all = [...seq.map(n => n.midi), ...(chord ? chord.tones.map(x => x.midi) : [])];
      const lo = Math.min(...all), pc = ((lo % 12) + 12) % 12, from = lo - (pc >= 5 ? pc - 5 : pc);
      let to = Math.max(Math.max(...all), from + (view === 'full' ? 23 : 16)); if (!isWhite(to)) to++;
      const W = { scale: ['#f6c9d5', '#8a1c3c'], mark: [HOT, '#fff'], play: [COOL, '#fff'], chord: ['#c9d4f2', '#1d2a4a'] };
      const B = { scale: ['#9b3355', '#fff'], mark: [HOT, '#fff'], play: [COOL, '#fff'], chord: ['#4a5a86', '#fff'] };
      const KW = 30, KH = 112, BW = 18, BH = 70, whites = [];
      for (let m = from; m <= to; m++) if (isWhite(m)) whites.push(m);
      const txt = (x, y, s, fill, size) => `<text x="${x}" y="${y}" text-anchor="middle" pointer-events="none" font-family="Inter,system-ui,sans-serif" font-size="${size}" font-weight="800" fill="${fill}">${s}</text>`;
      let svg = `<svg viewBox="0 0 ${whites.length * KW + 2} ${KH + 2}" role="img" aria-label="${t('Pianotangenter', 'Piano keys')}">`;
      whites.forEach((m, i) => {
        const k = marks.get(m), x = 1 + i * KW, [fill, ink] = k ? W[k.st] : ['#ececf1', ''];
        svg += `<rect data-midi="${m}" x="${x}" y="1" width="${KW - 2}" height="${KH}" rx="5" fill="${fill}"/>`;
        if (k) svg += txt(x + KW / 2 - 1, KH - 10, k.name, ink, 11);
        else if (m % 12 === 0) svg += txt(x + KW / 2 - 1, KH - 10, 'C' + (Math.floor(m / 12) - 1), '#a4a4b0', 8);
      });
      for (let m = from; m <= to; m++) {
        if (isWhite(m)) continue;
        const k = marks.get(m), x = 1 + whites.filter(w => w < m).length * KW - BW / 2 - 1, [fill, ink] = k ? B[k.st] : ['#17171d', ''];
        svg += `<rect data-midi="${m}" x="${x}" y="1" width="${BW}" height="${BH}" rx="3" fill="${fill}" stroke="#0b0b10"/>`;
        if (k) svg += txt(x + BW / 2, BH - 9, k.name, ink, 8.5);
      }
      el.innerHTML = svg + '</svg>';
    }
    return { el, set };
  }

  // ---------- trinn ----------
  function renderSteps(el) {
    const item = items[active], seq = seqOf(item);
    el.replaceChildren();
    seq.forEach((n, i) => {
      if (i > 0 && item.kind === 'scale') {
        const semis = Math.abs(n.midi - seq[i - 1].midi);
        el.append(h('span', { class: 's' + (semis === 1 ? ' half' : semis > 2 ? ' wide' : ''), text: semis === 1 ? t('halv', 'half') : semis === 2 ? t('hel', 'whole') : '1½' }));
      }
      el.append(h('span', { class: 'n' + (marked(item, n) ? ' mark' : '') + (i === playing ? ' play' : ''), text: n.name }));
    });
  }
  function infoHTML() {
    const item = items[active];
    if (item.kind !== 'scale') return '';
    const extra = item.def.down ? ' ' + t(`Nedover spilles den som naturlig ${item.root}-moll.`, `Going down, it is played as natural minor.`) : '';
    const list = [...item.marks].sort((a, b) => a - b).map(d => item.up[d]);
    if (!list.length) {
      const sizes = new Set(item.up.slice(1).map((n, i) => n.midi - item.up[i].midi));
      const text = sizes.has(1) ? t('Halvtonetrinnene er markert med rødt.', 'Half steps are shown in red.')
        : sizes.size === 1 ? t('Alle trinnene er like store.', 'All steps are the same size.')
        : t('Skalaen har ingen halvtonetrinn.', 'The scale has no half steps.');
      return text + extra;
    }
    const names = list.map(n => `<b>${n.name}</b> (${DEGREE_NAME[`${n.step}:${n.semi}`] || formula(item)[n.degree]})`);
    const lead = markMode === 'diff' ? t('Tonene som skiller skalaene: ', 'The notes that differ: ') : list.length > 1 ? t('Karaktertonene: ', 'Colour tones: ') : t('Karaktertonen: ', 'Colour tone: ');
    return lead + (names.length > 1 ? names.slice(0, -1).join(', ') + t(' og ', ' and ') + names[names.length - 1] : names[0]) + '.' + extra;
  }

  // ---------- lyd ----------
  let timers = [];
  const at = (sec, fn) => timers.push(setTimeout(fn, sec * 1000));
  const status = h('p', { class: 'status', role: 'status' });
  function stop() { timers.forEach(clearTimeout); timers = []; playing = -1; chordLit = false; paint(); status.textContent = ''; }
  // Spiller ett element fra offset; returnerer varigheten.
  function playItem(idx, offset, { withChord = false } = {}) {
    const item = items[idx], seq = seqOf(item), beat = 60 / tempo;
    const pad = (droneOn && item.kind === 'scale') || withChord, lead = pad ? 0.7 : 0, total = lead + seq.length * beat;
    at(offset, () => { active = idx; playing = -1; chordLit = withChord; paint(); status.textContent = t('Spiller ', 'Playing ') + item.name; });
    for (let b = 0; b < total; b += 4 * beat) {
      if (droneOn && item.kind === 'scale') at(offset + b, () => { note(item.up[0].midi - 12, { kind: 'pad', dur: 4 * beat + 0.3, vel: 0.6 }); note(item.up[0].midi - 24, { kind: 'pad', dur: 4 * beat + 0.3, vel: 0.5 }); });
      if (withChord) at(offset + b, () => chord.tones.forEach(x => note(x.midi, { kind: 'pad', dur: 4 * beat + 0.3, vel: 0.42 })));
    }
    if (withChord) at(offset, () => chord.tones.forEach(x => note(x.midi, { dur: 1.2, vel: 0.3 })));
    seq.forEach((n, k) => at(offset + lead + k * beat, () => { note(n.midi, { dur: beat * 0.92, vel: 0.55 }); playing = k; paint(); }));
    return total + 0.35;
  }
  function done(sec) { at(sec, () => { playing = -1; chordLit = false; paint(); status.textContent = ''; }); }
  function play(opts) { stop(); RS.audio(); done(playItem(active, 0, opts)); }
  function playAll() { stop(); RS.audio(); let off = 0; items.forEach((_, i) => { off += playItem(i, off) + 0.4; }); done(off); }
  function playChord() {
    stop(); RS.audio(); chordLit = true; paint();
    const t0 = RS.now() + 0.03;
    chord.tones.forEach((x, i) => note(x.midi, { time: t0 + i * 0.22, dur: 2 + (chord.tones.length - i) * 0.22, vel: 0.42 }));
    chord.tones.forEach(x => note(x.midi, { time: t0 + chord.tones.length * 0.22 + 0.25, dur: 1.8, vel: 0.36 }));
    status.textContent = t('Spiller ', 'Playing ') + chord.sym;
    done(chord.tones.length * 0.22 + 2.2);
  }
  // Grunntonen holdes mens karaktertonen(e) spilles over den.
  function playMark() {
    stop(); RS.audio();
    const item = items[active], seq = seqOf(item), root = item.up[0];
    const list = [...item.marks].sort((a, b) => a - b).map(d => item.up[d]);
    const t0 = RS.now() + 0.03;
    note(root.midi - 12, { kind: 'pad', time: t0, dur: 1 + list.length * 1.1, vel: 0.6 });
    note(root.midi, { time: t0, dur: 0.9 });
    playing = seq.indexOf(root); paint();
    list.forEach((n, i) => at(1 + i * 1.1, () => { note(n.midi, { dur: 1, vel: 0.55 }); playing = seq.findIndex(x => x.midi === n.midi); paint(); }));
    done(1.3 + list.length * 1.1);
  }

  // ---------- oppsett ----------
  const hasScale = scales.length > 0;
  const title = h('h1', { text: titleText() });
  const eyebrow = chord ? (params.get('sets') ? t('Akkord og melodi', 'Chord and melody') : t('Akkord og skala', 'Chord and scale')) : params.get('sets') ? t('Toner og fortegn', 'Notes and accidentals') : items.length > 1 ? t('Skalaer og kirketonearter', 'Scales and modes') : t('Skala', 'Scale');
  const playBtn = h('button', { type: 'button', class: 'primary', on: { click: () => play({ withChord: !!chord }) } }, chord ? t('▶ Sammen', '▶ Together') : t('▶ Spill', '▶ Play'));
  const dirSeg = seg(t('Retning', 'Direction'), [['up', '↑'], ['down', '↓'], ['both', '↕']], dir, v => { dir = v; stop(); });
  dirSeg.querySelectorAll('button').forEach((b, i) => { b.title = [t('Opp', 'Up'), t('Ned', 'Down'), t('Opp og ned', 'Up and down')][i]; b.setAttribute('aria-label', b.title); });
  const droneBtn = h('button', { type: 'button', 'aria-pressed': String(droneOn), on: { click: () => { droneOn = !droneOn; droneBtn.setAttribute('aria-pressed', String(droneOn)); stop(); } } }, t('Borduntone', 'Drone'));
  const kb = keyboard(), steps = h('div', { class: 'steps', 'aria-live': 'polite' }), info = h('p', { class: 'info' });
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': t('Velg skala', 'Choose scale') });
  let score = null;
  const markBtn = h('button', { type: 'button', on: { click: playMark } }, markMode === 'diff' ? t('♪ Hør tonen som skiller', '♪ Hear the difference') : t('♪ Hør karaktertonen', '♪ Hear the colour tone'));

  function renderCards() {
    cards.replaceChildren(...items.map((item, i) => {
      const sub = h('span');
      sub.innerHTML = item.kind === 'scale' ? formula(item).map((f, d) => (item.marks.has(d) ? `<b>${f}</b>` : f)).join(' ') : item.up.map(n => n.name).join(' – ');
      return h('button', { type: 'button', class: 'card', 'aria-pressed': String(i === active), on: { click: () => { stop(); active = i; paint(); play(); } } }, h('strong', { text: item.name }), sub);
    }));
  }
  function paint() {
    if (items.length > 1) renderCards();
    if (score) score.redraw();
    if (view === 'full' || view === 'keys') kb.set();
    if (view === 'full' || view === 'steps') { renderSteps(steps); info.innerHTML = infoHTML(); }
    markBtn.hidden = !items[active].marks.size;
  }

  const right = [];
  if (view === 'full') { if (hasScale) right.push(droneBtn, dirSeg); }
  else { right.push(playBtn); if (hasScale && view !== 'steps') right.push(dirSeg); }
  app.append(h('header', {}, h('div', {}, h('p', { class: 'eyebrow', text: eyebrow }), title), right.length ? h('div', { class: 'row' }, ...right) : null));
  if (view === 'full') {
    if (items.length > 1) app.append(cards);
    app.append(h('div', { class: 'panel' }, steps, info));
    score = mount(app, chord ? 236 : 120, drawScore);
    app.append(kb.el);
    if (chord) app.append(h('div', { class: 'legend' },
      h('span', {}, h('i', { style: 'background:#c9d4f2' }), t('Akkord: ', 'Chord: ') + chord.tones.map(x => x.name).join(' – ')),
      h('span', {}, h('i', { style: 'background:#f6c9d5' }), t('Skala', 'Scale')),
      h('span', {}, h('i', { style: `background:${COOL}` }), t('Klinger nå', 'Sounding now'))));
    const transport = [playBtn];
    if (chord) transport.push(h('button', { type: 'button', on: { click: playChord } }, t('Akkord', 'Chord')), h('button', { type: 'button', on: { click: () => play() } }, t('Skala', 'Scale')));
    if (items.length > 1) transport.push(h('button', { type: 'button', on: { click: playAll } }, t('▶ Spill alle', '▶ Play all')));
    transport.push(markBtn, h('button', { type: 'button', on: { click: stop } }, t('■ Stopp', '■ Stop')));
    app.append(h('div', { class: 'row' }, ...transport), status);
  } else if (view === 'staff') {
    score = mount(app, chord ? 236 : 120, drawScore);
  } else if (view === 'keys') {
    app.append(kb.el);
  } else {
    app.append(steps, info);
  }
  paint();
})();
