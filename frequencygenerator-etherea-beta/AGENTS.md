# Frequency Generator — Codex project instructions

## Product goal
Build a precise, modern, web-first frequency/tone generator that can later be packaged as native iOS/Android apps. The experience should feel extremely simple in Tone mode while exposing advanced capabilities in separate modes.

## Product principles
- Web first. No backend is required for core audio generation.
- Audio correctness, smoothness, safety and mobile usability come before visual polish.
- Keep Tone mode calm and simple. Advanced features belong in dedicated modes.
- Do not present health/healing claims as established facts. Solfeggio values may exist as labeled presets without medical claims.
- Volume is digital amplitude (0–100%), never claim calibrated dB SPL.
- Default playback volume must remain conservative.
- Never compensate for inaudible low/high frequencies by automatically increasing gain.
- Preserve shareable/deep-linkable state.
- Design for touch, keyboard and screen-reader use.

## Current prototype
The prototype is intentionally small and dependency-free:
- `index.html`
- `styles.css`
- `app.js`

It currently implements Tone, Multi, Sweep, Binaural, Noise and Presets using the Web Audio API.

Treat this as a functional product prototype, not a finished architecture. Refactoring is expected.

## Preferred architecture for the next stage
Use Vite + TypeScript and separate the audio engine from UI/state. Do not introduce a heavy frontend framework unless there is a clear benefit that is documented first.

Suggested structure:
- `src/audio/` — shared audio graph, master output, safety limiter, mode engines
- `src/music/` — frequency/note/cents/tuning math
- `src/state/` — serializable application state and URL state
- `src/ui/` — controls and mode-specific UI
- `src/presets/` — built-in preset data and user-preset model
- `tests/` — unit and browser/E2E tests

## Audio invariants
- Use Web Audio API for real-time synthesis.
- Use short fades/automation for starts, stops and parameter transitions to avoid clicks.
- Never schedule oscillator frequencies above a safe device-dependent upper limit. Respect Nyquist (`sampleRate / 2`) and the product's normal 20 kHz ceiling.
- Keep Sine as the default/reference waveform.
- Multi oscillator edits should update live nodes smoothly; do not tear down/restart the entire graph for every slider/input event.
- Add protection against summed-output clipping in Multi/Binaural/Noise via a sensible master safety stage and expose clipping/peak feedback if useful.
- Binaural mode must maintain true left/right channel separation before the master output stage.
- Noise should eventually be procedurally generated (AudioWorklet preferred) rather than relying on a short repeating buffer.

## UX invariants
- Direct numeric Hz entry is always available and obvious.
- Logarithmic slider is the default; linear remains optional.
- Keep octave halve/double controls.
- Fine-step controls must support configurable step size.
- Never require right-click/long-press for essential actions such as deleting presets.
- Avoid browser `prompt()` for normal product UI; use accessible dialogs/sheets.
- All modes should be usable on narrow mobile screens.
- User-facing frequency input should accept sensible localized decimal input where possible.

## Functional target
Modes:
1. Tone
2. Multi
3. Sweep
4. Binaural
5. Noise
6. Presets

Near-term additions:
- Multi Mute/Solo
- configurable nudge step
- complete share/deep-link state for every mode
- better preset editor (add/edit/delete/reorder)
- peak/clipping safety feedback
- custom tuning reference
- timer/sleep timer
- PWA/offline/installability
- WAV export using OfflineAudioContext (after the realtime engine is stable)

Native app concerns such as background audio/media controls belong to a later Capacitor/native phase and must not complicate the first web refactor unnecessarily.

## Testing requirements
Before considering a refactor complete:
- Add unit tests for frequency-slider mapping, note/cents conversion, binaural frequency calculation and state serialization.
- Add browser/E2E smoke tests for Play/Stop and mode switching where practical.
- Test current Safari/WebKit and Chromium behavior, especially AudioContext resume/user-gesture behavior.
- Run all configured checks before finishing a task.

## Working style
For substantial changes, first inspect the code and propose a short implementation plan. Prefer small, reviewable steps. Preserve working behavior while refactoring. Do not redesign the visual language unless the task explicitly asks for it.
