/* Standard MIDI format 0, 480 ticks per beat. */
  function createMidiFile(timeline,tempo) {
    const ppq = 480;
    const events = [];
    const microseconds = Math.round(60000000/tempo);
    events.push({tick:0,order:0,data:[0xFF,0x51,0x03,(microseconds>>16)&255,(microseconds>>8)&255,microseconds&255]});
    events.push({tick:0,order:1,data:[0xC0,0x00]});
    timeline.forEach(event => {
      const start = Math.round(event.startBeat*ppq);
      const end = Math.round((event.startBeat+event.durationBeats)*ppq);
      event.notes.forEach(note => {
        events.push({tick:start,order:2,data:[0x90,Math.max(0,Math.min(127,Math.round(note))),88]});
        events.push({tick:end,order:1,data:[0x80,Math.max(0,Math.min(127,Math.round(note))),0]});
      });
    });
    events.sort((a,b)=>a.tick-b.tick || a.order-b.order);
    const track = [];
    let lastTick = 0;
    events.forEach(event => {
      track.push(...vlq(event.tick-lastTick),...event.data);
      lastTick = event.tick;
    });
    track.push(0x00,0xFF,0x2F,0x00);
    return [
      ...ascii('MThd'),0,0,0,6,0,0,0,1,(ppq>>8)&255,ppq&255,
      ...ascii('MTrk'),...uint32(track.length),...track
    ];
  }

  function vlq(value) {
    let buffer = value & 0x7F;
    const bytes = [];
    while ((value >>= 7)) { buffer <<= 8; buffer |= ((value & 0x7F)|0x80); }
    while (true) {
      bytes.push(buffer&0xFF);
      if (buffer&0x80) buffer >>= 8; else break;
    }
    return bytes;
  }

  function ascii(text) { return Array.from(text).map(ch=>ch.charCodeAt(0)); }
  function uint32(n) { return [(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255]; }


