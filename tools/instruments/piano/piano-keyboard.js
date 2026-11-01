// tools/instruments/piano/piano-keyboard.js
// Klaviatur for Playable Piano: tegning, mus/touch/multitouch, datatastatur og fokusnavigering.
// Filen deles mellom ChordLink og Rockeskolen – hold kopiene like.
(function (global) {
  'use strict';

  const SHARP_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  const FLAT_NAMES  = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
  const BLACK_PCS = [1, 3, 6, 8, 10];
  const LOWEST_C = 24;   // C1
  const HIGHEST_C = 108; // C8

  // Fysiske taster (KeyboardEvent.code), så oppsettet virker uavhengig av tastaturspråk
  const LOWER_ROW = ['KeyZ', 'KeyS', 'KeyX', 'KeyD', 'KeyC', 'KeyV', 'KeyG', 'KeyB', 'KeyH', 'KeyN', 'KeyJ', 'KeyM', 'Comma'];
  const UPPER_ROW = ['KeyQ', 'Digit2', 'KeyW', 'Digit3', 'KeyE', 'KeyR', 'Digit5', 'KeyT', 'Digit6', 'KeyY', 'Digit7', 'KeyU', 'KeyI', 'Digit9', 'KeyO', 'Digit0', 'KeyP'];

  const isBlack = midi => BLACK_PCS.indexOf(midi % 12) !== -1;

  function create(container, options) {
    const opts = Object.assign({
      octaves: 'auto',
      labels: 'c',
      preferFlats: false,
      onNoteOn: function () {},
      onNoteOff: function () {},
      onRangeChange: function () {}
    }, options || {});

    const sources = new Map();  // midi -> Set av kilder (pointer, tast, MIDI ...)
    const pointers = new Map(); // pointerId -> midi | null
    const codes = new Map();    // KeyboardEvent.code -> midi som ble startet
    let octaveSetting = opts.octaves;
    let octaves = 4;
    let shift = 0;
    let lowC = 48;
    let focusMidi = 60;
    let marked = [];

    container.classList.add('pk-keyboard');
    container.setAttribute('role', 'group');

    function noteName(midi, withOctave) {
      const names = opts.preferFlats ? FLAT_NAMES : SHARP_NAMES;
      const name = names[midi % 12];
      return withOctave === false ? name : name + (Math.floor(midi / 12) - 1);
    }

    function ariaName(midi) {
      const octave = Math.floor(midi / 12) - 1;
      if (!isBlack(midi)) return SHARP_NAMES[midi % 12] + octave;
      return SHARP_NAMES[midi % 12] + octave + ' / ' + FLAT_NAMES[midi % 12] + octave;
    }

    function autoOctaves() {
      const width = container.clientWidth || 800;
      const coarse = global.matchMedia && global.matchMedia('(pointer: coarse)').matches;
      const minWhite = coarse ? 34 : 24;
      return Math.max(1, Math.min(4, Math.floor(width / (7 * minWhite))));
    }

    function computeRange() {
      octaves = octaveSetting === 'auto' ? autoOctaves() : octaveSetting;
      const base = 60 - 12 * Math.floor((octaves - 1) / 2);
      const maxLow = HIGHEST_C - 12 * octaves;
      lowC = Math.max(LOWEST_C, Math.min(maxLow, base + shift * 12));
      shift = (lowC - base) / 12;
    }

    function keyEl(midi) {
      return container.querySelector('.pk-key[data-midi="' + midi + '"]');
    }

    function render() {
      computeRange();
      const high = lowC + octaves * 12;
      const whites = [];
      for (let m = lowC; m <= high; m++) if (!isBlack(m)) whites.push(m);
      const whiteW = 100 / whites.length;
      const blackW = whiteW * 0.62;

      container.textContent = '';
      let whiteIndex = 0;
      for (let midi = lowC; midi <= high; midi++) {
        const black = isBlack(midi);
        const el = document.createElement('div');
        el.className = 'pk-key ' + (black ? 'pk-black' : 'pk-white');
        el.dataset.midi = midi;
        el.setAttribute('role', 'button');
        el.setAttribute('aria-label', ariaName(midi));
        el.tabIndex = -1;
        if (black) {
          el.style.left = (whiteIndex * whiteW - blackW / 2) + '%';
          el.style.width = blackW + '%';
        } else {
          el.style.left = (whiteIndex * whiteW) + '%';
          el.style.width = whiteW + '%';
          whiteIndex++;
        }
        const showLabel = opts.labels === 'all' || (opts.labels === 'c' && midi % 12 === 0);
        if (showLabel) {
          const label = document.createElement('span');
          label.className = 'pk-label';
          label.setAttribute('aria-hidden', 'true');
          label.textContent = opts.labels === 'c' || !black ? noteName(midi) : noteName(midi, false);
          el.appendChild(label);
        }
        if (sources.has(midi)) el.classList.add('is-active');
        if (marked.indexOf(midi) !== -1) el.classList.add('is-marked');
        container.appendChild(el);
      }

      if (focusMidi < lowC || focusMidi > high) focusMidi = Math.min(high, Math.max(lowC, lowC + 12));
      const focusEl = keyEl(focusMidi);
      if (focusEl) focusEl.tabIndex = 0;
      opts.onRangeChange({ low: lowC, high: high, octaves: octaves });
    }

    // ---------- Trykk og slipp (felles for alle kilder) ----------

    function press(midi, source, velocity) {
      let set = sources.get(midi);
      if (!set) {
        set = new Set();
        sources.set(midi, set);
      }
      if (set.has(source)) return;
      set.add(source);
      if (set.size === 1) {
        const el = keyEl(midi);
        if (el) el.classList.add('is-active');
        opts.onNoteOn(midi, velocity == null ? 0.9 : velocity, source);
      }
    }

    function release(midi, source) {
      const set = sources.get(midi);
      if (!set || !set.delete(source)) return;
      if (set.size) return;
      sources.delete(midi);
      const el = keyEl(midi);
      if (el) el.classList.remove('is-active');
      opts.onNoteOff(midi, source);
    }

    function allOff() {
      Array.from(sources.keys()).forEach(midi => {
        Array.from(sources.get(midi)).forEach(src => release(midi, src));
      });
      pointers.clear();
      codes.clear();
    }

    // ---------- Mus, touch og penn (Pointer Events) ----------

    function keyAt(x, y) {
      const el = document.elementFromPoint(x, y);
      const key = el && el.closest('.pk-key');
      return key && container.contains(key) ? key : null;
    }

    function velocityAt(key, y) {
      const rect = key.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (y - rect.top) / (rect.height || 1)));
      return 0.6 + 0.4 * ratio; // lenger ned på tangenten = kraftigere anslag
    }

    container.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const key = e.target.closest('.pk-key');
      if (!key) return;
      e.preventDefault();
      try { container.setPointerCapture(e.pointerId); } catch (err) { /* ignorer */ }
      const midi = Number(key.dataset.midi);
      pointers.set(e.pointerId, midi);
      press(midi, 'p' + e.pointerId, velocityAt(key, e.clientY));
    });

    container.addEventListener('pointermove', e => {
      if (!pointers.has(e.pointerId)) return;
      const key = keyAt(e.clientX, e.clientY);
      const midi = key ? Number(key.dataset.midi) : null;
      const prev = pointers.get(e.pointerId);
      if (midi === prev) return;
      if (prev != null) release(prev, 'p' + e.pointerId);
      pointers.set(e.pointerId, midi);
      if (midi != null) press(midi, 'p' + e.pointerId, velocityAt(key, e.clientY));
    });

    function pointerEnd(e) {
      if (!pointers.has(e.pointerId)) return;
      const midi = pointers.get(e.pointerId);
      pointers.delete(e.pointerId);
      if (midi != null) release(midi, 'p' + e.pointerId);
    }
    container.addEventListener('pointerup', pointerEnd);
    container.addEventListener('pointercancel', pointerEnd);
    container.addEventListener('lostpointercapture', pointerEnd);
    container.addEventListener('contextmenu', e => e.preventDefault());

    // ---------- Fokus og piltaster på selve klaviaturet ----------

    function moveFocus(midi) {
      const high = lowC + octaves * 12;
      midi = Math.max(lowC, Math.min(high, midi));
      const prev = keyEl(focusMidi);
      if (prev) prev.tabIndex = -1;
      focusMidi = midi;
      const el = keyEl(midi);
      if (el) {
        el.tabIndex = 0;
        el.focus();
      }
    }

    container.addEventListener('keydown', e => {
      const key = e.target.closest && e.target.closest('.pk-key');
      if (!key) return;
      const midi = Number(key.dataset.midi);
      switch (e.key) {
        case 'ArrowLeft': moveFocus(midi - 1); break;
        case 'ArrowRight': moveFocus(midi + 1); break;
        case 'ArrowDown': moveFocus(midi - 12); break;
        case 'ArrowUp': moveFocus(midi + 12); break;
        case 'Home': moveFocus(lowC); break;
        case 'End': moveFocus(lowC + octaves * 12); break;
        case ' ':
        case 'Enter':
          if (!e.repeat) press(midi, 'f', 0.85);
          break;
        default: return;
      }
      e.preventDefault();
      e.stopPropagation();
    });

    container.addEventListener('keyup', e => {
      if (e.key !== ' ' && e.key !== 'Enter') return;
      const key = e.target.closest && e.target.closest('.pk-key');
      if (key) release(Number(key.dataset.midi), 'f');
    });

    container.addEventListener('focusout', e => {
      const key = e.target.closest && e.target.closest('.pk-key');
      if (key) release(Number(key.dataset.midi), 'f');
    });

    // ---------- Datatastatur (Z–M og Q–P) ----------

    function codeToMidi(code) {
      let i = LOWER_ROW.indexOf(code);
      if (i !== -1) return lowC + i;
      i = UPPER_ROW.indexOf(code);
      if (i !== -1) return lowC + 12 + i;
      return null;
    }

    function typingTarget(el) {
      if (!el || !el.closest) return false;
      return !!el.closest('input, select, textarea, [contenteditable=""], [contenteditable="true"]');
    }

    document.addEventListener('keydown', e => {
      if (e.ctrlKey || e.metaKey || e.altKey || typingTarget(e.target)) return;
      const midi = codeToMidi(e.code);
      if (midi == null) return;
      e.preventDefault();
      if (e.repeat || codes.has(e.code)) return;
      codes.set(e.code, midi);
      press(midi, 'k' + e.code, 0.85);
    });

    document.addEventListener('keyup', e => {
      if (!codes.has(e.code)) return;
      const midi = codes.get(e.code);
      codes.delete(e.code);
      release(midi, 'k' + e.code);
    });

    global.addEventListener('blur', allOff);
    document.addEventListener('visibilitychange', () => { if (document.hidden) allOff(); });

    if (global.ResizeObserver) {
      let lastAuto = null;
      new ResizeObserver(() => {
        if (octaveSetting !== 'auto') return;
        const next = autoOctaves();
        if (next !== lastAuto) {
          lastAuto = next;
          render();
        }
      }).observe(container);
    }

    render();

    return {
      press,
      release,
      allOff,
      noteName,
      render,
      setOctaves(value) {
        octaveSetting = value === 'auto' ? 'auto' : Math.max(1, Math.min(4, parseInt(value, 10) || 4));
        render();
      },
      shiftOctave(delta) {
        shift += delta;
        render();
      },
      setLabels(mode) {
        opts.labels = mode;
        render();
      },
      setPreferFlats(flag) {
        opts.preferFlats = !!flag;
        render();
      },
      mark(midis) {
        marked = (midis || []).slice();
        container.querySelectorAll('.pk-key').forEach(el => {
          el.classList.toggle('is-marked', marked.indexOf(Number(el.dataset.midi)) !== -1);
        });
      },
      heldNotes: () => Array.from(sources.keys()).sort((a, b) => a - b),
      getRange: () => ({ low: lowC, high: lowC + octaves * 12, octaves: octaves }),
      canShift(delta) {
        const next = lowC + delta * 12;
        return next >= LOWEST_C && next + octaves * 12 <= HIGHEST_C;
      }
    };
  }

  global.CLPianoKeyboard = { create, SHARP_NAMES, FLAT_NAMES };
})(window);
