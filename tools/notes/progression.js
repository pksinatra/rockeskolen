(() => {
  const app = document.querySelector('.progression');
  const lang = app.dataset.lang;
  const no = lang === 'no';
  const params = new URLSearchParams(location.search);
  const presets = [
    { id:'1451', roman:['I','IV','V','I'], chords:['C','F','G','C'], no:'I–IV–V–I', en:'I–IV–V–I' },
    { id:'1564', roman:['I','V','vi','IV'], chords:['C','G','Am','F'], no:'Popprogresjonen', en:'Pop progression' },
    { id:'6415', roman:['vi','IV','I','V'], chords:['Am','F','C','G'], no:'Følelsesladet', en:'Emotional' },
    { id:'251', roman:['ii','V','I'], chords:['Dm','G','C'], no:'Jazzkadensen', en:'Jazz cadence' }
  ];
  const chordTypes = {
    '':[0,4,7], m:[0,3,7], min:[0,3,7], dim:[0,3,6], aug:[0,4,8],
    '7':[0,4,7,10], maj7:[0,4,7,11], m7:[0,3,7,10], min7:[0,3,7,10],
    sus2:[0,2,7], sus4:[0,5,7], add9:[0,4,7,14]
  };
  const pcs = { C:0,'C#':1,Db:1,D:2,'D#':3,Eb:3,E:4,F:5,'F#':6,Gb:6,G:7,'G#':8,Ab:8,A:9,'A#':10,Bb:10,B:11 };
  const sharpNames = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const flatKeys = new Set(['F','Bb','Eb','Ab','Db','Gb']);
  const flatNames = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
  const strings = {
    title: no ? 'Hør hvordan akkordene leder videre' : 'Hear how the chords move',
    ready: no ? 'Velg en progresjon eller trykk Spill.' : 'Choose a progression or press Play.',
    stopped: no ? 'Avspilling stoppet.' : 'Playback stopped.',
    playing: no ? 'Spiller' : 'Playing'
  };
  document.getElementById('title').textContent = strings.title;

  let synth;
  let timers = [];
  let looping = params.get('loop') === '1';
  let activePreset = presets.find(p => p.id === params.get('progression')) || presets[0];
  const custom = (params.get('chords') || '').split(',').map(v => v.trim()).filter(Boolean);
  if (custom.length >= 2 && custom.every(parseChord)) {
    activePreset = { id:'custom', roman:custom.map(() => ''), chords:custom, no:'Egen progresjon', en:'Custom progression' };
  }
  const tempo = document.getElementById('tempo');
  tempo.value = Math.max(50, Math.min(160, Number(params.get('tempo')) || 90));
  document.getElementById('loop').setAttribute('aria-pressed', String(looping));

  function parseChord(symbol) {
    const match = symbol.match(/^([A-G](?:#|b)?)(.*)$/);
    if (!match || pcs[match[1]] === undefined || chordTypes[match[2]] === undefined) return null;
    return { root:match[1], type:match[2], intervals:chordTypes[match[2]] };
  }
  function midiNotes(symbol) {
    const chord = parseChord(symbol);
    const rootMidi = 48 + pcs[chord.root];
    return chord.intervals.map(i => rootMidi + i);
  }
  function toneName(midi) {
    const names = flatKeys.has(params.get('key') || 'C') ? flatNames : sharpNames;
    return names[midi % 12] + (Math.floor(midi / 12) - 1);
  }
  function noteKey(midi) {
    const name = sharpNames[midi % 12].replace('#','').toLowerCase();
    return `${name}/${Math.floor(midi / 12) - 1}`;
  }
  function renderPresets() {
    const nav = document.getElementById('presets');
    nav.innerHTML = '';
    presets.forEach(preset => {
      const button = document.createElement('button');
      button.className = 'preset' + (preset.id === activePreset.id ? ' active' : '');
      button.type = 'button';
      button.textContent = `${preset.roman.join('–')} · ${preset[lang]}`;
      button.onclick = () => { stop(false); activePreset = preset; renderAll(); };
      nav.append(button);
    });
  }
  function renderCards(active = -1) {
    const wrap = document.getElementById('chordCards');
    wrap.style.setProperty('--count', activePreset.chords.length);
    wrap.innerHTML = activePreset.chords.map((chord,i) =>
      `<div class="chord-card${i === active ? ' active' : ''}"><span>${activePreset.roman[i] || (i + 1)}</span><strong>${chord}</strong></div>`
    ).join('');
  }
  function renderPiano(activeMidis = []) {
    const piano = document.getElementById('piano');
    piano.innerHTML = '';
    for (let midi=48; midi<=71; midi++) {
      const black = [1,3,6,8,10].includes(midi % 12);
      const key = document.createElement('div');
      key.className = `key ${black ? 'black' : 'white'}${activeMidis.includes(midi) ? ' active' : ''}`;
      key.dataset.midi = midi;
      if (!black && midi % 12 === 0) key.innerHTML = `<span class="key-label">C${Math.floor(midi / 12)-1}</span>`;
      piano.append(key);
    }
  }
  function renderNotation(active = -1) {
    const target = document.getElementById('notation');
    target.innerHTML = '';
    const width = Math.max(440, Math.min(920, target.parentElement.clientWidth - 24));
    const renderer = new Vex.Flow.Renderer(target, Vex.Flow.Renderer.Backends.SVG);
    renderer.resize(width, 164);
    const ctx = renderer.getContext();
    const stave = new Vex.Flow.Stave(10, 28, width - 20).addClef('treble').addTimeSignature(`${activePreset.chords.length}/4`);
    stave.setContext(ctx).draw();
    const notes = activePreset.chords.map((symbol,i) => {
      const note = new Vex.Flow.StaveNote({ clef:'treble', keys:midiNotes(symbol).map(noteKey), duration:'q' });
      if (i === active) note.setStyle({ fillStyle:'#7c3aed', strokeStyle:'#7c3aed' });
      return note.addModifier(new Vex.Flow.Annotation(symbol).setVerticalJustification(Vex.Flow.Annotation.VerticalJustify.TOP));
    });
    const voice = new Vex.Flow.Voice({ num_beats:activePreset.chords.length, beat_value:4 }).setStrict(false).addTickables(notes);
    new Vex.Flow.Formatter().joinVoices([voice]).format([voice], width - 120);
    voice.draw(ctx, stave);
  }
  function renderAll(active = -1) {
    renderPresets(); renderCards(active); renderNotation(active);
    renderPiano(active >= 0 ? midiNotes(activePreset.chords[active]) : []);
    document.getElementById('tempoValue').textContent = `${tempo.value} BPM`;
    if (active < 0) document.getElementById('status').textContent = strings.ready;
  }
  async function startAudio() {
    await Tone.start();
    if (!synth) synth = new Tone.PolySynth(Tone.Synth, { oscillator:{type:'triangle'}, envelope:{attack:.015,decay:.16,sustain:.32,release:.75} }).toDestination();
  }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function stop(showStatus = true) {
    clearTimers(); if (synth) synth.releaseAll(); renderAll();
    if (showStatus) document.getElementById('status').textContent = strings.stopped;
  }
  async function play() {
    stop(false); await startAudio();
    const beat = 60000 / Number(tempo.value);
    activePreset.chords.forEach((symbol,i) => {
      timers.push(setTimeout(() => {
        const midis = midiNotes(symbol);
        renderCards(i); renderNotation(i); renderPiano(midis);
        document.getElementById('status').textContent = `${strings.playing}: ${activePreset.roman[i] ? activePreset.roman[i] + ' · ' : ''}${symbol}`;
        synth.triggerAttackRelease(midis.map(toneName), beat * .82 / 1000);
      }, i * beat));
    });
    timers.push(setTimeout(() => {
      if (looping) play(); else renderAll();
    }, activePreset.chords.length * beat));
  }
  tempo.oninput = () => document.getElementById('tempoValue').textContent = `${tempo.value} BPM`;
  document.getElementById('play').onclick = play;
  document.getElementById('stop').onclick = () => stop(true);
  document.getElementById('loop').onclick = event => {
    looping = !looping; event.currentTarget.setAttribute('aria-pressed', String(looping));
  };
  addEventListener('resize', () => renderNotation(-1));
  renderAll();
})();
