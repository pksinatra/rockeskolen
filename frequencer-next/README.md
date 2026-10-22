# Frequencer — generator modes beta

This is the Frequency Etherea application extended with ChordLink Frequency Generator modes. The original Etherea Tone layout, Sound Color, harmonics, library, quick sessions, custom tone presets and session sequences remain in index.html. A narrow bridge coordinates playback and complete setup snapshots with the new TypeScript modes.

Added: eight-voice Multi with live mute/solo/level/pan; linear/log Sweep with loop/ping-pong; true stereo Binaural; procedural white/pink/brown Noise; audio-test presets; timers and master balance for added modes; complete setup save/load/delete and sharing. Complete setups use their own storage key and do not replace existing Frequencer presets. Switching modes cancels playback. Loading links never starts sound.

This is an intentionally open beta at https://www.chordlink.net/beta/frequencer/. The production Frequency Etherea login implementation is not changed. Do not deploy this open beta to production as-is. noindex meta, parent X-Robots-Tag and existing robots.txt exclusion cover /beta/.

Build: pnpm build. Tests: pnpm test, pnpm test:e2e, pnpm test:production. Tests use Chromium and WebKit. Pure audio rendering checks run against source modules; UI and interaction checks also run against the static production build.

Original Tone retains its 20–4000 Hz range and Etherea sound. Audio-test presets above this range use a pure Multi voice; new engines support 20–20000 Hz with device-dependent Nyquist limits. New engine output includes the existing Frequency Generator safety stage. Two separate audio implementations are coordinated, rather than rewriting the working Etherea audio engine during this beta pass.

Backups contain the previously deployed beta page and parent access rule. Deployment uploads only dist, first assets, then an exact-file allowlist, then index.html. The parent rule preserves the separate Frequency Generator beta and its existing allowed filenames. No production pages are changed.

The earlier inverse-direction prototype is kept separately in ../frequencygenerator-etherea-beta and is not deployed.
