# Frequencer layout release — 2026-09-17

Production: https://frequencyetherea.com/lab/frequencer/
Beta: https://www.chordlink.net/beta/frequencer/

Production was fetched from FTP before editing. Original files are retained as `*.original.*`; rendered original is `production.live.html`.

Production changes are restricted to CSS: restore two-column header and studio/library layout above 980px, compact transport, and fit waveform buttons at tablet widths. All production scripts, controls, audio and Frequency Etherea Premium authentication remain unchanged.

Beta uses the same production application with an open entitlement bootstrap and absolute Frequency Etherea navigation links. This is an intentionally public preview. It has one noindex meta tag and a parent-directory X-Robots-Tag header. Existing ChordLink robots.txt already disallows /beta/ and was left unchanged. Existing directory access rules were preserved.

Validation: 46 Playwright tests passed across Chromium and WebKit, including nine viewport widths, Free/Premium behavior, presets, sequence controls and open beta access. PHP syntax check passed. Remote source was compared with backups before atomic replacement; uploaded bytes were read back and verified.

Published files:
- c3space: www/frequencyetherea/lab/frequencer/index.php
- rockeskolen: www/chordlink/beta/frequencer/index.html
- rockeskolen: www/chordlink/beta/.htaccess

See live-verification.json for post-deployment HTTP verification.
