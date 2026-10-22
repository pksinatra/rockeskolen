<?php
require_once dirname(__DIR__) . '/includes/meta.php';

session_start();
$schoolForm = ['name' => '', 'email' => '', 'school' => '', 'students' => '', 'message' => ''];
$schoolStatus = '';
if (empty($_SESSION['school_contact_token'])) {
    $_SESSION['school_contact_token'] = bin2hex(random_bytes(32));
}
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['school_contact'])) {
    foreach ($schoolForm as $field => $value) {
        $schoolForm[$field] = trim((string) ($_POST[$field] ?? ''));
    }
    $validEmail = filter_var($schoolForm['email'], FILTER_VALIDATE_EMAIL) !== false;
    if ($schoolForm['name'] === '' || !$validEmail || $schoolForm['school'] === '' || $schoolForm['students'] === '' || $schoolForm['message'] === '') {
        $schoolStatus = 'Fyll ut navn, e-post, skole, antall elever og melding.';
    } else {
        $email = str_replace(["\r", "\n"], '', $schoolForm['email']);
        $body = "Navn: {$schoolForm['name']}\nE-post: {$email}\nSkole: {$schoolForm['school']}\nAntall elever: {$schoolForm['students']}\n\nMelding:\n{$schoolForm['message']}\n";
        $headers = ['From: Rockeskolen <post@rockeskolen.com>', 'Reply-To: ' . $email, 'Content-Type: text/plain; charset=UTF-8'];
        if (mail('post@rockeskolen.com', 'Tilbud om skoleabonnement', $body, implode("\r\n", $headers))) {
            $schoolStatus = 'Takk! Forespørselen er sendt til Rockeskolen.';
            $schoolForm = ['name' => '', 'email' => '', 'school' => '', 'students' => '', 'message' => ''];
        } else {
            $schoolStatus = 'Forespørselen kunne ikke sendes akkurat nå. Skriv gjerne direkte til post@rockeskolen.com.';
        }
    }
}
?><!doctype html>
<html lang="no">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
<?php rs_render_meta(
    'For skoler | Rockeskolen',
    'Bli pilotskole i Rockeskolens Musikkportal fra januar 2027: praktiske musikkverktøy, læringsressurser og FEIDE-innlogging for elever og musikklærere.',
    'https://rockeskolen.com/skoler/',
    'https://rockeskolen.com/images/share/rockeskolen-2026.jpg',
    'Rockeskolens Musikkportal for skoler'
); ?>
  <link rel="stylesheet" href="/includes/site.css?v=3">
