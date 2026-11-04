/* Rockeskolen – Noter-serien: notelinjer, nøkler, noteverdier, pauser og takt på mørk bakgrunn, med lyd.
 *
 * Notasjonen tegnes med VexFlow. Notene står proporsjonalt med varigheten, slik at det man ser og hører følges ad.
 *
 * URL-parametere:
 *   mode     staff | values | tree | meter          (standard: staff)
 *   clef     none | treble | bass | alto             startnøkkel for mode=staff (standard: none)
 *   clefs    hvilke nøkler som kan velges             (standard: none,treble,bass,alto)
 *   kind     notes | rests | alt                      noter, pauser eller veksling for values/tree (standard: notes)
 *   kinds    hvilke av dem som kan velges             (standard: bare kind)
 *   value    16 | 8 | 4 | 2 | 1                       startverdi i sekstendedeler for mode=values (standard: 4)
 *   meters   pulse,4/4,3/4,6/8                        valg for mode=meter (standard: 4/4,3/4,6/8)
 *   widget   (tom) | g                                g = G-linjen i G-nøkkelen, til høyrespalten
 *   title    egen overskrift
 *   lang     no | en
 */
(function () {
  const { t, h, audio, seg, slider, params, note, drum } = RS;
  const VF = Vex.Flow;
  const app = document.getElementById('app');
  const widget = app.dataset.widget;
  const mode = widget === 'g' ? 'staff' : ['staff', 'values', 'tree', 'meter'].includes(params.get('mode')) ? params.get('mode') : 'staff';
  const INK = '#f2f2f5', MUTED = '#8e8e9c', HOT = '#ff2a5f';
  const list = (name, all, fallback) => { const v = (params.get(name) || '').split(',').filter(x => all.includes(x)); return v.length ? v : fallback; };

  app.append(h('style', { text: `
    .score { position:relative; border:1px solid var(--line); border-radius:18px; background:radial-gradient(120% 90% at 50% 0%,#1b1018 0%,#0e0e13 55%,#0a0a0e 100%); overflow:hidden; touch-action:manipulation; }
    .score svg { display:block; }
    .score.tap { cursor:pointer; }
    .score .hot path, .score .hot rect { fill:${HOT} !important; stroke:${HOT} !important; }
    .score .hot text { fill:${HOT} !important; }
    .score .vf-gline rect { fill:${HOT}; stroke:none; }
    .score .vf-row.hot text { fill:#fff !important; }
    .info { display:grid; gap:4px; }
    .info .big { font-size:clamp(24px,5vw,36px); }
    .seg.wrap { flex-wrap:wrap; border-radius:16px; }
    .bar-row { display:flex; flex-wrap:wrap; align-items:center; gap:10px 14px; }
    .bar-row .slider { flex:1 1 220px; }
  ` }));

  // ---------- tegning ----------
  // Lager en boks med VexFlow-SVG som tegnes på nytt når bredden endres. draw(ctx, L, H) får logisk bredde.
  function mount(host, height, draw) {
    const box = h('div', { class: 'score' }); host.append(box);
    let lastW = 0;
    function render() {
      const W = box.clientWidth; if (!W || W === lastW) return; lastW = W;
      box.innerHTML = '';
      const s = Math.max(1, Math.min(1.5, W / 520)), L = W / s, H = typeof height === 'function' ? height(L) : height;
      const r = new VF.Renderer(box, VF.Renderer.Backends.SVG); r.resize(W, H * s);
      const ctx = r.getContext(); ctx.scale(s, s); ctx.setFillStyle(INK); ctx.setStrokeStyle(INK);
      box.s = s;
      draw(ctx, L, H);
    }
    new ResizeObserver(render).observe(box);
    box.redraw = () => { lastW = 0; render(); };
    return box;
  }
  const DUR = { 16: 'w', 8: 'h', 4: 'q', 2: '8', 1: '16' };
  let uid = 0;
  // Tegner en rytme proporsjonalt i staven. items: [{d, rest} | {bar: true, t}]. Returnerer [{t, d, rest, x, el}].
  function drawRhythm(ctx, stave, items, { key = 'c/5', restKey = 'b/4', wholeRestKey = 'd/5', total = 16, stem, groups, center = true } = {}) {
    let t = 0;
    const recs = items.map(it => {
      if (it.bar) return { bar: true, t: it.t, note: new VF.BarNote() };
      const n = new VF.StaveNote({ keys: [it.rest ? (it.d === 16 ? wholeRestKey : restKey) : key], duration: DUR[it.d] + (it.rest ? 'r' : ''), auto_stem: stem == null, stem_direction: stem });
      if (stem == null && !it.rest) n.setStemDirection(n.getKeyProps()[0].line >= 3 ? -1 : 1); // tonen på/over midtlinjen: hals ned
      const id = 'n' + (++uid); n.setAttribute('id', id);
      const r = { id, t, d: it.d, rest: !!it.rest, note: n }; t += it.d; return r;
    });
    const notes = recs.filter(r => !r.bar).map(r => r.note);
    const beamable = items.some(it => !it.bar && it.d <= 2);
    const beams = groups && beamable ? VF.Beam.generateBeams(notes, { groups, beam_rests: false, stem_direction: stem, maintain_stem_directions: stem == null }) : [];
    const voice = new VF.Voice({ num_beats: total / 4, beat_value: 4 }).setMode(VF.Voice.Mode.SOFT).addTickables(recs.map(r => r.note));
    new VF.Formatter().joinVoices([voice]).format([voice], Math.max(40, stave.getNoteEndX() - stave.getNoteStartX() - 20));
    const x0 = stave.getNoteStartX() + 12, x1 = stave.getNoteEndX() - 18, span = x1 - x0;
    recs.forEach(r => {
      r.x = r.bar ? x0 + (r.t / total) * span - 10 : center && r.d === total ? x0 + span / 2 - 10 : x0 + (r.t / total) * span;
      r.note.getTickContext().setX(r.x - stave.getNoteStartX());
    });
    voice.draw(ctx, stave);
    beams.forEach(b => b.setContext(ctx).draw());
    const out = recs.filter(r => !r.bar);
    out.forEach(r => (r.el = document.getElementById('vf-' + r.id)));
    out.x0 = x0; out.span = span;
    return out;
  }
  // Tekst under notene (telling). Returnerer gruppene, så de kan lyse opp.
  function label(ctx, text, x, y, { size = 13, color = MUTED, weight = 'bold', align = 'center' } = {}) {
    const g = ctx.openGroup('lbl');
    ctx.setFont('Inter, system-ui, sans-serif', size, weight); ctx.setFillStyle(color);
    const w = ctx.measureText(text).width;
    ctx.fillText(text, align === 'center' ? x - w / 2 : x, y);
    ctx.setFillStyle(INK); ctx.closeGroup();
    return g;
  }
  const hot = (el, on) => el && el.classList.toggle('hot', !!on);

  // ---------- avspilling: én presis loop for alle visninger ----------
  // state(): {bpm, len (sekstendedeler), notes: [{t, d, rest, el, midi, vel}], clicks: [{t, accent, kick}], labels: [{t, d, el}], once}
  function makePlayer(state, onStop) {
    let st = null;
    const lp = RS.loop({
      stepDur: () => 60 / st.bpm / 4,
      onStep(step, time) {
        if (st.once && step >= st.len) return;
        const tt = step % st.len, sd = 60 / st.bpm / 4;
        st.clicks.filter(c => c.t === tt).forEach(c => { drum.click(time, c.accent); if (c.kick) drum.kick(time, 0.7); });
        st.notes.filter(n => n.t === tt && !n.rest).forEach(n => note(n.midi || 72, { time, dur: Math.max(0.12, n.d * sd * 0.9), vel: n.vel || 0.5, kind: n.kind }));
      },
      onShow(step) {
        if (st.once && step >= st.len) { stop(); return; }
        const tt = step % st.len;
        st.notes.forEach(n => hot(n.el, tt >= n.t && tt < n.t + n.d));
        (st.labels || []).forEach(l => hot(l.el, tt >= l.t && tt < l.t + l.d));
        st.onStep && st.onStep(tt, step);
      },
    });
    function stop() {
      lp.stop(); if (st) { st.notes.forEach(n => hot(n.el, false)); (st.labels || []).forEach(l => hot(l.el, false)); st.onStop && st.onStop(); }
      onStop && onStop();
    }
    document.addEventListener('visibilitychange', () => { if (document.hidden && lp.running) stop(); });
    return {
      start() { audio(); if (lp.running) lp.stop(); st = state(); lp.start(0.1); },
      stop,
      get running() { return lp.running; },
    };
  }
  function playButton(player) {
    const b = h('button', { type: 'button', class: 'primary', on: { click: () => { if (player.running) player.stop(); else { player.start(); paint(); } } } });
    const paint = () => (b.textContent = player.running ? t('■ Stopp', '■ Stop') : t('▶ Spill', '▶ Play'));
    paint(); b.paint = paint; return b;
  }
  function header(eyebrow, title, ...right) {
    return h('header', {}, h('div', {}, h('p', { class: 'eyebrow', text: eyebrow }), h('h1', { text: params.get('title') || title })), right.length ? h('div', { class: 'row' }, ...right) : null);
  }

  // ======================================================================
  // Notelinjene: trykk på linjer og mellomrom. Samme plassering får nytt navn når nøkkelen byttes.
  function staffView() {
    const LET = ['C', 'D', 'E', 'F', 'G', 'A', 'B'], NAT = [0, 2, 4, 5, 7, 9, 11];
    const CLEFS = {
      none: { label: t('Ingen nøkkel', 'No clef') },
      treble: { label: t('G-nøkkel', 'Treble clef'), base: 30 },
      bass: { label: t('F-nøkkel', 'Bass clef'), base: 18 },
      alto: { label: t('C-nøkkel', 'Alto clef'), base: 24 },
    };
    const g = widget === 'g';
    const clefs = g ? ['treble'] : list('clefs', Object.keys(CLEFS), Object.keys(CLEFS));
    let clef = g ? 'treble' : clefs.includes(params.get('clef')) ? params.get('clef') : clefs[0];
    let seq = g ? [2] : [], geo = null, marks = [];
    const status = h('p', { class: 'status', role: 'status' });
    const dia = p => (clef === 'none' ? 30 : CLEFS[clef].base) + p;
    const nameOf = p => LET[((dia(p) % 7) + 7) % 7];
    const midiOf = p => { const d = dia(p); return NAT[((d % 7) + 7) % 7] + 12 * (Math.floor(d / 7) + 1); };
    const keyOf = p => { const d = dia(p); return LET[((d % 7) + 7) % 7].toLowerCase() + '/' + Math.floor(d / 7); };
    const where = p => p === -2 ? t('hjelpelinje under', 'ledger line below') : p === 10 ? t('hjelpelinje over', 'ledger line above')
      : p === -1 ? t('rett under notelinjene', 'just below the staff') : p === 9 ? t('rett over notelinjene', 'just above the staff')
        : p % 2 === 0 ? t(`${p / 2 + 1}. linje`, `line ${p / 2 + 1}`) : t(`${(p - 1) / 2 + 1}. mellomrom`, `space ${(p - 1) / 2 + 1}`);
    const fullName = p => nameOf(p) + (midiOf(p) === 60 ? t(' (midt-C)', ' (middle C)') : '');

    const playBtn = h('button', { type: 'button', class: 'primary', on: { click: playSeq } }, t('▶ Spill', '▶ Play'));
    const clearBtn = h('button', { type: 'button', on: { click: () => { seq = []; box.redraw(); say(); } } }, t('Tøm', 'Clear'));
    const clefSeg = clefs.length > 1 ? seg(t('Nøkkel', 'Clef'), clefs.map(k => [k, CLEFS[k].label]), clef, v => { clef = v; box.redraw(); say(true); }) : null;
    if (clefSeg) clefSeg.classList.add('wrap');
    app.append(
      g ? header(t('G-nøkkelen', 'Treble clef'), t('Her ligger G', 'This is where G lives'))
        : header(t('Notelinjene', 'The staff'), t('Linjer, mellomrom og nøkkel', 'Lines, spaces and clef'), playBtn, clearBtn));
    const box = mount(app, g ? 150 : 175, (ctx, L) => {
      const stave = new VF.Stave(8, g ? 18 : 30, L - 16);
      if (clef !== 'none') stave.addClef(clef);
      stave.setContext(ctx).draw();
      const sp = stave.getSpacingBetweenLines(), yB = stave.getYForLine(4);
      if (g) { ctx.openGroup('gline'); ctx.fillRect(stave.getNoteStartX() - 6, yB - sp - 1.5, stave.getNoteEndX() - stave.getNoteStartX() + 6, 3); ctx.closeGroup(); }
      geo = { yB, sp, x0: stave.getNoteStartX(), x1: stave.getNoteEndX() };
      marks = [];
      if (seq.length) {
        const vfClef = clef === 'none' ? 'treble' : clef;
        const notes = seq.map(p => { const n = new VF.StaveNote({ keys: [keyOf(p)], duration: 'w', clef: vfClef }); n.setAttribute('id', 'n' + (++uid)); return n; });
        const voice = new VF.Voice({ num_beats: 4 * notes.length, beat_value: 4 }).setMode(VF.Voice.Mode.SOFT).addTickables(notes);
        new VF.Formatter().joinVoices([voice]).format([voice], Math.max(40, geo.x1 - geo.x0 - 20));
        const step = Math.min(70, (geo.x1 - geo.x0 - 30) / Math.max(seq.length, 8));
        notes.forEach((n, i) => n.getTickContext().setX(14 + i * step));
        voice.draw(ctx, stave);
        marks = notes.map((n, i) => ({ el: document.getElementById('vf-' + n.getAttribute('id')), x: geo.x0 + 14 + i * step, p: seq[i] }));
        if (clef !== 'none') marks.forEach(m => label(ctx, nameOf(m.p), m.x + 6, stave.getYForLine(4) + 46, { color: '#cfcfd8', size: 13 }));
        hot(marks[marks.length - 1].el, true);
      }
    });
    box.classList.add('tap');
    box.addEventListener('pointerdown', e => {
      if (!geo) return;
      const r = box.getBoundingClientRect(), y = (e.clientY - r.top) / box.s;
      const p = Math.max(-2, Math.min(10, Math.round((geo.yB - y) / (geo.sp / 2))));
      if (g) { seq = [p]; } else { seq.push(p); if (seq.length > 8) seq.shift(); }
      box.redraw();
      if (clef === 'none') drum.wood(RS.now() + 0.01, false); else note(midiOf(p), { dur: 0.9, vel: 0.55 });
      say(false, p);
    });
    if (clefSeg) app.append(h('div', { class: 'row spread' }, clefSeg, h('span', { class: 'small muted', text: t('Trykk på en linje eller et mellomrom.', 'Tap a line or a space.') })));
    app.append(status);
    function say(clefChanged, p) {
      if (g) {
        status.textContent = p == null || p === 2 ? t('G-nøkkelen slynger seg rundt 2. linje nedenfra. Der ligger tonen G. Trykk på de andre linjene og mellomrommene også.', 'The treble clef curls around the second line from the bottom. That is where G is. Tap the other lines and spaces too.')
          : `${fullName(p)} – ${where(p)}.`;
        return;
      }
      if (clef === 'none') {
        status.textContent = p != null ? t(`${where(p)[0].toUpperCase() + where(p).slice(1)}. Men hvilken tone er det? Uten nøkkel vet vi ikke – velg en nøkkel.`, `${where(p)}. But which note is it? Without a clef we cannot tell – choose a clef.`)
          : t('Fem linjer og fire mellomrom. Uten nøkkel er det bare et rutenett. Trykk på linjene, og velg så en nøkkel.', 'Five lines and four spaces. Without a clef it is just a grid. Tap the lines, then choose a clef.');
        return;
      }
      if (clefChanged && seq.length) { status.textContent = t(`Samme plassering, ny nøkkel – nå heter tonene ${seq.map(nameOf).join(' – ')}.`, `Same positions, new clef – now the notes are ${seq.map(nameOf).join(' – ')}.`); return; }
      status.textContent = p != null ? `${fullName(p)} – ${where(p)}.` : t(`${CLEFS[clef].label}: trykk på linjene og mellomrommene for å skrive og høre toner.`, `${CLEFS[clef].label}: tap lines and spaces to write and hear notes.`);
    }
    function playSeq() {
      if (!seq.length) return; audio(); const t0 = RS.now() + 0.05;
      seq.forEach((p, i) => {
        if (clef === 'none') drum.wood(t0 + i * 0.45, i === 0); else note(midiOf(p), { time: t0 + i * 0.45, dur: 0.5, vel: 0.55 });
        setTimeout(() => marks.forEach((m, k) => hot(m.el, k === i)), (0.05 + i * 0.45) * 1000);
      });
    }
    say();
  }

  // ======================================================================
  // Noteverdier og pauser: én takt fylt med valgt verdi, spilt mot pulsen.
  const NAMES = {
    notes: { 16: t('Helnote', 'Whole note'), 8: t('Halvnote', 'Half note'), 4: t('Firedelsnote', 'Quarter note'), 2: t('Åttendedel', 'Eighth note'), 1: t('Sekstendedel', 'Sixteenth note') },
    rests: { 16: t('Helpause', 'Whole rest'), 8: t('Halvpause', 'Half rest'), 4: t('Firedelspause', 'Quarter rest'), 2: t('Åttendedelspause', 'Eighth rest'), 1: t('Sekstendedelspause', 'Sixteenth rest') },
  };
  const PLURAL = {
    notes: { 16: t('helnote', 'whole note'), 8: t('halvnoter', 'half notes'), 4: t('firedelsnoter', 'quarter notes'), 2: t('åttendedeler', 'eighth notes'), 1: t('sekstendedeler', 'sixteenth notes') },
    rests: { 16: t('helpause', 'whole rest'), 8: t('halvpauser', 'half rests'), 4: t('firedelspauser', 'quarter rests'), 2: t('åttendedelspauser', 'eighth rests'), 1: t('sekstendedelspauser', 'sixteenth rests') },
  };
  const LASTS = { 16: t('fire pulsslag', 'four beats'), 8: t('to pulsslag', 'two beats'), 4: t('ett pulsslag', 'one beat'), 2: t('et halvt pulsslag', 'half a beat'), 1: t('et kvart pulsslag', 'a quarter of a beat') };
  const KINDS = { notes: t('Noter', 'Notes'), rests: t('Pauser', 'Rests'), alt: t('Veksle', 'Alternate') };
  const fill = (d, kind) => Array.from({ length: 16 / d }, (_, i) => ({ d, rest: kind === 'rests' || (kind === 'alt' && d < 16 && i % 2 === 1) }));
  const beatClicks = () => [0, 4, 8, 12].map(t0 => ({ t: t0, accent: t0 === 0 }));

  function valuesView() {
    const kinds = list('kinds', Object.keys(KINDS), [KINDS[params.get('kind')] ? params.get('kind') : 'notes']);
    let kind = KINDS[params.get('kind')] && kinds.includes(params.get('kind')) ? params.get('kind') : kinds[0];
    let d = [16, 8, 4, 2, 1].includes(Number(params.get('value'))) ? Number(params.get('value')) : 4, bpm = 72, recs = [], counts = [];
    const nameEl = h('div', { class: 'big' }), lastEl = h('div', { class: 'muted' }), fitEl = h('div', { class: 'small muted' }), status = h('p', { class: 'status', role: 'status' });
    const player = makePlayer(() => ({ bpm, len: 16, notes: recs.map(r => ({ ...r, midi: 72, vel: 0.55 })), clicks: beatClicks(), labels: counts }), () => btn.paint());
    const btn = playButton(player);
    const names = () => NAMES[kind === 'rests' ? 'rests' : 'notes'];
    const valSeg = seg(t('Verdi', 'Value'), [16, 8, 4, 2, 1].map(v => [v, names()[v]]), d, v => { d = v; update(); });
    valSeg.classList.add('wrap');
    const kindSeg = kinds.length > 1 ? seg(t('Noter eller pauser', 'Notes or rests'), kinds.map(k => [k, KINDS[k]]), kind, v => { kind = v; relabel(); update(); }) : null;
    const rests = kind === 'rests';
    app.append(header(rests ? t('Pauser', 'Rests') : t('Noteverdier', 'Note values'), rests ? t('Hvor lenge varer stillheten?', 'How long does the silence last?') : t('Hvor lenge varer tonen?', 'How long does the note last?'), btn));
    const box = mount(app, 160, (ctx, L) => {
      const stave = new VF.Stave(8, 22, L - 16).addClef('treble').addTimeSignature('4/4');
      stave.setContext(ctx).draw();
      recs = drawRhythm(ctx, stave, fill(d, kind), { groups: [new VF.Fraction(1, 4)] });
      const y = stave.getYForLine(4) + 44;
      counts = [0, 4, 8, 12].map((t0, i) => ({ t: t0, d: 4, el: label(ctx, String(i + 1), recs.x0 + (t0 / 16) * recs.span + 18, y, { size: 14 }) }));
    });
    app.append(
      h('div', { class: 'grid2' },
        h('section', { class: 'panel info' }, nameEl, lastEl, fitEl),
        h('section', { class: 'panel' }, h('p', { class: 'eyebrow', text: t('Velg', 'Choose') }), valSeg, kindSeg ? h('div', { class: 'row', style: 'margin-top:10px' }, kindSeg) : null,
          h('div', { class: 'bar-row', style: 'margin-top:10px' }, slider(t('Tempo', 'Tempo'), { min: 50, max: 120, value: bpm, format: v => v + ' BPM', onInput: v => (bpm = v) })))),
      status);
    function relabel() { [...valSeg.children].forEach((b, i) => (b.textContent = names()[[16, 8, 4, 2, 1][i]])); }
    function update() {
      const k = kind === 'rests' ? 'rests' : 'notes', n = 16 / d;
      nameEl.textContent = NAMES[k][d];
      lastEl.textContent = t(`Varer i ${LASTS[d]}`, `Lasts ${LASTS[d]}`);
      fitEl.textContent = d === 16 ? t(`Én ${PLURAL[k][16]} fyller en hel 4/4-takt.`, `One ${PLURAL[k][16]} fills a whole 4/4 bar.`) : t(`${n} ${PLURAL[k][d]} fyller en 4/4-takt.`, `${n} ${PLURAL[k][d]} fill a 4/4 bar.`);
      status.textContent = kind === 'rests' ? t('Hør etter: pulsen tikker videre, men det er stille. Pausen varer like lenge som noten med samme verdi.', 'Listen: the pulse keeps ticking, but there is silence. The rest lasts as long as the note of the same value.')
        : kind === 'alt' ? (d === 16 ? t('En helnote fyller hele takten. Velg en kortere verdi for å veksle mellom tone og stillhet.', 'A whole note fills the whole bar. Choose a shorter value to alternate.') : t('Tone, stillhet, tone, stillhet – noter og pauser med samme verdi tar like lang plass.', 'Note, silence, note, silence – notes and rests of the same value take the same space.'))
          : t('Trykk Spill og hør hvordan tonene fordeler seg på de fire pulsslagene. Klikket markerer pulsen.', 'Press Play and hear how the notes spread over the four beats. The click marks the pulse.');
      box.redraw();
    }
    update();
  }

  // ======================================================================
  // Sammenhengen: helnote til sekstendedeler under hverandre, på samme tidslinje.
  function treeView() {
    const kinds = list('kinds', Object.keys(KINDS).filter(k => k !== 'alt'), [params.get('kind') === 'rests' ? 'rests' : 'notes']);
    let kind = kinds.includes(params.get('kind')) ? params.get('kind') : kinds[0], bpm = 72, rows = [], rowLabels = [], queue = [];
    const status = h('p', { class: 'status', role: 'status' });
    const player = makePlayer(() => {
      const notes = [], labels = [];
      queue.forEach((r, k) => { rows[r].forEach(n => notes.push({ ...n, t: n.t + 16 * k, midi: 72, vel: 0.55 })); labels.push({ t: 16 * k, d: 16, el: rowLabels[r] }); });
      const clicks = []; queue.forEach((_, k) => beatClicks().forEach(c => clicks.push({ ...c, t: c.t + 16 * k })));
      return { bpm, len: 16 * queue.length, once: true, notes, clicks, labels };
    }, () => btn.paint());
    const btn = h('button', { type: 'button', class: 'primary', on: { click: () => { if (player.running) player.stop(); else { queue = [0, 1, 2, 3, 4]; player.start(); btn.paint(); } } } });
    btn.paint = () => (btn.textContent = player.running ? t('■ Stopp', '■ Stop') : t('▶ Spill rad for rad', '▶ Play row by row'));
    btn.paint();
    const rests = kind === 'rests';
    app.append(header(t('Sammenheng', 'How they relate'), rests ? t('Fra helpause til sekstendedelspauser', 'From whole rest to sixteenth rests') : t('Fra helnote til sekstendedeler', 'From whole note to sixteenth notes'), btn));
    const VALS = [16, 8, 4, 2, 1];
    const box = mount(app, L => (L < (kind === 'rests' ? 560 : 480) ? 5 * 70 + 16 : 5 * 62 + 16), (ctx, L) => {
      const narrow = L < (kind === 'rests' ? 560 : 480), rh = narrow ? 70 : 62, lw = narrow ? 0 : kind === 'rests' ? 215 : 150;
      rows = []; rowLabels = [];
      VALS.forEach((d, i) => {
        const y = 8 + i * rh + (narrow ? 14 : 0);
        const g = ctx.openGroup('row', 'row' + i);
        const k = kind === 'rests' ? 'rests' : 'notes', n = 16 / d;
        const txt = `${n} ${n === 1 ? NAMES[k][16].toLowerCase() : PLURAL[k][d]}`;
        ctx.setFont('Inter, system-ui, sans-serif', 13, 'bold'); ctx.setFillStyle('#cfcfd8');
        ctx.fillText(txt[0].toUpperCase() + txt.slice(1), 10, narrow ? y + 4 : y + 50);
        ctx.setFillStyle(INK); ctx.closeGroup();
        rowLabels.push(g);
        const stave = new VF.Stave(lw + 4, y, L - lw - 12, { num_lines: 1 });
        stave.setContext(ctx).draw();
        rows.push(drawRhythm(ctx, stave, fill(d, kind), { key: 'f/5', restKey: 'f/5', wholeRestKey: 'f/5', stem: 1, groups: [new VF.Fraction(1, 4)], center: false }));
      });
    });
    box.classList.add('tap');
    box.addEventListener('pointerdown', e => {
      const r = box.getBoundingClientRect(), y = (e.clientY - r.top) / box.s, rh = r.width / box.s < (kind === 'rests' ? 560 : 480) ? 70 : 62;
      const i = Math.max(0, Math.min(4, Math.floor((y - 8) / rh)));
      if (player.running) player.stop(); queue = [i]; player.start(); btn.paint();
    });
    if (kinds.length > 1) app.append(h('div', { class: 'row' }, seg(t('Noter eller pauser', 'Notes or rests'), kinds.map(k => [k, KINDS[k]]), kind, v => { kind = v; box.redraw(); })));
    app.append(h('div', { class: 'bar-row' }, slider(t('Tempo', 'Tempo'), { min: 50, max: 120, value: bpm, format: v => v + ' BPM', onInput: v => (bpm = v) })), status);
    status.textContent = rests ? t('Hver rad varer like lenge – én takt. Jo kortere pausene er, jo flere får plass. Trykk på en rad for å høre den.', 'Each row lasts the same – one bar. The shorter the rests, the more fit. Tap a row to hear it.')
      : t('Hver rad varer like lenge – én takt. For hvert steg nedover halveres noteverdien, og antallet dobles. Trykk på en rad for å høre den.', 'Each row lasts the same – one bar. Each step down halves the value and doubles the number. Tap a row to hear it.');
  }

  // ======================================================================
  // Puls, takt og taktart: to takter med telling, betoning på ener'n.
  function meterView() {
    const METERS = {
      pulse: { label: t('Bare puls', 'Just the pulse'), beat: 4, per: 8, bars: 1, sig: null, count: () => '•',
        text: t('Jevne slag, og ingen er viktigere enn de andre. Det er pulsen.', 'Even beats, none more important than the others. That is the pulse.') },
      '4/4': { label: '4/4', beat: 4, per: 4, bars: 2, sig: '4/4', strong: [0], count: i => String(i + 1),
        text: t('Fire pulsslag i hver takt: 1 – 2 – 3 – 4. Taktstrekene viser hvor en ny takt begynner, og ener\'n kjennes tyngst.', 'Four beats in each bar: 1 – 2 – 3 – 4. The bar lines show where a new bar starts, and beat one feels heaviest.') },
      '3/4': { label: '3/4', beat: 4, per: 3, bars: 2, sig: '3/4', strong: [0], count: i => String(i + 1),
        text: t('Tre pulsslag i hver takt: 1 – 2 – 3. Det er valsens taktart.', 'Three beats in each bar: 1 – 2 – 3. That is the waltz.') },
      '6/8': { label: '6/8', beat: 2, per: 6, bars: 2, sig: '6/8', strong: [0], medium: [3], count: i => String(i + 1),
        text: t('Seks åttendedeler i hver takt, men vi kjenner dem som to hovedslag: 1 og 4.', 'Six eighth notes in each bar, but we feel them as two main beats: 1 and 4.') },
    };
    const meters = list('meters', Object.keys(METERS), ['4/4', '3/4', '6/8']);
    let m = meters[0], bpm = 84, recs = [], counts = [];
    const status = h('p', { class: 'status', role: 'status' });
    const player = makePlayer(() => {
      const M = METERS[m], len = M.per * M.beat * M.bars;
      const notes = recs.map((r, i) => { const k = i % M.per, strong = M.strong?.includes(k), med = M.medium?.includes(k); return { ...r, midi: 72, kind: 'pluck', vel: strong ? 0.75 : med ? 0.55 : 0.35 }; });
      const clicks = recs.map((r, i) => { const k = i % M.per; return { t: r.t, accent: !!M.strong?.includes(k), kick: !!M.strong?.includes(k) }; });
      return { bpm: M.beat === 2 ? bpm * 2 : bpm, len, notes, clicks, labels: counts };
    }, () => btn.paint());
    const btn = playButton(player);
    const isPulse = meters[0] === 'pulse';
    app.append(header(isPulse ? t('Puls', 'Pulse') : t('Taktart', 'Time signature'), isPulse ? t('Fra puls til takt', 'From pulse to bars') : t('Hvor mange slag i takten?', 'How many beats in a bar?'), btn));
    const box = mount(app, 170, (ctx, L) => {
      const M = METERS[m], total = M.per * M.beat * M.bars, items = [];
      for (let b = 0; b < M.bars; b++) {
        if (b) items.push({ bar: true, t: b * M.per * M.beat });
        for (let i = 0; i < M.per; i++) items.push({ d: M.beat });
      }
      const stave = new VF.Stave(8, 24, L - 16).addClef('treble');
      if (M.sig) stave.addTimeSignature(M.sig); else stave.setEndBarType((VF.BarlineType || VF.Barline.type).NONE);
      stave.setContext(ctx).draw();
      recs = drawRhythm(ctx, stave, items, { total, groups: M.beat === 2 ? [new VF.Fraction(3, 8)] : null });
      const y = stave.getYForLine(4) + 46;
      counts = recs.map((r, i) => {
        const k = i % M.per, strong = M.strong?.includes(k) || M.medium?.includes(k);
        return { t: r.t, d: r.d, el: label(ctx, M.count(k), r.x + 18, y, { size: strong ? 16 : 14, color: strong ? '#e5e5ec' : MUTED, weight: strong ? 'bold' : 'normal' }) };
      });
    });
    if (meters.length > 1) {
      const ms = seg(t('Taktart', 'Time signature'), meters.map(k => [k, METERS[k].label]), m, v => { m = v; const run = player.running; box.redraw(); say(); if (run) player.start(); });
      ms.classList.add('wrap');
      app.append(h('div', { class: 'row' }, ms));
    }
    app.append(h('div', { class: 'bar-row' }, slider(t('Tempo', 'Tempo'), { min: 50, max: 140, value: bpm, format: v => v + ' BPM', onInput: v => (bpm = v) })), status);
    function say() { status.textContent = METERS[m].text; }
    say();
  }

  ({ staff: staffView, values: valuesView, tree: treeView, meter: meterView })[mode]();
})();
