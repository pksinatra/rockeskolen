(function (global) {
  "use strict";

  const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
  const NATURAL_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

  const CHORD_TYPES = {
    maj:  { label: "Major", intervals: [0, 4, 7], degrees: ["1", "3", "5"] },
    min:  { label: "Minor", intervals: [0, 3, 7], degrees: ["1", "3", "5"] },
    dim:  { label: "Diminished", intervals: [0, 3, 6], degrees: ["1", "3", "5"] },
    aug:  { label: "Augmented", intervals: [0, 4, 8], degrees: ["1", "3", "5"] },
    sus2: { label: "Suspended 2", intervals: [0, 2, 7], degrees: ["1", "2", "5"] },
    sus4: { label: "Suspended 4", intervals: [0, 5, 7], degrees: ["1", "4", "5"] },
    "6":  { label: "Sixth", intervals: [0, 4, 7, 9], degrees: ["1", "3", "5", "6"] },
    min6: { label: "Minor sixth", intervals: [0, 3, 7, 9], degrees: ["1", "3", "5", "6"] },
    "7":  { label: "Dominant seventh", intervals: [0, 4, 7, 10], degrees: ["1", "3", "5", "7"] },
    maj7: { label: "Major seventh", intervals: [0, 4, 7, 11], degrees: ["1", "3", "5", "7"] },
    min7: { label: "Minor seventh", intervals: [0, 3, 7, 10], degrees: ["1", "3", "5", "7"] },
    m7b5: { label: "Half-diminished", intervals: [0, 3, 6, 10], degrees: ["1", "3", "5", "7"] },
    dim7: { label: "Diminished seventh", intervals: [0, 3, 6, 9], degrees: ["1", "3", "5", "7"] },
    add9: { label: "Add nine", intervals: [0, 4, 7, 14], degrees: ["1", "3", "5", "9"] },
    "9":  { label: "Dominant ninth", intervals: [0, 4, 7, 10, 14], degrees: ["1", "3", "5", "7", "9"] },
    maj9: { label: "Major ninth", intervals: [0, 4, 7, 11, 14], degrees: ["1", "3", "5", "7", "9"] },
    min9: { label: "Minor ninth", intervals: [0, 3, 7, 10, 14], degrees: ["1", "3", "5", "7", "9"] },
    "11": { label: "Eleventh", intervals: [0, 4, 7, 10, 14, 17], degrees: ["1", "3", "5", "7", "9", "11"] },
    "13": { label: "Thirteenth", intervals: [0, 4, 7, 10, 14, 17, 21], degrees: ["1", "3", "5", "7", "9", "11", "13"] }
  };

  const INSTRUMENTS = {
    C:  { label: "C instrument (concert pitch)", semitones: 0, letterSteps: 0 },
    Bb: { label: "B♭ instrument", semitones: 2, letterSteps: 1 },
    Eb: { label: "E♭ instrument", semitones: -3, letterSteps: -2 },
    F:  { label: "F instrument", semitones: 7, letterSteps: 4 }
  };

  const DETECTION_CHORDS = {
    maj: [0, 4, 7], min: [0, 3, 7], maj7: [0, 4, 7, 11],
    m7: [0, 3, 7, 10], "7": [0, 4, 7, 10], sus2: [0, 2, 7],
    sus4: [0, 5, 7], add9: [0, 4, 7, 14], "6": [0, 4, 7, 9],
    m9: [0, 3, 7, 10, 14], maj9: [0, 4, 7, 11, 14],
    "9": [0, 4, 7, 10, 14], "maj#11": [0, 4, 7, 11, 18],
    maj7add13: [0, 4, 7, 11, 21], maj9add13: [0, 4, 7, 11, 14, 21],
    maj13: [0, 4, 7, 11, 14, 17, 21], m11: [0, 3, 7, 10, 17],
    m13: [0, 3, 7, 10, 21], "11": [0, 4, 7, 10, 17],
    "13": [0, 4, 7, 10, 21], m7b5: [0, 3, 6, 10]
  };

  function mod(value, base) {
    return ((value % base) + base) % base;
  }

  function accidentalOffset(accidental) {
    let offset = 0;
    for (const char of accidental || "") {
      if (char === "#") offset += 1;
      if (char === "b") offset -= 1;
    }
    return offset;
  }

  function accidentalFor(targetPc, letter) {
    let difference = mod(targetPc - NATURAL_PC[letter], 12);
    if (difference > 6) difference -= 12;
    if (difference === 0) return "";
    if (difference > 0) return "#".repeat(difference);
    return "b".repeat(Math.abs(difference));
  }

  function parsePitch(value) {
    const match = String(value || "").trim().match(/^([A-GHa-gh])([#b]{0,2})(-?\d+)?$/);
    if (!match) return null;
    const enteredLetter = match[1].toUpperCase();
    const letter = enteredLetter === "H" ? "B" : enteredLetter;
    const accidental = match[2] || "";
    const octave = match[3] === undefined ? null : Number(match[3]);
    return {
      letter,
      accidental,
      octave,
      pc: mod(NATURAL_PC[letter] + accidentalOffset(accidental), 12)
    };
  }

  function degreeNumber(degree) {
    return Number(String(degree).match(/\d+/)[0]);
  }

  function spellChord(rootValue, type) {
    const root = parsePitch(rootValue);
    const chord = CHORD_TYPES[type] || CHORD_TYPES.maj;
    if (!root) throw new Error("Invalid root note");
    const rootIndex = LETTERS.indexOf(root.letter);

    return chord.intervals.map((interval, index) => {
      const degree = degreeNumber(chord.degrees[index]);
      const letter = LETTERS[mod(rootIndex + degree - 1, 7)];
      const targetPc = mod(root.pc + interval, 12);
      return letter + accidentalFor(targetPc, letter);
    });
  }

  function transposePitch(pitchValue, instrumentKey) {
    const pitch = typeof pitchValue === "string" ? parsePitch(pitchValue) : pitchValue;
    const instrument = INSTRUMENTS[instrumentKey] || INSTRUMENTS.C;
    if (!pitch) throw new Error("Invalid note");

    const sourceLetterIndex = LETTERS.indexOf(pitch.letter);
    const absoluteSource = pitch.octave === null
      ? pitch.pc
      : (pitch.octave + 1) * 12 + NATURAL_PC[pitch.letter] + accidentalOffset(pitch.accidental);
    const absoluteTarget = absoluteSource + instrument.semitones;
    const targetPc = mod(absoluteTarget, 12);
    const targetLetter = LETTERS[mod(sourceLetterIndex + instrument.letterSteps, 7)];
    const targetOctave = pitch.octave === null ? null : Math.floor(absoluteTarget / 12) - 1;

    return {
      letter: targetLetter,
      accidental: accidentalFor(targetPc, targetLetter),
      octave: targetOctave,
      pc: targetPc
    };
  }

  function pitchName(pitch, includeOctave) {
    return pitch.letter + pitch.accidental +
      (includeOctave && pitch.octave !== null ? pitch.octave : "");
  }

  function parsePitchList(input, defaultOctave) {
    const tokens = String(input || "")
      .replace(/[–—]/g, ",")
      .split(/[\s,;]+/)
      .map((token) => token.trim())
      .filter(Boolean);

    if (!tokens.length) throw new Error("Enter at least one note.");

    return tokens.map((token) => {
      const parsed = parsePitch(token);
      if (!parsed) throw new Error(`Could not understand “${token}”. Use e.g. C4, Eb4, G4.`);
      if (parsed.octave === null) parsed.octave = defaultOctave;
      return parsed;
    });
  }

  function stackChord(noteNames, rootOctave) {
    let previous = -Infinity;
    return noteNames.map((name, index) => {
      const pitch = parsePitch(name);
      let midi = (rootOctave + 1) * 12 + NATURAL_PC[pitch.letter] + accidentalOffset(pitch.accidental);
      if (index === 0) previous = midi - 1;
      while (midi <= previous) midi += 12;
      previous = midi;
      return {
        ...pitch,
        octave: Math.floor(midi / 12) - 1,
        midi
      };
    });
  }

  function withMidi(pitch) {
    return {
      ...pitch,
      midi: (pitch.octave + 1) * 12 + NATURAL_PC[pitch.letter] + accidentalOffset(pitch.accidental)
    };
  }

  function detectedChordLabel(rootPc, quality, preferFlats) {
    const sharpNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const flatNames = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
    const suffixes = {
      maj: "", min: "m", maj7: "maj7", m7: "m7", "7": "7",
      sus2: "sus2", sus4: "sus4", add9: "add9", "6": "6",
      m9: "m9", maj9: "maj9", "9": "9", "maj#11": "maj#11",
      maj13: "maj13", maj7add13: "maj7(add13)",
      maj9add13: "maj9(add13)", m11: "m11", m13: "m13",
      "11": "11", "13": "13", m7b5: "m7♭5"
    };
    return (preferFlats ? flatNames : sharpNames)[rootPc] + (suffixes[quality] || "");
  }

  function detectChords(pitches, preferFlats) {
    if (!Array.isArray(pitches) || pitches.length < 2) return null;
    const pitchClasses = [...new Set(pitches.map((pitch) => mod(pitch.pc, 12)))];
    const bassMidi = Math.min(...pitches.map((pitch) => pitch.midi));
    const bassPc = mod(bassMidi, 12);
    const candidates = [];

    Object.entries(DETECTION_CHORDS).forEach(([quality, intervals]) => {
      for (let rootPc = 0; rootPc < 12; rootPc += 1) {
        const template = [...new Set(intervals.map((interval) => mod(rootPc + interval, 12)))];
        if (template.every((pitchClass) => pitchClasses.includes(pitchClass))) {
          let score = template.length;
          if (rootPc === bassPc) score += 0.6;
          if (quality === "6" && rootPc !== bassPc) score -= 0.6;
          let label = detectedChordLabel(rootPc, quality, preferFlats);
          if (rootPc !== bassPc) {
            label += "/" + detectedChordLabel(bassPc, "maj", preferFlats);
          }
          candidates.push({ rootPc, quality, size: template.length, score, label });
        }
      }
    });

    candidates.sort((a, b) => b.score - a.score);
    return candidates.length
      ? { best: candidates[0], alternatives: candidates.slice(1, 4) }
      : null;
  }

  global.CLNotedMusic = {
    LETTERS,
    NATURAL_PC,
    CHORD_TYPES,
    INSTRUMENTS,
    parsePitch,
    parsePitchList,
    spellChord,
    transposePitch,
    pitchName,
    stackChord,
    withMidi,
    detectChords
  };
})(window);
