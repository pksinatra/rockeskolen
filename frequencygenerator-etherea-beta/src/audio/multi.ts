import { Graph, Voice } from "./graph";
import type { Osc } from "../state/model";
export class MultiEngine {
  readonly voices = new Map<string, Voice>();
  constructor(
    readonly graph: Graph,
    rows: Osc[],
  ) {
    this.update(rows);
  }
  update(rows: Osc[]) {
    const solo = rows.some((r) => r.solo),
      scale =
        1 /
        Math.max(
          1,
          rows.reduce((sum, r) => sum + r.vol, 0),
        );
    for (const [id, v] of this.voices)
      if (!rows.some((r) => r.id === id)) {
        v.stop();
        this.voices.delete(id);
      }
    for (const r of rows) {
      const gain = r.mute || (solo && !r.solo) ? 0 : r.vol * scale;
      const v = this.voices.get(r.id);
      if (v) v.update(r.f, r.wave, gain, r.pan);
      else
        this.voices.set(r.id, new Voice(this.graph, r.f, r.wave, gain, r.pan));
    }
  }
  stop() {
    this.voices.forEach((v) => v.stop());
    this.voices.clear();
  }
}
