/* Rockeskolen – form-embed for artikler.
 *
 * Viser en låt som fargeblokker (vers, refreng, bro …) og spiller akkordene del for del.
 * URL-parametere:
 *   form     vers_refreng | aba | aaba | blues   (standard: vers_refreng)
 *   presets  kommaliste med former som kan velges, eller "none" (standard: alle)
 *   title    egen overskrift
 *   tempo    slag per minutt (standard 100)
 *   lang     no | en
 * Klikk på en blokk for å høre bare den delen.
 */
(function () {
  const app = document.querySelector('.form');
  const no = app.dataset.lang === 'no';
  const params = new URLSearchParams(location.search);
  const $ = id => document.getElementById(id);
  const t = (nb, en) => (no ? nb : en);

  const COLORS = { I: '#94a3b8', A: '#a78bfa', B: '#60a5fa', C: '#fbbf24', O: '#94a3b8', L1: '#a78bfa', L2: '#60a5fa', L3: '#fbbf24' };
  const PARTS = {
    intro:   { letter: 'I', name: t('Intro', 'Intro'), chords: ['C', 'G', 'Am', 'F'] },
    vers:    { letter: 'A', name: t('Vers', 'Verse'), chords: ['Am', 'F', 'C', 'G'] },
    refreng: { letter: 'B', name: t('Refreng', 'Chorus'), chords: ['F', 'G', 'C', 'Am'] },
    bro:     { letter: 'C', name: t('Bro', 'Bridge'), chords: ['Dm', 'Em', 'F', 'G'] },
    outro:   { letter: 'O', name: t('Outro', 'Outro'), chords: ['F', 'G', 'C', 'C'] },
    a:       { letter: 'A', name: t('Hovedtema', 'Main theme'), chords: ['C', 'F', 'G', 'C'] },
    b:       { letter: 'B', name: t('Kontrast', 'Contrast'), chords: ['Am', 'Dm', 'E', 'Am'] },
    aa:      { letter: 'A', name: t('Hovedtema', 'Main theme'), chords: ['C', 'Am', 'Dm', 'G'] },
    ab:      { letter: 'B', name: t('Bro', 'Bridge'), chords: ['F', 'Em', 'Dm', 'G'] },
    l1:      { letter: '1', color: 'L1', name: t('Linje 1: I', 'Line 1: I'), chords: ['C7', 'C7', 'C7', 'C7'] },
    l2:      { letter: '2', color: 'L2', name: t('Linje 2: IV – I', 'Line 2: IV – I'), chords: ['F7', 'F7', 'C7', 'C7'] },
    l3:      { letter: '3', color: 'L3', name: t('Linje 3: V – IV – I', 'Line 3: V – IV – I'), chords: ['G7', 'F7', 'C7', 'C7'] }
  };
  const FORMS = {
    vers_refreng: { name: t('Vers–refreng', 'Verse–chorus'), parts: ['intro', 'vers', 'refreng', 'vers', 'refreng', 'bro', 'refreng', 'outro'],
      about: t('Vanlig i pop, rock og viser: versene forteller, refrenget gjentas, broen gir kontrast.', 'Common in pop and rock: verses tell the story, the chorus returns, the bridge brings contrast.') },
    aba: { name: 'ABA', parts: ['a', 'b', 'a'],
      about: t('Hovedtema – kontrast – hovedtema igjen. Kontrasten gjør at vi kjenner igjen A når den kommer tilbake.', 'Main theme – contrast – main theme again.') },
    aaba: { name: 'AABA', parts: ['aa', 'aa', 'ab', 'aa'],
      about: t('To like A-deler, en bro (B) og A igjen. Vanlig i eldre pop, jazzstandarder og musikaler.', 'Two A sections, a bridge (B) and A again. Common in standards.') },
    blues: { name: t('12-takters blues', '12-bar blues'), parts: ['l1', 'l2', 'l3'],
      about: t('Tre linjer à fire takter: I – I – I – I / IV – IV – I – I / V – IV – I – I.', 'Three four-bar lines: I – I – I – I / IV – IV – I – I / V – IV – I – I.') }
  };

  let formId = FORMS[params.get('form')] ? params.get('form') : 'vers_refreng';
  const presetParam = (params.get('presets') || '').trim();
  const presetIds = presetParam === 'none' ? [] : (presetParam ? presetParam.split(',').filter(id => FORMS[id]) : Object.keys(FORMS));
  const customTitle = (params.get('title') || '').trim();
  const tempo = $('tempo');
  tempo.value = Math.max(60, Math.min(160, Number(params.get('tempo')) || 100));

  // ---------- akkorder ----------
  const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const TYPES = { '': [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], dim: [0, 3, 6] };
  function chordMidis(symbol) {
    const m = /^([A-G])(b|#)?(.*)$/.exec(symbol);
    const root = PC[m[1]] + (m[2] === 'b' ? -1 : m[2] === '#' ? 1 : 0);
    let base = 60 + root;
    if (base > 65) base -= 12;
    return { bass: 36 + ((root + 12) % 12), notes: (TYPES[m[3]] || TYPES['']).map(i => base + i) };
  }

  // ---------- visning ----------
  let current = { part: -1, bar: -1, beat: -1 };
  function form() { return FORMS[formId]; }
  function renderPresets() {
    const nav = $('presets');
    nav.innerHTML = '';
    if (presetIds.length < 2) return;
    presetIds.forEach(id => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'preset' + (id === formId ? ' active' : '');
      b.textContent = FORMS[id].name;
      b.onclick = () => { stop(); formId = id; render(); };
      nav.append(b);
    });
  }
  function renderTimeline() {
    const wrap = $('timeline');
    wrap.innerHTML = '';
    form().parts.forEach((id, i) => {
      const part = PARTS[id];
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'block' + (i === current.part ? ' current' : '') + (current.part >= 0 && i !== current.part ? ' dim' : '');
      b.style.setProperty('--c', COLORS[part.color || part.letter]);
      b.style.setProperty('--bars', part.chords.length);
      b.innerHTML = `<strong>${part.letter}</strong><span>${part.name}</span>`;
      b.title = t('Spill denne delen', 'Play this section');
      b.onclick = () => playFrom(i, true);
      wrap.append(b);
    });
  }
  function renderBars() {
    const shown = current.part >= 0 ? current.part : 0;
    const part = PARTS[form().parts[shown]];
    const color = COLORS[part.color || part.letter];
    $('sectionInfo').innerHTML = current.part >= 0
      ? `<b>${part.letter} · ${part.name}</b> – ${t('del', 'section')} ${shown + 1} ${t('av', 'of')} ${form().parts.length}`
      : form().about;
    $('bars').innerHTML = part.chords.map((c, i) => {
      const on = current.part === shown && current.bar === i;
      const beats = [0, 1, 2, 3].map(k => `<i class="${on && current.beat === k ? 'on' : ''}"></i>`).join('');
      return `<div class="bar${on ? ' current' : ''}" style="--c:${color}"><small>${t('takt', 'bar')} ${i + 1}</small>${c}<div class="beats">${beats}</div></div>`;
    }).join('');
  }
  function render() {
    $('title').textContent = customTitle || form().name;
    $('tempoValue').textContent = `${tempo.value} BPM`;
    renderPresets(); renderTimeline(); renderBars();
  }

  // ---------- lyd ----------
  let ctx = null, master = null;
  const timers = [];
  function audio() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 4;
      master = ctx.createGain(); master.gain.value = 0.5;
      master.connect(comp); comp.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
  }
  const freq = midi => 440 * Math.pow(2, (midi - 69) / 12);
  function voice(midi, at, dur, peak, type) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq(midi);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(peak, at + 0.04);
    g.gain.exponentialRampToValueAtTime(peak * 0.6, at + 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g); g.connect(master); o.start(at); o.stop(at + dur + 0.05);
  }
  function click(at, accent) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'square'; o.frequency.value = accent ? 1500 : 1100;
    g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(accent ? 0.05 : 0.03, at + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.04);
    o.connect(g); g.connect(master); o.start(at); o.stop(at + 0.06);
  }
  function clearTimers() { while (timers.length) clearTimeout(timers.pop()); }
  function stop() {
    clearTimers();
    current = { part: -1, bar: -1, beat: -1 };
    if (ctx) { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(0.5, ctx.currentTime); }
    render(); $('status').textContent = '';
  }
  function playFrom(startPart, only) {
    clearTimers(); audio();
    if (ctx) {
      // Kutter lyd som allerede er planlagt, uten klikk.
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now); master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(0, now + 0.05); master.gain.linearRampToValueAtTime(0.5, now + 0.12);
    }
    const beat = 60 / Number(tempo.value);
    const t0 = ctx.currentTime + 0.15;
    const parts = form().parts.map((id, i) => ({ id, i })).filter(p => (only ? p.i === startPart : p.i >= startPart));
    let k = 0;
    parts.forEach(({ id, i }) => {
      PARTS[id].chords.forEach((symbol, bar) => {
        const { bass, notes } = chordMidis(symbol);
        const at = t0 + k * 4 * beat;
        notes.forEach(m => voice(m, at, 4 * beat * 0.96, 0.11, 'triangle'));
        voice(bass, at, 2 * beat * 0.9, 0.2, 'sine');
        voice(bass, at + 2 * beat, 2 * beat * 0.9, 0.16, 'sine');
        for (let b = 0; b < 4; b++) {
          click(at + b * beat, b === 0);
          timers.push(setTimeout(() => {
            current = { part: i, bar, beat: b };
            if (b === 0 && bar === 0) { renderTimeline(); $('status').textContent = `${t('Spiller', 'Playing')}: ${PARTS[id].name}`; }
            renderBars();
          }, (at + b * beat - ctx.currentTime) * 1000));
        }
        k++;
      });
    });
    timers.push(setTimeout(() => stop(), (t0 + k * 4 * beat - ctx.currentTime + 0.2) * 1000));
  }

  $('play').onclick = () => playFrom(0, false);
  $('stop').onclick = stop;
  tempo.oninput = () => { $('tempoValue').textContent = `${tempo.value} BPM`; };
  render();
})();
