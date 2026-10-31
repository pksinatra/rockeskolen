# Figurer – Musikkproduksjon – lyd, MIDI og signalvei

Kildekode for de 18 figurene i artikkelserien (node 294–298) i Rockeskolens Musikkportal.

- `python3 build.py` skriver SVG-filene til `images/musikkproduksjon/`, sammen med `figurer.json` (alt-tekst, bildetekst, plassering) og `index.html` (gjennomsynsside).
- `python3 render.py <mappe>` lager PNG-er med headless Chrome til visuell kontroll. PNG-ene skal ikke inn i repoet.
- `lib.py` inneholder felles farger, ikoner og hjelpefunksjoner. `figs_a.py`, `figs_b.py` og `figs_c.py` inneholder figurene per artikkel.

Figurene vises i artiklene som `<figure class="rs-figur">` med `<img>` fra `https://rockeskolen.com/images/musikkproduksjon/`. Stilen ligger i `rockeskolen_structure_qa/css/article-figures.css`.

`inter-subset.woff2` er et utvalg av Inter (SIL Open Font License 1.1, https://openfontlicense.org) med bare tegnene figurene trenger. Fonten bygges inn i hver SVG, fordi et bilde i `<img>` ikke kan bruke fontene på siden. Får en figur nye tegn, må utvalget hentes på nytt fra Google Fonts med `&text=`-parameteret.
