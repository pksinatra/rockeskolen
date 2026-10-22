# Known prototype issues / review checklist

These are known before the Codex refactor and should not be mistaken for newly discovered regressions.

- Some internal controls accept frequencies up to 24 kHz. This can exceed Nyquist on a 44.1 kHz AudioContext and must be fixed.
- Multi oscillator changes currently stop/restart the full Multi graph, causing unnecessary gaps and churn.
- Multi does not yet have Mute/Solo although it is part of the intended product design.
- Noise is generated into a two-second repeating buffer rather than procedurally for continuous playback.
- There is no dedicated master limiter/peak/clipping indicator for summed oscillator output.
- Custom preset deletion relies on a context-menu/right-click gesture, which is poor on mobile.
- Preset naming uses browser `prompt()`.
- Custom presets do not yet persist the complete state users may expect.
- Shared URLs currently encode only the main Tone settings.
- Nudge buttons are fixed rather than using a configurable step size.
- Custom tuning reference is not implemented.
- No PWA manifest/service worker/offline install flow yet.
- No automated unit or E2E tests yet.
- UI text/localization is not yet architected; decimal-comma numeric input deserves explicit handling for locales that use it.
- Native background playback/media controls are intentionally not part of this prototype.
