import { sessionPosition } from "./session";
import { ramp } from "./graph";
import { Graph } from "./graph";
import { ToneEngine } from "./tone";
import { MultiEngine } from "./multi";
import { BinauralEngine } from "./binaural";
import { SweepEngine } from "./sweep";
import { NoiseEngine } from "./noise";
import type { AppState, Mode } from "../state/model";
export class AudioController {
  graph?: Graph;
  engine?:
    ToneEngine | MultiEngine | BinauralEngine | SweepEngine | NoiseEngine;
  mode?: Mode;
  private request = 0;
  private sessionTimer?: ReturnType<typeof setInterval>;
  private fadeTimer?: ReturnType<typeof setTimeout>;
  private fading = false;
  progress: { remaining: number | null; step: number } = {
    remaining: null,
    step: -1,
  };
  onProgress = () => {};
  onStep = (_frequency: number) => {};
  fadeOut(seconds = 3) {
    if (!this.graph || !this.mode || this.fading) return;
    this.fading = true;
    clearInterval(this.sessionTimer);
    ramp(this.graph.sessionGain.gain, 0, this.graph.ctx, seconds);
    this.fadeTimer = setTimeout(() => this.stop(), seconds * 1000);
  }
  private startSession(s: AppState) {
    const config = structuredClone(s.session),
      sequence =
        s.mode === "tone" && config.sequence && config.steps.length > 0;
    const started = performance.now();
    let last = -1;
    const tick = () => {
      const p = sessionPosition(
        config,
        (performance.now() - started) / 1000,
        sequence,
      );
      this.progress = p;
      if (p.done) {
        this.stop();
        return;
      }
      if (sequence && p.step !== last) {
        last = p.step;
        this.onStep(config.steps[p.step]);
      }
      this.onProgress();
    };
    const end = sessionPosition(config, 0, sequence).remaining;
    if (end !== null && this.graph) {
      const now = this.graph.ctx.currentTime,
        fade = Math.min(config.fade, end);
      this.graph.sessionGain.gain.setValueAtTime(1, now + end - fade);
      this.graph.sessionGain.gain.linearRampToValueAtTime(0, now + end);
    }
    tick();
    this.sessionTimer = setInterval(tick, 100);
  }
  private noiseReady?: Promise<void>;
  constructor(readonly changed: () => void) {}
  stop() {
    this.request++;
    clearInterval(this.sessionTimer);
    clearTimeout(this.fadeTimer);
    this.fading = false;
    this.progress = { remaining: null, step: -1 };
    this.onProgress();
    this.engine?.stop();
    this.engine = undefined;
    this.mode = undefined;
    this.changed();
  }
  async toggle(s: AppState) {
    if (this.mode === s.mode) return this.stop();
    this.stop();
    if (s.mode === "presets") return;
    const token = ++this.request;
    try {
      this.graph ??= new Graph(new AudioContext(), s.volume);
      const g = this.graph;
      await g.ctx.resume();
      if (token !== this.request) return;
      if (g.ctx.state !== "running")
        throw new Error("Audio could not start. Please press Play again.");
      g.setMaster(s.volume, s.pan);
      g.sessionGain.gain.cancelScheduledValues(g.ctx.currentTime);
      g.sessionGain.gain.setValueAtTime(1, g.ctx.currentTime);
      if (s.mode === "noise") {
        this.noiseReady ??= NoiseEngine.prepare(g).catch((e) => {
          this.noiseReady = undefined;
          throw e;
        });
        await this.noiseReady;
        if (token !== this.request) return;
      }
      this.mode = s.mode;
      this.engine =
        s.mode === "tone"
          ? new ToneEngine(g, s.tone, s.color)
          : s.mode === "multi"
            ? new MultiEngine(g, s.multi)
            : s.mode === "binaural"
              ? new BinauralEngine(g, s.binaural)
              : s.mode === "sweep"
                ? new SweepEngine(g, { ...s.sweep }, () => this.stop())
                : new NoiseEngine(g, s.noise);
      this.startSession(s);
      this.changed();
    } catch (e) {
      if (token === this.request) this.stop();
      throw e;
    }
  }
  update(s: AppState) {
    this.graph?.setMaster(s.volume, s.pan);
    if (this.engine instanceof ToneEngine) this.engine.update(s.tone, s.color);
    if (this.engine instanceof MultiEngine) this.engine.update(s.multi);
    if (this.engine instanceof BinauralEngine) this.engine.update(s.binaural);
    if (this.engine instanceof NoiseEngine) this.engine.update(s.noise);
  }
}
