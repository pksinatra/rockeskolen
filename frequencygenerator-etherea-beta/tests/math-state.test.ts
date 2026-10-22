import { describe, it, expect } from "vitest";
import {
  binauralFrequencies,
  freqToSlider,
  sliderToFreq,
  noteFromFrequency,
  safeFrequency,
  numeric,
} from "../src/music/math";
import {
  defaults,
  normalize,
  serialize,
  deserialize,
  fromUrl,
  toUrl,
} from "../src/state/model";
describe("frequency math", () => {
  it("maps endpoints and round-trips logarithmic and linear positions", () => {
    for (const mode of ["log", "linear"]) {
      expect(sliderToFreq(0, 20, 20000, mode)).toBe(20);
      expect(sliderToFreq(1000, 20, 20000, mode)).toBe(20000);
      for (const f of [20, 55, 432, 440, 12345, 20000])
        expect(
          sliderToFreq(freqToSlider(f, 20, 20000, mode), 20, 20000, mode),
        ).toBeCloseTo(f, 8);
    }
  });
  it("uses international B and computes cents around custom concert pitch", () => {
    expect(noteFromFrequency(440)).toEqual({ note: "A4", cents: 0 });
    expect(noteFromFrequency(493.883301).note).toBe("B4");
    expect(noteFromFrequency(466.163762).note).toBe("B♭4");
    expect(noteFromFrequency(442, 442).cents).toBe(0);
    expect(noteFromFrequency(440 * 2 ** (25 / 1200)).cents).toBeCloseTo(25, 8);
  });
  it("respects 20 kHz and low sample-rate Nyquist limits", () => {
    expect(safeFrequency(24000, 44100)).toBe(20000);
    expect(safeFrequency(20000, 32000)).toBe(15680);
    expect(safeFrequency(-1)).toBe(20);
    expect(safeFrequency(NaN)).toBe(440);
  });
  it("preserves binaural beat spacing while shifting boundary carriers", () => {
    expect(binauralFrequencies(200, 10, "symmetric")).toEqual({
      left: 195,
      right: 205,
    });
    expect(binauralFrequencies(200, 10, "left")).toEqual({
      left: 200,
      right: 210,
    });
    expect(binauralFrequencies(200, 10, "right")).toEqual({
      left: 190,
      right: 200,
    });
    for (const c of [20, 20000])
      for (const mode of ["left", "right", "symmetric"]) {
        const f = binauralFrequencies(c, 100, mode, 32000);
        expect(f.left).toBeGreaterThanOrEqual(20);
        expect(f.right).toBeLessThan(16000);
        expect(f.right - f.left).toBe(100);
      }
  });
  it("accepts decimal commas and rejects non-finite data", () => {
    expect(numeric("440,5", 440)).toBe(440.5);
    expect(numeric("Infinity", 440)).toBe(440);
    expect(numeric(null, 0.2)).toBe(0.2);
  });
});
describe("complete validated share state", () => {
  it("round-trips every mode and control without starting audio", () => {
    for (const mode of [
      "tone",
      "multi",
      "sweep",
      "binaural",
      "noise",
      "presets",
    ] as const) {
      const s = defaults();
      s.mode = mode;
      s.volume = 0.13;
      s.pan = -0.4;
      s.tone = {
        frequency: 523.123456,
        wave: "triangle",
        tuning: 442,
        precision: 3,
        sliderMode: "linear",
        range: "200,2000",
      };
      s.multi[1].solo = true;
      s.multi[2].mute = true;
      s.sweep = {
        start: 40,
        end: 4000,
        duration: 4,
        curve: "linear",
        motion: "pingpong",
        wave: "sawtooth",
        loop: true,
      };
      s.binaural = { carrier: 345, beat: 7.5, mode: "right", wave: "square" };
      s.noise = "pink";
      expect(deserialize(serialize(s))).toEqual(s);
      expect(
        fromUrl(toUrl("https://chordlink.net/beta/frequencygenerator/", s)),
      ).toEqual(s);
    }
  });
  it("defaults volume to 30 percent but preserves explicit zero", () => {
    expect(fromUrl("https://example.com").volume).toBe(0.3);
    expect(fromUrl("https://example.com?vol=0").volume).toBe(0);
  });
  it("handles corrupt data and bounds hostile input", () => {
    expect(deserialize("{")).toEqual(defaults());
    const s = normalize({
      volume: 20,
      tone: { frequency: 1e100, wave: "invalid" },
      multi: Array(20).fill({ f: 24000, vol: 999 }),
      sweep: { duration: -4 },
      noise: "invalid",
    });
    expect(s.volume).toBe(1);
    expect(s.tone.frequency).toBe(20000);
    expect(s.tone.wave).toBe("sine");
    expect(s.multi).toHaveLength(8);
    expect(s.multi[0].vol).toBe(1);
    expect(s.sweep.duration).toBe(0.1);
    expect(s.noise).toBe("white");
  });
});
