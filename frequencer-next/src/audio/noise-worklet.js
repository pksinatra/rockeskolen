class ProceduralNoise extends AudioWorkletProcessor {
  constructor() {
    super();
    this.kind = "white";
    this.running = true;
    this.filters = [new Float64Array(8), new Float64Array(8)];
    this.port.onmessage = (e) => {
      if (e.data === "stop") this.running = false;
      else this.kind = e.data;
    };
  }
  process(inputs, outputs) {
    if (!this.running) return false;
    outputs[0].forEach((out, ch) => {
      const b = this.filters[ch];
      for (let i = 0; i < out.length; i++) {
        const w = Math.random() * 2 - 1;
        let y;
        if (this.kind === "brown") {
          b[7] = (b[7] + 0.02 * w) / 1.02;
          y = b[7] * 2.8;
        } else if (this.kind === "pink") {
          b[0] = 0.99886 * b[0] + w * 0.0555179;
          b[1] = 0.99332 * b[1] + w * 0.0750759;
          b[2] = 0.969 * b[2] + w * 0.153852;
          b[3] = 0.8665 * b[3] + w * 0.3104856;
          b[4] = 0.55 * b[4] + w * 0.5329522;
          b[5] = -0.7616 * b[5] - w * 0.016898;
          y =
            (b[0] + b[1] + b[2] + b[3] + b[4] + b[5] + b[6] + w * 0.5362) *
            0.11;
          b[6] = w * 0.115926;
        } else y = w * 0.45;
        out[i] = Math.max(-1, Math.min(1, y));
      }
    });
    return true;
  }
}
registerProcessor("procedural-noise", ProceduralNoise);
