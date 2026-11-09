# Publisering av illustrasjoner – november 2026

Skriptene som ble brukt til å modernisere illustrasjonene i Musikkteori og Musikk i praksis (4.–5. november 2026). Endringene er allerede gjort i produksjon. Skriptene ligger her som dokumentasjon og som mal for senere runder.

## Felles

- `db.inc.php` kobler til Drupal-databasen med oppsettet i `portal/sites/default/settings.php` (som ikke ligger i Git). Ingen hemmeligheter står i skriptene.
- `work.inc.php` setter arbeidsmappen for sikkerhetskopier og nedlastede noder: `RS_WORK` eller systemets tmp-mappe (`…/rockeskolen-publisering`). Ingenting skrives i repoet.
- `release.py` laster opp filer til rockeskolen.com via FTP (bruker og passord fra `~/.netrc`). Den stopper hvis produksjonsfilen avviker fra Git (`base=REV` velger commit å sammenligne med), tar sikkerhetskopi, laster opp til en midlertidig fil, kontrollerer SHA-256 og bytter navn. `python3 release.py <filer> [base=REV] [apply]`.
- `cache.php` tømmer bare Drupal-tabellene med prefiks og `cache_`.
- `dump.php`, `list.php`, `series.php` og `sect.php` henter og viser noder fra produksjon før redigering.

## Endringsskript per runde

Alle tørrkjører uten `apply`. De tar sikkerhetskopi av hver node, krever at hvert mønster treffer nøyaktig én gang, og skriver i en transaksjon som avbrytes hvis noden er endret underveis. Kjøres de på nytt, stopper de fordi de gamle boksene er borte.

| Skript | Noder | Hva |
|---|---|---|
| `insert300.php` | 300 | Trappe-illustrasjonen i «Toner på en stige» |
| `noter.php` | 163–166 | Noter-serien: `embed/staff.php` |
| `akkord.php` | 174–178 | Akkorder og harmoni: `embed/chord.php` |
| `dup174.php` | 174 | Fjernet en setning som sto to ganger |
| `skala.php` | 17, 154–161, 222–228 | Skalaer: `embed/mode.php` |
| `dim161.php`, `steps161.php` | 161 | Rettet bruken av halv–hel og hel–halv dim, trinnvisningene som figurer |
| `tonearter.php` | 15, 163, 181, 216, 288 | Tonearter og Fortegn, med faste fortegn |
| `praksis.php` | 261–276 | Låtskriving, Øving og Samspill: skisse, rytme, puls, groove, form og melodi |
| `utgivelse.php` | 235–243 | SVG-figurene fra `../figurer-musikk-i-praksis-2026-11/` |
| `circle289.php` | 289 | Beslektede tonearter: `embed/circle.php` |
| `publish289.php` | 289 | Publiserte artikkelen (status 1 på noden og gjeldende revisjon) |

Etter endringer i noder: kjør `php cache.php`.
