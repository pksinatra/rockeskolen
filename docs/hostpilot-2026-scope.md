# Høstpilot 2026 – frosset omfang

Status: **Frosset for lansering**  
Besluttet: 2026-08-03  
Måldato for offentlig lansering: 2026-08-12  
Pilotperiode: august–desember 2026

Dette dokumentet styrer alt arbeid fram til lansering. Ved konflikt med eldre
planer gjelder dette dokumentet.

## Formål

Høstpiloten skal bevise at Rockeskolens Digitale Øvingsrom er nyttig i praktisk
musikkundervisning, og at elever og lærere kan komme trygt inn og bruke de
viktigste ressursene uten hjelp.

Piloten er et ferdig, avgrenset tilbud – ikke et løfte om et komplett LMS.

## Målgrupper

1. Elever som vil spille, forstå og skape musikk.
2. Musikklærere og skolekontakter som vil bruke verktøy og ressurser i undervisning.
3. Åpne besøkende som skal kunne prøve innhold før innlogging.

Første skolekull begrenses til **3–5 pilotskoler**. Tilgang og kontakt med
skolene administreres manuelt av Rockeskolen gjennom pilotperioden.

## Dette er med i piloten

### Offentlig produkt

- tydelig forside som forklarer hva Øvingsrommet er
- mobiltilpasset portal og hovednavigasjon
- åpne oversikter for Verktøy, Instrumenter, Skolebenken og Komponister
- fungerende delebilder, sidetitler, metabeskrivelser og canonical-adresser
- side for lærere og skoler med interesse-/kontaktinngang

### Innhold

- eksisterende instrumentleksikon
- eksisterende komponist- og musikkteoriinnhold
- et kuratert utvalg praktiske verktøy:
  - pianoakkorder
  - gitarakkorder
  - piano- og gitarskalaer
  - kvintsirkelen
  - tuner
  - ChordLog/låtidéverktøy
- 3–5 utvalgte øvelser eller undervisningsinnganger som kan brukes umiddelbart

Nytt innhold lages bare dersom det fyller et dokumentert hull i den første
brukerreisen.

### Innlogging og tilgang

- fungerende FEIDE-start og retur til Rockeskolen
- vanlig Rockeskolen-konto for brukere som ikke benytter FEIDE
- enkel, nyttig landingsside etter innlogging
- eksisterende medlems-/VIP-tilgang og portal-SSO
- manuell godkjenning av pilotlærere og pilotskoler
- manuell feilretting og brukerstøtte under piloten

### Skolepilot

- ett tydelig pilottilbud
- oppstartsmøte med hver pilotskole
- tilgang for avtalt lærer/elevgruppe
- kort lærerveiledning med anbefalte startpunkter
- direkte kontaktkanal for support og tilbakemeldinger
- enkel evaluering etter 2–4 ukers bruk

## Dette er ikke med før lansering

Følgende flyttes eksplisitt til etter lansering:

- skoleadministrator som selv administrerer brukere, grupper eller lisenser
- automatisk tildeling av elev-/lærerrolle fra FEIDE-claims
- elevgrupper, klasseoversikter og lærerdashboard
- detaljert progresjon, karakterer, innleveringer eller vurdering
- komplett LMS-funksjonalitet
- selvbetjent skolekjøp og institusjonsfakturering i portalen
- omfattende favoritt-, anbefalings- eller personaliseringssystem
- full redesign av alle gamle sider og verktøy
- nye innholdstyper eller store innholdsserier
- native app
- integrasjoner utover FEIDE, medlemskap og dagens SSO

Disse punktene skal ikke snike seg inn som «små tillegg» før lansering.

## Kritiske brukerreiser

Piloten skal optimaliseres for fire brukerreiser:

1. **Besøkende:** Forside → forstå tilbudet → åpne et verktøy.
2. **Elev:** Logg inn → land på Min side → finn en øvelse eller et verktøy.
3. **Lærer:** Forside → For skoler → forstå pilottilbudet → ta kontakt.
4. **Pilotbruker:** FEIDE → riktig konto/tilgang → avtalt ressurs uten administrativ hjelp.

Arbeid som ikke forbedrer en av disse reisene, utsettes som hovedregel.

## Lanseringskriterier

Alle punktene under må være grønne før offentlig lansering:

- [x] Forsiden forklarer produktet og har tydelige neste handlinger.
- [ ] De prioriterte åpne verktøyene fungerer på mobil og desktop.
- [ ] FEIDE er testet ende-til-ende med minst én reell ekstern testbruker.
- [ ] Vanlig registrering, innlogging, glemt passord og utlogging fungerer.
- [ ] Pilotbrukere kan gis og miste tilgang manuelt.
- [ ] Min side gir en forståelig inngang til innholdet.
- [ ] Personvern, vilkår, kontakt og supportansvar er synlig.
- [ ] Skoletilbud og kontaktinngang er publisert.
- [ ] Kritiske sider har riktig SEO og delebilde.
- [ ] Produksjonsbackup, utrullingsrutine og enkel rollback er kontrollert.
- [ ] Ingen kjente feil blokkerer innlogging, tilgang, betaling eller kjerneverktøy.

Små visuelle avvik og ikke-kritiske forbedringer blokkerer ikke lansering. De
registreres i en egen etter-lansering-liste.

## Suksessmål for pilotperioden

Piloten regnes som vellykket dersom vi innen desember 2026 har:

- 3–5 aktive pilotskoler eller undervisningsmiljøer
- minst 5 aktive lærere
- minst 50 elever/testbrukere
- minst 70 % vellykkede innlogginger uten supportbehov
- minst 3 lærere som vil fortsette eller anbefale løsningen
- dokumentert hvilke tre funksjoner/innholdsområder som gir mest verdi

Tallene er læringsmål, ikke offentlige salgsløfter.

## Endringsregel

Fram til lansering kan en ny oppgave bare tas inn dersom den:

1. er nødvendig for sikkerhet, personvern eller stabilitet,
2. løser en blokkering i en kritisk brukerreise, eller
3. erstatter en annen oppgave av minst samme størrelse.

Alle andre ideer legges i etter-lansering-listen. Måldatoen flyttes ikke uten en
eksplisitt ny beslutning.

## Neste prioriterte arbeid

1. Gjøre forside og lærerinngang lanseringsklare.
2. Teste innlogging, FEIDE, tilgang og Min side ende-til-ende.
3. Ferdigstille personvern, vilkår og supportflyt.
4. Lage og publisere skoletilbudet.
5. Kjøre lanseringssjekk og produksjonsbackup.
