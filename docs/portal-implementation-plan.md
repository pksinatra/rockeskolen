# Portal Implementeringsplan

Dato: 2026-07-04

> Prioritering fram til lansering styres av `docs/hostpilot-2026-scope.md`.
> Dette dokumentet beskriver også senere produktfaser og skal derfor ikke brukes
> som argument for å utvide Høstpilot 2026.

Dette dokumentet oversetter IA-/rolledokumentet til en konkret Drupal-plan basert på aktiv produksjonsstruktur.

## Aktiv Struktur I Dag

### Forside Og Tema

- Aktiv forside: `/node/1`
- Forsidetittel: `Rockeskolens Digitale Øvingsrom`
- Aktivt frontend-theme: `zuvipro`
- Admin-theme: `claro`
- Hovedmeny: `main`

Forsiden har allerede riktig grunnidé, men teksten er mer informerende enn handlingsstyrende. Den bør bli tydeligere på:

- hva Øvingsrommet er
- hva som er åpent
- hva man får ved innlogging
- hvorfor FEIDE finnes her
- hva som kommer i pre-release / høstlansering

### Innholdstyper

Eksisterende innholdstyper som bør gjenbrukes:

- `verktoy`: 43 noder
- `instrument`: 87 noder
- `musikkteori`: 29 noder
- `komponister`: 25 noder
- `oving`: 7 noder
- `latskriving`: 1 node
- `ressurser`: 2 noder
- `page`: 4 noder
- `article`: 2 noder

Dette betyr at portalen allerede har nok innhold til en god anonym forside og et enkelt dashboard. Første fase bør derfor ikke være å lage mange nye innholdstyper, men å kuratere og presentere eksisterende innhold bedre.

### Views

Eksisterende Views som kan brukes:

- `verktoy`
- `instrumenter`
- `musikkteori`
- `komponister`
- `musikkhistorie`
- `forside_hovedplugger`
- `relatert_musikkteori`
- `tema`
- `glossary`

Disse kan sannsynligvis brukes til første versjon av forside, åpne oversikter og innholdslister.

### Taxonomier

Eksisterende vokabularer:

- `instrumenter`
- `musikkteori`
- `verktoy`
- `temaer`
- `tags`
- `historie`
- `latskriving`
- `musikkterminologi`
- `verktoy_apps`

Manglende struktur for ny portalmodell:

- tilgangsnivå
- nivå/vanskelighetsgrad
- læringsområde
- målgruppe
- format

Disse bør legges til som egne taxonomier eller felter.

### Roller

Aktive roller i dag:

- `anonymous`
- `authenticated`
- `content_editor`
- `administrator`

Mangler for produktmodellen:

- `gratisbruker`
- `pre_release`
- `elev`
- `laerer`
- `skoleadmin`

Anbefaling: start med å legge til `gratisbruker` og `pre_release`. Vent med `laerer` og `skoleadmin` til vi har testet FEIDE-claims og skoleflyt.

### Meny

Aktiv hovedmeny inneholder allerede:

- Verktøy
- Instrumenter
- Skolebenken
- Komponister
- Om

Skjulte/avslåtte kandidater:

- Musikkhistorie
- Ordliste
- Øving

Anbefaling: Hovedmenyen er nesten riktig for anonym bruker. Første endring bør være å legge til tydelig `Start`/forside og `Logg inn`, og eventuelt gjøre `Øving` synlig når øvingsområdet er ryddet.

## Fase 1: Ryddig Anonym Portal-Forside

Mål: Første skjerm skal forklare produktet og sende brukeren videre.

### Foreslått Struktur

1. Hero
   - Tittel: `Rockeskolens Digitale Øvingsrom`
   - Kort tekst: `Spill, forstå og skap musikk med verktøy, øvelser og læringsressurser fra Rockeskolen.`
   - Primær CTA: `Logg inn med FEIDE`
   - Sekundær CTA: `Utforsk åpne ressurser`

2. Tre innganger
   - `Jeg vil spille`
   - `Jeg vil forstå musikk`
   - `Jeg vil lage låter`

3. Åpne verktøy
   - Gitarakkorder
   - Pianoakkorder
   - Skalaer
   - Kvintsirkelen
   - Tuner

4. Hva får du med innlogging?
   - Min side
   - favoritter/progresjon etter hvert
   - pre-release-innhold
   - skole-/FEIDE-tilgang senere

5. Pre-release
   - `Lanseres høsten 2026`
   - `Vi åpner deler av Øvingsrommet fortløpende`
   - feedback-inngang

6. For lærere og skoler
   - kort forklaring
   - FEIDE nevnes tydelig
   - kontakt-/interesseinngang

### Kan Gjøres Uten Ny Kode

