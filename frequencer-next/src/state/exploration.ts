import { clamp, numeric, safeFrequency } from "../music/math";
export interface Color {
  enabled: boolean;
  warmth: number;
  brightness: number;
  space: number;
  echo: number;
  shimmer: number;
  pulse: number;
  pulseRate: number;
  harmonicMix: number;
  harmonicRatio: number;
}
export interface Session {
  seconds: number;
  fade: number;
  sequence: boolean;
  loop: boolean;
  stepSeconds: number;
  steps: number[];
}
export const colorDefaults = (): Color => ({
  enabled: false,
  warmth: 0.5,
  brightness: 0.5,
  space: 0,
  echo: 0,
  shimmer: 0,
  pulse: 0,
  pulseRate: 0.1,
  harmonicMix: 0,
  harmonicRatio: 2,
});
export const sessionDefaults = (): Session => ({
  seconds: 0,
  fade: 3,
  sequence: false,
  loop: false,
  stepSeconds: 15,
  steps: [174, 285, 396, 417, 528, 639, 741, 852, 963],
});
const record = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" ? (v as Record<string, unknown>) : {};
export function normalizeColor(value: unknown): Color {
  const v = record(value),
    d = colorDefaults();
  for (const key of [
    "warmth",
    "brightness",
    "space",
    "echo",
    "shimmer",
    "pulse",
    "harmonicMix",
  ] as const)
    d[key] = clamp(numeric(v[key], d[key]), 0, 1);
  d.enabled = v.enabled === true;
  d.pulseRate = clamp(numeric(v.pulseRate, d.pulseRate), 0.05, 20);
  d.harmonicRatio = [0.5, 1.5, 2, 3, 4].includes(Number(v.harmonicRatio))
    ? Number(v.harmonicRatio)
    : 2;
  return d;
}
export function normalizeSession(value: unknown): Session {
  const v = record(value),
    d = sessionDefaults();
  return {
    seconds: clamp(numeric(v.seconds, d.seconds), 0, 7200),
    fade: clamp(numeric(v.fade, d.fade), 0.1, 30),
    sequence: v.sequence === true,
    loop: v.loop === true,
    stepSeconds: clamp(numeric(v.stepSeconds, d.stepSeconds), 0.5, 600),
    steps: Array.isArray(v.steps)
      ? v.steps.slice(0, 64).map((f) => safeFrequency(numeric(f, 440)))
      : d.steps,
  };
}
export const sessionTemplates: Record<string, number[]> = {
  solfeggio: [174, 285, 396, 417, 528, 639, 741, 852, 963],
  descending: [528, 417, 396, 285, 174],
  arpeggio: [261.6256, 329.6276, 391.9954, 523.2511],
};
