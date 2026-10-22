import { it, expect } from "vitest";
import { defaults, normalize, fromUrl, toUrl } from "../src/state/model";
import {
  toneOnly,
  toneUrl,
  freeState,
  advancedLink,
} from "../src/access/state";
it("only missing volumes fall back to 30% digital amplitude", () => {
  expect(defaults().volume).toBe(0.3);
  expect(normalize({}).volume).toBe(0.3);
  for (const volume of [0, 0.2, 0.37, 1]) {
    const s = normalize({ volume });
    expect(s.volume).toBe(volume);
    expect(
      fromUrl(toUrl("https://chordlink.net/tools/frequencygenerator/", s))
        .volume,
    ).toBe(volume);
    expect(
      fromUrl(
        `https://chordlink.net/tools/frequencygenerator/?vol=${volume * 100}`,
      ).volume,
    ).toBe(volume);
  }
});
it("free restriction preserves all tone/global values without mutating saved state", () => {
  const s = defaults();
  s.volume = 0;
  s.pan = 0.4;
  s.multi[0].mute = true;
  s.sweep.loop = true;
  s.sweep.motion = "pingpong";
  const f = freeState(s);
  expect(f.multi.length).toBe(2);
  expect(f.multi[0].mute).toBe(true);
  expect(f.sweep.loop).toBe(false);
  expect(f.sweep.motion).toBe("up");
  expect(s.multi.length).toBe(3);
  expect(s.sweep.loop).toBe(true);
  expect(f.volume).toBe(0);
});
it("free Tone sharing contains no advanced settings and restores Tone exactly", () => {
  const s = defaults();
  s.tone = {
    frequency: 432.1234,
    wave: "sawtooth",
    tuning: 432,
    precision: 3,
    sliderMode: "linear",
    range: "20,2000",
  };
  s.volume = 0;
  s.pan = -0.3;
  s.mode = "tone";
  s.noise = "brown";
  const u = toneUrl("https://chordlink.net/tools/frequencygenerator/", s);
  expect(new URL(u).searchParams.has("state")).toBe(false);
  const restored = fromUrl(u);
  expect(restored.tone).toEqual(s.tone);
  expect(restored.volume).toBe(0);
  expect(restored.pan).toBe(-0.3);
  expect(restored.noise).toBe("white");
});
it("old f URLs and Tone-only JSON links remain usable without advanced authorization", () => {
  expect(
    fromUrl("https://example.com?f=432&wave=square&vol=20").tone.frequency,
  ).toBe(432);
  const s = defaults();
  expect(advancedLink(toUrl("https://example.com", s))).toBe(false);
  s.mode = "multi";
  expect(advancedLink(toUrl("https://example.com", s))).toBe(true);
  expect(toneOnly(s).mode).toBe("tone");
});
