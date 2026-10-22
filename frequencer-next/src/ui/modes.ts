import { panels } from "./panels";
import { AudioController } from "../audio/controller";
import {
  normalize,
  defaults,
  type AppState,
  type Mode,
  wave,
} from "../state/model";
import { numeric, safeFrequency, binauralFrequencies } from "../music/math";
import { presetGroups } from "../presets/builtin";
interface Bridge {
  stop(): void;
  snapshot(): Record<string, unknown>;
  restore(s: unknown): void;
}
const bridge = (window as unknown as { frequencerBridge: Bridge })
  .frequencerBridge;
const el = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const input = (id: string) => el<HTMLInputElement>(id);
let state = defaults();
state.volume = Number(bridge.snapshot().volume);
let mode: Mode = "tone";
let scopeFrame = 0;
const workspace = document.querySelector<HTMLElement>(".workspace")!;
const quick = document.querySelector<HTMLElement>(".quick-start")!;
const nav = document.createElement("nav");
nav.className = "generator-modes";
nav.setAttribute("aria-label", "Generator modes");
nav.innerHTML = ["tone", "multi", "sweep", "binaural", "noise", "presets"]
  .map(
    (m) =>
      `<button type="button" data-mode="${m}" aria-pressed="${m === "tone"}">${m[0].toUpperCase() + m.slice(1)}</button>`,
  )
  .join("");
quick.before(nav);
const added = document.createElement("section");
added.id = "generatorExtensions";
added.hidden = true;
added.innerHTML =
  panels +
  `<div id="advancedOutput" class="panel"><div class="control-grid"><label>Output · digital amplitude <output id="advancedVolumeText"></output><input id="advancedVolume" type="range" min="0" max="80" value="22"></label><label>Balance<input id="advancedPan" type="range" min="-100" max="100" value="0"></label><label>Session timer<select id="advancedTimer"><option value="0">Off</option><option value="60">1 minute</option><option value="300">5 minutes</option><option value="600">10 minutes</option><option value="1200">20 minutes</option></select></label></div><canvas id="advancedScope" width="1000" height="150" aria-label="Live waveform"></canvas><p class="fineprint">Start low. Output is digital amplitude, not calibrated SPL. Binaural mode keeps left and right channels separate.</p></div>`;
workspace.after(added);
const presets = document.createElement("section");
presets.id = "generatorPresets";
presets.className = "panel";
presets.hidden = true;
presets.innerHTML =
  '<div class="panel-head"><h2>Generator presets</h2></div><div class="panel-body"><div id="generatorBuiltins"></div><h3>Saved complete setups</h3><p class="fineprint">Stores all generator modes and the current Frequencer sound on this device.</p><div id="generatorSaved"></div></div>';
added.after(presets);
const actions = document.createElement("div");
actions.className = "generator-actions";
actions.innerHTML =
  '<span class="fineprint">Open beta · all modes available</span><button id="fullSave">Save setup</button><button id="fullShare">Share setup</button>';
nav.after(actions);
const dialogs = document.createElement("div");
dialogs.innerHTML =
  '<dialog id="setupDialog"><form id="setupForm"><h2>Save complete setup</h2><label>Name<input id="setupName" maxlength="80" required></label><div class="button-row"><button type="button" id="setupCancel">Cancel</button><button type="submit" class="primary">Save</button></div></form></dialog><dialog id="linkDialog"><h2>Share setup</h2><label>Copy this link<textarea id="setupLink" readonly></textarea></label><button id="linkClose">Close</button></dialog><p id="generatorMessage" role="status"></p>';
document.body.append(dialogs);
let messageTimer: ReturnType<typeof setTimeout>;
const message = (s: string) => {
  el("generatorMessage").textContent = s;
  clearTimeout(messageTimer);
  messageTimer = setTimeout(
    () => (el("generatorMessage").textContent = ""),
    4000,
  );
};
const audio = new AudioController(renderPlayback);
function select(next: Mode) {
  audio.stop();
  if (next !== mode || next !== "tone") bridge.stop();
  mode = next;
  state.mode = next;
  workspace.hidden = !["tone", "presets"].includes(mode);
  workspace.classList.toggle("preset-view", mode === "presets");
  quick.hidden = mode !== "tone";
  added.hidden = ["tone", "presets"].includes(mode);
  presets.hidden = mode !== "presets";
  document
    .querySelectorAll<HTMLElement>("[data-mode]")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.mode === mode)),
    );
  document
    .querySelectorAll<HTMLElement>(".fg-mode-panel")
    .forEach((p) => (p.hidden = p.id !== "panel-" + mode));
  renderPlayback();
}
nav
  .querySelectorAll<HTMLButtonElement>("button")
  .forEach((b) => (b.onclick = () => select(b.dataset.mode as Mode)));
