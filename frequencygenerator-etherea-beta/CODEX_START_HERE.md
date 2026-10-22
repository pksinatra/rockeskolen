# Start here in Codex

## First task
Review the existing prototype and turn it into a maintainable foundation without changing its product concept or doing a visual redesign.

### Goals for this first Codex pass
1. Audit the current audio implementation and identify correctness, safety and lifecycle problems.
2. Set up Vite + TypeScript and move the existing functionality into modular code while preserving the current UI and behavior as closely as practical.
3. Separate the shared/master audio graph from Tone, Multi, Sweep, Binaural and Noise engines.
4. Fix the high-frequency/Nyquist issue. Normal UI range should remain 20 Hz–20 kHz, and runtime limits must also respect the device AudioContext sample rate.
5. Add a conservative master safety/limiting stage so multiple oscillators cannot create uncontrolled summed peaks.
6. Make Multi controls update active oscillators smoothly instead of restarting all tones on every input event.
7. Add Mute and Solo to each Multi oscillator.
8. Replace the 2-second looping noise buffer with a better realtime/procedural approach, preferably AudioWorklet if browser support and implementation complexity are acceptable.
9. Replace right-click preset deletion and `prompt()` preset naming with mobile-friendly accessible UI.
10. Make URL/share state serializable for all generator modes, not only Tone.
11. Add automated tests for pure math/state code and a small set of browser smoke tests.
12. Preserve the conservative startup volume and click-free fades.

### Important non-goals for the first pass
- Do not add accounts, cloud sync or a backend.
- Do not add health/healing claims.
- Do not build the native iOS/Android wrapper yet.
- Do not perform a major visual redesign.
- Do not add WAV export until the realtime engine/refactor is stable.

### Deliverables
- Working dev/build scripts.
- Modular TypeScript source.
- Existing feature parity plus the fixes above.
- Tests and a short technical README explaining architecture and how to run/build/test.
- A concise list of remaining product/technical risks after the pass.
