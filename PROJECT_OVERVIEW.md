# Rockeskolen - prosjektoversikt

## Formaal

Rockeskolen er en digital ressurs for musikkopplaering, kreativitet og musikkskaping.
Hovedsiden er `www.rockeskolen.com`, der verktøy, ressurser, artikler, instrumentleksikon og laeringsinnhold skal presenteres.

`portal.rockeskolen.com` er Rockeskolens Digitale Oevingsrom (RDOe), en egen laeringsplattform og arbeidsflate for fordypning, oeving og kursinnhold.

## Arkitekturprinsipp

ChordLink er utviklingsplattformen. Nye funksjoner utvikles og testes foerst paa `www.chordlink.net/beta`.
Naar funksjonaliteten er stabil, kan den publiseres paa `www.rockeskolen.com/tools`.

Rockeskolen og ChordLink skal saa langt som mulig bruke identiske verktøy. Forskjeller skal i hovedsak vaere spraak, presentasjon og branding, ikke funksjonalitet.

Maalet er en kodebase og flere nettsteder.

## Andre nettsteder

Flere verktøy brukes ogsaa av:

- `frequencyetherea.com`
- `overtone.no`
- `tnewrx.com`

Endringer i verktøy maa derfor vurderes foer filer flyttes, slettes eller endres.

## Verktøystruktur

Musikkverktøy skal primaert publiseres som frittstaaende apper under:

- `/tools/chords/guitar`
- `/tools/chords/piano`
- `/tools/scales/guitar`
- `/tools/scales/piano`
- `/tools/wheels`
- osv.

Verktøyene skal presenteres visuelt i bokser/kort paa samme maate som ChordLink.

## Foerste kartlegging av Rockeskolen `/tools`

Dato: 2026-06-08

### Ser produksjonsnaere ut

- `/tools/chords/guitar/`
- `/tools/chords/piano/`
- `/tools/scales/guitar/`
- `/tools/scales/piano/`
- `/tools/circles/fifths/`
- `/tools/tuners/`
- `/tools/chordlog/`
- `/tools/symbols/`
- `/tools/charts/charts.php`
- `/tools/instruments/piano_playable.php`

### Finnes i ChordLink og boer sammenlignes

- Rockeskolen `/tools/chords/guitar/` mot ChordLink `/tools/chords/guitar/`
- Rockeskolen `/tools/chords/piano/` mot ChordLink `/tools/chords/piano/`
- Rockeskolen `/tools/scales/guitar/` mot ChordLink `/tools/scales/guitar/`
- Rockeskolen `/tools/scales/piano/` mot ChordLink `/tools/scales/piano/`
- Rockeskolen `/tools/circles/fifths/` mot ChordLink `/tools/circles/fifths/`
- Rockeskolen `/tools/chordlog/` mot ChordLink `/tools/chordlog/`
- Rockeskolen `/tools/symbols/` mot ChordLink `/tools/symbols/`
- Rockeskolen `/tools/tuners/` mot ChordLink `/tools/tuners/`

### Mangler eller avviker fra ChordLink-struktur

- Rockeskolen mangler ChordLink-stien `/tools/wheels/chords/`.
- Rockeskolen har `/tools/frequencer/`, `/tools/visualizers/`, `/tools/games/mahjong/`, `/tools/generators/suno.php`, `/tools/theory/` og `/tools/notes/`, som ikke finnes tilsvarende i ChordLink-repoets `tools`-struktur.
- ChordLink har `/tools/instruments/piano/`, mens Rockeskolen bruker `/tools/instruments/piano_playable.php`.
- ChordLink har `/tools/tuners/fork/` og `/tools/tuners/pro/`, mens Rockeskolen foreloepig har tuner-filer direkte under `/tools/tuners/`.

### Uferdige, dupliserte eller eksperimentelle kandidater

Disse boer ikke slettes uten konsekvensanalyse, men de boer vurderes for flytting til ChordLink beta, arkivering eller opprydding:

- `/tools/chordlog/working/`
- `/tools/chords/chords/`
- `/tools/chords/chords/guitar/working/`
- `/tools/chords/chords/guitar/working2/`
- `/tools/scales/scales/`
- `/tools/scales/scales/piano/working0/`
- `/tools/scales/scales/piano/working1/`
- `/tools/scales/piano/bullshit/`
- `/tools/scales/scales/piano/bullshit/`
- `/tools/scales/guitar/old/`
- `/tools/notes/old/`
- `/tools/indexold.html`

### Viktig observasjon

`/tools/index.php` i Rockeskolen er fortsatt tydelig ChordLink-merket i tekst og metadata. Den boer omskrives til Rockeskolen-presentasjon, men fortsatt vise samme verktøylogikk og stabile app-stier.

## Anbefalt neste rekkefolge

1. Sammenlign innholdet i de stabile Rockeskolen-verktøyene med tilsvarende ChordLink-verktøy.
2. Merk hvert verktøy som produksjonsklart, uferdig eller eksperimentelt.
3. Lag en ryddet Rockeskolen `/tools/index.php` med kort/kortbokser og Rockeskolen-branding.
4. Flytt ingenting foer det er kontrollert mot ChordLink, Frequency Etherea, Overtone og TNEW/RX.
5. Etter kontroll: vurder om `working`, `old`, duplikatmapper og eksperimenter skal til ChordLink beta eller arkiv.
