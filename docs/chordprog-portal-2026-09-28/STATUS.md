# ChordProg på norsk og portalendringer – 28. september 2026

Publisert og kontrollert:

- [ChordProg på Rockeskolen](https://rockeskolen.com/tools/chordprog/) har norsk som standardspråk og fortsatt engelsk språkvalg. Alle 250 progresjonsnavn er oversatt, og norske søk fungerer både på hele navn og deler av navn. «Loop» er beholdt som musikkbegrep.
- [Verktøyoversikten i portalen](https://portal.rockeskolen.com/verktoy) lenker til den lokale ChordProg-kopien. Feilen som føyde Rockeskolens domene foran en allerede absolutt URL er rettet.
- [Portalforsiden](https://portal.rockeskolen.com/) viser ChordFlow på kvintsirkelens tidligere plass, med én ChordFlow-boks totalt. Kvintsirkelen er beholdt i verktøyoversikten.

Ny ChordFlow-tekst:

> Lag akkordrekker som passer stemningen i låten. Velg toneart, lytt og behold akkordene du liker mens du prøver nye varianter. Se tonene på pianoet og last ned resultatet som MIDI.

## Gjennomføring

ChordProg er kopiert fra fersk, publisert ChordLink-kode. Notasjonsavhengigheten music.js ligger i den nye appmappen; Rockeskolens eksisterende note- og klaviaturressurser er ikke endret. Appens eksisterende offentlige tilgang er beholdt, og toppmenyen bruker Rockeskolens medlemsinnlogging.

Norsk oversettelse dekker grensesnitt, progresjonsnavn, hjelpetekster og MIDI-knapper. Eksisterende norske musikkforklaringer fra ChordLink-versjonen er videreført. Eksporterte MIDI-filer er kontrollert med MIDI-header og får Rockeskolen-filnavn. Maskinlesbare progresjonsdata/ID-er er beholdt slik at transponering og eksport fungerer som før.

Produksjonsfiler ble hentet før redigering og finnes i `backup/`. Publisering av ni nye appfiler ble verifisert byte for byte. Eksisterende endringer er avgrenset til verktøykatalogen `includes/content.php` og portalmodulens `CanonicalResponseSubscriber.php`. Ingen Drupal-artikler, medlemsdata eller brukerlagrede låter er endret. Drupals side-, dynamiske side- og rendermellomlager ble tømt etter publisering.

Lokale endringer ble flettet inn uten å erstatte tidligere lokalt arbeid. Språkregelen om «loop» er lagt til i prosjektets AGENTS.md.

## Tester

- PHP- og JavaScript-syntaks bestått.
- Lokal katalogtest: én ChordFlow på forsiden, kvintsirkelen beholdt i verktøyoversikten, gyldig lokal ChordProg-adresse.
- ChordProg testet lokalt og i produksjon: 250 progresjoner tilgjengelig, søk på «Storslått pop», «oppbygging» og «loop», norsk/engelsk språkbytte, avspilling/stopp og MIDI-nedlasting.
- Nedlastet MIDI har `MThd`-header. Testet eksport var 136 byte.
- Mobilbredde 390 px: dokumentbredden er 390 px, uten horisontalt side-overløp.
- Ingen observerte JavaScript-feil eller mislykkede ressurser i testflyten.
- Normal produksjons-URL `/verktoy`: én ChordProg-lenke til Rockeskolen og kvintsirkel beholdt.
- Normal produksjons-URL `/`: én ChordFlow på tidligere kvintsirkelplass, ingen kvintsirkelboks og ingen doble domener i lenkene.
- Fysisk lytting og import i en ekstern DAW er ikke testet.

Se `portal-verification.json` og `app-manifest.json`. Testskriptene er vedlagt. Tilbakerulling av portalvisning og katalog skal bruke sikkerhetskopiene etter kontroll av at produksjonen ikke har fått senere endringer. Den nye ChordProg-mappen trenger ikke slettes ved slik tilbakerulling.
