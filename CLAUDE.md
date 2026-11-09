# Rockeskolen – handover til Claude

Sist oppdatert: 9. november 2026.

Dette dokumentet beskriver de viktigste reglene, plasseringene og arbeidsmåtene for Rockeskolen. Les også `AGENTS.md` før du gjør endringer. Ved motstrid gjelder de nyeste, eksplisitte instruksene fra brukeren foran eldre dokumentasjon.

## 1. Prosjekt og domener

- Lokal repo-rot: `/Users/pk/Documents/Codex/rockeskolen`
- GitHub: `https://github.com/pksinatra/rockeskolen.git`
- Produksjon, hovedside og verktøy: `https://rockeskolen.com/`
- Produksjon, musikkportal/Drupal: `https://portal.rockeskolen.com/`
- Standardgren: `main`
- FTP-dokumentroten `/www/` tilsvarer roten på `rockeskolen.com`.
- Drupal ligger lokalt under `portal/`. Produksjonsinnholdet i Drupal-databasen er autoritativt og kan være nyere enn lokale kopier.

Git og FTP er to separate publiseringsløp. En Git-push publiserer ikke nødvendigvis nettstedet, og en FTP-opplasting skal aldri gjøres uten uttrykkelig beskjed.

## 2. Ufravikelige redaksjonelle regler

- Bruk internasjonale tonenavn: **B**, aldri H som Rockeskolens tonenavn.
- Senket B skrives **B♭**, eller `Bb` i teknisk tekst.
- H kan bare omtales i historiske forklaringer om navnetradisjoner.
- Bruk **loop** som norsk musikkbegrep. Ikke oversett det til «sløyfe».
- Produktnavnet er **Rockeskolens Musikkportal**. I løpende tekst kan **musikkportalen** brukes.
- Ikke bruk «Portal», «Øvingsrommet» eller «Rockeskolens Digitale Øvingsrom» som gjeldende produktnavn.
- Utenfor ChordLink brukes **VIP**, ikke «VIP/PRO». ChordLink er det uttrykkelige unntaket.
- Portalens slagord er: **Spill. Utforsk. Lag musikk.**
- Menypunktet heter **Musikksymboler**, ikke «Begrepsordbok».
- Ikke omskriv tekst utover det brukeren ber om.
- Ikke endre URL-er, domener, filnavn, klasser eller variabelnavn uten eksplisitt beskjed.

## 3. Bevar brukerarbeid og produksjonsdata

- Start alltid med `git status --short --branch` og `git fetch` før du vurderer Git-tilstanden.
- Dette er en delt arbeidsflate. Staged, unstaged og usporede filer kan tilhøre brukeren eller en annen agent.
- Ikke bruk `git reset --hard`, `git checkout --`, force-push eller andre destruktive kommandoer.
- Ikke rydd, flytt eller slett mapper fordi de ser utdaterte eller dupliserte ut.
- Hent produksjonsinnhold fra Drupal før redigering av noder, blokker, menyer eller annen databasebasert tekst.
- Lokale eksportfiler, sikkerhetskopier og dokumentasjon kan være historiske. `PROJECT_OVERVIEW.md` inneholder blant annet det gamle portalnavnet og er ikke autoritativ for dagens branding.

## 4. Kanoniske verktøyadresser

Disse sju URL-ene er faste og skal alltid brukes:

| Verktøy | Lokal mappe | Kanonisk URL | FTP-mappe |
|---|---|---|---|
| Pianoakkorder | `tools/chords/piano/` | `/tools/chords/piano/` | `/www/tools/chords/piano/` |
| Gitarakkorder | `tools/chords/guitar/` | `/tools/chords/guitar/` | `/www/tools/chords/guitar/` |
| Pianoskalaer | `tools/scales/piano/` | `/tools/scales/piano/` | `/www/tools/scales/piano/` |
| Gitarskalaer | `tools/scales/guitar/` | `/tools/scales/guitar/` | `/www/tools/scales/guitar/` |
| Kvintsirkelen | `tools/circles/fifths/` | `/tools/circles/fifths/` | `/www/tools/circles/fifths/` |
| Tuner | `tools/tuners/` | `/tools/tuners/` | `/www/tools/tuners/` |
| Intervaller | `tools/intervals/` | `/tools/intervals/` | `/www/tools/intervals/` |

### Regler for `/tools/updated/`

