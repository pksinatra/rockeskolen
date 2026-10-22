(function(global){
  "use strict";
  let instrument = "C";
  let current = null;

  function draw(){
    const target = document.getElementById("melodyNotation");
    if(!target || !current) return;
    const M = global.CLNotedMusic;
    const VF = global.Vex?.Flow;
    target.innerHTML = "";
    if(!M || !VF){
      target.textContent = "Notation could not load. The scale notes above are still available.";
      return;
    }
    try{
      let previousMidi = -Infinity;
      const sounding = [...current.notes, current.notes[0]].map(name=>{
        const pitch = M.parsePitch(name.replaceAll("♯","#").replaceAll("♭","b"));
        let midi = (instrument === "Eb" || instrument === "F" ? 48 : 60) + pitch.pc;
        while(midi <= previousMidi) midi += 12;
        previousMidi = midi;
        // Keep the spelled letter's octave correct at enharmonic boundaries.
        const natural = M.NATURAL_PC[pitch.letter];
        const offset = [...pitch.accidental].reduce((n,a)=>n+(a==="#"?1:-1),0);
        pitch.octave = Math.round((midi-natural-offset)/12)-1;
        return pitch;
      });
      const written = sounding.map(p=>{
        const result = M.transposePitch(p,instrument);
        // Alto sax is written a major sixth above sounding pitch.
        // Noted's shared E-flat helper returns the same pitch class below.
        const offset = accidentals=>[...accidentals].reduce((n,a)=>n+(a==="#"?1:-1),0);
        const midi = (p.octave+1)*12 + M.NATURAL_PC[p.letter] + offset(p.accidental)
          + M.INSTRUMENTS[instrument].semitones + (instrument === "Eb" ? 12 : 0);
        result.octave = Math.round((midi-M.NATURAL_PC[result.letter]-offset(result.accidental))/12)-1;
        return result;
      });
      const width = Math.max(430, target.parentElement.clientWidth-24, written.length*52+75);
      const renderer = new VF.Renderer(target,VF.Renderer.Backends.SVG);
      renderer.resize(width,180);
      const context = renderer.getContext();
      const stave = new VF.Stave(8,24,width-16).addClef("treble");
      stave.setContext(context).draw();
      const accidentalState = new Map();
      const notes = written.map(p=>{
        const note = new VF.StaveNote({clef:"treble",keys:[p.letter.toLowerCase()+"/"+p.octave],duration:"q",auto_stem:true});
        if(p.accidental) note.addModifier(new VF.Accidental(p.accidental),0);
        else if(accidentalState.get(p.letter+"/"+p.octave)) note.addModifier(new VF.Accidental("n"),0);
        accidentalState.set(p.letter+"/"+p.octave,p.accidental);
        return note;
      });
      const voice = new VF.Voice({num_beats:notes.length,beat_value:4}).setStrict(false).addTickables(notes);
      new VF.Formatter().joinVoices([voice]).format([voice],width-95);
      voice.draw(context,stave);
      const displayName = p=>M.pitchName(p,false).replaceAll("#","♯").replaceAll("b","♭");
      document.getElementById("melodyWrittenNotes").textContent =
        "Written notes: " + written.slice(0,-1).map(displayName).join(" · ");
      document.getElementById("melodyTranspositionHelp").textContent = instrument === "C"
        ? "Concert pitch. Accidentals are shown on each note."
        : "Written for " + M.INSTRUMENTS[instrument].label + ". The progression and playback stay in concert pitch.";
    }catch(error){
      target.textContent = "Notation is unavailable for this scale. Use the note names above.";
      console.error("Scale notation",error);
    }
  }

  global.CLScaleNotation = {
    render(notes){
      current = {notes};
      const select = document.getElementById("melodyInstrument");
      select.value = instrument;
      select.onchange = ()=>{ instrument = select.value; draw(); };
      draw();
    }
  };
})(window);
