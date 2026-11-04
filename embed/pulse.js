/* Rockeskolen – puls- og takt-embed.
 *
 * URL-parametere:
 *   mode     pulse | meter              (standard: pulse)
 *   bpm      40–200                     (standard: 90)
 *   beats    2 | 3 | 4 | 5              (meter, standard: 4)
 *   widget   (tom) | tempo | quiz | tap  tempo = hverdagstempo, quiz = 3 eller 4?, tap = liten tappeøvelse
 *   title    egen overskrift
 *   lang     no | en
 */
(function () {
  const { t, h, audio, slider, seg, canvas, glow, params, note, drum, rand, reduced } = RS;
  const app = document.getElementById('app');
  const widget = app.dataset.widget;
  const clampBpm = v => Math.max(40, Math.min(200, Number(v) || 90));
  const latency = () => (RS.ctx ? (RS.ctx.outputLatency || RS.ctx.baseLatency || 0) : 0);

  if (widget === 'tempo') return tempoWidget();
  if (widget === 'quiz') return quizWidget();
  if (params.get('mode') === 'meter') return meterView();
  return pulseView(widget === 'tap');

  // ======================================================================
  // Puls med «Tapp med»
  function pulseView(compact) {
    let bpm = clampBpm(params.get('bpm')), ghost = false, beats = [], taps = [], lastBeat = { time: -1, n: 0 }, ringT = -9, msg = '', msgT = -9, msgClass = '';
    const playBtn = h('button', { type: 'button', class: 'primary', on: { click: () => (lp.running ? stop() : start()) } }, t('▶ Start pulsen', '▶ Start the pulse'));
    const tapBtn = h('button', { type: 'button', class: 'tap', on: { pointerdown: e => { e.preventDefault(); tap(); } } }, t('Tapp med', 'Tap along'));
    const ghostBtn = h('button', { type: 'button', 'aria-pressed': 'false', on: { click: () => { ghost = !ghost; ghostBtn.setAttribute('aria-pressed', String(ghost)); } } }, t('Usynlig puls', 'Invisible pulse'));
    const tempo = slider('Tempo', { min: 40, max: 200, value: bpm, format: v => v + ' BPM', onInput: v => (bpm = v) });
    const stats = h('p', { class: 'status', role: 'status', text: compact ? t('Start pulsen og tapp med.', 'Start the pulse and tap along.') : t('Start pulsen, og tapp med knappen, mellomromstasten eller rett på sirkelen.', 'Start the pulse and tap with the button, the space bar or right on the circle.') });
    const stage = h('div', { class: 'stage' });
    app.append(
      h('style', { text: `
        .tap { font-size:16px; padding:14px 26px; background:#1e1e26; border-color:rgba(255,42,95,.5); }
        .tap:active { background:var(--red); }
        .stage canvas { cursor:pointer; }
      ` }),
      h('header', {}, h('div', {}, h('p', { class: 'eyebrow', text: t('Puls', 'Pulse') }), h('h1', { text: params.get('title') || (compact ? t('Finn pulsen', 'Find the pulse') : t('Kjenn pulsen – og tapp med', 'Feel the pulse – and tap along')) })), compact ? null : playBtn),
      stage,
      compact ? h('div', { class: 'row' }, playBtn, tapBtn) : h('div', { class: 'grid2' }, h('section', { class: 'panel' }, tempo, h('div', { class: 'row', style: 'margin-top:6px' }, ghostBtn, h('span', { class: 'small muted', text: t('4 slag med lyd, 4 slag stille', '4 beats with sound, 4 silent') }))), h('section', { class: 'panel row', style: 'justify-content:center' }, tapBtn)),
      stats);
    if (compact) tempo.input.value = bpm;
    const cv = canvas(stage, w => (compact ? 190 : w < 520 ? 260 : 300));
    stage.prepend(cv.c);
    cv.c.addEventListener('pointerdown', e => { e.preventDefault(); tap(); });
    addEventListener('keydown', e => { if (e.code === 'Space' && !e.repeat) { e.preventDefault(); tap(); } });

    const silent = n => ghost && n % 8 >= 4;
    const lp = RS.loop({
      stepDur: () => 60 / bpm,
      onStep: (n, time) => { beats.push({ time, n }); if (beats.length > 16) beats.shift(); if (!silent(n)) drum.wood(time, n % 4 === 0); },
      onShow: (n, time) => { lastBeat = { time, n }; },
    });
    function start() { lp.start(); beats = []; taps = []; playBtn.textContent = t('■ Stopp', '■ Stop'); playBtn.classList.remove('primary'); }
    function stop() { lp.stop(); playBtn.textContent = t('▶ Start pulsen', '▶ Start the pulse'); playBtn.classList.add('primary'); }
    function tap() {
      audio();
      if (!lp.running) { start(); stats.textContent = t('Pulsen er i gang. Tapp når du hører slaget.', 'The pulse is running. Tap when you hear the beat.'); return; }
      const now = RS.ctx.currentTime - latency();
      let best = null; beats.forEach(b => { if (!best || Math.abs(b.time - now) < Math.abs(best.time - now)) best = b; });
      if (!best) return;
      const off = (now - best.time) * 1000, win = Math.min(60, 60000 / bpm * 0.12);
      taps.push({ off, at: performance.now() }); if (taps.length > 12) taps.shift();
      msgClass = Math.abs(off) <= win ? 'hit' : off < 0 ? 'early' : 'late';
      msg = msgClass === 'hit' ? t('Treff!', 'Hit!') : msgClass === 'early' ? t('Litt tidlig', 'A bit early') : t('Litt sent', 'A bit late');
      msgT = performance.now(); ringT = performance.now();
      const hits = taps.filter(x => Math.abs(x.off) <= win).length;
      const avg = Math.round(taps.reduce((a, x) => a + x.off, 0) / taps.length);
      stats.textContent = t(`${hits} av ${taps.length} siste tapp traff. Snitt: ${Math.abs(avg)} ms ${avg < 0 ? 'tidlig' : 'sent'}.`, `${hits} of the last ${taps.length} taps hit. Average: ${Math.abs(avg)} ms ${avg < 0 ? 'early' : 'late'}.`)
        + (silent(best.n) ? t(' Du holder pulsen i stillheten!', ' You are keeping the pulse in the silence!') : '');
    }
    function frame() {
      const { g, w, h: hh } = cv, nowS = RS.ctx ? RS.ctx.currentTime : 0, period = 60 / bpm;
      g.clearRect(0, 0, w, hh);
      const cx = w / 2, cy = (compact ? hh : hh - 50) / 2 + 4, R = Math.min(compact ? 54 : 78, hh * 0.27);
      const since = lp.running && lastBeat.time > 0 ? nowS - lastBeat.time : 9;
      const hide = lp.running && silent(lastBeat.n);
      const k = reduced ? (since < 0.12 ? 1 : 0) : Math.exp(-since * 9);
      // ringer som brer seg ut
      if (!hide) for (let i = 0; i < 3; i++) {
        const age = since + i * period;
        if (age > period * 2.6) continue;
        const r = R + age / period * R * 0.9, a = Math.max(0, 0.5 - age / (period * 2.6) * 0.5);
        g.strokeStyle = `rgba(255,42,95,${a})`; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
      }
      // kjernen
      const r = R * (1 + (hide ? 0 : 0.18 * k)), grad = g.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
      if (hide) { grad.addColorStop(0, 'rgba(255,255,255,.07)'); grad.addColorStop(1, 'rgba(255,255,255,.02)'); }
      else { grad.addColorStop(0, `rgba(255,${190 + 65 * k},${200 + 55 * k},1)`); grad.addColorStop(0.45, '#ff2a5f'); grad.addColorStop(1, 'rgba(120,10,40,.6)'); }
      glow(g, '#ff2a5f', hide ? 0 : 20 + 50 * k); g.fillStyle = grad; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill(); g.shadowBlur = 0;
      if (hide) { g.strokeStyle = 'rgba(255,255,255,.25)'; g.setLineDash([4, 6]); g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke(); g.setLineDash([]); }
      // tapp-ring
      const tapAge = (performance.now() - ringT) / 1000;
      if (tapAge < 0.5) { g.strokeStyle = msgClass === 'hit' ? `rgba(74,222,128,${1 - tapAge * 2})` : `rgba(255,255,255,${0.8 - tapAge * 1.6})`; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, R * (1.05 + tapAge), 0, Math.PI * 2); g.stroke(); }
      // tekst i midten
      g.textAlign = 'center'; g.textBaseline = 'middle';
      if (performance.now() - msgT < 900) { g.fillStyle = msgClass === 'hit' ? '#4ade80' : '#fff'; g.font = `800 ${compact ? 17 : 22}px Inter, system-ui`; g.fillText(msg, cx, cy); }
      else if (lp.running) { g.fillStyle = hide ? 'rgba(255,255,255,.5)' : '#fff'; g.font = `900 ${compact ? 30 : 40}px Inter, system-ui`; g.fillText(hide ? '…' : String(lastBeat.n % 4 + 1), cx, cy + 1); }
      else { g.fillStyle = '#fff'; g.font = `800 ${compact ? 15 : 18}px Inter, system-ui`; g.fillText(bpm + ' BPM', cx, cy); }
      // tidlig/sent-stripe
      if (!compact) {
        const y = hh - 26, x0 = 30, x1 = w - 30, span = 200, xOf = ms => cx + Math.max(-1, Math.min(1, ms / span)) * (x1 - x0) / 2;
        g.strokeStyle = 'rgba(255,255,255,.15)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke();
        g.fillStyle = 'rgba(74,222,128,.18)'; const win = Math.min(60, 60000 / bpm * 0.12); g.fillRect(xOf(-win), y - 9, xOf(win) - xOf(-win), 18);
        g.fillStyle = 'rgba(255,255,255,.45)'; g.font = '700 11px Inter, system-ui';
        g.textAlign = 'left'; g.fillText(t('tidlig', 'early'), x0, y - 16); g.textAlign = 'right'; g.fillText(t('sent', 'late'), x1, y - 16); g.textAlign = 'center'; g.fillText(t('treff', 'hit'), cx, y - 16);
        taps.forEach((tp, i) => { const a = (i + 1) / taps.length; g.fillStyle = Math.abs(tp.off) <= win ? `rgba(74,222,128,${a})` : `rgba(255,138,166,${a})`; g.beginPath(); g.arc(xOf(tp.off), y, i === taps.length - 1 ? 6 : 4, 0, Math.PI * 2); g.fill(); });
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // ======================================================================
  // Takt: en sirkel med slag. Velg antall, betoning og lyd.
  function meterView() {
    const METERS = {
      2: { groups: [2], label: '2' }, 3: { groups: [3], label: '3' }, 4: { groups: [4], label: '4' },
      '5a': { groups: [3, 2], label: '5 (3+2)' }, '5b': { groups: [2, 3], label: '5 (2+3)' },
    };
    let meterId = METERS[params.get('beats')] ? params.get('beats') : params.get('beats') === '5' ? '5a' : '4';
    let bpm = clampBpm(params.get('bpm') || 100), sound = 'click', accents = null, cur = { n: -1, time: 0 };
    const N = () => METERS[meterId].groups.reduce((a, b) => a + b, 0);
    const groupStarts = () => { const s = new Set(); let i = 0; METERS[meterId].groups.forEach(g => { s.add(i); i += g; }); return s; };
    const resetAccents = () => (accents = groupStarts());
    resetAccents();
    const WORDS = t(['én', 'to', 'tre', 'fire', 'fem'], ['one', 'two', 'three', 'four', 'five']);
    const countEl = h('div', { class: 'count' });
    const status = h('p', { class: 'status', role: 'status' });
    const playBtn = h('button', { type: 'button', class: 'primary', on: { click: () => (lp.running ? stop() : start()) } }, t('▶ Spill', '▶ Play'));
    const meterSeg = seg(t('Slag i takten', 'Beats per bar'), Object.entries(METERS).map(([k, m]) => [k, m.label]), meterId, v => { meterId = v; resetAccents(); render(); });
    const soundSeg = seg(t('Lyd', 'Sound'), [['click', t('Klikk', 'Click')], ['komp', t('Komp', 'Backing')], ['drums', t('Trommer', 'Drums')]], sound, v => (sound = v));
    const tempo = slider('Tempo', { min: 40, max: 200, value: bpm, format: v => v + ' BPM', onInput: v => (bpm = v) });
    const preset = (id, m, b, s, acc) => h('button', { type: 'button', on: { click: () => { meterId = m; bpm = b; sound = s; meterSeg.set(m); soundSeg.set(s); tempo.set(b); accents = acc ? new Set(acc) : groupStarts(); render(); if (!lp.running) start(); } } }, id);
    const stage = h('div', { class: 'stage' });
    app.append(
      h('style', { text: `
        .count { display:flex; justify-content:center; gap:10px; flex-wrap:wrap; font-size:clamp(18px,3.4vw,26px); font-weight:800; color:rgba(255,255,255,.35); }
        .count span { transition:color .08s, transform .08s; } .count span.acc { color:rgba(255,255,255,.7); text-transform:uppercase; }
        .count span.now { color:#fff; transform:scale(1.12); } .count span.acc.now { color:var(--red); text-shadow:0 0 18px var(--glow); }
        .count i { color:rgba(255,255,255,.2); font-style:normal; }
        .stage canvas { cursor:pointer; }
      ` }),
      h('header', {}, h('div', {}, h('p', { class: 'eyebrow', text: t('Takt', 'Meter') }), h('h1', { text: params.get('title') || t('Når pulsen blir til grupper', 'When the pulse forms groups') })), playBtn),
      stage, countEl,
      h('div', { class: 'grid2' },
        h('section', { class: 'panel' }, h('p', { class: 'eyebrow', text: t('Slag i hver takt', 'Beats in each bar') }), meterSeg, h('p', { class: 'eyebrow', style: 'margin-top:12px', text: t('Lyd', 'Sound') }), soundSeg, tempo),
        h('section', { class: 'panel' }, h('p', { class: 'eyebrow', text: t('Prøv', 'Try') }),
          h('div', { class: 'row' }, preset(t('Vals', 'Waltz'), '3', 138, 'komp'), preset(t('Marsj', 'March'), '2', 112, 'komp'), preset('Backbeat', '4', 96, 'drums', [1, 3])),
          h('p', { class: 'small muted', text: t('Trykk på et slag i sirkelen for å flytte betoningen.', 'Tap a beat in the circle to move the accent.') }))),
      status);
    meterSeg.classList.add('wrap'); meterSeg.style.flexWrap = 'wrap';
    const cv = canvas(stage, w => (w < 520 ? 280 : 320));
    stage.prepend(cv.c);
    let dots = [];
    cv.c.addEventListener('pointerdown', e => {
      const r = cv.c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      const i = dots.findIndex(d => Math.hypot(d[0] - x, d[1] - y) < 28); if (i < 0) return;
      accents.has(i) ? accents.delete(i) : accents.add(i); render();
      audio(); drum.wood(RS.now() + 0.01, accents.has(i));
    });
    // Akkordene veksler mellom C og G hver takt.
    const HARM = [{ bass: 48, chord: [64, 67, 72] }, { bass: 43, chord: [62, 67, 71] }];
    const lp = RS.loop({
      stepDur: () => 60 / bpm,
      onStep: (n, time) => {
        const i = n % N(), bar = Math.floor(n / N()), acc = accents.has(i), starts = groupStarts();
        if (sound === 'click') drum.wood(time, acc);
        else if (sound === 'komp') {
          const hm = HARM[bar % 2];
          if (starts.has(i)) note(hm.bass, { time, dur: 60 / bpm * 0.9, vel: acc ? 0.8 : 0.55, kind: 'bass' });
          else hm.chord.forEach(m => note(m, { time, dur: 60 / bpm * 0.35, vel: acc ? 0.55 : 0.3, kind: 'pluck' }));
        } else {
          drum.hat(time, acc ? 1.2 : 0.8);
          if (acc && !starts.has(i)) drum.snare(time, 1); else if (acc) drum.kick(time, 1); else if (starts.has(i)) drum.kick(time, 0.7);
        }
      },
      onShow: (n, time) => { cur = { n, time }; highlight(n % N()); },
    });
    function start() { lp.start(); playBtn.textContent = t('■ Stopp', '■ Stop'); playBtn.classList.remove('primary'); }
    function stop() { lp.stop(); cur = { n: -1, time: 0 }; highlight(-1); playBtn.textContent = t('▶ Spill', '▶ Play'); playBtn.classList.add('primary'); }
    function render() {
      const starts = groupStarts();
      countEl.replaceChildren(...Array.from({ length: N() }, (_, i) => [i && starts.has(i) ? h('i', { text: '|' }) : null, h('span', { class: accents.has(i) ? 'acc' : '', text: WORDS[i] })]).flat().filter(Boolean));
      const n = N(), names = { 2: t('totakt – marsj', 'two – march'), 3: t('tretakt – vals', 'three – waltz'), 4: t('firetakt', 'four'), 5: t('femtakt', 'five') };
      status.textContent = t(`${n} slag i hver takt (${names[n]}). `, `${n} beats per bar (${names[n]}). `)
        + (accents.size && !accents.has(0) ? t('Betoningen ligger ikke på ener – men takten begynner fortsatt der.', 'The accent is not on one – but the bar still begins there.') : t('Første slag får betoning, og takten begynner på nytt.', 'The first beat is accented, and the bar starts again.'));
    }
    function highlight(i) { [...countEl.querySelectorAll('span')].forEach((s, k) => s.classList.toggle('now', k === i)); }
    function frame() {
      const { g, w, h: hh } = cv, n = N(), cx = w / 2, cy = hh / 2, R = Math.min(hh * 0.36, w * 0.36);
      g.clearRect(0, 0, w, hh);
      const nowS = RS.ctx ? RS.ctx.currentTime : 0, period = 60 / bpm, i = cur.n >= 0 ? cur.n % n : -1;
      const frac = cur.n >= 0 ? Math.min(1, (nowS - cur.time) / period) : 0;
      // ytre bane
      g.strokeStyle = 'rgba(255,255,255,.1)'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke();
      const ang = k => -Math.PI / 2 + (k / n) * Math.PI * 2;
      // gruppebuer
      let s = 0; METERS[meterId].groups.forEach((gr, gi) => {
        g.strokeStyle = gi % 2 ? 'rgba(91,140,255,.35)' : 'rgba(255,42,95,.35)'; g.lineWidth = 6; g.lineCap = 'round';
        g.beginPath(); g.arc(cx, cy, R + 18, ang(s) + 0.12, ang(s + gr) - 0.12); g.stroke(); s += gr;
      });
      // viser
      if (i >= 0) {
        const a = ang(i + (reduced ? 0 : frac));
        const grad = g.createLinearGradient(cx, cy, cx + Math.cos(a) * R, cy + Math.sin(a) * R);
        grad.addColorStop(0, 'rgba(255,42,95,0)'); grad.addColorStop(1, 'rgba(255,42,95,.9)');
        g.strokeStyle = grad; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * (R - 16), cy + Math.sin(a) * (R - 16)); g.stroke();
        g.fillStyle = 'rgba(255,42,95,.08)'; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, ang(i), a); g.closePath(); g.fill();
      }
      dots = [];
      for (let k = 0; k < n; k++) {
        const a = ang(k), x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R, acc = accents.has(k), on = k === i;
        const pop = on ? Math.exp(-(nowS - cur.time) * 7) : 0, r = (acc ? 19 : 12) * (1 + 0.35 * pop);
        dots.push([x, y]);
        glow(g, '#ff2a5f', on ? 40 * pop + 10 : acc ? 10 : 0);
        g.fillStyle = on ? (acc ? '#ff2a5f' : '#fff') : acc ? 'rgba(255,42,95,.55)' : 'rgba(255,255,255,.18)';
        g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.shadowBlur = 0;
        g.fillStyle = on && !acc ? '#111' : '#fff'; g.font = `800 ${acc ? 15 : 12}px Inter, system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(k + 1), x, y + 1);
      }
      g.fillStyle = '#fff'; g.font = '900 34px Inter, system-ui'; g.fillText(String(n), cx, cy - 6);
      g.fillStyle = 'rgba(255,255,255,.45)'; g.font = '700 11px Inter, system-ui'; g.fillText(t('slag per takt', 'beats per bar'), cx, cy + 18);
      requestAnimationFrame(frame);
    }
    render(); requestAnimationFrame(frame);
  }

  // ======================================================================
  // Widget: Hverdagstempo
  function tempoWidget() {
    const ITEMS = [
      { id: 'rest', icon: '♥', no: 'Hvilepuls', en: 'Resting heart', bpm: 70, sound: time => { drum.kick(time, 0.55); drum.kick(time + 0.16, 0.35); } },
      { id: 'walk', icon: '🚶', no: 'Gange', en: 'Walking', bpm: 110, sound: (time, n) => { drum.kick(time, 0.4); drum.hat(time, n % 2 ? 0.6 : 0.9); } },
      { id: 'run', icon: '🏃', no: 'Løping', en: 'Running', bpm: 170, sound: (time, n) => { drum.kick(time, 0.35); drum.hat(time, n % 2 ? 0.7 : 1); } },
    ];
    let cur = null, lastT = 0;
    const stage = h('div', { class: 'stage' });
    const label = h('div', { class: 'small muted', text: t('Velg en hverdagspuls', 'Choose an everyday pulse') });
    const lp = RS.loop({ stepDur: () => 60 / cur.bpm, onStep: (n, time) => cur.sound(time, n), onShow: (n, time) => (lastT = time) });
    const btns = ITEMS.map(it => h('button', { type: 'button', 'aria-pressed': 'false', on: { click: () => {
      const same = cur === it; lp.stop(); btns.forEach(b => b.setAttribute('aria-pressed', 'false'));
      if (same) { cur = null; label.textContent = t('Stoppet', 'Stopped'); return; }
      cur = it; btns[ITEMS.indexOf(it)].setAttribute('aria-pressed', 'true'); lp.start();
      label.textContent = t(`${it.no}: omtrent ${it.bpm} slag i minuttet`, `${it.en}: about ${it.bpm} beats per minute`);
    } } }, `${it.icon} ${t(it.no, it.en)}`));
    app.append(h('header', {}, h('div', {}, h('p', { class: 'eyebrow', text: 'Tempo' }), h('h1', { text: params.get('title') || t('Hverdagstempo', 'Everyday tempo') }))),
      stage, h('div', { class: 'row' }, btns), label);
    const cv = canvas(stage, 130); stage.prepend(cv.c);
    (function frame() {
      const { g, w, h: hh } = cv; g.clearRect(0, 0, w, hh);
      const k = cur && RS.ctx ? Math.exp(-(RS.ctx.currentTime - lastT) * 8) : 0, cx = w / 2, cy = hh / 2;
      glow(g, '#ff2a5f', 10 + 40 * k); g.fillStyle = cur ? '#ff2a5f' : 'rgba(255,255,255,.15)';
      g.beginPath(); g.arc(cx, cy, 30 * (1 + 0.3 * k), 0, Math.PI * 2); g.fill(); g.shadowBlur = 0;
      g.fillStyle = '#fff'; g.font = '900 18px Inter, system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(cur ? String(cur.bpm) : '–', cx, cy); g.font = '700 11px Inter, system-ui'; g.fillStyle = 'rgba(255,255,255,.5)'; g.fillText('BPM', cx, cy + 46);
      requestAnimationFrame(frame);
    })();
  }

  // Widget: Quiz «3 eller 4?»
  function quizWidget() {
    let q = null, score = [0, 0], lastShow = { n: -1, time: 0 };
    const fb = h('p', { class: 'status', role: 'status', text: t('Trykk Spill og tell med. Kjenner du grupper på tre eller fire?', 'Press Play and count along. Do you feel groups of three or four?') });
    const beatsEl = h('div', { class: 'qbeats' });
    const lp = RS.loop({
      stepDur: () => 60 / q.bpm,
      onStep: (n, time) => {
        if (n >= q.n * 4) { setTimeout(() => lp.stop(), 50); return; }
        const i = n % q.n, hm = Math.floor(n / q.n) % 2 ? { bass: 43, chord: [62, 67, 71] } : { bass: 48, chord: [64, 67, 72] };
        if (i === 0) note(hm.bass, { time, dur: 0.5, vel: 0.8, kind: 'bass' }); else hm.chord.forEach(m => note(m, { time, dur: 0.18, vel: 0.28, kind: 'pluck' }));
        drum.wood(time, i === 0);
      },
      onShow: (n, time) => (lastShow = { n, time }),
    });
    const ask = () => { lp.stop(); q = { n: rand([3, 4]), bpm: 96 + Math.floor(Math.random() * 40), done: false }; beatsEl.replaceChildren(); lp.start(); fb.textContent = t('Tre eller fire?', 'Three or four?'); };
    const answer = n => {
      if (!q || q.done) return; q.done = true;
      const ok = n === q.n; score[0] += ok ? 1 : 0; score[1]++;
      beatsEl.replaceChildren(...Array.from({ length: q.n }, (_, i) => h('span', { class: i ? '' : 'acc', text: String(i + 1) })));
      fb.replaceChildren(h('span', { class: 'feedback ' + (ok ? 'good' : 'bad'), text: ok ? t('Riktig! ', 'Right! ') : t('Ikke helt. ', 'Not quite. ') }),
        (q.n === 3 ? t('Det var grupper på tre – som i en vals.', 'It was groups of three – like a waltz.') : t('Det var grupper på fire.', 'It was groups of four.')) + ` (${score[0]}/${score[1]})`);
    };
    app.append(
      h('style', { text: `.qbeats { display:flex; gap:8px; min-height:36px; } .qbeats span { width:36px; height:36px; display:grid; place-items:center; border-radius:50%; background:#1e1e26; font-weight:800; } .qbeats span.acc { background:var(--red); box-shadow:0 0 16px var(--glow); }` }),
      h('header', {}, h('div', {}, h('p', { class: 'eyebrow', text: 'Quiz' }), h('h1', { text: params.get('title') || t('3 eller 4?', '3 or 4?') }))),
      h('div', { class: 'stage', id: 'qs' }),
      h('div', { class: 'row' }, h('button', { type: 'button', class: 'primary', on: { click: ask } }, t('▶ Spill', '▶ Play')),
        h('button', { type: 'button', on: { click: () => answer(3) } }, t('Tre', 'Three')), h('button', { type: 'button', on: { click: () => answer(4) } }, t('Fire', 'Four'))),
      beatsEl, fb);
    const stage = app.querySelector('#qs'), cv = canvas(stage, 90); stage.prepend(cv.c);
    (function frame() {
      const { g, w, h: hh } = cv; g.clearRect(0, 0, w, hh);
      const k = lp.running && RS.ctx ? Math.exp(-(RS.ctx.currentTime - lastShow.time) * 8) : 0, first = q && lastShow.n % q.n === 0;
      // Under spørsmålet vises bare at det pulserer, ikke hvor gruppene begynner.
      glow(g, '#ff2a5f', 8 + 30 * k); g.fillStyle = lp.running ? `rgba(255,42,95,${0.4 + 0.6 * k})` : 'rgba(255,255,255,.12)';
      g.beginPath(); g.arc(w / 2, hh / 2, 22 * (1 + 0.3 * k), 0, Math.PI * 2); g.fill(); g.shadowBlur = 0;
      if (q && q.done && lp.running && first) { g.strokeStyle = `rgba(255,255,255,${k})`; g.lineWidth = 2; g.beginPath(); g.arc(w / 2, hh / 2, 32, 0, Math.PI * 2); g.stroke(); }
      requestAnimationFrame(frame);
    })();
  }
})();
