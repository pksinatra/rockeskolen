import {
  fromUrl,
  defaults,
  normalize,
  toUrl,
  type AppState,
} from "../state/model";
// Keep the basic Tone state and explicit volume when an advanced link cannot
// be restored. Never write this fallback over the user's saved presets.
export function toneOnly(state: AppState): AppState {
  const result = defaults();
  result.volume = state.volume;
  result.pan = state.pan;
  result.tone = { ...state.tone };
  result.multi = result.multi.slice(0, 2);
  return result;
}
export function freeState(state: AppState): AppState {
  const result = normalize(state);
  result.multi = result.multi.slice(0, 2);
  result.sweep.loop = false;
  if (result.sweep.motion === "pingpong") result.sweep.motion = "up";
  return result;
}
export function toneUrl(url: string, state: AppState): string {
  const u = new URL(toUrl(url, toneOnly(state)));
  u.searchParams.delete("state");
  u.searchParams.set("f", String(state.tone.frequency));
  u.searchParams.set("wave", state.tone.wave);
  u.searchParams.set("vol", String(state.volume * 100));
  u.searchParams.set("pan", String(state.pan * 100));
  u.searchParams.set("tuning", String(state.tone.tuning));
  u.searchParams.set("precision", String(state.tone.precision));
  u.searchParams.set("slider", state.tone.sliderMode);
  u.searchParams.set("range", state.tone.range);
  return u.href;
}
export const advancedLink = (url: string) =>
  new URL(url).searchParams.has("state") && fromUrl(url).mode !== "tone";