- redigere node 1
- bruke eksisterende Views-blokker
- bruke eksisterende `forsideplugg`-blokktypen
- justere hovedmeny
- flytte/skjule irrelevante blokker

### Krever Trolig Custom-Kode Eller Theme

- mer moderne dashboard-komponenter
- dynamisk "fortsett der du slapp"
- favoritter
- progresjon
- rollebasert innhold på samme side

## Fase 2: Enkel Min Side

Mål: Innlogget bruker skal ikke lande i en generisk Drupal-opplevelse.

### Første Versjon

En enkel side/rute, for eksempel `/min-side`, med:

- Velkommen
- `Hva vil du gjøre i dag?`
- Snarveier til Verktøy, Skolebenken, Instrumenter, Øving, Låtskriving
- Ukens øvelse
- Nye ressurser
- Feedback-lenke

### Første Tekniske Løsning

Lavrisiko:

- Lag en vanlig Drupal-side eller landing page.
- Legg den i meny for innloggede brukere.
- Sett `openid_connect.settings.redirect_login` til denne siden når siden er klar.

Mer avansert senere:

- custom controller i en Rockeskolen dashboard-modul
- personlige favoritter
- progresjon
- skole-/gruppeblokker

## Fase 3: Roller Og Tilgang

### Først

Opprett roller:

- `gratisbruker`
- `pre_release`

Bruk dem til å teste enkel tilgangsmerking uten å låse ned for mye.

### Så

Lag tilgangsmerking:

- `Åpent`
- `Krever konto`
- `Pre-release`
- `Elev/medlem`
- `Lærer`
- `Skole`
- `Kommer snart`

Anbefalt Drupal-modell:

- start med taxonomy `tilgangsniva`
- legg feltet på `verktoy`, `musikkteori`, `oving`, `latskriving`, `ressurser` og eventuelt `instrument`
- bruk Views til å vise og filtrere
- vent med hard access control til vi vet nøyaktig hva som skal låses

## Fase 4: FEIDE-Flyt

Teknisk FEIDE-start fungerer i dag.

Første produktendring:

- La FEIDE-brukere lande på `/min-side` etter login.
- Ikke gi skole-/lærerrolle automatisk ennå.
- Logg eller undersøk hvilke claims vi faktisk får tilbake fra Dataporten/FEIDE før automatikk bygges.

Mulig mellomløsning:

- Alle FEIDE-brukere blir `authenticated`.
- Manuell oppgradering til `pre_release`, `elev` eller `laerer`.
- Senere: automatikk basert på skoleavtale/claim.

## Fase 5: Innhold Som Bør Prioriteres

Bruk eksisterende innhold først.

### Åpne Ressurser

Prioriter disse fordi de allerede finnes:

- Verktøy: `Skalaer`, `Pianoakkorder`, `Gitarakkorder`, `Tuner`, `Akkordprogresjoner`
- Musikkteori: `Hva er en akkord?`, `Akkordtyper`, `Kvintsirkelen`, `Pentatoniske skalaer`
- Låtskriving: `Hvordan starte en låt uten å overtenke?`
- Øving: velg 2-3 gode eksterne/åpne ressurser

### Nye Kjerneelementer

Bør opprettes etter forside/min-side:

- `Start med gitar`
- `Start med piano`
- `Start med låtskriving`
- `Ukens øvelse`
- `For lærere og skoler`
- `Hva er Rockeskolens Digitale Øvingsrom?`

## Fase 6: Theme Og Opprydding

Aktivt theme er `zuvipro`, ikke `themes/custom/rockeskolen`.

Før vi endrer design:

1. Avklar om `zuvipro` skal vendor-/Composer-styres, eller om det skal tas inn som prosjektkode.
2. Finn ut om `themes/custom/rockeskolen` er gammelt, planlagt eller ubrukt.
3. Ikke bygg ny UX i feil theme.

Kjente UX-småting:

- generisk `Share This Page` bør fjernes/skjules på sider der det virker tilfeldig
- cookie-tekst bør oversettes og tilpasses
- login/FEIDE bør bli mer synlig
- footer bør samkjøres med `www.rockeskolen.com`

## Konkret Neste Arbeidsøkt

Anbefalt rekkefølge:

1. Lage tekst og blokkstruktur for ny anonym forside.
2. Lage tekst og blokkstruktur for enkel `/min-side`.
3. Implementere dette først som Drupal-side/blokker, uten ny custom-kode.
4. Deretter opprette `gratisbruker`/`pre_release` og tilgangstaxonomi.
5. Først etter det: vurdere custom dashboard-modul.

Dette gir rask synlig produktforbedring uten å risikere FEIDE eller Drupal-stabilitet.
