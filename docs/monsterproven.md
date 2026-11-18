# Monsterprøven

Musikkteori-spill der monstrene stiller spørsmålene. Sju delprøver, 26 nivåer.

- Spillet: `tools/games/monsterproven/index.php` → https://rockeskolen.com/tools/games/monsterproven/
- Artikkel-embed: `embed/monsterproven.php` → https://rockeskolen.com/embed/monsterproven.php
- VIP: `has_rockeskolen_access()`. Første nivå i hver delprøve er gratis.

## Lenke til én delprøve

`?delprove=` + `toner`, `notelesing`, `intervaller`, `akkorder`, `skalaer`, `noteverdier` eller `pauser`.

Eksempel: https://rockeskolen.com/tools/games/monsterproven/?delprove=noteverdier

Delingslenker legger til `&s=<stjerner>`, og da viser spillet «Du er utfordret! En venn har 7 av 12 stjerner …».

## Innbygging i artikkel (Drupal)

Samme format som de andre embedene. Høyden tilpasses automatisk (`autoheight.js`).

```html
<iframe style="background-color:#0b0b10;border-width:0;display:block;" src="https://rockeskolen.com/embed/monsterproven.php?delprove=noteverdier" width="100%" height="680" title="Monsterprøven – Noteverdier" loading="lazy" allow="autoplay"></iframe>
```

Bytt `noteverdier` (og tittelen) med delprøven som passer artikkelen.

## Senere: innbygging uten iframe

Tas når Drupal skal oppgraderes. Mønsteret finnes i `portal/modules/custom/scale_embed/`: en Drupal-modul legger til et JS-bibliotek, og artikkelen har bare en plassholder, f.eks. `<div class="monsterprove" data-delprove="noteverdier"></div>`. Spillet må da kapsles inn (Shadow DOM) og tilpasses en boks i stedet for full skjerm. VIP kan komme rett fra Drupal-rollen (også FEIDE). Spillet skal fortsatt bare ligge ett sted.

## Deling

Del-knapp ved hver delprøve, på resultatskjermen og på oppsummeringen etter siste nivå. Delekortet (1080×1350) viser delprøvens nivåer og stjerner, og siste resultat («11 av 12 riktige på Kvart og kvint», «Full pott!») eller «Bestått!» når alle nivåene er klart.
