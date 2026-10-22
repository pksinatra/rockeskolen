# Interaktive teoriartikler – 11. september 2026

Publiserte verktøy: `https://rockeskolen.com/tools/soundlab/`.

| Artikkel | Node | Modus |
| --- | --- | --- |
| Melodi | 20 | melody |
| Frekvenser og tonehøyde | 167 | frequency |
| Overtoner og resonans | 230 | harmonics |
| Frekvenser i naturen | 231 | nature |
| Motiv, gjentakelse og variasjon | 232 | motif |
| Melodi og akkorder | 233 | harmony |

De to nye artiklene er publisert som musikkteori, med kategorien Melodi (39). HTML-filene i denne mappen er publisert brødtekst. Endringer i Drupal må hentes på nytt før senere oppdateringer; ikke overskriv nyere redigeringer med disse kopiene.

## Implementasjon

`tools/soundlab/index.php` velger en av seks tillatte moduser via `?mode=`. Ingen eksterne JavaScript-avhengigheter. Web Audio starter ved brukerhandling, har separat lydnivå og stopper ved Stopp, skjult side eller avsluttet eksempel. Frekvenstoner avsluttes etter 12 sekunder. Melodien varer fire sekunder i begge rytmene; akkordskiftet kommer etter de første fire tonene.

Diagrammet for frekvens viser et fast tidsvindu på 10 ms. Overtonespekteret viser relative amplituder, ikke målt effekt eller dB. Naturlydene er syntetiske, tydelig merkede undervisningsmodeller. Melodigrafen er en tonehøydekurve, ikke vanlig notasjon. Toner redigeres via tilgjengelige valgfelter.

`embed.js` på artikkelsiden mottar høyde fra verktøyet. Den kontrollerer både avsenderdomene, iframe-vindu, sti og høydegrense. Begge Rockeskolen-domenene godtas fordi www videresendes til domenet uten www.

## Faglige referanser brukt ved kontroll

- [OpenStax: Hearing](https://openstax.org/books/college-physics-2e/pages/17-6-hearing) – frekvensfordeling og klang.
- [OpenStax: Standing Waves and Resonance](https://openstax.org/books/university-physics-volume-1/pages/16-6-standing-waves-and-resonance) – harmoniske frekvensforhold.
- [Music Theory for the 21st-Century Classroom](https://musictheory.pugetsound.edu/mt21c/frontmatter-5.html) – motiv og melodisk variasjon.
- [Adding Non-Chord Tones](https://musictheory.pugetsound.edu/mt21c/AddingNonChordTones.html) – toner utenfor akkorden.

## Kontroll

PHP- og JavaScript-syntaks kontrollert. Alle seks moduser kontrollert i Chromium lokalt og på publisert adresse: avspilling/stopp, tonevalg, rytme, akkorder, motivgjentakelse, overtoneverdier og mobilbredde uten horisontal overflyt. Kontrollen verifiserer nettleserens lydstart og funksjoner; den erstatter ikke lytting på flere fysiske enheter.

Sluttkontroll: alle seks publiserte artikler verifisert med spill/stopp inne i iframe ved 375 px bredde. Automatisk høyde tilpasset hele innholdet. Melodi-kategorien viser node 20, 232 og 233.