- `/tools/updated/` er aldri en offentlig eller kanonisk adresse.
- Ikke lenk til `/tools/updated/` fra portalen, menyer, metadata, canonical-tags, API-kall eller innloggingsredirecter.
- Ikke flytt, gi nytt navn til eller slett mapper under `/tools/updated/` uten en særskilt instruks.
- Historiske `/tools/updated/`-kopier kan stå på produksjonsserveren som kilde eller sikkerhetsnett, men brukerne skal ikke sendes dit.

### Delte verktøyressurser

- Lokal mappe: `tools/shared/`
- Offentlig URL: `/tools/shared/`
- FTP-mappe: `/www/tools/shared/`
- PHP/VIP-oppsett og verktøykatalog: `tools/shared/bootstrap.php`
- Musikk-API: `tools/shared/music.php`
- Felles stil: `tools/shared/site.css`
- Felles språklogikk: `tools/shared/language.js`
- Datasett: `tools/shared/data/`
- Andre delte data: `tools/shared/help.json` og `tools/shared/translations.json`

Verktøyene skal peke til `/tools/shared/`, aldri `/tools/updated/shared/`. Behold PHP/VIP-wrapperen i hvert verktøys `index.php`.

Gitarskalaer bruker `app.css` og `ui.js`. De eldre `guitarscales.css` og `guitarscales.js` skal ligge urørt med mindre brukeren uttrykkelig ber om opprydding.

Tuner-mappen skal behandles som en sammenslåing. Bevar eksisterende filer og samplemapper; ikke erstatt hele mappen destruktivt.

## 5. Mapper som ikke skal «ryddes» automatisk

Det finnes historiske, eksperimentelle og dupliserte mapper, blant annet:

- `tools/chords/chords/`
- `tools/scales/scales/`
- `tools/scales/piano/bullshit/`
- `tools/scales/guitar/old/`
- `tools/chordlog/working/`
- `tools/notes/old/`
- `members/working04012026/`
- `docs/tool-upgrade-2026-09-27/`
- `docs/chordprog-portal-2026-09-28/`
- `docs/front-correction-2026-09-29/`

Disse er ikke nødvendigvis i bruk, men de skal ikke flyttes eller slettes uten konsekvensanalyse og uttrykkelig godkjenning.

`frequencygenerator/` er et eget, nestet Git-repo og skal foreløpig stå usporet i Rockeskolen-repoet. Ikke legg det til i foreldrerepoet og ikke endre det som del av en Rockeskolen-oppgave.

`.pnpm-store/` er lokal cache og skal være ignorert.

## 6. Hovedside og statiske sider

- Forside: `index.php` i repo-roten. Det skal bare finnes én forside – ingen `index.html`.
- Skoleside: `skoler/index.php`
- Workshops: `workshop/index.php`
- Verktøykatalog på hoveddomenet: `tools/index.php`
- Generell artikkelvisning: `article.php`
- Generell verktøyvisning: `tool.php`
- Bilder: `images/`
- Delte nettstedressurser: `assets/`

Ikke anta at en lokal statisk fil er autoritativ hvis tilsvarende innhold kommer fra Drupal eller en produksjonsdatabase.

## 7. Medlemskap, VIP, Stripe og FEIDE

Medlemsdelen ligger i `members/`.

Viktige filer:

- Felles medlemskonfigurasjon: `members/config.php`
- Lokal hemmelig konfigurasjon: `members/config.local.php`
- Trygg eksempelkonfigurasjon: `members/config.local.example.php`
- Innlogging: `members/login.php`
- Konto: `members/account.php`
- VIP-side: `members/upgrade.php`
- Stripe checkout: `members/stripe_checkout.php`
- Stripe webhook: `members/stripe_webhook.php`
- Stripe-retur: `members/stripe_complete.php`
- Portal/SSO: `members/portal.php` og `members/portal-return.php`
- Databasemigreringer: `members/migrations/`
- Tester: `members/tests/`

Tilgangsmodellen i `members/config.php` er:

- `pro`: ChordLink-funksjoner, ikke automatisk Rockeskolens VIP-innhold.
- `vip`: Rockeskolens VIP-innhold og ChordLink-verktøy.
- `admin`: begge deler.

FEIDE-innlogging går via musikkportalen på `portal.rockeskolen.com`. Bevar redirect-parametere til den kanoniske verktøyadressen.

