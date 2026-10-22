# Portal IA Og Roller

Arbeidsnotat for Rockeskolens Digitale Øvingsrom.

> For arbeid fram til lansering gjelder det frosne omfanget i
> `docs/hostpilot-2026-scope.md`. Funksjoner merket «senere» her er ikke del av
> Høstpilot 2026 med mindre scope-dokumentet sier det eksplisitt.

Dato: 2026-07-03

## Mål

Portalen skal være elevens og lærerens arbeidsrom, ikke bare en åpen innholdsside. Den skal støtte tre ting samtidig:

- åpen utforsking for nye brukere
- trygg innlogging og tilgang via FEIDE
- strukturert læring for elever, lærere og skoler

## Begreper

- Rockeskolen: merkevaren, skolen og miljøet.
- Rockeskolens Digitale Øvingsrom: portalen og læringsproduktet.
- RDØ: intern kortform, eventuelt introdusert gradvis eksternt.
- ChordLink: akkord-/progresjonsverktøy eller verktøyfamilie.
- ChordLog: låtidé-/skisseverktøy hvis navnet videreføres.

## Roller

### Anonym

Ikke innlogget bruker.

Skal kunne:

- lese åpne sider
- prøve åpne verktøy
- forstå hva portalen er
- se hva man får ved innlogging
- gå til FEIDE-/login-flyt

Skal ikke kunne:

- lagre progresjon
- lagre favoritter
- se lukket pre-release-/medlemsinnhold
- få personlig dashboard

### Gratisbruker

Innlogget bruker uten betalt eller skolebasert tilgang.

Skal kunne:

- få enkel "Min side"
- lagre favoritter
- lagre enkel progresjon
- bruke åpne verktøy
- få utvalgte gratisøvelser
- gi feedback

### Pre-Release-Bruker

Tidlig testbruker fram mot lansering.

Skal kunne:

- se pre-release-innhold
- teste nye verktøy
- gi strukturert feedback
- få ukens øvelse eller sommerutfordringer
- eventuelt få early-bird/lanseringsrabatt

### Elev

Betalt eller skolegodkjent elev.

Skal kunne:

- se full elevportal
- følge læringsløp
- bruke elevdashboard
- lagre favoritter/progresjon
- få anbefalte øvelser
- bruke flere verktøy og oppgaver enn gratisbrukere

### Lærer

Underviser eller skolekontakt.

Skal kunne:

- se lærerressurser
- finne øvelser for grupper
- se elev-/gruppeopplegg når dette finnes
- bruke portalen i undervisning

### Skoleadmin

Rolle for skole-/gruppeavtaler.

Skal kunne:

- administrere skolegruppe
- se tilknyttede lærere/elever
- håndtere tilgangsstatus
- få oversikt over lisens/avtale

Dette kan vente til skolemodellen er nærmere avklart, men bør være med i arkitekturen.

### Administrator

Drupal-/Rockeskolen-admin.

Skal kunne:

- administrere innhold
- administrere brukere
- administrere roller og tilgang
- kontrollere FEIDE/OIDC-oppsett

## FEIDE-Flyt

Nåværende teknisk status:

- FEIDE håndteres av `openid_connect`
- klient-ID: `feide`
- plugin: `generic`
- provider: Dataporten
- scopes: `openid profile email`
- redirect/callback: `/openid-connect/feide`

Foreslått første fase:

1. Brukeren klikker "Log in with FEIDE".
2. Brukeren sendes til Dataporten.
3. Brukeren kommer tilbake til portalen.
4. Portalen oppretter eller kobler Drupal-bruker.
5. Brukeren får minimum rollen `authenticated`.
6. Brukeren sendes til en enkel "Min side" eller dashboard.

Avklaringer:

- Skal FEIDE-brukere automatisk bli gratisbrukere?
- Skal enkelte FEIDE-domener/skoler gi elev- eller lærerrolle automatisk?
- Skal lærere godkjennes manuelt først?
- Skal e-postdomene eller FEIDE claims brukes for skoletilknytning?
- Hvilke claims fra Dataporten/FEIDE skal lagres?

