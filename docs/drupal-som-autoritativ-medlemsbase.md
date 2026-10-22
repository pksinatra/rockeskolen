# Drupal som autoritativ medlemsbase

Status: Målmodell implementert og migrert i produksjon 11. august 2026.

## Fast rollemodell

- Anonym bruker
- Autentisert bruker
- Innholdsredaktør
- VIP-medlem (`vip_member`)
- Administrator (`administrator`)

Drupal er fasit for kontoens status og roller. SQL-tabellene for Rockeskolen og
ChordLink er et tilgangsspeil og autentiseringslager, ikke autoritet for roller.

## Tilgangskart

| Drupal-status | SQL-speil | Effekt |
| --- | --- | --- |
| Aktiv, autentisert | `free` | Grunnleggende medlemstilgang |
| `VIP-medlem` | `vip` | Rockeskolen VIP og ChordLink |
| `Innholdsredaktør` | `free` | Redaksjonell Drupal-tilgang, ikke automatisk VIP |
| `Administrator` | `admin` | Administrasjon og full systemtilgang |
| Blokkert Drupal-konto | inaktiv | Ingen innlogging eller medlemstilgang |

Feide-innlogging gir `VIP-medlem`. Betaling kan gi `VIP-medlem`. Manuell
rolleendring gjøres i Drupal og skal deretter synkroniseres til SQL.

## Produksjonskartlegging

- 5 aktive Drupal-kontoer.
- 12 aktive SQL-medlemskontoer: 10 `free`, 1 `vip`, 1 `admin`.
- Ingen dupliserte aktive e-postadresser i noen av basene.
- Alle fem avtalte Drupal-roller er allerede definert.
- Brukernavnet `Admin` finnes, er aktivt og har uid 1.
- To Drupal-kontoer har administratorrollen.
- Én Feide-identitet finnes i Drupal.
- Bare én konto har en eksplisitt Drupal–SQL-kobling, og den er `free`.
- To ukoblede kontoer kan kobles entydig på lik e-postadresse.
- Elleve aktive SQL-kontoer mangler eksplisitt Drupal-kobling.
- Fire aktive Drupal-kontoer mangler eksplisitt SQL-kobling.
- Ingen ødelagte eller dupliserte koblinger ble funnet.

## Resultat etter migrering

- 13 aktive Drupal-kontoer og 13 eksplisitte én-til-én-koblinger.
- 2 Drupal-administratorer og 2 Drupal VIP-medlemmer.
- 0 rolleavvik mellom koblede Drupal- og SQL-kontoer.
- 0 ødelagte eller dupliserte identitetskoblinger.
- 1 Feide-grant og 1 aktiv Stripe-grant administrerer de to VIP-rollene.
- Feil passord på portalsiden returnerer til portalsiden.
- `/admin-login` støtter kontobytte og komplett utlogging fra begge systemer.
- En gammel, ukoblet SQL-konto med rollen `admin` er satt på manuell kontroll
  og er ikke automatisk gitt Drupal-administratorrettigheter.

## Viktigste avvik i dagens kode

`AccessSynchronizer` og Feide-abonnenten leser SQL-rollen og legger til eller
fjerner Drupal-rollen `VIP-medlem`. Dette er motsatt av målmodellen og må snus
før medlemsadministrasjon i Drupal kan være pålitelig.

Portalens medlemsformular poster dessuten direkte til `members/login.php`.
Derfor havner feil passord på feil domene. Feilresponsen må returneres til
startsiden, mens vellykket innlogging fortsatt etablerer begge sesjonene.

## Migreringsrekkefølge

1. Ta konsistente sikkerhetskopier av begge databasene.
2. Opprett en rapport med foreslåtte én-til-én-koblinger; ingen automatisk
   kobling ved konflikt.
3. Koble de to entydige e-posttreffene.
4. Opprett Drupal-kontoer for aktive SQL-medlemmer som mangler konto.
5. Opprett SQL-speil for aktive Drupal-brukere som mangler dette.
6. Bevar eksisterende `vip` og `admin` ved å migrere dem til tilsvarende
   Drupal-roller før synkroniseringsretningen snus.
7. Gjør Drupal til autoritet og synkroniser Drupal → SQL.
8. Gjør Feide- og betalingshendelser til eksplisitte Drupal-rollehendelser.
9. Rydd innlogging, feilflyt, kontostatus, utlogging og admininngang.
10. Kjør akseptansetester før produksjonsbytte.

## Sikkerhetsregler

- Administrative roller fjernes aldri av medlems- eller betalingssynkronisering.
- Uklar identitet kobles aldri automatisk.
- E-post er bare automatisk koblingsnøkkel når den er unik i begge baser.
- Koblingstabellen er den varige identiteten etter migrering.
- Rolleendringer logges med årsak: betaling, Feide eller manuelt.
- Migreringen må kunne rulles tilbake uten tap av kontoer eller roller.

## Akseptansekriterier

- Begge innloggingssidene gir Rockeskolen- og Drupal-sesjon.
- Alle innloggede personer er fullverdige Drupal-brukere.
- Feil passord vises på siden der innloggingen startet.
- `VIP-medlem` i Drupal gir SQL-rollen `vip`.
- Fjerning av `VIP-medlem` fjerner VIP-tilgangen etter gjeldende betalingsregel.
- Feide gir `VIP-medlem` og lager ikke dublettkonto.
- `Admin` kan logge inn med brukernavn på tydelig administratorinngang.
- Utlogging avslutter begge sesjonene.
- Brukeren kan se egen status: autentisert, VIP, redaktør eller administrator.
