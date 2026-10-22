import { ramp } from "./graph";
import type { Color } from "../state/exploration";
/** Optional Tone-only processing; bypass preserves the reference oscillator.
 * Binaural never enters this graph, preserving its left/right separation. */
export class ToneColor {
  readonly input: GainNode;
  readonly output: GainNode;
  private dry: GainNode;
  private wet: GainNode;
  private filter: BiquadFilterNode;
  private shelf: BiquadFilterNode;
  private delay: DelayNode;
  private feedback: GainNode;
  private echo: GainNode;
  private reverb: GainNode;
  private pulse: GainNode;
  private lfo: OscillatorNode;
  private depth: GainNode;
  private nodes: AudioNode[];
  constructor(
    private ctx: AudioContext,
    destination: AudioNode,
    color: Color,
  ) {
    const c = ctx;
    this.input = c.createGain();
    this.output = c.createGain();
    this.dry = c.createGain();
    this.wet = c.createGain();
    this.filter = c.createBiquadFilter();
    this.filter.type = "lowpass";
    this.shelf = c.createBiquadFilter();
    this.shelf.type = "highshelf";
    this.shelf.frequency.value = 1800;
    this.delay = c.createDelay(2);
    this.feedback = c.createGain();
    this.echo = c.createGain();
    this.reverb = c.createGain();
    this.pulse = c.createGain();
    this.lfo = c.createOscillator();
    this.depth = c.createGain();
    const convolver = c.createConvolver();
    const impulse = c.createBuffer(
      2,
      Math.floor(c.sampleRate * 2.5),
      c.sampleRate,
    );
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < data.length; i++)
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 4);
    }
    convolver.buffer = impulse;
    this.input.connect(this.dry).connect(this.output);
    this.input.connect(this.filter).connect(this.shelf).connect(this.pulse);
    this.shelf.connect(this.delay).connect(this.feedback).connect(this.delay);
    this.delay.connect(this.echo).connect(this.pulse);
    this.shelf.connect(convolver).connect(this.reverb).connect(this.pulse);
    this.lfo.connect(this.depth).connect(this.pulse.gain);
    this.pulse.connect(this.wet).connect(this.output).connect(destination);
    this.dry.gain.value = color.enabled ? 0 : 1;
    this.wet.gain.value = color.enabled ? 1 : 0;
    this.echo.gain.value = 0;
    this.reverb.gain.value = 0;
    this.depth.gain.value = 0;
    this.nodes = [
      this.input,
      this.output,
      this.dry,
      this.wet,
      this.filter,
      this.shelf,
      this.delay,
      this.feedback,
      this.echo,
      this.reverb,
      this.pulse,
      this.lfo,
      this.depth,
      convolver,
    ];
    this.update(color);
    this.lfo.start();
  }
  update(s: Color) {
    const c = this.ctx;
    ramp(this.dry.gain, s.enabled ? 0 : 1, c);
    ramp(this.wet.gain, s.enabled ? 1 : 0, c);
    ramp(
      this.filter.frequency,
      Math.min(
        c.sampleRate * 0.45,
        850 + s.brightness * 5200 + (1 - s.warmth) * 2200,
      ),
      c,
    );
    ramp(this.filter.Q, 0.62 + s.warmth * 0.7, c);
    ramp(this.shelf.gain, -5 + s.brightness * 10, c);
    ramp(this.delay.delayTime, 0.28 + (1 - s.brightness) * 0.38, c, 0.08);
    ramp(this.feedback.gain, 0.08 + s.echo * 0.42, c);
    ramp(this.echo.gain, s.echo * 0.5, c);
    ramp(this.reverb.gain, s.space * 0.5, c);
    // Modulation ranges from 1-depth to 1: it never boosts the dry level.
    ramp(this.pulse.gain, 1 - s.pulse / 2, c);
    ramp(this.depth.gain, s.pulse / 2, c);
    ramp(this.lfo.frequency, s.pulseRate, c);
  }
  stop() {
    ramp(this.output.gain, 0, this.ctx, 0.03);
    this.lfo.stop(this.ctx.currentTime + 0.04);
    setTimeout(() => this.nodes.forEach((n) => n.disconnect()), 70);
  }
}