VIP-siden er `/members/upgrade.php`. VIP-tekster på Rockeskolen skal ikke markedsføres som PRO. Gjeldende prisformulering i Bli VIP-bokser er **39,90 kr/mnd eller 299 kr/år** når begge prisene skal vises (månedspris først).

### Hemmeligheter

- `members/config.local.php` inneholder produksjonshemmeligheter og er ignorert av Git.
- Ikke vis, kopier til dokumentasjon, commit eller logg verdiene i denne filen.
- Database-, Stripe- og synkroniseringshemmeligheter skal hentes fra miljøvariabler som `CHORDLINK_DB_*`, `CHORDLINK_STRIPE_*` og `CHORDLINK_ROLE_SYNC_SECRET`.
- Ikke legg FTP-passord, API-nøkler, databasepassord eller tokens i repoet.
- Før push: skann alle nye commits for hemmeligheter og GitHub-filer over 100 MB.

## 8. Drupal / Rockeskolens Musikkportal

Drupal-koden ligger i `portal/`.

Viktig egendefinert kode:

- Medlemskap, VIP, SSO og FEIDE-kobling: `portal/modules/custom/rockeskolen_membership/`
- Struktur, canonical, forsider, serier og presentasjonslogikk: `portal/modules/custom/rockeskolen_structure_qa/`
- Skala-embed: `portal/modules/custom/scale_embed/`
- Egendefinert tema: `portal/themes/custom/rockeskolen/`
- Supplerende eksisterende temaendringer: `portal/themes/zuvipro/`
- Drupal-konfigurasjon med lokale produksjonsdata: `portal/sites/default/settings.php` – aldri commit eller eksponer hemmelighetene.

Databaseinnhold er ikke representert fullstendig av filene i repoet. Hent alltid aktiv node/blokk/meny fra produksjon før tekstendringer.

Etter endringer i Drupal-PHP, Twig, ruting, tjenester, biblioteker eller databaseinnhold må relevante Drupal-cacher tømmes. Bruk Drush når det er tilgjengelig. Hvis cache tømmes via database, begrens operasjonen til Drupal-tabeller med gjeldende prefiks og `cache_`; ikke rør andre tabeller.

## 9. Publisering og FTP

Publiser bare når brukeren uttrykkelig ber om det.

Ved FTP-publisering:

1. Avklar nøyaktig lokal mappe og produksjonsmappe.
2. Ikke last opp hele repoet.
3. Ikke slett serverfiler som ikke finnes lokalt.
4. Last opp til en midlertidig fil, last den ned igjen og sammenlign SHA-256 før atomisk erstatning.
5. Bevar en eksisterende produksjonsfil frem til den nye er verifisert.
6. Verifiser de offentlige URL-ene etterpå.
7. Tøm Drupal-cache bare når endringen berører Drupal eller når brukeren uttrykkelig ber om det.

Produksjonsstatus per 22. oktober 2026:

- `tools/shared/` er lastet opp og kontrollert.
- De seks kanoniske verktøymappene i tabellen over er lastet opp via FTP.
- Verktøysidene svarte HTTP 200 etter opplastingen.
- Drupal-cachen ble tømt etter opplastingen av de delte ressursene.
- `/tools/updated/` ble ikke slettet eller endret under migreringen.

## 10. Lokal testing

Start en enkel PHP-server fra repo-roten:

```bash
php -S 127.0.0.1:8796 -t /Users/pk/Documents/Codex/rockeskolen
```

Test minst:

- `http://127.0.0.1:8796/tools/chords/guitar/`
- `http://127.0.0.1:8796/tools/chords/piano/`
- `http://127.0.0.1:8796/tools/scales/piano/`
- `http://127.0.0.1:8796/tools/scales/guitar/`
- `http://127.0.0.1:8796/tools/circles/fifths/`
- `http://127.0.0.1:8796/tools/tuners/`
- `http://127.0.0.1:8796/tools/intervals/`
- `http://127.0.0.1:8796/tools/shared/music.php?type=scale`

Kontroller for hvert berørte verktøy:

- HTTP 200.
- Ingen PHP warnings, notices eller fatal errors.
- Ingen konsollfeil i nettleseren.
- Riktig canonical-tag.
- Riktig login-redirect.
- Ingen forekomster av `/tools/updated/`.
- Alle CSS-, JS-, sample- og API-kall svarer 200.
- PHP-syntaks med `php -l`.
- Visuell og funksjonell kontroll av verktøyet, ikke bare statisk HTML.

