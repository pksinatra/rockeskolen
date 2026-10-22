# Rockeskolen – verktøystatus 27. september 2026

**Oppdatering 28. september:** ChordProg er nå publisert på norsk på Rockeskolen, og portalens lenke og ChordFlow-boks er rettet. Se [oppfølgingsrapporten](../chordprog-portal-2026-09-28/STATUS.md).

Seks frittstående verktøy er oppgradert og publisert med norsk og engelsk språkvalg. Rockeskolens verktøykatalog peker til dem. Gamle appadresser, lærebokvisninger, Drupal-innhold og medlemsdatabaser er ikke endret.

## Oppgraderte verktøy

| Verktøy | Endring | Åpne |
|---|---|---|
| Gitarakkorder | Nyere publisert ChordLink-motor, oppdaterte akkorddata, lydkontroller og grepvisning. Gjest/gratis og VIP/PRO håndteres på Rockeskolen. | [Gitarakkorder](https://rockeskolen.com/tools/updated/guitar-chords/) |
| Pianoakkorder | Flere akkordtyper, oppdaterte formler, lydtype, etterklang og volum. Eksisterende gjest/gratis-utvalg beholdt. | [Pianoakkorder](https://rockeskolen.com/tools/updated/piano-chords/) |
| Gitarskalaer | Nyere publisert motor, 38 skaladefinisjoner, én/to oktaver, tempo, klangvalg og tonenavn/intervaller. | [Gitarskalaer](https://rockeskolen.com/tools/updated/guitar-scales/) |
| Pianoskalaer | Nyere publisert versjon og skalaoversikt, avspilling med lydkontroller, norsk/engelsk. | [Pianoskalaer](https://rockeskolen.com/tools/updated/piano-scales/) |
| Kvintsirkel | Funksjonelt allerede nær ChordLink. Samordnet publisert versjon, språkvalg, ryddigere hjelpetekst og korrigert engelsk «relative minor». | [Kvintsirkel](https://rockeskolen.com/tools/updated/fifths/) |
| Tuner | Største funksjonsløft: fra enkel stemmegaffel til mikrofontuner, stemmegaffel og gitar, bass, ukulele, banjo, fiolin, bratsj og cello. Seks gitarsamples; andre instrumenter har modellert lyd. | [Tuner](https://rockeskolen.com/tools/updated/tuner/) |

Alle seks har språkvalg **Norsk / English** øverst. Norsk er standard; valgt språk huskes for disse appene. Direkte valg: `?lang=nb` og `?lang=en`. Internasjonale tonenavn B og B♭/Bb beholdes.

Gitarakkorder bruker den publiserte ChordLink-versjonen. Det separate Guitar Chords Lab med et mer omfattende CAGED-bibliotek i beta er ikke gjort til produksjonsversjon i denne oppdateringen.

På mobil ruller de to pianoklaviaturene inne i sine egne paneler. Det er kun klaviaturene i de nye appene som er endret.

## Status for øvrige verktøy og ressurser

| Verktøy / familie | Observert status | Håndtering |
|---|---|---|
| ChordFlow | Produksjonens index, app.js, styles.css og language.js er byte-identiske med ChordLink; Rockeskolen har egen nettstedstilpasning. Har allerede norsk/engelsk. | Beholdt. Ingen oppgraderingsetterslep på disse filene. |
| ChordLog | Samme verktøyfamilie og mye felles logikk. Forskjeller i norsk UI, lagringsknapp, innlogging og lagringsendepunkter. | Beholdt. Ingen skriving, sletting eller flytting av lagrede låter. Ikke gjort tospråklig i denne oppdateringen. |
| Spillbart piano | Finnes på `/tools/instruments/piano_playable.php`; ChordLink bruker `/tools/instruments/piano/`. | Beholdt etter instruksen om pianoklaviatur/lærebokressurser. Eldre merking finnes fortsatt. |
| Pianovisualisering | Finnes på `/tools/visualizers/piano/`. ChordLink har blant annet nyere fargevalg. Ikke oppført i produksjonens verktøykatalog ved kartlegging. | Beholdt; ikke erstattet, ettersom dette kan overlappe visningsressursene som skal beskyttes. |
| Musikksymboler | Rockeskolen har et eget norsk, søkbart oppslagsverk; ChordLink har en annen symbolvelger. | Beholdt som Rockeskolen-tilpasning, ikke behandlet som en ren gammel kopi. |
| Akkorddiagrammer / Charts | Rockeskolen har `/tools/charts/charts.php` og tilhørende filer, men `/tools/charts/` viser mappeoversikt. ChordLink har en egen katalog med nedlastinger. | Delvis tilgjengelig; full ChordLink-katalog mangler. Ingen betalings-/nedlastingsflyt endret. |
| Frequencer | Eldre app på `/tools/frequencer/`. | Beholdt. Ikke samme publiserte app som ChordLinks nyere Frequency Generator. |
| Notation Mahjong | Tilgjengelig på `/tools/games/mahjong/`. | Beholdt; ingen tilsvarende app på den kontrollerte ChordLink-stien. |
| AI Music Prompt Builder | Tilgjengelig på `/tools/generators/suno.php`. | Beholdt; ingen tilsvarende app på den kontrollerte ChordLink-stien. |
| SoundLab | Rockeskolens pedagogiske app med egen embed.js. | Beskyttet og urørt. |
| Noter, progresjonsvisninger og akkord-/skalavisninger for artikler | `/tools/notes/`, `/tools/chords/notes/`, inkluderingsfiler og tilsvarende artikkelressurser. | Beskyttet og urørt. |
| Teorivisninger | `/tools/theory/`: notelinjer, nøkler, noteverdier, pauser, taktarter og puls. | Beskyttet og urørt. |
| Duplikater og eldre arbeidsmapper | Blant annet `/tools/chords/chords/`, `/tools/scales/scales/` og lokale old/working-varianter. | Ingen sletting eller flytting. Bør bare ryddes etter kartlegging av alle innbyggingslenker. |

Dette gjør ikke hele Rockeskolen tospråklig. Norsk/engelsk er levert for de seks oppgraderte appene; ChordFlow hadde det fra før. De øvrige verktøyene ovenfor er bevart med eksisterende språk og funksjoner.

## Det Rockeskolen mangler fra publisert ChordLink

| App | Status på Rockeskolen |
|---|---|
| **ChordProg** | Katalogen lenker til ChordLink. Ingen egen app på `/tools/chordprog/`. |
| **ChordPlay** | Ingen egen app på `/tools/chordplay/`. |
| **Noted** | Ingen egen app på `/tools/noted/`. Rockeskolens artikkelbaserte noteverktøy er en annen ressurs. |
| **Harmonic Orbit** | Ingen egen app på `/tools/wheels/chords/`. |
| **Frequency Generator** | ChordLink har publisert app på `/tools/frequencygenerator/`. Rockeskolen har eldre Frequencer og lokale utviklingskopier; de er ikke likestilt med denne publiserte appen. |
| **Full Charts-katalog** | Bare deler finnes på Rockeskolen; katalog- og nedlastingsflyten er ikke overført. |

Separat `/tools/tuners/fork/` og `/tools/tuners/pro/` finnes ikke på Rockeskolen. Funksjonene i ChordLink Tuner er nå tilgjengelige i den nye Rockeskolen-tuneren, så dette er ikke lenger et funksjonelt hull. Den gamle stemmegaffelen er fortsatt tilgjengelig på sin gamle adresse.

Flere ikke-eksisterende stier returnerer HTTP 200 med forsiden. Mangler er derfor kontrollert mot sidetittel og FTP-mapper, ikke bare HTTP-status.

## ChordLink-beta – ikke automatisk produksjonsklare mangler

Produksjonsserverens betaoversikt inneholder også ChordSeq, Intervals, MXL Viewer, Pads, Solfeggio, Spatial, Synths, Progressions og videreutviklede verktøy under Chords, Wheels, Frequen­cer/Frequency Generator og Visualizers. Gitarbiblioteket med CAGED er et eksempel på funksjonalitet som fortsatt er separat fra den publiserte verktøyversjonen.

Dette er utviklingskandidater, ikke en bekreftelse på at hver betamappe er ferdig eller bør kopieres direkte. Det er ikke utført full funksjonstest av betaverktøyene. Verktøy som nå også finnes under `/tools/`, som ChordFlow, ChordProg, ChordPlay og Noted, er vurdert ut fra den publiserte versjonen.

## Sikkerhet og validering

- Ferske kildefiler hentet fra begge produksjonsområdene før endring; 299 filer registrert med SHA-256 i `snapshot-manifest.json`.
- Publisert 45 nye filer under `/tools/updated/`. Hver fil lastet tilbake og sammenlignet byte for byte før aktivering.
- Eksisterende produksjonsendring er begrenset til **seks app_url-verdier i `/includes/content.php`**. Det er den felles verktøykatalogen som brukes av oversikt/omtaler og eventuelle andre sider som leser den. ChordFlow, ChordProg og øvrige katalogoppføringer er beholdt.
- Gamle appadresser omdirigeres ikke og deres filer er ikke overskrevet. Drupal, lærebokfiler, medlemskode og lagrede brukerdata er ikke skrevet til.
- Ny appadapter bruker produksjonens `current_user()` og `has_chordlink_access()`. PRO, VIP og administrator har full verktøytilgang. Skillet mellom gjest og gratisbruker beholdes for akkordverktøyene; grunnakkordene er tilgjengelige også etter gratis innlogging.
- Lokale funksjonstester: seks apper i to språk med fem simulerte roller – gjest, gratis, PRO, VIP og administrator. Dette er ikke det samme som en innloggingstest med faktiske medlemskontoer.
- Produksjonstester: alle seks apper i begge språk, faktiske data og ressurslasting, ingen observerte JavaScript-/PHP-feil eller HTTP-feil i testflyten.
- Avspillingskontroller og lydressurser testet i produksjon. Mikrofonstart/stopp testet med en simulert nettlesermikrofon. Fysisk instrumentstemming og subjektiv lydkvalitet er ikke manuelt lyttetestet.
- Mobilbredde 390 px kontrollert. To opprinnelige overløp i de nye pianoappene er rettet og retestet. Gamle pianovisninger er urørt.
- PHP- og JavaScript-syntaks kontrollert.

## Data og senere vedlikehold

Rockeskolens `/api/music.php` var ikke et fungerende JSON-endepunkt i produksjon; det leverte forsiden. De nye appene har derfor et eget, lesebasert endepunkt under `/tools/updated/shared/music.php`.

Det serverer et datert øyeblikksbilde av ChordLinks publiserte API: 38 skalaoppføringer, 21 eksterne akkordformler (i tillegg til pianoappens lokale formler) og 30 gitarakkordoppføringer for hver av 12 grunntoner. Dette oppdateres **ikke automatisk** fra ChordLink. Neste synkronisering må kontrollere data og funksjoner igjen.

Oversettelser ligger i `tools/updated/shared/translations.json`. `build-language.py` i denne rapportmappen bygger den tilhørende språkfilen. Egne, tospråklige hjelpetekster ligger i `tools/updated/shared/help.json`.

## Tilbakerulling

`backup/production-content.php` er katalogen fra produksjon før oppdateringen. `release/content.php` er den publiserte versjonen. En trygg tilbakerulling kontrollerer først at produksjonsfilen fortsatt samsvarer med den publiserte versjonen, og gjenoppretter deretter sikkerhetskopien. Da åpner katalogen de gamle appene igjen. De nye mappene kan stå; ingen sletting er nødvendig.

`backup/local-content.php` bevarer tidligere lokalt arbeid. Lokal katalog fikk bare de samme seks URL-endringene; den ble ikke erstattet av den avvikende produksjonskopien.

Testresultater: `functional-test.json`, `mobile-retest.json`, `live-test.json`, `audio-test.json`. `functional-test.json` viser den første mobilmålingen; `mobile-retest.json` dokumenterer at begge funn ble rettet. Opplastede filhashverdier: `deployment-apps.json`. HTTP-kartlegging: `live-inventory.json`.
