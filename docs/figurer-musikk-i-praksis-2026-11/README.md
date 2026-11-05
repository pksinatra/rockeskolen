# Figurer – Musikk i praksis – Utgivelse, Rettigheter og Markedsføring

Kildekode for de 11 figurene i node 235–243 i Rockeskolens Musikkportal.

- `python3 figs.py` skriver SVG-filene til `images/musikk-i-praksis/` og `figurer.json` (node, fil, alt-tekst, bildetekst og overskriften figuren står foran) til denne mappen.
- Farger, font og tegnefunksjoner hentes fra `../figurer-musikkproduksjon-2026-10/lib.py`, så figurene har samme stil og samme innebygde Inter-utvalg som Musikkproduksjon. PNG-kontroll kan gjøres med `render.py` i samme mappe.
- Innholdet i figurene bygger bare på det som står i artiklene. Priser er utelatt fordi de endrer seg.

Figurene vises i artiklene som `<figure class="rs-figur">` med `<img>` fra `https://rockeskolen.com/images/musikk-i-praksis/` og en `<figcaption>` med bildeteksten fra `figurer.json`.