</head>
<body>
  <header class="page-header">
    <div class="topbar">
      <a class="brand" href="/" aria-label="Rockeskolen">
        <img src="/images/rock-logo.png" alt="Rockeskolen">
      </a>
      <nav class="nav" aria-label="Hovednavigasjon">
        <a href="/tools/">Verktøy</a>
        <a href="/workshop/">Workshop</a>
        <a href="/skoler/" aria-current="page">For skoler</a>
        <a href="https://portal.rockeskolen.com/">Musikkportalen</a>
      </nav>
    </div>
  </header>

  <main class="page-shell school-page">
    <section class="page-title school-hero" aria-labelledby="school-title">
      <p class="eyebrow">Pilot 2027</p>
      <h1 id="school-title">Bli pilotskole</h1>
      <p class="lead">Rockeskolens Musikkportal samler praktiske verktøy, øvelser og fagstoff for musikklærere og elever. Fra januar 2027 inviterer vi et begrenset antall skoler til å bruke musikkportalen sammen med oss ut skoleåret.</p>
      <div class="actions">
        <a class="button primary" href="mailto:post@rockeskolen.com?subject=Interesse%20for%20Rockeskolens%20skolepilot">Meld interesse</a>
        <a class="button secondary" href="https://portal.rockeskolen.com/user/login">Prøv innlogging</a>
      </div>
      <p class="pilot-note">Deltakelse avtales direkte med hver skole.</p>
    </section>

    <section class="section school-section" aria-labelledby="school-value">
      <div class="section-head">
        <div>
          <p class="eyebrow">I undervisningen</p>
          <h2 id="school-value">Fra forklaring til lyd.</h2>
          <p>Elevene kan se, høre og prøve sammenhengen mellom teori, instrument og egen musikkskaping. Musikkportalen fungerer på mobil og datamaskin, i timen og mellom timene.</p>
        </div>
      </div>
      <div class="value-grid">
        <article class="value">
          <h3>Spill</h3>
          <p>Akkorder, skalaer, stemming og visuelle instrumentverktøy som gir rask respons.</p>
        </article>
        <article class="value">
          <h3>Forstå</h3>
          <p>Musikkteori, instrumentleksikon og komponister forklart i en praktisk sammenheng.</p>
        </article>
        <article class="value">
          <h3>Skap</h3>
          <p>Låtidéer, akkordrekker og øvelser som hjelper eleven videre fra tanke til musikk.</p>
        </article>
      </div>
    </section>

    <section class="section school-section" aria-labelledby="pilot-how">
      <div class="section-head">
        <div>
          <p class="eyebrow">Slik fungerer piloten</p>
          <h2 id="pilot-how">Vi følger dere tett i starten.</h2>
          <p>Musikkportalen er ny for dere, så vi bruker litt ekstra tid sammen i oppstarten. Etter det bruker dere den som en vanlig del av undervisningen. Finner dere feil eller noe som ikke fungerer, vil vi gjerne høre det.</p>
        </div>
      </div>
    </section>

    <section class="pilot-panel" aria-labelledby="pilot-includes">
      <div>
        <p class="eyebrow">Dette får pilotskolen</p>
        <h2 id="pilot-includes">En pilot med tett oppfølging.</h2>
      </div>
      <ul class="check-list">
        <li>Tilgang for avtalt lærer og elevgruppe ut skoleåret</li>
        <li>FEIDE-innlogging der skolen bruker FEIDE</li>
        <li>Et kort digitalt oppstartsmøte og oppfølging i startfasen</li>
        <li>Anbefalte startpunkter for undervisningen</li>
        <li>Direkte support og mulighet til å påvirke videre utvikling</li>
        <li>Evaluering etter prøvemånedene</li>
      </ul>
    </section>

    <section class="section school-section" aria-labelledby="pilot-fit">
      <div class="section-head">
        <div>
          <p class="eyebrow">Hvem passer piloten for?</p>
          <h2 id="pilot-fit">Lærere som vil prøve i praksis.</h2>
          <p>Piloten passer for grunnskole, videregående skole, kulturskole, musikkskole og andre undervisningsmiljøer som arbeider med musikk. Dere trenger ikke innføre et nytt komplett skolesystem.</p>
        </div>
      </div>
      <div class="article-card school-copy">
        <h3>Slik kommer dere i gang</h3>
        <ol>
          <li>Send oss noen linjer om skolen, elevgruppen og hva dere vil bruke musikkportalen til.</li>
          <li>Vi avklarer tilgang, FEIDE og oppstart i januar.</li>
          <li>Læreren prøver musikkportalen med gruppen og gir kort tilbakemelding.</li>
        </ol>
        <p>Piloten har manuell oppfølging. Klasseadministrasjon, vurdering og et komplett LMS er ikke en del av piloten.</p>
        <div class="actions">
          <a class="button primary" href="mailto:post@rockeskolen.com?subject=Interesse%20for%20Rockeskolens%20skolepilot">Meld interesse</a>
          <a class="button secondary" href="https://portal.rockeskolen.com/user/login">Prøv innlogging</a>
        </div>
      </div>
    </section>

    <section class="section school-section" id="abonnement" aria-labelledby="subscription-title">
      <div class="section-head"><div>
        <p class="eyebrow">Etter piloten</p>
        <h2 id="subscription-title">Abonnement for skoler</h2>
        <p>Etter piloten kan skolen tegne abonnement for skoleåret. Alle elever og lærere får VIP-tilgang med FEIDE.</p>
      </div></div>
      <ul class="check-list">
        <li>Gruppe eller klasse (opptil 30 elever): 1 490 kr per skoleår</li>
        <li>Trinn (opptil 100 elever): 2 490 kr per skoleår</li>
        <li>Hele skolen: 3 990 kr per skoleår</li>
        <li>Kommuner og flere skoler: etter avtale</li>
      </ul>
      <form class="contact-form" method="post" action="/skoler/#abonnement">
        <input type="hidden" name="school_contact" value="1">
        <?php if ($schoolStatus !== ''): ?><div class="form-notice form-notice--success" role="status"><?php echo htmlspecialchars($schoolStatus, ENT_QUOTES, 'UTF-8'); ?></div><?php endif; ?>
        <div class="contact-field-row">
          <label>Navn <span aria-hidden="true">*</span><input name="name" required value="<?php echo htmlspecialchars($schoolForm['name'], ENT_QUOTES, 'UTF-8'); ?>"></label>
          <label>E-post <span aria-hidden="true">*</span><input type="email" name="email" required value="<?php echo htmlspecialchars($schoolForm['email'], ENT_QUOTES, 'UTF-8'); ?>"></label>
        </div>
        <div class="contact-field-row">
          <label>Skole <span aria-hidden="true">*</span><input name="school" required value="<?php echo htmlspecialchars($schoolForm['school'], ENT_QUOTES, 'UTF-8'); ?>"></label>
          <label>Antall elever <span aria-hidden="true">*</span><input name="students" required value="<?php echo htmlspecialchars($schoolForm['students'], ENT_QUOTES, 'UTF-8'); ?>"></label>
        </div>
        <label>Melding <span aria-hidden="true">*</span><textarea name="message" required rows="5"><?php echo htmlspecialchars($schoolForm['message'], ENT_QUOTES, 'UTF-8'); ?></textarea></label>
        <button class="button primary" type="submit">Be om tilbud</button>
      </form>
    </section>
  </main>

  <footer class="footer">
    <div class="footer-inner">
      <strong>Rockeskolen</strong>
      <span>Spørsmål om piloten: post@rockeskolen.com</span>
    </div>
  </footer>
</body>
</html>
