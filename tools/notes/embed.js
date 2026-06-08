/* Rockeskolen – Notes Embed v1
 * Scope: staff + scale
 * Dependencies: VexFlow 4.x
 */

(function () {
  const VEXFLOW_SRC = "https://unpkg.com/vexflow@4.2.5/build/cjs/vexflow.js";
  const SCALE_API = "https://www.chordlink.net/api/scales/piano.php";

  // ---------- utils ----------
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function parseDataNotes(str) {
    // Example: "staff clef=treble scale=C-major oct=4"
    const out = {
      view: "staff",
      clef: "treble",
      scale: { root: "C", type: "major", octave: 4 }
    };

    if (!str) return out;

    str.split(/\s+/).forEach(tok => {
      if (tok === "staff") out.view = "staff";
      else if (tok.startsWith("clef=")) out.clef = tok.split("=")[1];
      else if (tok.startsWith("scale=")) {
        const [r, t] = tok.split("=")[1].split("-");
        out.scale.root = r || out.scale.root;
        out.scale.type = t || out.scale.type;
      }
      else if (tok.startsWith("oct=")) {
        out.scale.octave = parseInt(tok.split("=")[1], 10) || out.scale.octave;
      }
    });

    return out;
  }

  function showError(host, msg) {
    host.innerHTML = `<div style="color:#900;font-size:14px">${msg}</div>`;
  }

  // ---------- main ----------
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      await loadScript(VEXFLOW_SRC);
    } catch {
      console.error("VexFlow could not be loaded");
      return;
    }

    const VF = Vex.Flow;

    // A) <script data-notes>
    document.querySelectorAll("script[data-notes]").forEach(script => {
      const cfg = parseDataNotes(script.dataset.notes);
      const host = document.createElement("div");
      host.className = "rk-notes-container";
      script.after(host);
      renderStaffScale(host, cfg, VF);
    });

    // B) <div class="rk-notes" data-config="...">
    document.querySelectorAll(".rk-notes[data-config]").forEach(async div => {
      try {
        const cfg = await fetch(div.dataset.config).then(r => r.json());
        renderStaffScale(div, cfg, VF);
      } catch {
        showError(div, "Kunne ikke laste notekonfigurasjon");
      }
    });
  });

  // ---------- renderer ----------
  async function renderStaffScale(host, cfg, VF) {
    host.innerHTML = "";
    host.style.maxWidth = "960px";
    host.style.margin = "2rem auto";

    // fetch scale
    const url = new URL(SCALE_API);
    url.searchParams.set("root", cfg.scale.root);
    url.searchParams.set("type", cfg.scale.type);
    url.searchParams.set("oct", cfg.scale.octave);

    let notes;
    try {
      const json = await fetch(url.toString()).then(r => r.json());
      notes = (json.notes || []).map(n => n.name).filter(Boolean);
    } catch {
      showError(host, "Kunne ikke hente skala");
      return;
    }

    if (!notes.length) {
      showError(host, "Ingen noter i skala");
      return;
    }

    // SVG renderer
    const width = Math.min(960, host.clientWidth || 960);
    const renderer = new VF.Renderer(host, VF.Renderer.Backends.SVG);
    renderer.resize(width, 200);

    const ctx = renderer.getContext();
    const stave = new VF.Stave(10, 40, width - 20);
    stave.addClef(cfg.clef || "treble");
    stave.setContext(ctx).draw();

    // notes
    const vexNotes = notes.map(name => {
      const key = nameToVexKey(name);
      return new VF.StaveNote({
        clef: cfg.clef || "treble",
        keys: [key],
        duration: "q"
      });
    });

    const voice = new VF.Voice({
      num_beats: vexNotes.length,
      beat_value: 4
    }).setStrict(false);

    voice.addTickables(vexNotes);
    new VF.Formatter().joinVoices([voice]).format([voice], width - 60);
    voice.draw(ctx, stave);
  }

  function nameToVexKey(name) {
    // C4, Eb4, F#5 → c/4, eb/4, f#/5
    let s = name.replace("♭", "b").replace("♯", "#").trim();
    const m = s.match(/^([A-Ga-g])([#b]?)(-?\d+)$/);
    if (!m) return "c/4";
    return `${m[1].toLowerCase()}${m[2]}/${m[3]}`;
  }

})();
