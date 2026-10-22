import { colorDefaults, sessionDefaults, normalizeColor, normalizeSession, type Color, type Session } from "./exploration";
import { clamp, numeric, safeFrequency } from "../music/math";
export type Wave = "sine" | "triangle" | "square" | "sawtooth";
export type Mode =
  "tone" | "multi" | "sweep" | "binaural" | "noise" | "presets";
export interface Osc {
  id: string;
  f: number;
  wave: Wave;
  vol: number;
  pan: number;
  mute: boolean;
  solo: boolean;
}
export interface AppState {
  version: 1;
  color: Color;
  session: Session;
  mode: Mode;
  volume: number;
  pan: number;
  tone: {
    frequency: number;
    wave: Wave;
    tuning: number;
    precision: number;
    sliderMode: "log" | "linear";
    range: string;
  };
  multi: Osc[];
  sweep: {
    start: number;
    end: number;
    duration: number;
    curve: "linear" | "exponential";
    motion: "up" | "down" | "pingpong";
    wave: Wave;
    loop: boolean;
  };
  binaural: {
    carrier: number;
    beat: number;
    mode: "symmetric" | "left" | "right";
    wave: Wave;
  };
  noise: "white" | "pink" | "brown";
}
export const defaults = (): AppState => ({
  version: 1,
  color: colorDefaults(),
  session: sessionDefaults(),
  mode: "tone",
  volume: 0.3,
  pan: 0,
  tone: {
    frequency: 440,
    wave: "sine",
    tuning: 440,
    precision: 2,
    sliderMode: "log",
    range: "20,20000",
  },
  multi: [220, 330, 440].map((f, i) => ({
    id: String(i),
    f,
    wave: "sine",
    vol: [0.55, 0.4, 0.3][i],
    pan: [-0.2, 0.2, 0][i],
    mute: false,
    solo: false,
  })),
  sweep: {
    start: 20,
    end: 20000,
    duration: 30,
    curve: "exponential",
    motion: "up",
    wave: "sine",
    loop: false,
  },
  binaural: { carrier: 200, beat: 10, mode: "symmetric", wave: "sine" },
  noise: "white",
});
type RecordValue = Record<string, unknown>;
const record = (v: unknown): RecordValue =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as RecordValue) : {};
const choice = <T extends string>(
  v: unknown,
  list: readonly T[],
  fallback: T,
): T => (list.includes(v as T) ? (v as T) : fallback);
export const wave = (v: unknown) =>
  choice(v, ["sine", "triangle", "square", "sawtooth"] as const, "sine");
export function normalize(value: unknown): AppState {
  const d = defaults(),
    v = record(value),
    t = record(v.tone),
    s = record(v.sweep),
    b = record(v.binaural);
  const n = (v: unknown, f: number, lo: number, hi: number) =>
    clamp(numeric(v, f), lo, hi);
  return {
    version: 1,
    color: normalizeColor(v.color),
    session: normalizeSession(v.session),
    mode: choice(
      v.mode,
      ["tone", "multi", "sweep", "binaural", "noise", "presets"] as const,
      d.mode,
    ),
    volume: n(v.volume, 0.3, 0, 1),
    pan: n(v.pan, 0, -1, 1),
    tone: {
      frequency: safeFrequency(numeric(t.frequency, 440)),
      wave: wave(t.wave),
      tuning:
        choice(String(t.tuning), ["432", "440", "442"], "440") === "432"
          ? 432
          : String(t.tuning) === "442"
            ? 442
            : 440,
      precision: Math.round(n(t.precision, 2, 0, 3)),
      sliderMode: choice(t.sliderMode, ["log", "linear"] as const, "log"),
      range: choice(
        t.range,
        ["20,200", "20,2000", "20,20000", "100,1000", "200,2000"],
        "20,20000",
      ),
    },
    multi: Array.isArray(v.multi)
      ? v.multi.slice(0, 8).map((r, i) => {
          const o = record(r);
          return {
            id: String(i),
            f: safeFrequency(numeric(o.f, 440)),
            wave: wave(o.wave),
            vol: n(o.vol, 0.5, 0, 1),
            pan: n(o.pan, 0, -1, 1),
            mute: o.mute === true,
            solo: o.solo === true,
          };
        })
      : d.multi,
    sweep: {
      start: safeFrequency(numeric(s.start, 20)),
      end: safeFrequency(numeric(s.end, 20000)),
      duration: n(s.duration, 30, 0.1, 600),
      curve: choice(s.curve, ["linear", "exponential"] as const, "exponential"),
      motion: choice(s.motion, ["up", "down", "pingpong"] as const, "up"),
      wave: wave(s.wave),
      loop: s.loop === true,
    },
    binaural: {
      carrier: safeFrequency(numeric(b.carrier, 200)),
      beat: n(b.beat, 10, 0.1, 100),
      mode: choice(
        b.mode,
        ["symmetric", "left", "right"] as const,
        "symmetric",
      ),
      wave: wave(b.wave),
    },
    noise: choice(v.noise, ["white", "pink", "brown"] as const, "white"),
  };
}
export const serialize = (s: AppState) => JSON.stringify(normalize(s));
export function deserialize(text: string): AppState {
  try {
    return normalize(JSON.parse(text));
  } catch {
    return defaults();
  }
}
export function fromUrl(url: string): AppState {
  const p = new URL(url).searchParams;
  if (p.has("state")) return deserialize(p.get("state")!);
  const d = defaults();
  d.tone.frequency = safeFrequency(numeric(p.get("f"), 440));
  d.tone.wave = wave(p.get("wave"));
  d.volume = clamp(numeric(p.get("vol"), 30) / 100, 0, 1);
  d.pan = clamp(numeric(p.get("pan"), 0) / 100, -1, 1);
  d.tone = normalize({
    tone: {
      ...d.tone,
      tuning: p.get("tuning") ?? d.tone.tuning,
      precision: p.get("precision") ?? d.tone.precision,
      sliderMode: p.get("slider") ?? d.tone.sliderMode,
      range: p.get("range") ?? d.tone.range,
    },
  }).tone;
  return d;
}
export function toUrl(url: string, s: AppState): string {
  const u = new URL(url);
  ["f", "wave", "vol", "pan"].forEach((k) => u.searchParams.delete(k));
  u.searchParams.set("state", serialize(s));
  return u.href;
}
