(function () {
  'use strict';

  const qualities = {
    major: { formula: [0, 4, 7], suffix: '', family: 'triad' },
    minor: { formula: [0, 3, 7], suffix: 'm', family: 'triad' },
    diminished: { formula: [0, 3, 6], suffix: 'dim', family: 'triad' },
    sus2: { formula: [0, 2, 7], suffix: 'sus2', family: 'suspended' },
    sus4: { formula: [0, 5, 7], suffix: 'sus4', family: 'suspended' },
    add9: { formula: [0, 4, 7, 14], suffix: 'add9', family: 'extended' },
    major7: { formula: [0, 4, 7, 11], suffix: 'maj7', family: 'seventh' },
    minor7: { formula: [0, 3, 7, 10], suffix: 'm7', family: 'seventh' },
    dominant7: { formula: [0, 4, 7, 10], suffix: '7', family: 'seventh' }
  };

  const diatonicTriads = ['major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished'];
  const diatonicSevenths = ['major7', 'minor7', 'minor7', 'major7', 'dominant7', 'minor7', 'diminished'];
  const relationshipNames = {
    0: 'root', 1: 'minorSecond', 2: 'majorSecond', 3: 'minorThird', 4: 'majorThird', 5: 'perfectFourth',
    6: 'tritone', 7: 'perfectFifth', 8: 'minorSixth', 9: 'majorSixth', 10: 'minorSeventh', 11: 'majorSeventh'
  };

  function mod12(value) { return ((value % 12) + 12) % 12; }
  function rootOffset(scale, degreeNumber) { return scale.majorOffsets[degreeNumber - 1]; }
  function chordPitchClasses(scale, key, rootDegree, qualityId) {
    const root = scale.tonicMidi(key) + rootOffset(scale, rootDegree);
    return qualities[qualityId].formula.map(offset => mod12(root + offset));
  }
  function isChordTone(scale, key, melodyDegree, rootDegree, qualityId) {
    const melody = scale.degreeMidi(key, melodyDegree);
    return chordPitchClasses(scale, key, rootDegree, qualityId).includes(mod12(melody));
  }
  function relationship(scale, key, melodyDegree, rootDegree) {
    const melody = scale.degreeMidi(key, melodyDegree);
    const root = scale.tonicMidi(key) + rootOffset(scale, rootDegree);
    const semitones = mod12(melody - root);
    return { semitones, nameKey: relationshipNames[semitones] };
  }
  function isDiatonic(scale, key, rootDegree, qualityId) {
    const scalePitchClasses = scale.majorOffsets.map(offset => mod12(scale.tonicMidi(key) + offset));
    return chordPitchClasses(scale, key, rootDegree, qualityId).every(pitchClass => scalePitchClasses.includes(pitchClass));
  }
  function isDiatonicFromRoot(scale, key, rootMidi, qualityId) {
    const scalePitchClasses = scale.majorOffsets.map(offset => mod12(scale.tonicMidi(key) + offset));
    return chordPitchClassesFromRoot(rootMidi, qualityId).every(pitchClass => scalePitchClasses.includes(pitchClass));
  }
  function chordSymbol(scale, key, rootDegree, qualityId) { return `${key.notes[rootDegree - 1]}${qualities[qualityId].suffix}`; }
  function chordMidi(scale, key, rootDegree, qualityId, inversion = 0) {
    const root = 48 + mod12(scale.tonicMidi(key) + rootOffset(scale, rootDegree));
    const notes = qualities[qualityId].formula.map(offset => root + offset);
    const turns = Math.max(0, Math.min(notes.length - 1, inversion));
    for (let index = 0; index < turns; index++) notes[index] += 12;
    notes.forEach((note, index) => { while (notes[index] > 72) notes[index] -= 12; });
    return notes.sort((a, b) => a - b);
  }
  function chordMidiFromRoot(rootMidi, qualityId, inversion = 0) {
    const root = 48 + mod12(rootMidi);
    const notes = qualities[qualityId].formula.map(offset => root + offset);
    const turns = Math.max(0, Math.min(notes.length - 1, inversion));
    for (let index = 0; index < turns; index++) notes[index] += 12;
    notes.forEach((note, index) => { while (notes[index] > 72) notes[index] -= 12; });
    return notes.sort((a, b) => a - b);
  }
  function chordPitchClassesFromRoot(rootMidi, qualityId) {
    return qualities[qualityId].formula.map(offset => mod12(rootMidi + offset));
  }
  function isChordToneFromRoot(melodyMidi, rootMidi, qualityId) {
    return chordPitchClassesFromRoot(rootMidi, qualityId).includes(mod12(melodyMidi));
  }
  function relationshipFromRoot(melodyMidi, rootMidi) {
    const semitones = mod12(melodyMidi - rootMidi);
    return { semitones, nameKey: relationshipNames[semitones] };
  }
  function chordSymbolFromRoot(rootName, qualityId) { return `${rootName}${qualities[qualityId].suffix}`; }
  function validateExample(scale, key, melodyDegree, rootDegree, qualityId, inversion = 0) {
    if (!scale || !key || !qualities[qualityId]) return false;
    if (melodyDegree < 1 || melodyDegree > 7 || rootDegree < 1 || rootDegree > 7) return false;
    const chord = chordMidi(scale, key, rootDegree, qualityId, inversion);
    return chord.every(Number.isFinite) && Number.isFinite(scale.degreeMidi(key, melodyDegree));
  }

  window.ChordLinkHarmonicContext = { qualities, diatonicTriads, diatonicSevenths, mod12, chordPitchClasses, isChordTone, relationship, isDiatonic, isDiatonicFromRoot, chordSymbol, chordMidi, chordMidiFromRoot, chordPitchClassesFromRoot, isChordToneFromRoot, relationshipFromRoot, chordSymbolFromRoot, validateExample };
})();
