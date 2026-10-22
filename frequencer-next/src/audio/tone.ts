import { Graph, Voice } from "./graph";
import { ToneColor } from "./color";
import type { AppState } from "../state/model";
import { colorDefaults } from "../state/exploration";
import type { Color } from "../state/exploration";
export class ToneEngine {
  voice: Voice;
  private harmonic: Voice;
  private shimmer: Voice;
  private color: ToneColor;
  constructor(
    private g: Graph,
    s: AppState["tone"],
    color: Color = colorDefaults(),
  ) {
    this.color = new ToneColor(g.ctx, g.input, color);
    this.voice = new Voice(g, s.frequency, s.wave, 1, 0, this.color.input);
    this.harmonic = new Voice(
      g,
      s.frequency * color.harmonicRatio,
      s.wave,
      0,
      0,
      this.color.input,
    );
    this.shimmer = new Voice(
      g,
      s.frequency * 2,
      "sine",
      0,
      0,
      this.color.input,
    );
    this.update(s, color);
  }
  update(s: AppState["tone"], color: Color) {
    const harmonic = color.enabled ? color.harmonicMix : 0,
      shimmer = color.enabled ? color.shimmer * 0.3 : 0;
    const scale = 1 / (1 + harmonic + shimmer);
    const level = (ratio: number, amount: number) =>
      s.frequency * ratio <= this.g.frequency(20000) ? amount * scale : 0;
    this.voice.update(s.frequency, s.wave, scale);
    this.harmonic.update(
      s.frequency * color.harmonicRatio,
      s.wave,
      level(color.harmonicRatio, harmonic),
    );
    this.shimmer.update(s.frequency * 2, "sine", level(2, shimmer));
    this.color.update(color);
  }
  stop() {
    this.voice.stop();
    this.harmonic.stop();
    this.shimmer.stop();
    this.color.stop();
  }
}