window.addEventListener("frequencer-tone-start", () => {
  audio.stop();
  if (mode !== "tone") select("tone");
});
window.addEventListener("frequencer-tone-select", () => {
  if (mode !== "tone") select("tone");
});
function renderPlayback() {
  const running = Boolean(audio.mode);
  el<HTMLButtonElement>("playButton").disabled = mode === "presets";
  for (const m of ["multi", "sweep", "binaural", "noise"])
    el(m + "Play").textContent = audio.mode === m ? "Stop" : "Start " + m;
  if (mode !== "tone") {
    el("stateText").textContent = running ? "Playing " + mode : "Audio stopped";
    el("playButton").textContent = running ? "Stop" : "Start";
    document.body.classList.toggle("is-playing", running);
  }
  cancelAnimationFrame(scopeFrame);
  if (running) draw();
}
audio.onProgress = () => {
  if (mode === "tone") return;
  const seconds = audio.progress.remaining;
  el("timerText").textContent =
    seconds === null
      ? "No timer"
      : `${Math.floor(seconds / 60)}:${String(Math.ceil(seconds % 60)).padStart(2, "0")}`;
};
function draw() {
  if (!audio.graph || !audio.mode) return;
  const c = el<HTMLCanvasElement>("advancedScope"),
    ctx = c.getContext("2d")!,
    a = audio.graph.analyser,
    data = new Uint8Array(a.fftSize);
  a.getByteTimeDomainData(data);
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.strokeStyle = "#d95ce8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  data.forEach((v, i) => {
    const x = (i * c.width) / (data.length - 1),
      y = (v * c.height) / 255;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  });
  ctx.stroke();
  scopeFrame = requestAnimationFrame(draw);
}
async function play() {
  if (["tone", "presets"].includes(mode)) return;
  if (mode === "multi" && !state.multi.length) {
    message("Add a voice first.");
    return;
  }
  try {
    await audio.toggle(state);
  } catch {
    message("Audio could not start. Press Start again.");
  }
}
for (const m of ["multi", "sweep", "binaural", "noise"])
  el(m + "Play").onclick = play;