## 11. Git-arbeidsflyt

- Inspiser status og remote før arbeid.
- Ikke anta at lokal `main` er synkronisert med `origin/main`.
- Ikke inkluder brukerens eller andre agenters endringer i en commit uten eksplisitt grunn.
- Bruk små, avgrensede commits. Ved verktøymigrering: én commit per verktøy.
- Ikke force-push.
- Før push: bekreft `origin`, skann hemmeligheter og kontroller GitHub-grensen på 100 MB per fil.
- Remote skal være under `github.com/pksinatra`.
- FTP-opplasting og Git-push må rapporteres separat.

## 12. Praktisk beslutningsregel

Når du er usikker på hvilken versjon eller sti som er riktig:

1. Ikke flytt eller slett noe.
2. Sammenlign lokal fil, Git-historikk og produksjonsfil.
3. Se etter canonical-tag, ressursstier, API-stier og login-redirect.
4. Bruk den kanoniske URL-tabellen i dette dokumentet.
5. Be brukeren om avgjørelse hvis valget kan overskrive nyere arbeid eller endre offentlig struktur.

## Design, innhold og musikkfaglige prinsipper

Disse prinsippene supplerer de tekniske instruksjonene for repoet.

### Design

Rockeskolen skal oppleves moderne, musikalsk og profesjonell – ikke som en tradisjonell skolenettside.

- Hoveduttrykket er **mørkt/svart med røde aksenter**.
- Primær font er **Inter**.
- Layout skal være ryddig, luftig og lett å orientere seg i.
- Unngå unødvendig pynt, visuell støy og stereotyp «rock»-estetikk.
- Interaktive verktøy skal oppleves som deler av samme univers, selv om de enkelte grensesnittene kan være forskjellige.
- Ikke redesign etablerte sider eller verktøy bare for å gjøre alt visuelt likt, med mindre det er uttrykkelig ønsket.

Illustrasjoner skal støtte innholdet, ikke forsøke å forklare alt inne i selve bildet.

- **Ikke legg tekst inn i genererte illustrasjoner.**
- Piano og keyboard skal ha korrekt tangentoppsett.
- Musikalsk notasjon skal være faglig korrekt.
- Visuelt uttrykk skal aldri prioriteres foran musikalsk korrekthet.

### Innholdsstruktur

Portalen har allerede en etablert struktur. Prioriter **mer og bedre innhold innenfor denne strukturen** framfor nye kategorier, navigasjonsnivåer eller innganger.

Musikkteori er strukturert etter disse fagområdene:

- Noter
- Intervaller
- Akkorder og harmoni
- Skalaer
- Tonearter
- Melodi
- Rytme
- Form og struktur
- Frekvenser

Bruk eksisterende artikler og artikkelserier der det er mulig. Ikke dupliser stoff bare for å lage nye kurs, læringsstier eller innganger.

«Skolebenken» fases ut.

Rockeskolen har også det redaksjonelle området **Musikk i praksis**, med praktiske emner som låtskriving, musikkproduksjon, utgivelse og distribusjon, markedsføring, rettigheter og økonomi.

### Utviklingsprinsipper

Prioriter å forbedre, komplettere og knytte sammen det som allerede finnes.

Ikke ta utgangspunkt i at det må:
- opprettes nye innholdstyper
- legges til flere navigasjonsnivåer
- opprettes nye kategorier
- bygges nye versjoner av verktøy som allerede fungerer
- foreslås nye funksjoner før eksisterende løsning er forstått

Ny utvikling skal løse et reelt behov for brukeren, innholdet eller virksomheten.

Rockeskolen og ChordLink skal holdes konseptuelt adskilt. Rockeskolen kan bruke teknologi og verktøy fra ChordLink, men de er separate initiativer med ulike formål.

### Musikkfaglig korrekthet

Musikkteori må behandles som et musikalsk system, ikke bare som numeriske forhold.

Ved utvikling og kontroll av musikalsk logikk:

