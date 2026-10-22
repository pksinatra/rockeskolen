# Rockeskolen Portal Status

Dato: 2026-07-03

Dette dokumentet oppsummerer status etter Drupal- og FEIDE-oppryddingen i `portal.rockeskolen.com`.

## Kort Konklusjon

Portalen er ikke lenger i "først må vi få Drupal opp på trygg versjon"-fasen. Den kjører nå Drupal 11 og har fungerende FEIDE-startflyt. Neste fase er å gjøre portalen til et tydelig læringsprodukt med roller, tilgang, dashboard og ryddig deploy-/git-struktur.

## Produksjonsstatus

- Domene: `portal.rockeskolen.com`
- Drupal core: `11.3.13`
- FEIDE/OIDC-modul: `openid_connect 3.0.0-alpha8`
- FEIDE authmap-avhengighet: `externalauth 2.0.11`
- Field Group: `field_group 4.0.0`
- FEIDE-klient: aktiv
- FEIDE provider: Dataporten
- FEIDE scopes: `openid profile email`
- `trusted_host_patterns`: konfigurert for `portal.rockeskolen.com`
- `update.php`: sperret igjen etter oppdatering

Verifisert etter deploy:

- Forsiden svarer `200`
- `/user` redirecter til `/user/login`
- FEIDE-loginformen finnes på `/user/login`
- Simulert FEIDE-submit gir `302` videre til `auth.dataporten.no`
- Callback peker til `/openid-connect/feide`

## Gjort

### Drupal Core

- Oppgradert Drupal core fra `11.2.8` til `11.3.13`.
- Kjørt databaseoppdateringer.
- Tømt Drupal-cache.
- Låst `update.php` etter oppdatering.
- Lagt inn trusted host-konfigurasjon.

### Contrib-Moduler

Disse er nå Composer-styrt lokalt og deployet til produksjon:

- `drupal/externalauth`: `2.0.11`
- `drupal/field_group`: `4.0.0`
- `drupal/openid_connect`: `3.0.0-alpha8`

Dette fjernet den gamle `field_group 8.x-3.6`-linjen og løftet FEIDE-kjeden til nyere Drupal 11-kompatible pakker.

### Composer

Composer er ikke installert globalt på maskinen. Ved oppdatering ble Composer hentet som:

```bash
/private/tmp/composer.phar
```

Serveren trenger ikke Composer for dagens FTP-deploymodell. Composer brukes lokalt til å bygge oppdatert kode, og ferdige filer lastes opp via FTP.

## Backup Fra Arbeidet

Siste relevante backup før contrib-deploy:

- Kodebackup av endrede portalområder: `/private/tmp/rockeskolen-portal-contrib-backup-20260703`
- Databasebackup: `/private/tmp/rockeskolen-portal-db-before-contrib-20260703.sql`

Tidligere core-backuper fra 2026-07-01 ligger også i `/private/tmp` hvis de ikke er ryddet av systemet.

## Git-Strategi For Portal

Vi skal ikke legge hele Drupal-installasjonen i git.

Repoet bør tracke:

- `portal/composer.json`
- `portal/composer.lock`
- `portal/modules/custom/**`
- `portal/themes/custom/**`
- dokumentasjon under `docs/**`

Repoet bør ikke tracke:

- `portal/core/**`
- `portal/vendor/**`
- `portal/sites/default/files/**`
- `portal/sites/default/settings.php`
- contrib-moduler som kan installeres fra Composer
- komplette FTP-backuper

Avklaringspunkt:

- `portal/themes/zuvipro` ligger manuelt under `themes/` og er aktivt i produksjon. Den bør enten Composer-/leverandørstyres, eller tas inn målrettet hvis vi skal endre den. Foreløpig holdes den utenfor git.

## Fortsatt Teknisk Arbeid

1. Få resten av manuelle contrib-/theme-avhengigheter inn i en reproducerbar modell.
   - `zuvi`
   - `radix`
   - `zuvipro`
   - eventuelle andre manuelle moduler/themes

2. Lage fast deployrutine.
   - Composer update lokalt
   - verifisering lokalt mot produksjonsdatabase uten å skrive
   - smal FTP-backup av berørte filer
   - databasebackup ved behov
   - smal FTP-deploy
   - cache-clear
   - HTTP/FEIDE-sjekk

3. Forberede Drupal 12-sporet.
   - holde Drupal 11 oppdatert fram til Drupal 12
   - følge med på Drupal 12-kompatibilitet for `openid_connect`, `externalauth`, `field_group` og theme-laget
   - unngå nye manuelle moduler uten Composer-plan

4. Server-/PHP-varsler.
   - GD mangler AVIF-støtte
   - output buffering er ikke aktivert
   - disse er hosting-/PHP-innstillinger, ikke Drupal-kodeendringer

## Produktretning

Todelingen står fast:

- `www.rockeskolen.com`: markedsflate, forklaring, salg, pre-release og påmelding
- `portal.rockeskolen.com`: læring, innlogging, FEIDE, innhold, verktøy, øvelser og roller

Rockeskolens Digitale Øvingsrom bør beskrives fullt ut eksternt. `RDØ` kan brukes internt eller introduseres gradvis.

## Anbefalt Neste Rekkefølge

1. Definer roller og tilgang.
   - anonym
   - gratisbruker
   - pre-release
   - elev
   - lærer
   - skoleadmin
   - administrator

2. Definer FEIDE-flyt.
   - hva skjer ved første FEIDE-login?
   - hvilken rolle får brukeren?
   - skal skole/domene/organisasjon påvirke tilgang?
   - hvordan håndteres lærere og skoleadministratorer?

3. Lag portalens nye informasjonsarkitektur.
   - Start her
   - Verktøy
   - Instrumenter
   - Skolebenken
   - Øvelser
   - Læringsløp
   - Låtskriving
   - Samspill
   - Min side

4. Lag anonym portal-forside.
   - hva er Rockeskolens Digitale Øvingsrom?
   - hva er åpent?
   - hva får man med innlogging?
   - hva betyr pre-release?
   - tydelig FEIDE-/login-inngang

5. Lag innlogget dashboard.
   - "Hva vil du gjøre i dag?"
   - fortsett der du slapp
   - ukens øvelse
   - anbefalte verktøy
   - favoritter
   - feedback

6. Koble `www` tydeligere mot portalen.
   - pre-release CTA
   - "Prøv Øvingsrommet"
   - forklaring for elever, foresatte, lærere og skoler
   - tydelig vei til registrering/login

## Nærmeste Praktiske Neste Steg

Neste praktiske arbeidsøkt bør være å lage en enkel portal-IA og rollemodell før vi endrer Drupal-innhold. Da vet vi hvilke innholdstyper, menyer, views og tilgangsregler som faktisk trengs.
