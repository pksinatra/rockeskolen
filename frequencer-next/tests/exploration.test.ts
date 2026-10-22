import { it, expect } from "vitest";
import {
  defaults,
  normalize,
  serialize,
  deserialize,
  fromUrl,
} from "../src/state/model";
import { sessionPosition } from "../src/audio/session";
import { normalizeColor, normalizeSession } from "../src/state/exploration";
it("legacy states default to neutral Tone and no session; explicit zero stays silent", () => {
  const s = fromUrl("https://example.org/?f=432&vol=0");
  expect(s.color.enabled).toBe(false);
  expect(s.session.seconds).toBe(0);
  expect(s.volume).toBe(0);
});
it("new controls survive complete serialization", () => {
  const s = defaults();
  s.color.enabled = true;
  s.color.echo = 0.4;
  s.color.harmonicRatio = 1.5;
  s.session.sequence = true;
  s.session.steps = [220, 330];
  s.session.seconds = 60;
  expect(deserialize(serialize(s))).toEqual(s);
});
it("invalid effect and session inputs stay bounded", () => {
  const c = normalizeColor({
    echo: 999,
    pulse: -3,
    pulseRate: Infinity,
    harmonicRatio: 999,
  });
  expect(c.echo).toBe(1);
  expect(c.pulse).toBe(0);
  expect(c.pulseRate).toBe(0.1);
  expect(c.harmonicRatio).toBe(2);
  const s = normalizeSession({
    steps: Array(100).fill(99999),
    stepSeconds: 0,
    seconds: -4,
    fade: 999,
  });
  expect(s.steps).toHaveLength(64);
  expect(s.steps[0]).toBe(20000);
  expect(s.stepSeconds).toBe(0.5);
  expect(s.seconds).toBe(0);
  expect(s.fade).toBe(30);
  expect(normalize({ session: { steps: [] } }).session.steps).toEqual([]);
});
it("sequence progress uses elapsed time, obeys loop and timer precedence", () => {
  const s = defaults().session;
  s.sequence = true;
  s.steps = [220, 330, 440];
  s.stepSeconds = 2;
  expect(sessionPosition(s, 4.5, true)).toEqual({
    step: 2,
    remaining: 1.5,
    done: false,
  });
  expect(sessionPosition(s, 6, true).done).toBe(true);
  s.loop = true;
  expect(sessionPosition(s, 8.2, true)).toEqual({
    step: 1,
    remaining: null,
    done: false,
  });
  s.seconds = 5;
  expect(sessionPosition(s, 5, true).done).toBe(true);
  expect(sessionPosition(s, 1, false)).toEqual({
    step: -1,
    remaining: 4,
    done: false,
  });
});