- vurder **musikalsk kontekst og funksjon**, ikke bare antall halvtoner
- bruk korrekt enharmonisk stavemåte
- skill mellom begreper som kan klinge likt, men ha ulik teoretisk funksjon
- ta hensyn til skalaer og strukturer som kan oppføre seg ulikt oppadgående og nedadgående
- følg etablerte notasjonskonvensjoner
- vær oppmerksom på avhengigheter mellom toner, intervaller, skalaer, akkorder, tonearter og harmonisk kontekst
- ikke anta at en numerisk eller teknisk mulig representasjon nødvendigvis er den musikalsk riktige

Hvis terminologi, notasjon eller analyse er usikker, skal dette undersøkes og verifiseres framfor å generaliseres ut fra en enkel regel.

### Redaksjonell tilnærming

Rockeskolen skal forklare musikk tydelig uten å gjøre faget enklere enn det er.

Prioriter:
- praktisk musikalsk forståelse
- presis terminologi
- eksempler som kan høres, sees eller prøves
- sammenheng mellom teori og praktisk musisering
- korte og lesbare tekster for nett
- eksisterende redaksjonelle valg og publisert struktur

Ikke gjør innhold lengre eller mer komplisert bare for å virke grundig.

Et gjennomgående prinsipp er:

**Spill hverandre gode!**

Det gjelder både musikalsk samspill og måten Rockeskolen utvikler innhold, verktøy og læringsmiljø på.

## Faste regler fra brukeren (22. oktober 2026)

- Kanoniske verktøy-URL-er er `/tools/chords/piano/`, `/tools/chords/guitar/`, `/tools/scales/piano/`, `/tools/scales/guitar/`, `/tools/circles/fifths/` og `/tools/tuners/`, med felles filer i `/tools/shared/`.
- `/tools/updated/` skal aldri brukes.
- Ingen mapper flyttes, opprettes, omdøpes eller slettes uten brukerens godkjenning. Dette gjelder alle mapper, ikke bare de som er listet i kapittel 5.
- `chordlink/` ligger på produksjonsserveren under `/www/chordlink/` (rockeskolen.com/chordlink/), har eget repo og er ikke en del av Rockeskolen-repoet. Den skal aldri endres, lastes opp til eller slettes som del av en Rockeskolen-oppgave, heller ikke ved FTP-publisering.
- I de seks verktøyene vises ikke PRO i menyer eller grensesnitt. VIP inkluderer Pro, og betalt innhold merkes **VIP**.
- Verktøyenes grensesnitt er på norsk som standard. Engelsk vises bare når `?lang=en` står i URL-en; språkvalget lagres ikke i cookie.

## Faste regler fra brukeren (23. oktober 2026)

- **Prisrekkefølge:** Månedspris først, så årspris: **39,90 kr/mnd eller 299 kr/år**. Dette erstatter den eldre rekkefølgen «299 kr i året / 39,90 mnd.».
- **PRO gir VIP:** PRO er ChordLinks betalingsnivå. En bruker med `pro` (eller en aktiv Pro-plan i Stripe) regnes som VIP på Rockeskolen og skal ikke sendes til `/members/upgrade.php`. Tilgangsrollene er `pro`, `vip` og `admin`. Motsatt vei, at VIP skal gi PRO på chordlink.net, er ikke bygget ennå; brukeren gir detaljer senere.
- **Skrivemåte for fortegn:**
  - Akkorder og tonearter i løpende tekst og i akkordnavn skrives med vanlige tegn: **Bb**, **Ab**, **F#m**, **Eb-dur**, **F#-dur**, trinn som **bVII**.
  - Enkelttoner (skalatoner, fortegnslister, enkeltnoter i tekst) skrives med **♭/♯**: E♭, F♯, «C – D – E♭ – F».
  - Notebilder og notelinjer bruker ♭/♯.
  - Dette presiserer regelen om B♭/Bb i kapittel 2. Er det uklart om noe er en akkord/toneart eller en enkelttone, spør brukeren.
- **Nye embeds:** Alle nye interaktive elementer til artikler legges direkte i `/embed/` (lokalt `embed/`, FTP `/www/embed/`), for eksempel `embed/rhythm.php` og `embed/interval.php`. Eksisterende embeds andre steder, som `/tools/notes/`, blir liggende der de er og skal ikke flyttes.

## Faste regler fra brukeren (25. oktober 2026)

