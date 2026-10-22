import { Graph, ramp } from "./graph";
import type { AppState } from "../state/model";
export class NoiseEngine {
  node: AudioWorkletNode;
  gain: GainNode;
  private revision = 0;
  private stopped = false;
  private kind: AppState["noise"];
  static async prepare(g: Graph) {
    if (!g.ctx.audioWorklet)
      throw new Error(
        "Procedural noise requires AudioWorklet on HTTPS or localhost.",
      );
    await g.ctx.audioWorklet.addModule(
      new URL("./noise-worklet.js", import.meta.url),
    );
  }
  constructor(
    readonly graph: Graph,
    kind: AppState["noise"],
  ) {
    this.kind = kind;
    this.node = new AudioWorkletNode(graph.ctx, "procedural-noise", {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [2],
    });
    this.gain = graph.ctx.createGain();
    this.gain.gain.value = 0;
    this.node.connect(this.gain).connect(graph.input);
    this.node.port.postMessage(kind);
    ramp(this.gain.gain, 0.65, graph.ctx);
  }
  update(kind: AppState["noise"]) {
    if (kind === this.kind) return;
    this.kind = kind;
    const revision = ++this.revision;
    ramp(this.gain.gain, 0, this.graph.ctx, 0.02);
    setTimeout(() => {
      if (!this.stopped && revision === this.revision) {
        this.node.port.postMessage(kind);
        ramp(this.gain.gain, 0.65, this.graph.ctx);
      }
    }, 25);
  }
  stop() {
    this.stopped = true;
    ramp(this.gain.gain, 0, this.graph.ctx, 0.03);
    setTimeout(() => {
      this.node.port.postMessage("stop");
      this.node.disconnect();
      this.gain.disconnect();
      this.node.port.close();
    }, 50);
  }
}
