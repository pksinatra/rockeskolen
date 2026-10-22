import { safeFrequency } from "../music/math";
import type { Wave } from "../state/model";
export function ramp(
  p: AudioParam,
  target: number,
  ctx: BaseAudioContext,
  seconds = 0.035,
) {
  const now = ctx.currentTime;
  if (typeof p.cancelAndHoldAtTime === "function") p.cancelAndHoldAtTime(now);
  else {
    const value = p.value;
    p.cancelScheduledValues(now);
    p.setValueAtTime(value, now);
  }
  p.linearRampToValueAtTime(target, now + seconds);
}
export class Graph {
  readonly input: GainNode;
  readonly volume: GainNode;
  readonly sessionGain: GainNode;
  readonly balance: GainNode[];
  readonly analyser: AnalyserNode;
  constructor(
    readonly ctx: AudioContext,
    initialVolume = 0.3,
  ) {
    this.input = ctx.createGain();
    this.volume = ctx.createGain();
    this.sessionGain = ctx.createGain();
    this.volume.gain.value = initialVolume;
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -6;
    compressor.knee.value = 6;
    compressor.ratio.value = 20;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.15;
    // A channel-wise ceiling follows the compressor, including its attack transient.
    const ceiling = ctx.createWaveShaper(),
      curve = new Float32Array(65537);
    for (let i = 0; i < curve.length; i++) {
      const x = (i / (curve.length - 1)) * 2 - 1;
      curve[i] = Math.max(-0.95, Math.min(0.95, x));
    }
    ceiling.curve = curve;
    const split = ctx.createChannelSplitter(2),
      merge = ctx.createChannelMerger(2);
    this.balance = [ctx.createGain(), ctx.createGain()];
    this.input.channelCount = 2;
    this.input.channelCountMode = "explicit";
    this.input
      .connect(this.sessionGain)
      .connect(this.volume)
      .connect(compressor)
      .connect(ceiling)
      .connect(split);
    this.balance.forEach((g, i) => {
      split.connect(g, i);
      g.connect(merge, 0, i);
    });
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    merge.connect(this.analyser).connect(ctx.destination);
  }
  setMaster(volume: number, pan: number) {
    ramp(this.volume.gain, volume, this.ctx);
    ramp(this.balance[0].gain, pan > 0 ? 1 - pan : 1, this.ctx);
    ramp(this.balance[1].gain, pan < 0 ? 1 + pan : 1, this.ctx);
  }
  frequency(f: number) {
    return safeFrequency(f, this.ctx.sampleRate);
  }
}
export class Voice {
  readonly osc: OscillatorNode;
  readonly gain: GainNode;
  readonly pan: StereoPannerNode;
  private stopped = false;
  private revision = 0;
  constructor(
    readonly graph: Graph,
    f: number,
    wave: Wave,
    level: number,
    pan = 0,
    destination: AudioNode = graph.input,
  ) {
    const c = graph.ctx;
    this.osc = c.createOscillator();
    this.gain = c.createGain();
    this.pan = c.createStereoPanner();
    this.osc.frequency.value = graph.frequency(f);
    this.osc.type = wave;
    this.pan.pan.value = pan;
    this.gain.gain.value = 0;
    this.osc.connect(this.gain).connect(this.pan).connect(destination);
    this.osc.start();
    ramp(this.gain.gain, level, c);
    this.osc.onended = () => {
      this.osc.disconnect();
      this.gain.disconnect();
      this.pan.disconnect();
    };
  }
  update(f: number, wave: Wave, level: number, pan = 0) {
    const revision = ++this.revision;
    const c = this.graph.ctx;
    ramp(this.osc.frequency, this.graph.frequency(f), c);
    ramp(this.gain.gain, level, c);
    ramp(this.pan.pan, pan, c);
    if (this.osc.type !== wave) {
      ramp(this.gain.gain, 0, c, 0.015);
      setTimeout(() => {
        if (!this.stopped && revision === this.revision) {
          this.osc.type = wave;
          ramp(this.gain.gain, level, c);
        }
      }, 20);
    }
  }
  stop() {
    if (this.stopped) return;
    this.stopped = true;
    ramp(this.gain.gain, 0, this.graph.ctx, 0.03);
    this.osc.stop(this.graph.ctx.currentTime + 0.04);
  }
}
