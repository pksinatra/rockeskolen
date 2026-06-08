// /apps/scales/js/scale-embed.js

(() => {
  const API_URL = "/api/scales/piano.php";

  // Legg til enkel standard-styling hvis ikke allerede lagt inn
  function injectStyles() {
    if (document.getElementById("scale-embed-styles")) return;
    const css = `
      .scale-demo{margin:12px 0;padding:8px;border-radius:10px;
        background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);
        max-width:260px;font-family:system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;}
      .scale-demo-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;}
      .scale-demo-label{font-size:13px;color:#e8eeff;}
      .scale-demo-meta{font-size:11px;color:#9fb1cf;}
      .scale-demo button.play-scale{font-size:12px;padding:4px 8px;border-radius:8px;
        border:0;cursor:pointer;background:linear-gradient(135deg,#ff5c7a,#b28bff,#54d2f2);
        color:#061020;font-weight:600;}
      .se-keyboard{position:relative;width:210px;height:70px;margin-top:6px;}
      .se-whites{display:flex;height:70px;}
      .se-white{flex:1 0 auto;position:relative;background:#fff;border:1px solid #ccc;
        box-sizing:border-box;border-bottom-left-radius:4px;border-bottom-right-radius:4px;}
      .se-white-label{position:absolute;bottom:3px;left:0;right:0;font-size:9px;color:#111;text-align:center;}
      .se-blacks{position:absolute;inset:0;pointer-events:none;}
      .se-black{position:absolute;top:0;width:18px;height:42px;background:#111;border:1px solid #222;
        border-bottom-left-radius:4px;border-bottom-right-radius:4px;pointer-events:auto;
        box-shadow:inset 0 -4px 0 rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.1);}
      .se-white.active{background:linear-gradient(135deg,#ff5c7a,#b28bff,#54d2f2);
        box-shadow:0 0 12px rgba(178,139,255,0.55);}
      .se-black.active{background:linear-gradient(135deg,#b28bff,#54d2f2);}
      .se-note-dot{position:absolute;top:4px;left:50%;transform:translateX(-50%);
        background:rgba(0,0,0,0.8);color:#fff;font-size:9px;padding:1px 4px;border-radius:999px;}
    `;
    const style = document.createElement("style");
    style.id = "scale-embed-styles";
    style.textContent = css;
    document.head.appendChild(style);
  }

  // Lyd
  const AC = new (window.AudioContext || window.webkitAudioContext)();
  const midiToFreq = m => 440 * Math.pow(2, (m - 69) / 12);
  function ping(midi, offset = 0) {
    const t = AC.currentTime + offset;
    const o = AC.createOscillator();
    const g = AC.createGain();
    o.type = "triangle";
    o.frequency.value = midiToFreq(midi);
    o.connect(g); g.connect(AC.destination);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.22, t + 0.01);
    g.gain.linearRampToValueAtTime(0.12, t + 0.18);
    g.gain.exponentialRampToValueAtTime(0.0008, t + 0.70);
    o.start(t); o.stop(t + 0.72);
  }

  // Enkel keyboard-render for én oktav C..B
  const WHITE_PCS = [0,2,4,5,7,9,11];
  const BLACK_AFTER = {0:1,2:3,4:null,5:6,7:8,9:10,11:null};
  const N_SHARP = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

  function buildMiniKeyboard(container, octave, activePcs) {
    container.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "se-keyboard";

    const whites = document.createElement("div");
    whites.className = "se-whites";
    const blacks = document.createElement("div");
    blacks.className = "se-blacks";

    const whiteWidth = 210 / 7;
    const blackWidth = 18;

    WHITE_PCS.forEach((pc, idx) => {
      const w = document.createElement("div");
      w.className = "se-white";
      const label = document.createElement("div");
      label.className = "se-white-label";
      const name = N_SHARP[pc] + octave;
      label.textContent = name;
      w.appendChild(label);
      if (activePcs.has(pc)) {
        w.classList.add("active");
        const dot = document.createElement("div");
        dot.className = "se-note-dot";
        dot.textContent = "●";
        w.appendChild(dot);
      }
      whites.appendChild(w);

      const bpc = BLACK_AFTER[pc];
      if (bpc !== null && bpc !== undefined) {
        const b = document.createElement("div");
        b.className = "se-black";
        const left = (idx + 1) * whiteWidth - (blackWidth / 2);
        b.style.left = left + "px";
        if (activePcs.has(bpc)) {
          b.classList.add("active");
        }
        blacks.appendChild(b);
      }
    });

    wrap.appendChild(whites);
    wrap.appendChild(blacks);
    container.appendChild(wrap);
  }

  async function init() {
    injectStyles();

    const demos = document.querySelectorAll(".scale-demo");
    if (!demos.length) return;

    for (const box of demos) {
      const root  = (box.dataset.root || "C").toUpperCase();
      const scale = box.dataset.scale || "major";
      const oct   = box.dataset.oct || "4";
      const label = box.dataset.label || "";

      const header = document.createElement("div");
      header.className = "scale-demo-header";

      const labelEl = document.createElement("div");
      labelEl.className = "scale-demo-label";
      labelEl.textContent = label || `${root} ${scale}`;

      const metaEl = document.createElement("div");
      metaEl.className = "scale-demo-meta";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "play-scale";
      btn.textContent = "Spill skala";

      header.appendChild(labelEl);
      header.appendChild(btn);

      const keyboardHost = document.createElement("div");
      keyboardHost.className = "se-kb-host";

      box.appendChild(header);
      box.appendChild(keyboardHost);
      box.appendChild(metaEl);

      let notes = null;
      let info = null;

      async function loadScale() {
        const url = `${API_URL}?root=${encodeURIComponent(root)}&scale=${encodeURIComponent(scale)}&oct=${encodeURIComponent(oct)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.error) {
          metaEl.textContent = data.error;
          return;
        }
        notes = data.notes || [];
        info = data;
        metaEl.textContent = `${data.scaleName} • oktav ${data.octave}`;
        const pcs = new Set(notes.map(n => {
          const midi = n.midi;
          return ((midi % 12) + 12) % 12;
        }));
        buildMiniKeyboard(keyboardHost, parseInt(oct, 10), pcs);
      }

      btn.addEventListener("click", async () => {
        if (!notes) {
          await loadScale();
        }
        if (!notes || !notes.length) return;
        let t = 0;
        const step = 0.25;
        notes.forEach(n => {
          ping(n.midi, t);
          t += step;
        });
      });

      // Forlaster skalaen rolig i bakgrunnen (visuelt)
      loadScale().catch(() => {});
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
