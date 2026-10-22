import { mountExploration } from "./exploration";
import { Access, type Feature } from "../access/client";
import { advancedLink, freeState, toneOnly, toneUrl } from "../access/state";
import { AudioController } from "../audio/controller";
import { SweepEngine } from "../audio/sweep";
import {
  binauralFrequencies,
  clamp,
  freqToSlider,
  noteFromFrequency,
  numeric,
  safeFrequency,
  sliderToFreq,
} from "../music/math";
import {
  fromUrl,
  normalize,
  toUrl,
  wave,
  type AppState,
  type Mode,
} from "../state/model";
import { presetGroups } from "../presets/builtin";
import { readPresets, writePresets } from "../presets/storage";
const el = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const input = (id: string) => el<HTMLInputElement>(id);
const all = (q: string) =>
  Array.from(document.querySelectorAll<HTMLElement>(q));
const val = (id: string) => input(id).value;
const num = (id: string, f: number) => numeric(val(id), f);
const fmt = (n: number, p = 2) => n.toFixed(p);
const access = new Access();
const initialUrl = location.href;
let state = fromUrl(initialUrl),
  toastTimer: number | undefined,
  scopeFrame = 0;
const audio = new AudioController(renderPlayback);
function toast(text: string) {
  el("toast").textContent = text;
  el("toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(
    () => el("toast").classList.remove("show"),
    4000,
  );
}
const featureNames: Record<Feature, string> = {
  "multi.extraVoices": "More than two oscillator voices",
  "sweep.loop": "Looping sweeps",
  "sweep.pingpong": "Ping-pong sweeps",
  "presets.custom": "Custom presets",
  "sharing.advanced": "Complete advanced state sharing",
};
function showPro(feature: Feature) {
  el("proMessage").textContent =
    `${featureNames[feature]} is included with ChordLink Pro.`;
  const dialog = el<HTMLDialogElement>("proDialog");
  if (!dialog.open) dialog.showModal();
}
async function requireFeature(feature: Feature) {
  try {
    if (await access.authorize(feature)) return true;
    state = freeState(state);
    audio.stop();
    fillState();
    showPro(feature);
    renderAccess();
    return false;
  } catch (e) {
    access.useFree();
    state = freeState(state);
    audio.stop();
    fillState();
    renderAccess();
    toast(
      e instanceof Error
        ? e.message
        : "Membership could not be checked. Please try again.",
    );
    return false;
  }
}
function renderAccess() {
  all("[data-pro-feature] .pro-chip, small[data-pro-feature]").forEach((b) => {
    const feature = (b.dataset.proFeature ??
      b.closest<HTMLElement>("[data-pro-feature]")?.dataset
        .proFeature) as Feature;
    b.hidden = access.showsPro(feature);
  });
  el("multiProBadge").hidden =
    access.showsPro("multi.extraVoices") || state.multi.length < 2;
  const option = input("sweepMotion").querySelector('option[value="pingpong"]');
  if (option)
    option.textContent = access.showsPro("sweep.pingpong")
      ? "Ping-pong"
      : "Ping-pong · PRO";
  const badge = el("advancedShareBadge");
  badge.hidden = state.mode === "tone" || access.showsPro("sharing.advanced");
}
function persist() {
  try {
    history.replaceState(
      null,
      "",
      access.showsPro("sharing.advanced")
        ? toUrl(location.href, state)
        : toneUrl(location.href, state),
    );
  } catch {}
}
function changed() {
  audio.update(state);
  renderReadouts();
  persist();
}
function renderReadouts() {
  const t = state.tone,
    [min, max] = t.range.split(",").map(Number),
    note = noteFromFrequency(t.frequency, t.tuning);
  el("toneNote").textContent =
    `${note.note} · ${note.cents >= 0 ? "+" : ""}${fmt(note.cents, 1)} cents`;
  el("exactFreqBtn").textContent = `${fmt(t.frequency, t.precision)} Hz`;
  input("toneSlider").value = String(
    freqToSlider(t.frequency, min, max, t.sliderMode),
  );
  el("volumeValue").textContent = `${Math.round(state.volume * 100)}%`;
  el("panValue").textContent =
    state.pan === 0
      ? "Center"
      : `${state.pan < 0 ? "L" : "R"} ${Math.round(Math.abs(state.pan) * 100)}%`;
  const f = binauralFrequencies(
    state.binaural.carrier,
    state.binaural.beat,
    state.binaural.mode,
    audio.graph?.ctx.sampleRate,
  );
  el("leftFreq").textContent = `${fmt(f.left)} Hz`;
  el("rightFreq").textContent = `${fmt(f.right)} Hz`;
  el("beatFreq").textContent = `${fmt(f.right - f.left)} Hz`;
  all("#toneWaveButtons .wave").forEach((b) => {
    b.classList.toggle("active", b.dataset.wave === t.wave);
    b.setAttribute("aria-pressed", String(b.dataset.wave === t.wave));
  });
  all(".noise-card").forEach((b) => {
    b.classList.toggle("active", b.dataset.noise === state.noise);
    b.setAttribute("aria-pressed", String(b.dataset.noise === state.noise));
  });
  const labels = all(".range-labels span");
  labels[0].textContent = `${min} Hz`;
  labels[1].textContent = max >= 1000 ? `${max / 1000} kHz` : `${max} Hz`;
}
function renderPlayback() {
  const names: Record<string, string> = {
    tone: "PLAY",
    multi: "PLAY ALL",
    sweep: "START SWEEP",
    binaural: "PLAY BINAURAL",
    noise: "PLAY NOISE",
  };
  Object.entries(names).forEach(([mode, label]) => {
    const b = el(mode + "Play"),
      playing = audio.mode === mode;
    b.textContent = playing ? "■ STOP" : `▶ ${label}`;
    b.classList.toggle("playing", playing);
    b.setAttribute("aria-pressed", String(playing));
  });
  el("audioStatus").textContent = audio.mode
    ? `Playing ${audio.mode} · ${audio.graph!.ctx.sampleRate} Hz sample rate`
    : "Audio stopped";
  el("sweepStatus").textContent = audio.mode === "sweep" ? "Sweeping" : "Ready";
  cancelAnimationFrame(scopeFrame);
  if (audio.mode) drawScope();
  audio.onProgress();
}
function drawScope() {
  if (!audio.mode || !audio.graph) return;
  const canvas = el<HTMLCanvasElement>("scope"),
    c = canvas.getContext("2d")!,
    a = audio.graph.analyser,
    data = new Uint8Array(a.fftSize);
  a.getByteTimeDomainData(data);
  c.clearRect(0, 0, canvas.width, canvas.height);
  c.beginPath();
  c.strokeStyle = "rgba(255,94,99,.95)";
  c.lineWidth = 3;
  data.forEach((v, i) => {
    const x = (i / (data.length - 1)) * canvas.width,
      y = (v / 255) * canvas.height;
    i ? c.lineTo(x, y) : c.moveTo(x, y);
  });
  c.stroke();
  if (audio.engine instanceof SweepEngine)
    el("sweepLive").textContent = `${fmt(audio.engine.value())} Hz`;
  scopeFrame = requestAnimationFrame(drawScope);
}
function selectMode(mode: Mode) {
  audio.stop();
  state.mode = mode;
  all(".tab").forEach((b) => {
    const active = b.dataset.tab === mode;
    b.classList.toggle("active", active);
    b.setAttribute("aria-pressed", String(active));
  });
  all(".panel").forEach((p) =>
    p.classList.toggle("active", p.id === `panel-${mode}`),
  );
  renderAccess();
  persist();
}
function setFrequency(f: number, format = true) {
  state.tone.frequency = safeFrequency(f, audio.graph?.ctx.sampleRate);
  if (format)
    input("toneFreq").value = fmt(state.tone.frequency, state.tone.precision);
  changed();
}
function renderRows() {
  const wrap = el("oscList");
  wrap.replaceChildren();
  renderAccess();
  state.multi.forEach((r, i) => {
    const card = document.createElement("div");
    card.className = "osc-card";
    card.innerHTML = `<div class="osc-index">${i + 1}</div><label>Frequency<input class="osc-f" inputmode="decimal" aria-label="Tone ${i + 1} frequency"></label><label>Wave<select class="osc-wave"><option>sine</option><option>triangle</option><option>square</option><option>sawtooth</option></select></label><label>Volume<input class="osc-vol mini-range" type="range" min="0" max="100"></label><label>Pan<input class="osc-pan mini-range" type="range" min="-100" max="100"></label><div class="osc-actions"><button class="mute">Mute</button><button class="solo">Solo</button><button class="osc-delete" aria-label="Delete tone ${i + 1}">×</button></div>`;
    const field = (s: string) => card.querySelector<HTMLInputElement>(s)!;
    field(".osc-f").value = String(r.f);
    field(".osc-wave").value = r.wave;
    field(".osc-vol").value = String(r.vol * 100);
    field(".osc-pan").value = String(r.pan * 100);
    const buttons = () => {
      field(".mute").setAttribute("aria-pressed", String(r.mute));
      field(".solo").setAttribute("aria-pressed", String(r.solo));
    };
    buttons();
    card.addEventListener("input", () => {
      r.f = safeFrequency(
        numeric(field(".osc-f").value, r.f),
        audio.graph?.ctx.sampleRate,
      );
      r.wave = wave(field(".osc-wave").value);
      r.vol = Number(field(".osc-vol").value) / 100;
      r.pan = Number(field(".osc-pan").value) / 100;
      changed();
    });
    field(".osc-f").addEventListener(
      "change",
      () => (field(".osc-f").value = String(r.f)),
    );
    field(".mute").onclick = () => {
      r.mute = !r.mute;
      buttons();
      changed();
    };
    field(".solo").onclick = () => {
      r.solo = !r.solo;
      buttons();
      changed();
    };
    field(".osc-delete").onclick = () => {
      state.multi = state.multi.filter((x) => x !== r);
      if (!state.multi.length && audio.mode === "multi") audio.stop();
      changed();
      renderRows();
    };
    wrap.append(card);
  });
}
function fillState() {
  const t = state.tone;
  input("toneFreq").value = fmt(t.frequency, t.precision);
  input("masterVolume").value = String(state.volume * 100);
  input("masterPan").value = String(state.pan * 100);
  input("tuningRef").value = String(t.tuning);
  input("precisionSelect").value = String(t.precision);
  input("rangeSelect").value = t.range;
  input("sliderMode").value = t.sliderMode;
  Object.entries(state.sweep).forEach(([k, v]) => {
    const id = "sweep" + k[0].toUpperCase() + k.slice(1);
    if (k === "loop") input(id).checked = Boolean(v);
    else input(id).value = String(v);
  });
  Object.entries(state.binaural).forEach(
    ([k, v]) =>
      (input("binaural" + k[0].toUpperCase() + k.slice(1)).value = String(v)),
  );
  renderRows();
  renderReadouts();
  renderExploration();
  selectMode(state.mode);
}
async function play() {
  if (!audio.mode && state.mode === "tone" && state.session.sequence && !state.session.steps.length) {
    toast("Add at least one sequence step first"); return;
  }
  if (state.mode === "multi" && !state.multi.length) {
    toast("Add a tone first");
    return;
  }
  try {
    await audio.toggle(state);
    if (audio.graph) {
      setFrequency(state.tone.frequency);
      renderReadouts();
    }
  } catch (e) {
    toast(e instanceof Error ? e.message : "Audio could not start");
  }
}
all(".tab").forEach(
  (b) => (b.onclick = () => selectMode(b.dataset.tab as Mode)),
);
["tone", "multi", "sweep", "binaural", "noise"].forEach(
  (m) => (el(m + "Play").onclick = play),
);
input("toneFreq").addEventListener("input", () =>
  setFrequency(num("toneFreq", state.tone.frequency), false),
);
input("toneFreq").addEventListener("change", () =>
  setFrequency(num("toneFreq", state.tone.frequency)),
);
input("toneSlider").oninput = () => {
  const [min, max] = state.tone.range.split(",").map(Number);
  setFrequency(
    sliderToFreq(num("toneSlider", 0), min, max, state.tone.sliderMode),
  );
};
all("#nudgeRow button").forEach(
  (b) =>
    (b.onclick = () =>
      setFrequency(state.tone.frequency + Number(b.dataset.delta))),
);
el("halfBtn").onclick = () => setFrequency(state.tone.frequency / 2);
el("doubleBtn").onclick = () => setFrequency(state.tone.frequency * 2);
el("exactFreqBtn").onclick = () => input("toneFreq").focus();
all("#toneWaveButtons .wave").forEach(
  (b) =>
    (b.onclick = () => {
      state.tone.wave = wave(b.dataset.wave);
      changed();
    }),
);
input("masterVolume").oninput = () => {
  state.volume = num("masterVolume", 30) / 100;
  changed();
};
input("masterPan").oninput = () => {
  state.pan = num("masterPan", 0) / 100;
  changed();
};
["sliderMode", "rangeSelect", "tuningRef", "precisionSelect"].forEach(
  (id) =>
    (input(id).onchange = () => {
      state.tone.sliderMode = val("sliderMode") === "linear" ? "linear" : "log";
      state.tone.range = val("rangeSelect");
      state.tone.tuning = num("tuningRef", 440);
      state.tone.precision = num("precisionSelect", 2);
      setFrequency(state.tone.frequency);
    }),
);
el("addOscBtn").onclick = async () => {
  if (state.multi.length >= 2 && !(await requireFeature("multi.extraVoices")))
    return;
  if (state.multi.length >= 8) return toast("Maximum 8 oscillators");
  state.multi.push({
    id: crypto.randomUUID(),
    f: 440,
    wave: "sine",
    vol: 0.5,
    pan: 0,
    mute: false,
    solo: false,
  });
  renderRows();
  changed();
};
["Start", "End", "Duration", "Curve", "Motion", "Wave", "Loop"].forEach(
  (k) =>
    (input("sweep" + k).onchange = async () => {
      if (
        k === "Loop" &&
        input("sweepLoop").checked &&
        !(await requireFeature("sweep.loop"))
      ) {
        input("sweepLoop").checked = state.sweep.loop;
        return;
      }
      if (
        k === "Motion" &&
        val("sweepMotion") === "pingpong" &&
        !(await requireFeature("sweep.pingpong"))
      ) {
        input("sweepMotion").value = state.sweep.motion;
        return;
      }
      state.sweep = normalize({
        sweep: {
          start: num("sweepStart", 20),
          end: num("sweepEnd", 20000),
          duration: num("sweepDuration", 30),
          curve: val("sweepCurve"),
          motion: val("sweepMotion"),
          wave: val("sweepWave"),
          loop: input("sweepLoop").checked,
        },
      }).sweep;
      ["Start", "End", "Duration"].forEach(
        (x) =>
          (input("sweep" + x).value = String(
            state.sweep[x.toLowerCase() as "start" | "end" | "duration"],
          )),
      );
      if (audio.mode === "sweep") {
        audio.stop();
        void play();
      }
      changed();
    }),
);
["Carrier", "Beat", "Mode", "Wave"].forEach((k) =>
  input("binaural" + k).addEventListener("input", () => {
    state.binaural = normalize({
      binaural: {
        carrier: num("binauralCarrier", 200),
        beat: num("binauralBeat", 10),
        mode: val("binauralMode"),
        wave: val("binauralWave"),
      },
    }).binaural;
    changed();
  }),
);
all(".noise-card").forEach(
  (b) =>
    (b.onclick = () => {
      state.noise = b.dataset.noise as AppState["noise"];
      changed();
    }),
);
function renderPresets() {
  const wrap = el("presetGroups");
  wrap.replaceChildren();
  Object.entries(presetGroups).forEach(([name, items]) => {
    const group = document.createElement("div");
    group.className = "preset-group";
    const heading = document.createElement("h3");
    heading.textContent = name;
    const grid = document.createElement("div");
    grid.className = "preset-grid";
    items.forEach(([name, f]) => {
      const b = document.createElement("button");
      b.className = "preset-chip";
      b.textContent = `${name} · ${fmt(f, f % 1 ? 2 : 0)} Hz`;
      b.onclick = () => {
        selectMode("tone");
        setFrequency(f);
        toast(`${fmt(f)} Hz loaded`);
      };
      grid.append(b);
    });
    group.append(heading, grid);
    wrap.append(group);
  });
  renderCustom();
}
function renderCustom() {
  const items = readPresets(),
    grid = el("customPresets");
  grid.replaceChildren();
  el("customPresetsWrap").classList.toggle("hidden", !items.length);
  items.forEach((p, i) => {
    const row = document.createElement("div");
    const load = document.createElement("button");
    load.className = "preset-chip";
    load.textContent = p.name;
    load.onclick = async () => {
      if (!(await requireFeature("presets.custom"))) return;
      audio.stop();
      state = normalize(p.state);
      fillState();
      toast("Preset loaded");
    };
    const del = document.createElement("button");
    del.textContent = "Delete";
    del.setAttribute("aria-label", `Delete preset ${p.name}`);
    del.onclick = async () => {
      if (!(await requireFeature("presets.custom"))) return;
      try {
        const a = readPresets();
        a.splice(i, 1);
        writePresets(a);
        renderCustom();
      } catch {
        toast("Could not save presets on this device");
      }
    };
    row.append(load, del);
    grid.append(row);
  });
}
const dialog = el<HTMLDialogElement>("presetDialog");
el("savePresetBtn").onclick = async () => {
  if (!(await requireFeature("presets.custom"))) return;
  input("presetName").value =
    state.mode === "tone" ? `${fmt(state.tone.frequency)} Hz` : state.mode;
  dialog.showModal();
  input("presetName").select();
};
el("cancelPreset").onclick = () => dialog.close();
el<HTMLFormElement>("presetForm").onsubmit = async (e) => {
  e.preventDefault();
  if (!(await requireFeature("presets.custom"))) {
    dialog.close();
    return;
  }
  const name = val("presetName").trim();
  if (!name) return;
  try {
    const a = readPresets();
    if (a.length >= 100) return toast("Maximum 100 presets");
    a.push({ name, state: normalize(state) });
    writePresets(a);
    dialog.close();
    renderCustom();
    toast("Preset saved");
  } catch {
    toast("Could not save presets on this device");
  }
};
el("shareBtn").onclick = async () => {
  if (state.mode !== "tone" && !(await requireFeature("sharing.advanced")))
    return;
  const url =
    toUrl(location.href, state);
  history.replaceState(null, "", url);
  try {
    if (navigator.share) {
      await navigator.share({ title: "Frequency Generator", url });
      return;
    }
    await navigator.clipboard.writeText(url);
    toast("Share link copied");
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") return;
    input("shareLink").value = url;
    el<HTMLDialogElement>("shareDialog").showModal();
    input("shareLink").select();
  }
};
el("closeShare").onclick = () => el<HTMLDialogElement>("shareDialog").close();
window.addEventListener("keydown", (e) => {
  if ((e.target as HTMLElement).closest("input,select,textarea,button,dialog"))
    return;
  if (e.code === "Space") {
    e.preventDefault();
    void play();
  }
  if (e.key === "ArrowUp") {
    e.preventDefault();
    setFrequency(state.tone.frequency + 1);
  }
  if (e.key === "ArrowDown") {
    e.preventDefault();
    setFrequency(state.tone.frequency - 1);
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) audio.stop();
});
window.addEventListener("pagehide", () => audio.stop());
async function restoreUrl(url: string) {
  audio.stop();
  const incoming = fromUrl(url);
  if (advancedLink(url)) {
    state = (await requireFeature("sharing.advanced"))
      ? incoming
      : toneOnly(incoming);
  } else
    state = access.showsPro("multi.extraVoices")
      ? incoming
      : new URL(url).searchParams.has("state")
        ? toneOnly(incoming)
        : freeState(incoming);
  fillState();
}
window.addEventListener("popstate", () => void restoreUrl(location.href));
el("closePro").onclick = () => el<HTMLDialogElement>("proDialog").close();
async function initialize() {
  document.querySelector("main")!.inert = true;
  try {
    await access.refresh();
  } catch (e) {
    toast(
      e instanceof Error
        ? e.message
        : "Membership could not be checked. Free tools are available.",
    );
  }
  await restoreUrl(initialUrl);
  renderPresets();
  renderPlayback();
  renderAccess();
  document.querySelector("main")!.inert = false;
  document.documentElement.dataset.ready = "true";
}
const renderExploration = mountExploration(() => state, audio, changed, setFrequency, () => selectMode("tone"));
void initialize();
