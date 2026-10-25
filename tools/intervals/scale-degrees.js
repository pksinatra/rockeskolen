(function () {
  'use strict';

  const majorOffsets = [0, 2, 4, 5, 7, 9, 11];
  const degrees = [
    { number: 1, roman: 'I', interval: 'P1' },
    { number: 2, roman: 'II', interval: 'M2' },
    { number: 3, roman: 'III', interval: 'M3' },
    { number: 4, roman: 'IV', interval: 'P4' },
    { number: 5, roman: 'V', interval: 'P5' },
    { number: 6, roman: 'VI', interval: 'M6' },
    { number: 7, roman: 'VII', interval: 'M7' }
  ].map((degree, index) => ({ ...degree, semitones: majorOffsets[index] }));

  // One practical conventional spelling for every chromatic tonic pitch class.
  const majorKeys = [
    { id: 'C', pitchClass: 0, notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'] },
    { id: 'Db', pitchClass: 1, notes: ['D♭', 'E♭', 'F', 'G♭', 'A♭', 'B♭', 'C'] },
    { id: 'D', pitchClass: 2, notes: ['D', 'E', 'F♯', 'G', 'A', 'B', 'C♯'] },
    { id: 'Eb', pitchClass: 3, notes: ['E♭', 'F', 'G', 'A♭', 'B♭', 'C', 'D'] },
    { id: 'E', pitchClass: 4, notes: ['E', 'F♯', 'G♯', 'A', 'B', 'C♯', 'D♯'] },
    { id: 'F', pitchClass: 5, notes: ['F', 'G', 'A', 'B♭', 'C', 'D', 'E'] },
    { id: 'F#', pitchClass: 6, notes: ['F♯', 'G♯', 'A♯', 'B', 'C♯', 'D♯', 'E♯'] },
    { id: 'G', pitchClass: 7, notes: ['G', 'A', 'B', 'C', 'D', 'E', 'F♯'] },
    { id: 'Ab', pitchClass: 8, notes: ['A♭', 'B♭', 'C', 'D♭', 'E♭', 'F', 'G'] },
    { id: 'A', pitchClass: 9, notes: ['A', 'B', 'C♯', 'D', 'E', 'F♯', 'G♯'] },
    { id: 'Bb', pitchClass: 10, notes: ['B♭', 'C', 'D', 'E♭', 'F', 'G', 'A'] },
    { id: 'B', pitchClass: 11, notes: ['B', 'C♯', 'D♯', 'E', 'F♯', 'G♯', 'A♯'] }
  ];

  function keyById(id) {
    return majorKeys.find(key => key.id === id) || majorKeys[0];
  }

  function tonicMidi(key) {
    return 48 + key.pitchClass;
  }

  function degreeMidi(key, degreeNumber) {
    return tonicMidi(key) + majorOffsets[Math.max(1, Math.min(7, degreeNumber)) - 1];
  }

  function scalePath(key, degreeNumber) {
    return majorOffsets.slice(0, Math.max(1, Math.min(7, degreeNumber))).map(offset => tonicMidi(key) + offset);
  }

  function fullScale(key) {
    const tonic = tonicMidi(key);
    return [...majorOffsets, 12].map(offset => tonic + offset);
  }

  function tonalContext(key) {
    const tonic = tonicMidi(key);
    // A concise tonic arpeggio establishes the key without sounding like a
    // reference melody or outlining the scale towards the answer.
    return [0, 4, 7, 12].map(offset => tonic + offset);
  }

  window.ChordLinkScaleDegrees = { majorOffsets, degrees, majorKeys, keyById, tonicMidi, degreeMidi, scalePath, fullScale, tonalContext };
})();
