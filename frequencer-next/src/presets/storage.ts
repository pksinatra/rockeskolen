import { normalize, type AppState } from "../state/model";
export interface Preset {
  name: string;
  state: AppState;
}
export function readPresets(): Preset[] {
  try {
    const data: unknown = JSON.parse(
      localStorage.getItem("fg-presets") || "[]",
    );
    if (!Array.isArray(data)) return [];
    return data
      .slice(0, 100)
      .filter((p) => p && typeof p.name === "string")
      .map((p) => ({
        name: p.name.slice(0, 80),
        state: normalize(
          p.state ?? {
            tone: {
              frequency: p.frequency,
              wave: p.wave,
              precision: p.precision,
            },
          },
        ),
      }));
  } catch {
    return [];
  }
}
export function writePresets(p: Preset[]) {
  localStorage.setItem("fg-presets", JSON.stringify(p));
}
