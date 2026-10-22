# Frequency Generator

First-pass refactor of the supplied prototype. Public folder: `www/chordlink/tools/frequencygenerator/` (one word). The beta and comparison prototypes remain under `/beta/`.

## Baseline and scope

Commit `7dce761` contains the untouched prototype and original instructions. The original local ChordLink copy and the FTP copy of `index.html`, `styles.css`, and `app.js` were byte-identical before deployment. Work is isolated in this repository; the parent ChordLink repository was not reinitialized.

The six-mode layout, colors, typography, presets, controls, and product concept are retained. Essential header actions now remain visible on mobile. Master volume defaults to 30% digital amplitude; explicit saved/shared zero remains zero. This is not calibrated acoustic output.

## Run and verify

Use Node 22.12+ (or a recent supported Node LTS), pnpm 11 and PHP 8+. Production requires the existing ChordLink membership configuration. Tests use a local PHP membership fixture, never a production login.

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium webkit
php -S 127.0.0.1:5175 -t tests/server tests/server/router.php # separate terminal, test-only membership fixture
pnpm dev
pnpm check
```

`pnpm build` runs strict TypeScript checking and creates `dist/`. `pnpm test` runs unit tests, `pnpm test:e2e` runs Chromium/WebKit tests, and `pnpm format` formats source. Serve `dist/` over HTTPS; do not open `index.html` as a file. Vite uses relative asset paths for deployment under `/tools/frequencygenerator/`. Only deploy `dist/`, not source, Git, dependencies, or instruction files.

## Architecture

- `src/audio/graph.ts`: shared output, fade automation, disposable oscillator voices. Graph: mode voices → master volume → compressor → per-channel 0.95 sample ceiling → independent stereo balance gains → analyser → output. The balance stage attenuates individual channels without mixing binaural channels.
- `src/audio/{tone,multi,sweep,binaural,noise}.ts`: mode engines. Multi normalizes the sum of configured levels and updates stable voice IDs in place. Mute/Solo ramp gain; mute takes precedence over solo. Wave changes fade down before changing shape. Deleted voices stop on the audio clock and disconnect on `ended`.
- `src/audio/noise-worklet.js`: continuous independent stereo white/pink/brown noise. Filters retain state across render quanta; there is no two-second looping source. Noise type changes fade around the transition.
- `src/audio/controller.ts`: lazy AudioContext, awaited user-gesture resume, mutual exclusion between modes, cancellation of stale asynchronous starts. Mode switches, page hiding and navigation stop playback.
- `src/music/math.ts`: note/cents conversion (B and B♭), localized decimal parsing, slider mapping, device frequency limits, binaural calculation. Frequencies are bounded to 20 Hz–min(20 kHz, 0.49 × sample rate). Binaural pairs shift together at boundaries to retain beat spacing.
- `src/state/model.ts`: versioned, validated serializable state for every mode, including oscillator mute/solo, sweep loop, waveform, global settings and slider preferences. Supports old Tone links. URLs/presets never store playing status or autoplay.
- `src/presets/`: built-in presets and validated local persistence, including migration of legacy custom presets. User names render as text, not HTML.
- `src/ui/main.ts`: DOM bindings using the existing IDs/layout; accessible native preset and share dialogs, visible delete buttons, readouts and scope. Space operates the selected mode when focus is outside an interactive control.

## Audit and validation

Fixed prototype defects: 24 kHz scheduling; full Multi restarts and leaked nodes; unbounded summed output; repeating noise; right-click-only deletion; prompt dialogs; Tone-only state links; missing-URL-volume becoming zero; audio continuing after switching tabs; asynchronous starts surviving stop/switch; mobile header actions hidden by CSS.

2026-09-13: `pnpm check` passed: 8 unit tests and 10 browser tests (5 each in Chromium and WebKit). Browser coverage includes all mode starts/stops, procedural noise startup, decimal input, frequency cap, Multi node identity, mute/solo/add/delete, full-state reload, mobile preset save/load/delete and page width, sweep completion and cancellation. Offline rendered audio tests verify bounded 8-voice square-wave output and binaural frequency separation in left/right channels. TypeScript and production build pass.

## Remaining work and limits

- Playwright WebKit is an automated engine check, not a physical iPhone/iPad or installed Safari listening test. Bluetooth route changes, OS interruptions, long sessions, and audible transition quality still need device/listening QA.
- Sweep loops are scheduled from JavaScript timers with fades at cycle boundaries; they are not sample-accurate seamless loops. Background playback is intentionally stopped.
- The master ceiling is sample-based, not an inter-sample/true-peak mastering limiter. Limiting can distort loud combinations. No calibrated SPL or hearing-safety guarantee is implied. Peak/clipping UI is deferred.
- Pink-noise coefficients are the prototype filter model; precise spectral calibration across device sample rates is not claimed. Noise requires AudioWorklet support and a secure context; failures display an error instead of silently substituting a repeating buffer.
- Master volume/balance remain in the original Tone panel. Sweep edits restart only Sweep; Multi edits stay live.
- Tone and Multi accept decimal commas. Sweep/Binaural native numeric input handling remains browser/locale dependent.
- Presets support full-state save/load and explicit deletion. Rename, overwrite and reorder, configurable nudge size, arbitrary custom tuning, timer, localization, PWA/offline, native wrapping and WAV export remain future work.
- State is visible in the URL and may create long links with eight oscillators. Local preset storage is device/browser-specific and can be unavailable or cleared.

## Public membership release

See `RELEASE.md` for the Free/Pro/VIP policy, server authority, current test coverage and deployment record.

## Historical beta server access

The original beta deny-all `.htaccess` was fetched before editing. A narrowly scoped allow-expression opens only the two requested page URLs, their exact index files and the generator's explicit static assets. Other beta URLs and instruction files remain denied. No credentials are kept in this repository.
