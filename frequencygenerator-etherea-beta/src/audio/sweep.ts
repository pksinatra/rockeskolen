import { Graph, Voice } from "./graph";
import type { AppState } from "../state/model";
export class SweepEngine {
  voice: Voice;
  timer: number | undefined;
  began = 0;
  start = 20;
  end = 20000;
  stopped = false;
  constructor(
    readonly graph: Graph,
    public settings: AppState["sweep"],
    readonly done: () => void,
  ) {
    this.voice = new Voice(graph, settings.start, settings.wave, 0.75);
    this.cycle();
  }
  cycle() {
    if (this.stopped) return;
    const s = this.settings,
      c = this.graph.ctx;
    this.start = this.graph.frequency(s.motion === "down" ? s.end : s.start);
    this.end = this.graph.frequency(s.motion === "down" ? s.start : s.end);
    this.began = c.currentTime;
    const p = this.voice.osc.frequency;
    p.cancelScheduledValues(this.began);
    p.setValueAtTime(this.start, this.began);
    const go = (f: number, t: number) =>
      s.curve === "linear"
        ? p.linearRampToValueAtTime(f, t)
        : p.exponentialRampToValueAtTime(f, t);
    go(this.end, this.began + s.duration);
    if (s.motion === "pingpong") go(this.start, this.began + s.duration * 2);
    this.timer = window.setTimeout(
      () => {
        if (s.loop) {
          this.voice.stop();
          this.voice = new Voice(this.graph, this.start, s.wave, 0.75);
          this.cycle();
        } else this.done();
      },
      1000 * s.duration * (s.motion === "pingpong" ? 2 : 1),
    );
  }
  value() {
    const s = this.settings;
    let t = (this.graph.ctx.currentTime - this.began) / s.duration;
    if (s.motion === "pingpong" && t > 1) t = 2 - t;
    t = Math.max(0, Math.min(1, t));
    return s.curve === "linear"
      ? this.start + (this.end - this.start) * t
      : this.start * (this.end / this.start) ** t;
  }
  stop() {
    this.stopped = true;
    clearTimeout(this.timer);
    this.voice.stop();
  }
}