Anbefaling nå:

- Ikke automatiser skole-/lærerroller før vi vet hvilke claims vi får stabilt.
- Start med trygg innlogging + enkel gratisbrukerrolle.
- Legg skole-/lærerlogikk bak en eksplisitt godkjenningsmodell senere.

## Tilgangsmerking

Alle relevante innholdstyper bør etter hvert kunne merkes med tilgangsnivå:

- Åpent
- Krever gratis konto
- Pre-release
- Elev/medlem
- Lærer
- Skole
- Kommer snart

Dette kan løses med taxonomy eller et eget felt, avhengig av hvor mye Drupal Views og tilgangskontroll vi trenger.

## Foreslått Hovednavigasjon

For anonym bruker:

- Start
- Verktøy
- Instrumenter
- Skolebenken
- Komponister
- Om Øvingsrommet
- Logg inn

For innlogget bruker:

- Min side
- Øvelser
- Læringsløp
- Verktøy
- Instrumenter
- Skolebenken
- Låtskriving
- Samspill

For lærer/skole senere:

- Lærerrom
- Gruppeopplegg
- Ressurspakker
- Elever/grupper

## Innholdsområder

### Start Her

Formål:

- forklare portalen
- hjelpe brukeren å velge retning
- skille åpent, innlogget og pre-release

Mulige innganger:

- Jeg vil spille
- Jeg vil forstå musikk
- Jeg vil lage låter
- Jeg er lærer
- Jeg vil teste verktøy

### Verktøy

Verktøy bør oppleves som del av portalen, ikke eksterne demoer.

Prioriter:

- Pianoakkorder
- Gitarakkorder
- Skalaer
- Kvintsirkelen
- Tuner
- ChordLog
- ChordLink

### Instrumenter

Start med praktiske startsider:

- Gitar
- Piano
- Bass
- Trommer
- Vokal
- Synth/MIDI
- Produksjon

### Skolebenken

Læringsstoff og teori:

- Noter
- Rytme
- Intervaller
- Skalaer
- Akkorder
- Tonearter
- Form
- Gehør

### Øvelser

Små, handlingsrettede oppgaver.

Eksempler:

- lær tre akkorder
- finn tonearten
- bygg en akkordrekke
- spill med metronom
- lag et riff
- skriv en låtidé

### Læringsløp

Kuraterte stier:

- Start med gitar
- Start med piano
- Grunnleggende musikkteori
- Første låt
- Band og samspill
- Låtskriving

### Min Side

Første versjon bør være enkel:

- velkomst
- favoritter
- sist besøkt
- anbefalte verktøy
- ukens øvelse
- feedback

Senere:

- progresjon
- kurs jeg følger
- lagrede låtidéer
- skole-/gruppeinfo

## Første Drupal-Implementering

Lavrisiko første versjon:

1. Lag en tydelig anonym portal-forside.
2. Lag enkel innlogget landingsside.
3. Legg til tilgangsmerking som struktur, selv om full tilgangsstyring kommer senere.
4. Gjør FEIDE/login mer synlig.
5. Fjern eller skjul standardtekst som ikke passer, for eksempel generisk "Share this page" der det ikke gir verdi.
6. Lag feedback-lenke eller skjema for pre-release.

Ikke gjør dette først:

- komplisert skoleadmin
- automatisk FEIDE-rollelogikk basert på claims uten testing
- stor redesign av alt innhold samtidig
- betaling/abonnement før brukerreisen er tydelig

## Neste Konkrete Oppgave

Lag en enkel, produksjonsnær portal-forside og innlogget "Min side"-skisse i Drupal-struktur:

- hvilke blokker/sections trengs?
- hvilke eksisterende Drupal content types kan brukes?
- hvilke nye fields eller taxonomier trengs?
- hva kan gjøres uten ny custom-kode?
