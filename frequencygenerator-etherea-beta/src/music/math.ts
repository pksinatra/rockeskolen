export const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));
export function numeric(v: unknown, fallback: number): number {
  if (v === null || v === undefined || v === "") return fallback;
  const n = Number(typeof v === "string" ? v.trim().replace(",", ".") : v);
  return Number.isFinite(n) ? n : fallback;
}
export const upperFrequency = (sampleRate = 48000) =>
  Math.min(20000, sampleRate * 0.49);
export const safeFrequency = (f: number, sampleRate = 48000) =>
  clamp(numeric(f, 440), 20, upperFrequency(sampleRate));
export function noteFromFrequency(f: number, tuning = 440) {
  if (!(f > 0) || !(tuning > 0)) return { note: "—", cents: 0 };
  const midi = 69 + 12 * Math.log2(f / tuning),
    rounded = Math.round(midi);
  const names = [
    "C",
    "C♯",
    "D",
    "E♭",
    "E",
    "F",
    "F♯",
    "G",
    "A♭",
    "A",
    "B♭",
    "B",
  ];
  return {
    note: `${names[((rounded % 12) + 12) % 12]}${Math.floor(rounded / 12) - 1}`,
    cents: (midi - rounded) * 100,
  };
}
export function freqToSlider(f: number, min = 20, max = 20000, mode = "log") {
  f = clamp(f, min, max);
  return (
    1000 *
    (mode === "linear"
      ? (f - min) / (max - min)
      : Math.log(f / min) / Math.log(max / min))
  );
}
export function sliderToFreq(v: number, min = 20, max = 20000, mode = "log") {
  const t = clamp(v / 1000, 0, 1);
  return mode === "linear" ? min + t * (max - min) : min * (max / min) ** t;
}
export function binauralFrequencies(
  carrier: number,
  beat: number,
  mode: string,
  sampleRate = 48000,
) {
  const hi = upperFrequency(sampleRate),
    gap = clamp(beat, 0.1, Math.min(100, hi - 20));
  let left =
    mode === "left"
      ? carrier
      : mode === "right"
        ? carrier - gap
        : carrier - gap / 2;
  left = clamp(left, 20, hi - gap);
  return { left, right: left + gap };
}