- **Intervallverktøyet** ligger på `/tools/intervals/` (lokalt `tools/intervals/`, FTP `/www/tools/intervals/`). Det er hentet fra chordlink.net/tools/intervals/ og tilpasset Rockeskolen: Rockeskolens toppfelt og delingsdata via `tools/shared/bootstrap.php`, norsk som standard og engelsk bare med `?lang=en`, og lydfilene i `/audio/`. Endringer gjøres i Rockeskolens kopi, aldri i ChordLink.
- **Verktøyoversikten** styres av `includes/content.php` (`rs_tools()`). Den samme listen vises på rockeskolen.com/tools/ og på musikkportalens Verktøy-side. Produksjonsversjonen av filen er autoritativ; hent den før endringer.

## Arbeidsdeling og pågående mål (9. november 2026)

- **Claude tar det tekniske. Codex og ChatGPT står for planleggingen.** Planer kan komme inn som innlimt tekst. Gjennomfør dem teknisk, men følg reglene i dette dokumentet.
- **Mål 1:** Flytte alle verktøyene fra ChordLink over til Rockeskolen og tilpasse dem, på samme måte som intervallverktøyet. Det betyr toppfeltet og delingsdataene via `tools/shared/bootstrap.php`, norsk som standard og engelsk med `?lang=en`, VIP i stedet for PRO og ingen avhengigheter til ChordLink.
- **Mål 2:** Gjøre musikkportalen ferdig slik at den kan presenteres for skoler.

### Verktøy i ChordLink og Rockeskolen (lokale mapper, 9. november 2026)

Hentet fra `/Users/pk/Documents/Codex/chordlink/tools/` og `tools/`. Hvor langt hvert verktøy er tilpasset er ikke kartlagt ennå. At begge har en mappe med samme navn betyr ikke at Rockeskolens kopi er oppdatert.

| Status | Verktøy |
|---|---|
| Bare i ChordLink | `chordflow`, `chordplay`, `mxl-viewer`, `noted`, `progression-access`, `wheels/chords`, `explore-build`, `frequencygenerator` (Rockeskolen har `frequencer/`) |
| I begge | `charts`, `chordlog`, `chordprog`, `chords` (piano, guitar, notes), `circles/fifths`, `instruments/piano`, `intervals`, `notes`, `scales` (piano, guitar), `symbols`, `theory`, `tuners`, `visualizers/piano` |
| Bare i Rockeskolen | `games/mahjong`, `generators`, `soundlab`, `shared` |

## Fakta og faste regler lært underveis (oppdatert 9. november 2026)

### Forside og ruting

- **Det skal bare finnes én forside: `index.php`.** Ingen `index.html` i repoet eller på serveren. Kontrollert via FTP 9. november 2026: `/www/` har `index.php`, `index-wp.php` og to `*.codex-meta-backup`-filer, men ingen `index.html`. Disse filene skal ikke ryddes uten godkjenning.
- `.htaccess` har `DirectoryIndex index.html index.php`. Den har også en oppsamlingsregel som sender alle stier som ikke finnes til `/index.php`. Den er laget for gamle WordPress-permalenker.
- **Konsekvens for testing:** En URL som ikke finnes, svarer **HTTP 200 med forsiden**. Et 200-svar beviser altså ikke at en fil finnes på serveren. Kontroller innholdet, eller list filen via FTP.

### FTP

- Vert `ftp.domeneshop.no`, brukernavn `rockeskolen`. Passordet er det samme som i `~/.netrc`-oppføringen for `ftp.domeneshop.no`, men den oppføringen har et annet brukernavn (en annen konto). Les passordet med Pythons `netrc`-modul. Det skal aldri skrives ut eller lagres i repoet.
- Kontroller at du er på riktig konto ved å sjekke at `/www/embed/interval.php` finnes. Kjør `TYPE I` før `SIZE`.
- **FTP kan være den eneste kopien.** Serveren har filer som verken finnes på Macen eller på GitHub. Sikkerhetskopier lokalt før en serverfil endres.

### Rydding

- Mac, GitHub og FTP skal ryddes kontrollert og gradvis. **All rydding krever dobbel bekreftelse.** Det gjelder sletting, flytting, overskriving, opprydding i grener og committing av andres arbeid. Legg først fram planen og få et ja. Bekreft deretter en gang til med den konkrete listen.
- `members/config.php.save` og `members/debug.txt` ligger lokalt. Hva de inneholder og om de ligger offentlig tilgjengelig er ikke vurdert. Filene kan inneholde hemmeligheter, så ikke vis innholdet.

