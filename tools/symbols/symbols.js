(() => {
  'use strict';
  const cards = [...document.querySelectorAll('.symbol-card')];
  const query = document.querySelector('#symbol-query');
  const clear = document.querySelector('#clear-search');
  const count = document.querySelector('#visible-count');
  const empty = document.querySelector('#no-results');
  const buttons = [...document.querySelectorAll('[data-category]')];
  let category = 'alle';
  const normalize = value => value.toLocaleLowerCase('nb-NO').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  function filter() {
    const term = normalize(query.value.trim());
    let visible = 0;
    cards.forEach(card => {
      const haystack = normalize(`${card.dataset.name} ${card.dataset.description} ${card.dataset.symbol}`);
      const show = (!term || haystack.includes(term)) && (category === 'alle' || card.dataset.category === category);
      card.hidden = !show;
      if (show) visible++;
    });
    count.textContent = visible;
    empty.hidden = visible !== 0;
    clear.hidden = term === '';
  }
  query.addEventListener('input', filter);
  clear.addEventListener('click', () => { query.value = ''; query.focus(); filter(); });
  buttons.forEach(button => button.addEventListener('click', () => {
    buttons.forEach(item => item.classList.toggle('is-active', item === button));
    category = button.dataset.category;
    filter();
  }));

  if (!window.Vex?.Flow) return;
  const VF = window.Vex.Flow;
  const durations = new Map([
    ['Helnote', 'w'], ['Halvnote', 'h'], ['Firedelsnote', 'q'], ['Åttendedelsnote', '8'],
    ['Sekstendedelsnote', '16'], ['Trettitoendelsnote', '32'], ['Sekstifjerdedelsnote', '64'], ['Hundreogtjueåttedelsnote', '128'],
    ['Helpause', 'wr'], ['Halvpause', 'hr'], ['Firedelspause', 'qr'],
    ['Åttendedelspause', '8r'], ['Sekstendedelspause', '16r'], ['Trettitoendelspause', '32r'], ['Sekstifjerdedelspause', '64r']
  ]);
  const clefs = new Map([['G-nøkkel', 'treble'], ['F-nøkkel', 'bass'], ['C-nøkkel', 'alto'], ['Tenornøkkel', 'tenor'], ['Slagnøkkel', 'percussion'], ['Nøytral nøkkel', 'percussion']]);
  const timeSignatures = new Map([['Vanlig takt', 'C'], ['Alla breve', 'C|']]);
  const accidentals = new Map([['Kryss', '#'], ['B', 'b'], ['Oppløsningstegn', 'n'], ['Dobbeltkryss', '##'], ['Dobbelt-b', 'bb']]);
  const endBars = new Map([
    ['Enkel taktstrek', VF.Barline.type.SINGLE], ['Dobbel taktstrek', VF.Barline.type.DOUBLE],
    ['Sluttstrek', VF.Barline.type.END], ['Dobbel sluttstrek med repetisjon', VF.Barline.type.REPEAT_END]
  ]);
  const beginBars = new Map([
    ['Dobbel startstrek', VF.Barline.type.NONE],
    ['Dobbel startstrek med repetisjon', VF.Barline.type.REPEAT_BEGIN]
  ]);
  const repetitions = new Map([['Coda', VF.Repetition.type.CODA_LEFT], ['Segno', VF.Repetition.type.SEGNO_LEFT]]);
  const ornaments = new Map([['Omvending', 'turn'], ['Omvendt omvending', 'turn_inverted'], ['Mordent', 'mordent'], ['Omvendt mordent', 'mordent_inverted']]);
  const pauseMarks = new Set(['Pustetegn', 'Cesur']);
  const ottavas = new Map([['Oktav opp', { text: '8', superscript: 'va', position: VF.TextBracket.Position.TOP }], ['Oktav ned', { text: '8', superscript: 'vb', position: VF.TextBracket.Position.BOTTOM }]]);
  const pedalText = new Map([['Pedal ned', 'Ped.'], ['Pedal opp', '*'], ['Una corda', 'una corda'], ['Tre corde', 'tre corde']]);
  const textFallbacks = new Map([
    ['Lang fermate', '⌒'], ['Meget lang fermate', '⌒'], ['Kort fermate', '⌒'],
    ['Trillsymbol', 'tr'], ['Schleifer', 'schl.'],
    ['Hundreogtjueåttedelsnote', '128'], ['Trettitoendelspause', '32r'], ['Sekstifjerdedelspause', '64r']
  ]);
  const specialNames = new Set(['Flertaktspause', 'Bue', 'Bindebue', 'Tremolo', ...ornaments.keys(), ...pauseMarks, ...ottavas.keys(), ...pedalText.keys(), ...textFallbacks.keys()]);

  function drawVoice(context, stave, notes, beats = notes.length) {
    const voice = new VF.Voice({ num_beats: beats, beat_value: 4 }).setMode(VF.Voice.Mode.SOFT);
    voice.addTickables(notes);
    new VF.Formatter().joinVoices([voice]).formatToStave([voice], stave, { align_rests: true });
    voice.draw(context, stave);
  }

  function render(host) {
    const name = host.dataset.name;
    if (!durations.has(name) && !clefs.has(name) && !timeSignatures.has(name) && !accidentals.has(name) && !endBars.has(name) && !beginBars.has(name) && !repetitions.has(name) && !specialNames.has(name)) return;
    const fallback = host.innerHTML;
    try {
      host.textContent = '';
      if (textFallbacks.has(name)) {
        host.textContent = textFallbacks.get(name);
        host.classList.add('text-notation');
        return;
      }
      const width = Math.max(260, host.clientWidth || 320);
      const renderer = new VF.Renderer(host, VF.Renderer.Backends.SVG);
      renderer.resize(width, 142);
      const context = renderer.getContext();
      context.setFillStyle('#111').setStrokeStyle('#111');
      const stave = new VF.Stave(20, 30, width - 40);
      if (clefs.has(name)) stave.addClef(clefs.get(name));
      if (timeSignatures.has(name)) stave.addTimeSignature(timeSignatures.get(name));
      if (endBars.has(name)) stave.setEndBarType(endBars.get(name));
      if (beginBars.has(name)) stave.setBegBarType(beginBars.get(name));
      if (repetitions.has(name)) stave.setRepetitionType(repetitions.get(name));
      stave.setContext(context).draw();

      if (name === 'Dobbel startstrek') {
        const top = stave.getYForLine(0);
        const height = stave.getYForLine(4) - top;
        context.fillRect(stave.getX(), top, 4, height);
        context.fillRect(stave.getX() + 9, top, 1.5, height);
        return;
      }

      if (clefs.has(name) || timeSignatures.has(name) || endBars.has(name) || beginBars.has(name) || repetitions.has(name)) return;
      if (name === 'Flertaktspause') {
        new VF.MultiMeasureRest(4, { number_of_measures: 4, show_number: true, padding_left: 55, padding_right: 55 })
          .setStave(stave).setContext(context).draw();
        return;
      }
      if (name === 'Bue' || name === 'Bindebue') {
        const secondKey = name === 'Bue' ? 'd/5' : 'b/4';
        const notes = [
          new VF.StaveNote({ keys: ['b/4'], duration: 'q' }),
          new VF.StaveNote({ keys: [secondKey], duration: 'q' })
        ];
        drawVoice(context, stave, notes, 2);
        const connector = name === 'Bue'
          ? new VF.Curve(notes[0], notes[1], { cps: [{ x: 0, y: 12 }, { x: 0, y: 12 }], invert: true })
          : new VF.StaveTie({ first_note: notes[0], last_note: notes[1], first_indices: [0], last_indices: [0] });
        connector.setContext(context).draw();
        return;
      }
      if (pauseMarks.has(name)) {
        const notes = [new VF.StaveNote({ keys: ['b/4'], duration: 'q' }), new VF.StaveNote({ keys: ['d/5'], duration: 'q' })];
        drawVoice(context, stave, notes, 2);
        context.setFont('serif', 25, 'bold');
        context.fillText(name === 'Pustetegn' ? ',' : '//', width / 2 - 6, 29);
        return;
      }
      if (ottavas.has(name)) {
        const notes = [new VF.StaveNote({ keys: ['b/4'], duration: 'q' }), new VF.StaveNote({ keys: ['d/5'], duration: 'q' })];
        drawVoice(context, stave, notes, 2);
        const spec = ottavas.get(name);
        new VF.TextBracket({ start: notes[0], stop: notes[1], text: spec.text, superscript: spec.superscript, position: spec.position })
          .setLine(1).setContext(context).draw();
        return;
      }
      if (pedalText.has(name)) {
        const notes = [new VF.StaveNote({ keys: ['b/4'], duration: 'q' }), new VF.StaveNote({ keys: ['d/5'], duration: 'q' })];
        drawVoice(context, stave, notes, 2);
        context.setFont('serif', name === 'Pedal opp' ? 30 : 18, name === 'Pedal opp' ? 'normal' : 'italic');
        context.fillText(pedalText.get(name), width / 2 - 28, 125);
        return;
      }
      const note = new VF.StaveNote({ keys: ['b/4'], duration: durations.get(name) || 'q' });
      if (accidentals.has(name)) note.addModifier(new VF.Accidental(accidentals.get(name)), 0);
      if (ornaments.has(name)) note.addModifier(new VF.Ornament(ornaments.get(name)), 0);
      if (name === 'Tremolo') note.addModifier(new VF.Tremolo(3), 0);
      drawVoice(context, stave, [note], 1);
    } catch (_) {
      host.innerHTML = fallback;
    }
  }
  requestAnimationFrame(() => document.querySelectorAll('.notation').forEach(render));
})();
