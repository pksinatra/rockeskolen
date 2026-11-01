// tools/instruments/piano/piano-roll.js
// Piano-roll-visning: rutenett med tonehøyde (rader) og tid (kolonner), tegnet på canvas.
// Mus: klikk på tom rute legger til, dra for lengde. Klikk på note fjerner, dra flytter, dra i høyre kant endrer varighet.
// Touch (iPad): trykk legger til / fjerner, dra på note flytter, dra på tom flate panorerer.
// Filen deles mellom ChordLink og Rockeskolen – hold kopiene like.
(function (global) {
  'use strict';

  const LOW = 36;  // C2
  const HIGH = 96; // C7
  const ROWS = HIGH - LOW + 1;
  const BLACK = [1, 3, 6, 8, 10];
  const isBlack = midi => BLACK.indexOf(midi % 12) !== -1;
  const C = {
    rowWhite: '#1e1e1e',
    rowBlack: '#171717',
    octave: '#3d3d3d',
    sub: '#262626',
    beat: '#343434',
    bar: '#5f5f5f',
    note: '255, 106, 139',
    noteBorder: '#ffd0db',
    noteText: '#22070e',
    keyWhite: '#e9e9e9',
    keyBlack: '#1b1b1b',
    keyLine: '#9a9a9a',
    keyText: '#555',
    live: '#ff6a8b',
    ruler: '#141414',
    rulerText: '#cfcfcf',
    rulerTick: '#555',
    cursor: '#6fb7ff'
  };

  function create(container, options) {
    const opts = Object.assign({
      sequencer: null,
      noteName: m => String(m),
      onPreview: function () {},
      label: 'Piano roll'
    }, options || {});
    const seq = opts.sequencer;
    const coarse = global.matchMedia && global.matchMedia('(pointer: coarse)').matches;
    const rowH = coarse ? 20 : 15;
    const keysW = coarse ? 52 : 46;
    const rulerH = 24;
    const dpr = Math.min(2, global.devicePixelRatio || 1);
    let beatW = 48;
    let beats = 0;
    let lastDur = null;
    let live = [];
    let drag = null;
    let rafId = 0;

    container.classList.add('pr');
    container.style.setProperty('--pr-keys-w', keysW + 'px');
    container.style.setProperty('--pr-ruler-h', rulerH + 'px');
    container.innerHTML =
      '<div class="pr-corner"></div>' +
      '<div class="pr-ruler-box"><canvas class="pr-ruler"></canvas></div>' +
      '<div class="pr-keys-box"><canvas class="pr-keys"></canvas></div>' +
      '<div class="pr-scroll" tabindex="0">' +
        '<div class="pr-content">' +
          '<canvas class="pr-grid"></canvas>' +
          '<div class="pr-cursor" aria-hidden="true"></div>' +
          '<div class="pr-playhead" aria-hidden="true"></div>' +
        '</div>' +
      '</div>';

    const $ = sel => container.querySelector(sel);
    const scroll = $('.pr-scroll');
    const content = $('.pr-content');
    const gridCv = $('.pr-grid');
    const keysCv = $('.pr-keys');
    const rulerCv = $('.pr-ruler');
    const cursorEl = $('.pr-cursor');
    const playheadEl = $('.pr-playhead');
    scroll.setAttribute('role', 'region');
    scroll.setAttribute('aria-label', opts.label);

    function sizeCanvas(cv, w, h) {
      cv.width = Math.max(1, Math.round(w * dpr));
      cv.height = Math.max(1, Math.round(h * dpr));
      cv.style.width = w + 'px';
      cv.style.height = h + 'px';
      const ctx = cv.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return ctx;
    }

    // ---------- Oppsett og tegning ----------

    let gridCtx, keysCtx, rulerCtx, contentW = 0, contentH = ROWS * rowH;

    function layout() {
      const st = seq.getState();
      beats = st.beats;
      const avail = scroll.clientWidth || 600;
      const minBeat = coarse ? 64 : 44;
      beatW = Math.max(minBeat, Math.floor((avail / beats) * 100) / 100);
      contentW = Math.floor(beatW * beats);
      content.style.width = contentW + 'px';
      content.style.height = contentH + 'px';
      // Et loddrett rullefelt kan dukke opp først når innholdet har fått høyde – regn ut på nytt da
      if (scroll.clientWidth && scroll.clientWidth !== avail && !layout.again) {
        layout.again = true;
        layout();
        layout.again = false;
        return;
      }
      gridCtx = sizeCanvas(gridCv, contentW, contentH);
      keysCtx = sizeCanvas(keysCv, keysW, contentH);
      rulerCtx = sizeCanvas(rulerCv, contentW, rulerH);
      draw();
    }

    function draw() {
      if (!gridCtx) return;
      if (seq.getState().beats !== beats) {
        layout();
        return;
      }
      drawGrid();
      drawKeys();
      drawRuler();
      placeCursor();
    }

    function roundRect(ctx, x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    function drawGrid() {
      const ctx = gridCtx;
      const st = seq.getState();
      ctx.clearRect(0, 0, contentW, contentH);
      for (let midi = HIGH; midi >= LOW; midi--) {
        const y = (HIGH - midi) * rowH;
        ctx.fillStyle = isBlack(midi) ? C.rowBlack : C.rowWhite;
        ctx.fillRect(0, y, contentW, rowH);
        if (midi % 12 === 0) {
          ctx.fillStyle = C.octave;
          ctx.fillRect(0, y + rowH - 1, contentW, 1);
        }
      }
      const step = st.grid;
      for (let i = 0; i * step <= beats + 1e-6; i++) {
        const b = i * step;
        const x = Math.round(b * beatW);
        const isBar = Math.abs(b % 4) < 1e-6;
        const isBeat = Math.abs(b % 1) < 1e-6;
        ctx.fillStyle = isBar ? C.bar : isBeat ? C.beat : C.sub;
        ctx.fillRect(Math.min(x, contentW - 1), 0, isBar ? 2 : 1, contentH);
      }
      ctx.font = '600 10px system-ui, sans-serif';
      ctx.textBaseline = 'middle';
      seq.getNotes().forEach(n => {
        if (n.midi < LOW || n.midi > HIGH) return;
        const x = n.start * beatW;
        const w = Math.max(4, n.dur * beatW - 1);
        const y = (HIGH - n.midi) * rowH + 1;
        const h = rowH - 2;
        const outside = n.start >= beats;
        ctx.globalAlpha = outside ? 0.25 : 1;
        ctx.fillStyle = 'rgba(' + C.note + ',' + (0.45 + 0.55 * n.vel).toFixed(2) + ')';
        roundRect(ctx, x + 0.5, y, w, h, 3);
        ctx.fill();
        ctx.lineWidth = drag && drag.id === n.id ? 2 : 1;
        ctx.strokeStyle = drag && drag.id === n.id ? '#ffffff' : C.noteBorder;
        ctx.stroke();
        if (w > 30 && h >= 12) {
          ctx.fillStyle = C.noteText;
          ctx.fillText(opts.noteName(n.midi), x + 5, y + h / 2 + 0.5);
        }
        ctx.globalAlpha = 1;
      });
    }

    function drawKeys() {
      const ctx = keysCtx;
      ctx.clearRect(0, 0, keysW, contentH);
      ctx.fillStyle = C.keyWhite;
      ctx.fillRect(0, 0, keysW, contentH);
      ctx.font = '600 10px system-ui, sans-serif';
      ctx.textBaseline = 'middle';
      for (let midi = HIGH; midi >= LOW; midi--) {
        const y = (HIGH - midi) * rowH;
        const active = live.indexOf(midi) !== -1;
        if (isBlack(midi)) {
          ctx.fillStyle = active ? C.live : C.keyBlack;
          ctx.fillRect(0, y + 1, keysW * 0.6, rowH - 2);
        } else {
          if (active) {
            ctx.fillStyle = C.live;
            ctx.fillRect(0, y, keysW, rowH);
          }
          const next = midi + 1;
          if (next % 12 === 5 || next % 12 === 0) { // linje mellom E–F og B–C
            ctx.fillStyle = C.keyLine;
            ctx.fillRect(0, y, keysW, 1);
          }
        }
        if (midi % 12 === 0) {
          ctx.fillStyle = C.keyText;
          ctx.textAlign = 'right';
          ctx.fillText(opts.noteName(midi), keysW - 4, y + rowH / 2);
          ctx.textAlign = 'left';
        }
      }
      ctx.fillStyle = C.keyLine;
      ctx.fillRect(keysW - 1, 0, 1, contentH);
    }

    function drawRuler() {
      const ctx = rulerCtx;
      const st = seq.getState();
      ctx.clearRect(0, 0, contentW, rulerH);
      ctx.fillStyle = C.ruler;
      ctx.fillRect(0, 0, contentW, rulerH);
      ctx.font = '600 11px system-ui, sans-serif';
      ctx.textBaseline = 'middle';
      for (let b = 0; b < beats; b++) {
        const x = Math.round(b * beatW);
        const isBar = b % 4 === 0;
        ctx.fillStyle = isBar ? C.rulerText : C.rulerTick;
        ctx.fillRect(x, isBar ? 0 : rulerH - 7, isBar ? 2 : 1, isBar ? rulerH : 7);
        if (isBar) {
          ctx.fillStyle = C.rulerText;
          ctx.fillText(String(b / 4 + 1), x + 5, rulerH / 2 - 2);
        }
      }
      if (!st.playing) {
        const x = st.cursor * beatW;
        ctx.fillStyle = C.cursor;
        ctx.beginPath();
        ctx.moveTo(x - 6, rulerH - 8);
        ctx.lineTo(x + 6, rulerH - 8);
        ctx.lineTo(x, rulerH);
        ctx.closePath();
        ctx.fill();
      }
    }

    function placeCursor() {
      const st = seq.getState();
      cursorEl.style.transform = 'translateX(' + Math.round(st.cursor * beatW) + 'px)';
      cursorEl.hidden = st.playing || !st.recording;
    }

    // Linjal og tangentkolonne følger rutenettets rulling
    scroll.addEventListener('scroll', () => {
      rulerCv.style.transform = 'translateX(' + -scroll.scrollLeft + 'px)';
      keysCv.style.transform = 'translateY(' + -scroll.scrollTop + 'px)';
    });

    // ---------- Treff og koordinater ----------

    function point(e) {
      const rect = gridCv.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      return {
        x: x,
        y: y,
        beat: Math.max(0, Math.min(beats, x / beatW)),
        midi: Math.max(LOW, Math.min(HIGH, HIGH - Math.floor(y / rowH)))
      };
    }

    function noteAt(x, y) {
      const list = seq.getNotes();
      for (let i = list.length - 1; i >= 0; i--) {
        const n = list[i];
        const nx = n.start * beatW;
        const nw = Math.max(4, n.dur * beatW);
        const ny = (HIGH - n.midi) * rowH;
        if (x >= nx && x <= nx + nw && y >= ny && y <= ny + rowH) {
          const edgeW = Math.min(coarse ? 16 : 8, nw * 0.4);
          return { note: n, edge: x >= nx + nw - edgeW };
        }
      }
      return null;
    }

    function findNote(id) {
      return seq.getNotes().find(n => n.id === id);
    }

    function snapFloor(b, st) { return st.snap ? Math.floor(b / st.grid + 1e-6) * st.grid : b; }
    function snapRound(b, st) { return st.snap ? Math.round(b / st.grid) * st.grid : b; }

    function addAt(p) {
      const st = seq.getState();
      const start = snapFloor(p.beat, st);
      if (start >= st.beats) return null;
      const dur = Math.min(lastDur || st.grid, st.beats - start);
      const note = seq.addNote(p.midi, start, dur, 0.8);
      if (note) opts.onPreview(p.midi);
      return note;
    }

    // ---------- Peker (mus, touch, penn) ----------

    gridCv.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault();
      scroll.focus({ preventScroll: true });
      try { gridCv.setPointerCapture(e.pointerId); } catch (err) { /* ignorer */ }
      const p = point(e);
      const hit = noteAt(p.x, p.y);
      const base = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, dragged: false };
      if (hit) {
        seq.beginEdit();
        drag = Object.assign(base, { mode: hit.edge ? 'resize' : 'move', id: hit.note.id, offset: p.beat - hit.note.start, midi: hit.note.midi });
        opts.onPreview(hit.note.midi);
      } else if (e.pointerType === 'mouse') {
        const note = addAt(p);
        if (note) drag = Object.assign(base, { mode: 'create', id: note.id });
      } else {
        drag = Object.assign(base, { mode: 'tap', scrollL: scroll.scrollLeft, scrollT: scroll.scrollTop, p: p });
      }
      draw();
    });

    gridCv.addEventListener('pointermove', e => {
      if (!drag) {
        if (e.pointerType === 'mouse') {
          const p = point(e);
          const hit = noteAt(p.x, p.y);
          gridCv.style.cursor = hit ? (hit.edge ? 'ew-resize' : 'grab') : 'crosshair';
        }
        return;
      }
      if (e.pointerId !== drag.pointerId) return;
      const dist = Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY);
      if (dist > 6) drag.dragged = true;
      const st = seq.getState();
      const p = point(e);
      if (drag.mode === 'tap' && dist > 8) drag.mode = 'pan';
      if (drag.mode === 'pan') {
        scroll.scrollLeft = drag.scrollL - (e.clientX - drag.startX);
        scroll.scrollTop = drag.scrollT - (e.clientY - drag.startY);
        return;
      }
      const note = drag.id != null ? findNote(drag.id) : null;
      if (!note) return;
      if (drag.mode === 'move') {
        if (!drag.dragged) return;
        gridCv.style.cursor = 'grabbing';
        const maxStart = Math.max(0, st.beats - note.dur);
        const start = Math.max(0, Math.min(maxStart, snapRound(p.beat - drag.offset, st)));
        if (start !== note.start || p.midi !== note.midi) {
          if (p.midi !== drag.midi) {
            drag.midi = p.midi;
            opts.onPreview(p.midi);
          }
          seq.updateNote(note.id, { start: start, midi: p.midi });
        }
      } else if (drag.mode === 'resize' || drag.mode === 'create') {
        const minDur = st.snap ? st.grid : global.CLPianoSequencer.MIN_DUR;
        const end = snapRound(p.beat, st);
        const dur = Math.max(minDur, Math.min(st.beats - note.start, end - note.start));
        if (Math.abs(dur - note.dur) > 1e-6) {
          seq.updateNote(note.id, { dur: dur });
          drag.dragged = true;
        }
      }
    });

    function endDrag(e, cancelled) {
      if (!drag || (e && e.pointerId !== drag.pointerId)) return;
      const d = drag;
      drag = null;
      const note = d.id != null ? findNote(d.id) : null;
      if (d.mode === 'move' || d.mode === 'resize') {
        if (!d.dragged && !cancelled && note) {
          // Klikk eller trykk uten å dra fjerner noten
          seq.removeNote(note.id, true);
        } else if (d.mode === 'resize' && note) {
          lastDur = note.dur;
        }
        seq.endEdit(true);
      } else if (d.mode === 'create') {
        if (d.dragged && note) lastDur = note.dur;
      } else if (d.mode === 'tap' && !cancelled) {
        addAt(d.p);
      }
      gridCv.style.cursor = '';
      draw();
    }
    gridCv.addEventListener('pointerup', e => endDrag(e, false));
    gridCv.addEventListener('pointercancel', e => endDrag(e, true));
    gridCv.addEventListener('contextmenu', e => e.preventDefault());

    // Tangentkolonnen spiller tonen; linjalen flytter innspillingsmarkøren
    keysCv.addEventListener('pointerdown', e => {
      e.preventDefault();
      const rect = keysCv.getBoundingClientRect();
      const midi = Math.max(LOW, Math.min(HIGH, HIGH - Math.floor((e.clientY - rect.top) / rowH)));
      opts.onPreview(midi);
    });
    rulerCv.addEventListener('pointerdown', e => {
      e.preventDefault();
      const rect = rulerCv.getBoundingClientRect();
      const st = seq.getState();
      seq.setCursor(snapFloor(Math.max(0, (e.clientX - rect.left) / beatW), st));
    });

    // ---------- Spillehode ----------

    function tick() {
      const st = seq.getState();
      if (!st.playing) {
        playheadEl.hidden = true;
        rafId = 0;
        return;
      }
      const x = seq.position() * beatW;
      playheadEl.hidden = false;
      playheadEl.style.transform = 'translateX(' + Math.round(x) + 'px)';
      const view = scroll.clientWidth;
      if (x < scroll.scrollLeft || x > scroll.scrollLeft + view - 24) scroll.scrollLeft = Math.max(0, x - 24);
      rafId = global.requestAnimationFrame(tick);
    }

    function scrollToNotes() {
      const list = seq.getNotes().filter(n => n.midi >= LOW && n.midi <= HIGH);
      const center = list.length ? list.reduce((s, n) => s + n.midi, 0) / list.length : 60;
      scroll.scrollTop = Math.max(0, (HIGH - center) * rowH - scroll.clientHeight / 2);
    }

    if (global.ResizeObserver) {
      let lastW = 0;
      new ResizeObserver(() => {
        if (scroll.clientWidth !== lastW) {
          lastW = scroll.clientWidth;
          layout();
        }
      }).observe(scroll);
    }

    playheadEl.hidden = true;
    layout();
    scrollToNotes();

    return {
      draw,
      layout,
      scrollToNotes,
      setLive(midis) {
        live = midis || [];
        if (keysCtx) drawKeys();
      },
      transportChanged() {
        draw();
        if (seq.getState().playing && !rafId) rafId = global.requestAnimationFrame(tick);
      }
    };
  }

  global.CLPianoRoll = { create, LOW, HIGH };
})(window);