### ChordLink

- Lokal ChordLink-repo: `/Users/pk/Documents/Codex/chordlink` (remote `pksinatra/chordlink`). ChordLink skal **aldri** ligge i den lokale `rockeskolen/`-mappen. Under Rockeskolen finnes ChordLink bare på FTP (`/www/chordlink/`).
- ChordLink kan bli skilt ut og solgt. Den skal derfor ikke ha avhengigheter til Rockeskolen, og verktøy som kopieres til Rockeskolen skal ikke ha avhengigheter tilbake til ChordLink.

### Redaksjonelt

- **Spør før redaksjonelle valg** og valg som endrer hvordan innhold presenteres (skrivemåte, merkevare, bilder, tekst, hva som vises). Tekniske rettelser av klare feil kan gjøres direkte. Et kort «ja» på et spørsmål med flere alternativer er uklart, så spør hvilket alternativ som menes.
- **Ikke tull med stavemåten.** Skalaer og akkorder har én faglig riktig stavemåte, og alternative stavemåter skal ikke presenteres som like riktige. Eksempel: C hel–halv dim er **C – D – E♭ – F – F♯ – G♯ – A – B**. F og F♯ er ulike toner. Spør hvis du er usikker.
- Frasen **«Musikk på nett og i virkeligheten»** skal ikke brukes. Slagordet er «Spill. Utforsk. Lag musikk.».
- **Noteillustrasjoner:** Mange hvite notelinjer i full bredde blir stripete mot den mørke portalen. Bruk mørk bakgrunn i samme stil som `embed/lab.css`, og samle små eksempler i én illustrasjon per tema.
- **Kildekode for publiserte filer** (f.eks. figurgeneratorer for SVG-er i `images/`) skal committes i repoet, typisk i en mappe under `docs/`. Se `docs/figurer-musikkproduksjon-2026-10/` og `docs/figurer-musikk-i-praksis-2026-11/`. Kildekoden skal ikke bare ligge i en lokal skissemappe. Nye mapper krever fortsatt godkjenning.
- Svar alltid brukeren på norsk (bokmål).

### Git

- Når brukeren ber om push, skal hele lokale `main` synkroniseres med origin, også commits fra Codex og andre økter. Kjør `git fetch` og integrer uten force-push. Skann upushede commits for hemmeligheter og filer over 100 MB, og nevn kort hvilke andre commits som ble med. Ucommittede og usporede filer fra andre skal fortsatt ikke committes uten grunn.

### Drupal, medlemskap og FEIDE

- Drupal er den autoritative medlemsbasen (migrert 11. august 2026). SQL-tabellene er et tilgangsspeil. Se `docs/drupal-som-autoritativ-medlemsbase.md` og `docs/innlogging-og-sso.md`.
- Brukeren installerer Drupals sikkerhetsoppdateringer selv, så ikke mas om advarselen. Planen er å oppgradere til Drupal 12 når den kommer. Da må egne moduler få `core_version_requirement: ^11 || ^12` og sjekkes for API-endringer.
- **FEIDE gjennomgås samlet av brukeren senere.** Valg som avhenger av FEIDE, som hvordan lærervisningen finner elevene sine, utsettes. Ikke endre FEIDE-koden i `rockeskolen_membership` som en del av andre oppgaver.

### Kart over repoet (hovedtrekk)

- `includes/`: felles toppfelt (`app-header.php`, `front-header.php`), `meta.php`, stil og `content.php` (`rs_tools()`).
- `embed/`: interaktive elementer til artikler (`chord`, `circle`, `form`, `groove`, `home`, `interval`, `ladder`, `melody`, `mode`, `pulse`, `rhythm`, `sound`, `staff`). Felles stil ligger i `lab.css`, og `autoheight.js` justerer høyden på iframes.
- `skoler/`, `workshop/`, `kurs/`, `vip/`, `admin/`, `api/`, `audio/`, `images/`, `assets/`.
- Eksperimentelle frekvensmapper i roten: `frequencer-layout/`, `frequencer-next/`, `frequencygenerator-etherea-beta/`. `frequencygenerator/` er et eget repo.
- `docs/` har planer og statusdokumenter (portal, skoletilgang, SSO). De kan være historiske, så kontroller mot produksjon.