el("playButton").addEventListener(
  "click",
  (e) => {
    if (mode === "tone") return;
    e.stopImmediatePropagation();
    void play();
  },
  true,
);
el("stopButton").addEventListener(
  "click",
  (e) => {
    if (mode === "tone") return;
    e.stopImmediatePropagation();
    audio.fadeOut(0.8);
  },
  true,
);
function update() {
  audio.update(state);
  readouts();
}
function readouts() {
  el("advancedVolumeText").textContent = Math.round(state.volume * 100) + "%";
  const b = binauralFrequencies(
    state.binaural.carrier,
    state.binaural.beat,
    state.binaural.mode,
    audio.graph?.ctx.sampleRate,
  );
  el("leftFreq").textContent = b.left.toFixed(2) + " Hz";
  el("rightFreq").textContent = b.right.toFixed(2) + " Hz";
  el("beatFreq").textContent = (b.right - b.left).toFixed(2) + " Hz";
  document.querySelectorAll<HTMLElement>("[data-noise]").forEach((b) => {
    b.classList.toggle("active", b.dataset.noise === state.noise);
    b.setAttribute("aria-pressed", String(b.dataset.noise === state.noise));
  });
}
function rows() {
  const wrap = el("oscList");
  wrap.replaceChildren();
  state.multi.forEach((o, i) => {
    const row = document.createElement("div");
    row.className = "osc-card";
    row.innerHTML = `<label>Voice ${i + 1} · Hz<input class="osc-f" inputmode="decimal"></label><label>Wave<select class="osc-wave"><option>sine</option><option>triangle</option><option>square</option><option>sawtooth</option></select></label><label>Level<input class="osc-vol" type="range" min="0" max="100"></label><label>Pan<input class="osc-pan" type="range" min="-100" max="100"></label><div class="osc-actions"><button class="mute">Mute</button><button class="solo">Solo</button><button class="remove">Remove</button></div>`;
    const f = (q: string) => row.querySelector<HTMLInputElement>(q)!;
    f(".osc-f").value = String(o.f);
    f(".osc-wave").value = o.wave;
    f(".osc-vol").value = String(o.vol * 100);
    f(".osc-pan").value = String(o.pan * 100);
    f(".osc-f").setAttribute("aria-label", `Voice ${i + 1} frequency`);
    row.oninput = () => {
      o.f = safeFrequency(
        numeric(f(".osc-f").value, o.f),
        audio.graph?.ctx.sampleRate,
      );
      o.wave = wave(f(".osc-wave").value);
      o.vol = Number(f(".osc-vol").value) / 100;
      o.pan = Number(f(".osc-pan").value) / 100;
      update();
    };
    f(".osc-f").onchange = () => {
      f(".osc-f").value = String(o.f);
    };
    const buttons = () => {
      f(".mute").setAttribute("aria-pressed", String(o.mute));
      f(".solo").setAttribute("aria-pressed", String(o.solo));
    };
    buttons();
    f(".mute").onclick = () => {
      o.mute = !o.mute;
      buttons();
      update();
    };
    f(".solo").onclick = () => {
      o.solo = !o.solo;
      buttons();
      update();
    };
    f(".remove").setAttribute("aria-label", `Remove voice ${i + 1}`);
    f(".remove").onclick = () => {
      state.multi = state.multi.filter((v) => v !== o);
      if (!state.multi.length) audio.stop();
      rows();
      update();
    };
    wrap.append(row);
  });
}
el("addOscBtn").onclick = () => {
  if (state.multi.length >= 8) {
    message("Maximum eight voices.");
    return;
  }
  state.multi.push({
    id: crypto.randomUUID(),
    f: 440,
    wave: "sine",
    vol: 0.3,
    pan: 0,
    mute: false,
    solo: false,
  });
  rows();
  update();
};
for (const key of [
  "start",
  "end",
  "duration",
  "curve",
  "motion",
  "wave",
  "loop",
] as const) {
  const id = "sweep" + key[0].toUpperCase() + key.slice(1);
  input(id).onchange = () => {
    const active = audio.mode === "sweep";
    if (active) audio.stop();
    state.sweep = normalize({
      sweep: {
        ...state.sweep,
        [key]: key === "loop" ? input(id).checked : input(id).value,
      },
    }).sweep;
    fill();
    if (active) void play();
  };
}
for (const key of ["carrier", "beat", "mode", "wave"] as const) {
  const id = "binaural" + key[0].toUpperCase() + key.slice(1);
  input(id).oninput = () => {
    state.binaural = normalize({
      binaural: { ...state.binaural, [key]: input(id).value },
    }).binaural;
    update();
  };
}
document.querySelectorAll<HTMLElement>("[data-noise]").forEach(
  (b) =>
    (b.onclick = () => {
      state.noise = b.dataset.noise as AppState["noise"];
      update();
    }),
);
input("advancedVolume").oninput = () => {
  state.volume = Number(input("advancedVolume").value) / 100;
  update();
};
input("advancedPan").oninput = () => {
  state.pan = Number(input("advancedPan").value) / 100;
  update();
};
input("advancedTimer").onchange = () => {
  audio.stop();
  state.session.seconds = Number(input("advancedTimer").value);
};
function fill() {
  rows();
  input("advancedVolume").value = String(state.volume * 100);
  input("advancedPan").value = String(state.pan * 100);
  const timer = input("advancedTimer");
  if (!timer.querySelector(`option[value="${state.session.seconds}"]`)) {
    const o = document.createElement("option");
    o.value = String(state.session.seconds);
    o.textContent = state.session.seconds + " seconds";
    timer.append(o);
  }
  timer.value = String(state.session.seconds);
  for (const [prefix, values] of [
    ["sweep", state.sweep],
    ["binaural", state.binaural],
  ] as const)
    for (const [key, value] of Object.entries(values)) {
      const field = input(prefix + key[0].toUpperCase() + key.slice(1));
      if (key === "loop") field.checked = Boolean(value);
      else field.value = String(value);
    }
  readouts();
}
const snapshot = () => ({
  version: 1,
  generator: { ...state, mode },
  frequencer: bridge.snapshot(),
});
function restore(data: unknown) {
  if (!data || typeof data !== "object") return;
  const d = data as { generator?: unknown; frequencer?: unknown };
  if (!d.generator) return;
  audio.stop();
  bridge.stop();
  state = normalize(d.generator);
  const target = state.mode;
  state.volume = Math.min(0.8, state.volume);
  bridge.restore(d.frequencer);
  fill();
  select(target);
}
const storageKey = "fe-frequencer-complete-setups-v1";
interface Saved {
  name: string;
  data: ReturnType<typeof snapshot>;
}
function saved(): Saved[] {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) || "[]");
    return Array.isArray(value)
      ? value.filter((p) => typeof p.name === "string" && p.data).slice(0, 100)
      : [];
  } catch {
    return [];
  }
}
function renderSaved() {
  const wrap = el("generatorSaved");
  wrap.replaceChildren();
  for (const [i, p] of saved().entries()) {
    const row = document.createElement("div");
    row.className = "saved-setup";
    const load = document.createElement("button");
    load.textContent = p.name;
    load.onclick = () => restore(p.data);
    const del = document.createElement("button");
    del.textContent = "Delete";
    del.setAttribute("aria-label", "Delete setup " + p.name);
    del.onclick = () => {
      try {
        const all = saved();
        all.splice(i, 1);
        localStorage.setItem(storageKey, JSON.stringify(all));
        renderSaved();
      } catch {
        message("Could not update saved setups.");
      }
    };
    row.append(load, del);
    wrap.append(row);
  }
  if (!wrap.childElementCount)
    wrap.textContent = "No complete setups saved yet.";
}
el("fullSave").onclick = () => {
  input("setupName").value = "";
  el<HTMLDialogElement>("setupDialog").showModal();
  input("setupName").focus();
};
el("setupCancel").onclick = () => el<HTMLDialogElement>("setupDialog").close();
el<HTMLFormElement>("setupForm").onsubmit = (e) => {
  e.preventDefault();
  const name = input("setupName").value.trim();
  if (!name) return;
  try {
    const all = saved();
    if (all.length >= 100) {
      message("Maximum 100 saved setups.");
      return;
    }
    all.push({ name, data: snapshot() });
    localStorage.setItem(storageKey, JSON.stringify(all));
    renderSaved();
    el<HTMLDialogElement>("setupDialog").close();
    message("Complete setup saved.");
  } catch {
    message("Could not save on this device.");
  }
};
el("fullShare").onclick = async () => {
  const url = new URL(location.href);
  url.searchParams.set("setup", JSON.stringify(snapshot()));
  try {
    await navigator.clipboard.writeText(url.href);
    message("Setup link copied.");
  } catch {
    input("setupLink").value = url.href;
    el<HTMLDialogElement>("linkDialog").showModal();
    input("setupLink").select();
  }
};
el("linkClose").onclick = () => el<HTMLDialogElement>("linkDialog").close();
for (const [group, items] of Object.entries(presetGroups)) {
  const title = document.createElement("h3");
  title.textContent = group;
  el("generatorBuiltins").append(title);
  const list = document.createElement("div");
  list.className = "preset-choices";
  for (const [name, f] of items) {
    const b = document.createElement("button");
    b.textContent = name + " · " + f + " Hz";
    b.onclick = () => {
      if (group === "Audio test") {
        state.multi = [
          {
            id: "test",
            f,
            wave: "sine",
            vol: 1,
            pan: 0,
            mute: false,
            solo: false,
          },
        ];
        fill();
        select("multi");
      } else {
        select("tone");
        bridge.restore({ hz: f });
      }
    };
    list.append(b);
  }
  el("generatorBuiltins").append(list);
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    audio.stop();
    bridge.stop();
  }
});
window.addEventListener("pagehide", () => {
  audio.stop();
  bridge.stop();
});
fill();
renderSaved();
const loadUrl = () => {
  const text = new URL(location.href).searchParams.get("setup");
  if (text)
    try {
      restore(JSON.parse(text));
    } catch {
      message("This setup link could not be loaded.");
    }
};
window.addEventListener("popstate", loadUrl);
loadUrl();
document.documentElement.dataset.ready = "true";
