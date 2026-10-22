# Public release: /tools/frequencygenerator/

The user confirmed manual testing of the preceding audio refactor. This release preserves its layout and audio engines, adds the ChordLink footer, sets the missing-volume fallback to 30% digital amplitude, and connects feature access to existing ChordLink membership.

## Defaults and preservation

Explicit volumes, including zero and previous 20% states, survive normalization, old Tone links, complete state links, preset loading, and reload. The audio graph receives the explicit initial volume before a voice starts; a saved zero cannot briefly ramp down from the default. Local presets are not erased or rewritten when a user lacks Pro. Free users can still see their saved preset names, but loading/saving/deleting custom presets requires Pro.

## Canonical membership integration

`public/access.php` loads the real `/members/config.php`, verifies `chordlink_db_available()`, calls `refresh_user_from_db()`, and uses `is_pro_user()`. This is the canonical ChordPlay flow with an explicit fail-closed database check. The existing `PRO_ROLES` includes Pro, VIP and admin; VIP has no separate UI. No account system or entitlement is created in local storage. Responses are private/no-store.

GET returns presentation hints. Each Pro-only action requests POST authorization for its feature using the current same-origin session. The server ignores claimed roles, local flags and query parameters. Unsupported features deny by default. Denial or network errors leave the action unavailable and return the application to Free limits without overwriting saved presets. Tests forge local/URL flags and change the session role after page initialization.

Synthesis and user preset data remain local. These server checks establish membership authority for the application; JavaScript running on a visitor's own device cannot be made tamper-proof or treated as DRM. Any future server-side export, storage or professional workflow must authorize its actual server operation through the same canonical membership check, never merely accept a browser capability flag.

## Features

| Feature                                                          | Anonymous / Free                                      | Pro / VIP               |
| ---------------------------------------------------------------- | ----------------------------------------------------- | ----------------------- |
| Tone controls, all four waves, reference choices, volume/balance | Full                                                  | Full                    |
| Multi                                                            | 2 voices, all per-voice controls                      | Up to 8 voices          |
| Sweep                                                            | Single run, linear/log, up/down                       | Also loop and ping-pong |
| Binaural                                                         | Core generator                                        | Full                    |
| Noise                                                            | White/pink/brown                                      | Full                    |
| Built-in presets                                                 | Full                                                  | Full                    |
| Custom presets                                                   | Names retained, actions prompt for Pro                | Save/load/delete        |
| Tone share                                                       | Available, backward-compatible f/wave/vol/pan URLs    | Available               |
| Complete advanced share/restore                                  | Pro prompt; explicit Tone volume retained on fallback | Available               |

The common feature registry is the extension point for future export, preset editing, timers and workflow actions. Unimplemented names are rejected, rather than prematurely unlocked.

## Footer and presentation

Footer matches the existing ChordLink dark footer convention and exact requested tagline. Links are `/tools/`, `/members/upgrade.php`, `/members/`, `/privacy/`, `/terms/`; canonical URLs and Pro copy were checked against live ChordLink/ChordPlay source. Discreet PRO chips identify restricted controls. The upgrade dialog appears on attempted restricted actions and links to Explore Pro; there is no blanket paywall.

## Validation

`pnpm check` runs unit tests, strict TypeScript/build, browser tests against Vite plus the real PHP adapter, and the release matrix again against the built production files served through PHP. Membership roles are provided only by a non-deployed test fixture that uses the verified canonical role check. No test fixture, role cookie implementation or source repository is in `dist/`.

Coverage includes default/explicit volumes; Anonymous and Free limits; Pro and VIP eight-voice, sweep, custom-preset and share access; old Tone URLs; advanced restores; canonical footer at desktop/mobile widths; database/network failure; forged flags; stale membership; audio play/stop, noise, continuous Multi node identity, rendered peak/left-right separation and zero startup output.

## Deployment

Only `dist/` belongs in `/www/chordlink/tools/frequencygenerator/`. It contains `index.html`, exact hashed CSS/JS assets and the PHP membership adapter. Do not deploy the Vite source, fixtures, members configuration or credentials. The existing beta deployment remains unchanged.

Live Pro/VIP user sessions were not impersonated or modified for testing; role behavior is covered using the local fixture and the canonical function. The live anonymous adapter and public page are verified after deployment.

Final validation on 2026-09-14: 12 unit tests, 40 Chromium/WebKit browser tests, and 28 production-build browser tests passed. PHP lint, strict TypeScript, production build, whitespace checks and exclusion of test identity fixtures from dist passed.

Published 2026-09-14 to https://chordlink.net/tools/frequencygenerator/. All five dist files were read back over FTPS and verified byte-for-byte. Live checks: page HTTP 200 with public canonical URL and no noindex; anonymous capabilities returned `features: []`, `maxVoices: 2`, no-store; forged anonymous Pro request returned HTTP 403. In-app browser confirmed 30% new-state volume, two Multi voices, the third-voice Pro explanation and canonical compact footer in a narrow window. Playback was left stopped. Beta files were not modified.
