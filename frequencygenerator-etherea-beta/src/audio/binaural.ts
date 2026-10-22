import { Graph, Voice } from "./graph";
import { binauralFrequencies } from "../music/math";
import type { AppState } from "../state/model";
export class BinauralEngine {
  voices: Voice[];
  constructor(
    readonly graph: Graph,
    s: AppState["binaural"],
  ) {
    const f = binauralFrequencies(
      s.carrier,
      s.beat,
      s.mode,
      graph.ctx.sampleRate,
    );
    this.voices = [
      new Voice(graph, f.left, s.wave, 0.65, -1),
      new Voice(graph, f.right, s.wave, 0.65, 1),
    ];
  }
  update(s: AppState["binaural"]) {
    const f = binauralFrequencies(
      s.carrier,
      s.beat,
      s.mode,
      this.graph.ctx.sampleRate,
    );
    this.voices[0].update(f.left, s.wave, 0.65, -1);
    this.voices[1].update(f.right, s.wave, 0.65, 1);
  }
  stop() {
    this.voices.forEach((v) => v.stop());
  }
}
