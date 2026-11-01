// tools/instruments/piano/piano-sequencer.js
// Notemodell og avspilling for piano-rollen: noter med tonehøyde, start og varighet (i taktslag),
// loop, opptak, kvantisering, angre/gjør om og MIDI-eksport.
// Timing via Tone.Transport og Tone.Part (lookahead mot AudioContext-tiden).
// Filen deles mellom ChordLink og Rockeskolen – hold kopiene like.
(function (global) {
  'use strict';

  const STORAGE_KEY = 'cl-piano-roll-v1';
  const OLD_STORAGE_KEY = 'cl-piano-sequence-v1';
  const BEATS_PER_BAR = 4;
  const BAR_OPTIONS = [1, 2, 4, 8];
  // Rutenett i taktslag: 1/4, 1/8, 1/8-triol, 1/16, 1/16-triol, 1/32
  const GRID_OPTIONS = [1, 0.5, 1 / 3, 0.25, 1 / 6, 0.125];
  const GRID_LABELS = ['1/4', '1/8', '1/8T', '1/16', '1/16T', '1/32'];
  const MAX_NOTES = 512;
  const MAX_HISTORY = 100;
  const MIN_DUR = 1 / 32;

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function create(options) {
    const opts = Object.assign({
      engine: null,
      onChange: function () {},   // noter eller innstillinger er endret
      onTransport: function () {} // play/stop/opptak er endret
    }, options || {});
    const engine = opts.engine;

    let notes = [];   // { id, midi, start, dur, vel } – start og dur i taktslag
    let nextId = 1;
    let bpm = 100;
    let bars = 2;
    let grid = 0.25;
    let loop = true;
    let snap = true;
    let metronome = false;
    let playing = false;
    let recording = false;
    let cursor = 0;   // innsettingspunkt for opptak når transporten står
    let undoStack = [];
    let redoStack = [];
    let editSnapshot = null;
    const pending = new Map(); // midi -> { start, vel } for noter som spilles inn mens transporten går
    let stepGroup = null;      // akkord som spilles inn ved markøren mens transporten står
    let recordSnapshotTaken = false;
    let stopEventId = null;

    load();

    const part = new Tone.Part((time, ev) => {
      engine.playStep([ev], () => Tone.Ticks(ev.durTicks).toSeconds(), time);
    }, []);
    part.start(0);

    // Metronom: kort klikk rett til utgangen (uten effekter), høyere tone på taktens første slag
    const click = new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.02 },
      volume: -14
    }).toDestination();
    Tone.Transport.scheduleRepeat(time => {
      if (!metronome || !playing) return;
      const beat = Math.round(Tone.Transport.getTicksAtTime(time) / Tone.Transport.PPQ);
      click.triggerAttackRelease(beat % BEATS_PER_BAR === 0 ? 'C6' : 'G5', '32n', time);
    }, '4n');

    applyTransport();
    rebuildPart();

    // ---------- Lagring ----------

    function save() {
      try {
        global.localStorage.setItem(STORAGE_KEY, JSON.stringify({
          v: 1, bpm, bars, grid, loop, snap, metronome,
          notes: notes.map(n => [n.midi, round(n.start), round(n.dur), Math.round(n.vel * 100) / 100])
        }));
      } catch (err) { /* lagring er en bonus, ikke et krav */ }
    }

    // Seks desimaler holder triolverdier (1/3, 1/6) presise nok
    function round(v) { return Math.round(v * 1e6) / 1e6; }

    function readJSON(key) {
      try { return JSON.parse(global.localStorage.getItem(key) || 'null'); } catch (err) { return null; }
    }

    function load() {
      const data = readJSON(STORAGE_KEY);
      if (data && data.v === 1 && Array.isArray(data.notes)) {
        bpm = clampBpm(data.bpm);
        bars = BAR_OPTIONS.indexOf(data.bars) !== -1 ? data.bars : 2;
        grid = gridValue(data.grid, 0.25);
        loop = data.loop !== false;
        snap = data.snap !== false;
        metronome = data.metronome === true;
        notes = data.notes.slice(0, MAX_NOTES)
          .filter(n => Array.isArray(n) && Number.isInteger(n[0]) && n[0] >= 0 && n[0] <= 127 && n[1] >= 0 && n[2] > 0)
          .map(n => makeNote(n[0], Number(n[1]), Number(n[2]), typeof n[3] === 'number' ? n[3] : 0.8));
        return;
      }
      // Flytt et mønster fra den gamle stegsequenceren over til piano-rollen
      const old = readJSON(OLD_STORAGE_KEY);
      if (!old || old.v !== 1 || !Array.isArray(old.steps)) return;
      const gates = { '32n': 0.125, '16n': 0.25, '8n': 0.5, '4n': 1 };
      const length = old.length === 8 ? 8 : 16;
      bpm = clampBpm(old.tempo);
      old.steps.slice(0, length).forEach((step, i) => {
        if (!Array.isArray(step)) return;
        step.forEach(n => {
          if (!Array.isArray(n) || !Number.isInteger(n[0])) return;
          let dur = gates[n[2]];
          if (dur == null) { // «Bind»: hold til neste steg med toner
            let d = 1;
            while (d < length && !(old.steps[(i + d) % length] || []).length) d++;
            dur = d * 0.25;
          }
          notes.push(makeNote(n[0], i * 0.25, dur, typeof n[1] === 'number' ? n[1] : 0.8));
        });
      });
      bars = Math.max(1, Math.ceil(length * 0.25 / BEATS_PER_BAR));
      save();
    }

    function makeNote(midi, start, dur, vel) {
      return { id: nextId++, midi: midi, start: Math.max(0, start), dur: Math.max(MIN_DUR, dur), vel: clamp(vel, 0.1, 1) };
    }

    // Finn rutenettverdien som ligger nærmest (tåler avrundede triolverdier fra lagring eller skjema)
    function gridValue(value, fallback) {
      const n = Number(value);
      const match = GRID_OPTIONS.find(g => Math.abs(g - n) < 1e-4);
      return match == null ? fallback : match;
    }

    function clampBpm(value) {
      const n = parseInt(value, 10);
      return Number.isFinite(n) ? clamp(n, 40, 240) : 100;
    }

    // ---------- Angre / gjør om ----------

    function snapshot() {
      return JSON.stringify(notes.map(n => [n.midi, n.start, n.dur, n.vel]));
    }

    function restore(json) {
      notes = JSON.parse(json).map(n => makeNote(n[0], n[1], n[2], n[3]));
    }

    function pushHistory(snap) {
      undoStack.push(snap);
      if (undoStack.length > MAX_HISTORY) undoStack.shift();
      redoStack = [];
    }

    function changed() {
      rebuildPart();
      save();
      opts.onChange();
    }

    // ---------- Avspilling ----------

    function loopBeats() { return bars * BEATS_PER_BAR; }

    function rebuildPart() {
      const ppq = Tone.Transport.PPQ;
      part.clear();
      notes.forEach(n => {
        if (n.start >= loopBeats()) return;
        const end = Math.min(n.start + n.dur, loopBeats());
        part.add(Math.round(n.start * ppq) + 'i', {
          midi: n.midi,
          vel: n.vel,
          durTicks: Math.max(1, Math.round((end - n.start) * ppq))
        });
      });
    }

    function applyTransport() {
      Tone.Transport.bpm.value = bpm;
      Tone.Transport.loop = loop;
      Tone.Transport.loopStart = 0;
      Tone.Transport.loopEnd = bars + 'm';
      if (stopEventId != null) {
        Tone.Transport.clear(stopEventId);
        stopEventId = null;
      }
      if (!loop) {
        // Uten loop stopper vi av oss selv når siste takt er spilt
        stopEventId = Tone.Transport.scheduleOnce(time => {
          // setTimeout i stedet for Tone.Draw, så stoppet skjer også når fanen ikke vises
          setTimeout(stop, Math.max(0, (time - Tone.immediate()) * 1000));
        }, bars + 'm');
      }
    }

    function position() {
      if (!playing) return cursor;
      const ticks = Tone.Transport.getTicksAtTime(Tone.immediate());
      const beats = ticks / Tone.Transport.PPQ;
      return loop ? beats % loopBeats() : Math.min(beats, loopBeats());
    }

    function play() {
      if (playing) return;
      playing = true;
      recordSnapshotTaken = false;
      // Tone.start() må kalles direkte i klikkhendelsen for at lyden skal låses opp på iOS
      engine.start().then(() => {
        if (!playing) return;
        Tone.Transport.stop();
        Tone.Transport.position = 0;
        applyTransport();
        Tone.Transport.start('+0.05');
      });
      opts.onTransport();
    }

    function stop() {
      if (!playing) return;
      const end = position();
      pending.forEach((p, midi) => finishRecorded(midi, end));
      pending.clear();
      playing = false;
      Tone.Transport.stop();
      Tone.Transport.position = 0;
      opts.onTransport();
    }

    // ---------- Opptak ----------

    function snapValue(v) {
      return snap ? Math.round(v / grid) * grid : v;
    }

    function finishRecorded(midi, endBeat) {
      const p = pending.get(midi);
      if (!p) return;
      let dur = endBeat - p.start;
      if (dur <= 0) dur += loopBeats();
      let start = snapValue(p.start);
      if (start >= loopBeats()) start = 0;
      dur = snap ? Math.max(grid, Math.round(dur / grid) * grid) : Math.max(MIN_DUR, dur);
      if (notes.length < MAX_NOTES) notes.push(makeNote(midi, start, Math.min(dur, loopBeats()), p.vel));
      changed();
    }

    function recordNoteOn(midi, vel) {
      if (!recording) return;
      if (playing) {
        if (!recordSnapshotTaken) {
          pushHistory(snapshot());
          recordSnapshotTaken = true;
        }
        pending.set(midi, { start: position(), vel: vel });
        return;
      }
      // Transporten står: noten (eller akkorden) settes inn ved markøren med én rutelengde
      if (!stepGroup) {
        pushHistory(snapshot());
        stepGroup = { start: cursor };
      }
      if (notes.length < MAX_NOTES && !notes.some(n => n.midi === midi && n.start === stepGroup.start)) {
        notes.push(makeNote(midi, stepGroup.start, grid, vel));
        changed();
      }
    }

    function recordNoteOff(midi, allReleased) {
      if (!recording) return;
      if (playing) {
        finishRecorded(midi, position());
        pending.delete(midi);
        return;
      }
      if (stepGroup && allReleased) {
        cursor = (stepGroup.start + grid) % loopBeats();
        stepGroup = null;
        opts.onChange();
      }
    }

    // ---------- MIDI-eksport (Standard MIDI File, type 0) ----------

    function exportMidi() {
      const PPQ = 480;
      const events = [];
      notes.forEach(n => {
        const on = Math.round(n.start * PPQ);
        const off = Math.max(on + 1, Math.round((n.start + n.dur) * PPQ));
        const vel = clamp(Math.round(n.vel * 127), 1, 127);
        events.push({ tick: on, order: 1, data: [0x90, n.midi, vel] });
        events.push({ tick: off, order: 0, data: [0x80, n.midi, 0] });
      });
      events.sort((a, b) => a.tick - b.tick || a.order - b.order);

      const track = [];
      const vlq = value => {
        const bytes = [value & 0x7f];
        while ((value >>= 7)) bytes.unshift((value & 0x7f) | 0x80);
        return bytes;
      };
      const mpqn = Math.round(60000000 / bpm);
      track.push(0, 0xff, 0x51, 0x03, (mpqn >> 16) & 0xff, (mpqn >> 8) & 0xff, mpqn & 0xff);
      track.push(0, 0xff, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08);
      let last = 0;
      events.forEach(ev => {
        track.push(...vlq(ev.tick - last), ...ev.data);
        last = ev.tick;
      });
      track.push(...vlq(Math.max(0, bars * BEATS_PER_BAR * PPQ - last)), 0xff, 0x2f, 0x00);

      const header = [0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, (PPQ >> 8) & 0xff, PPQ & 0xff];
      const len = track.length;
      const trackHeader = [0x4d, 0x54, 0x72, 0x6b, (len >>> 24) & 0xff, (len >> 16) & 0xff, (len >> 8) & 0xff, len & 0xff];
      return new Uint8Array(header.concat(trackHeader, track));
    }

    return {
      // Redigering
      addNote(midi, start, dur, vel) {
        if (notes.length >= MAX_NOTES) return null;
        pushHistory(snapshot());
        const note = makeNote(midi, start, dur, vel == null ? 0.8 : vel);
        notes.push(note);
        changed();
        return note;
      },
      removeNote(id, silent) {
        if (!silent) pushHistory(snapshot());
        notes = notes.filter(n => n.id !== id);
        changed();
      },
      removeNotes(ids) {
        if (!ids.length) return;
        pushHistory(snapshot());
        notes = notes.filter(n => ids.indexOf(n.id) === -1);
        changed();
      },
      // Endringer under dra-operasjoner lagres uten egen historikk; beginEdit/endEdit rammer dem inn
      updateNote(id, patch) {
        this.updateNotes([Object.assign({ id: id }, patch)]);
      },
      updateNotes(patches) {
        patches.forEach(patch => {
          const note = notes.find(n => n.id === patch.id);
          if (!note) return;
          if (patch.midi != null) note.midi = clamp(patch.midi, 0, 127);
          if (patch.start != null) note.start = Math.max(0, patch.start);
          if (patch.dur != null) note.dur = Math.max(MIN_DUR, patch.dur);
          if (patch.vel != null) note.vel = clamp(patch.vel, 0.1, 1);
        });
        changed();
      },
      beginEdit() { editSnapshot = snapshot(); },
      endEdit(didChange) {
        if (didChange && editSnapshot != null && editSnapshot !== snapshot()) pushHistory(editSnapshot);
        editSnapshot = null;
      },
      // Kvantiserer de valgte notene, eller alle hvis ingen er valgt
      quantize(ids) {
        if (!notes.length) return;
        const before = snapshot();
        const target = ids && ids.length ? notes.filter(n => ids.indexOf(n.id) !== -1) : notes;
        target.forEach(n => {
          n.start = Math.round(n.start / grid) * grid;
          n.dur = Math.max(grid, Math.round(n.dur / grid) * grid);
        });
        if (snapshot() !== before) {
          pushHistory(before);
          changed();
        }
      },
      clear() {
        if (!notes.length) return;
        pushHistory(snapshot());
        notes = [];
        changed();
      },
      undo() {
        if (!undoStack.length) return;
        redoStack.push(snapshot());
        restore(undoStack.pop());
        changed();
      },
      redo() {
        if (!redoStack.length) return;
        undoStack.push(snapshot());
        restore(redoStack.pop());
        changed();
      },

      // Transport og innstillinger
      play,
      stop,
      position,
      setBpm(value) {
        bpm = clampBpm(value);
        Tone.Transport.bpm.value = bpm;
        save();
        opts.onChange();
        return bpm;
      },
      setBars(value) {
        bars = BAR_OPTIONS.indexOf(value) !== -1 ? value : bars;
        if (cursor >= loopBeats()) cursor = 0;
        applyTransport();
        changed();
      },
      setGrid(value) {
        grid = gridValue(value, grid);
        save();
        opts.onChange();
      },
      setMetronome(flag) {
        metronome = !!flag;
        save();
        opts.onTransport();
      },
      setLoop(flag) {
        loop = !!flag;
        applyTransport();
        save();
        opts.onTransport();
      },
      setSnap(flag) {
        snap = !!flag;
        save();
        opts.onChange();
      },
      setRecording(flag) {
        recording = !!flag;
        stepGroup = null;
        opts.onTransport();
      },
      setCursor(beat) {
        cursor = clamp(beat, 0, loopBeats() - grid);
        opts.onChange();
      },
      recordNoteOn,
      recordNoteOff,
      exportMidi,

      getNotes: () => notes,
      getState: () => ({
        bpm, bars, grid, loop, snap, metronome, playing, recording, cursor,
        beats: loopBeats(),
        canUndo: undoStack.length > 0,
        canRedo: redoStack.length > 0,
        count: notes.length
      })
    };
  }

  global.CLPianoSequencer = { create, BAR_OPTIONS, GRID_OPTIONS, GRID_LABELS, BEATS_PER_BAR, MIN_DUR };
})(window);
