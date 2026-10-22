# Innlogging og SSO

Oppdatert: 2026-08-08

Rockeskolen har to brukerlag med hvert sitt ansvar:

- medlemsdatabasen på `rockeskolen.com` lagrer Rockeskolen-konto, medlemsrolle og abonnement
- Drupal på `portal.rockeskolen.com` lagrer portalsesjon, Drupal-roller og FEIDE-identitet

Passord kopieres ikke mellom systemene. De bindes sammen med en kortlivet,
engangs SSO-token.

## Felles innloggingsside

`https://portal.rockeskolen.com/user/login` er den felles innloggingssiden:

1. **E-post og passord** – skjemaet vises på portalen, autentiseres direkte mot
   medlemsdatabasen og kommer tilbake gjennom `/members/portal.php` og
   portalens `/members/sso`.
2. **FEIDE** – bruker Drupals OpenID Connect-integrasjon og kobler medlemskonto
   ved stabil FEIDE-ID eller verifisert e-post.

Lokal Drupal-innlogging er skjult bak den diskrete lenken **Administrator eller
redaktør** og er ikke ment som medlemsinnlogging.

## Direkte medlemsinnlogging

`https://rockeskolen.com/members/login.php` tilbyr Rockeskolen-passord og en
tydelig vei til FEIDE. Uten eksplisitt returadresse fortsetter vellykket
Rockeskolen-innlogging til portalen via SSO. Verktøy-, konto- og betalingsflyter
kan sende en trygg intern returadresse og beholder da denne.

## Sikkerhetsregler

- bare interne stier godtas som destinasjon
- SSO-token er tilfeldig, hashet i databasen, engangs og gyldig i fem minutter
- token er bundet til klientens IP-hash
- eksisterende Drupal-konto med samme e-post kobles ikke automatisk med lokalt
  passord; FEIDE eller eksplisitt kobling kreves
- VIP-rolle synkroniseres fra medlemsdatabasen til Drupal
