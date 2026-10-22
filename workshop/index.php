<?php
declare(strict_types=1);

session_set_cookie_params([
    'httponly' => true,
    'secure' => true,
    'samesite' => 'Lax',
]);
session_start();
require_once dirname(__DIR__) . '/includes/meta.php';

$formStatus = '';
$formValues = [
    'name' => '',
    'email' => '',
    'organization' => '',
    'interest' => '',
    'message' => '',
];

if (empty($_SESSION['workshop_contact_token'])) {
    $_SESSION['workshop_contact_token'] = bin2hex(random_bytes(32));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    foreach ($formValues as $field => $value) {
        $formValues[$field] = trim((string) ($_POST[$field] ?? ''));
    }

    $token = (string) ($_POST['contact_token'] ?? '');
    $honeypot = trim((string) ($_POST['website'] ?? ''));
    $lastSent = (int) ($_SESSION['workshop_contact_sent_at'] ?? 0);
    $validToken = $token !== '' && hash_equals((string) $_SESSION['workshop_contact_token'], $token);
    $validEmail = filter_var($formValues['email'], FILTER_VALIDATE_EMAIL) !== false;
    $validLengths = mb_strlen($formValues['name']) <= 120
        && mb_strlen($formValues['email']) <= 190
        && mb_strlen($formValues['organization']) <= 190
        && mb_strlen($formValues['interest']) <= 120
        && mb_strlen($formValues['message']) <= 4000;

    if (!$validToken || $honeypot !== '') {
        $formStatus = 'Ugyldig innsending. Last inn siden på nytt og prøv igjen.';
    } elseif (time() - $lastSent < 20) {
        $formStatus = 'Vent litt før du sender en ny henvendelse.';
    } elseif ($formValues['name'] === '' || !$validEmail || $formValues['message'] === '' || !$validLengths) {
        $formStatus = 'Fyll ut navn, en gyldig e-postadresse og en kort melding.';
    } else {
        $cleanEmail = str_replace(["\r", "\n"], '', $formValues['email']);
        $subject = 'Ny henvendelse om kurs og workshops';
        $body = "Navn: {$formValues['name']}\n"
            . "E-post: {$cleanEmail}\n"
            . "Skole/organisasjon: {$formValues['organization']}\n"
            . "Interessert i: {$formValues['interest']}\n\n"
            . "Melding:\n{$formValues['message']}\n";
        $headers = [
            'From: Rockeskolen <post@rockeskolen.com>',
            'Reply-To: ' . $cleanEmail,
            'Content-Type: text/plain; charset=UTF-8',
        ];

        if (mail('post@rockeskolen.com', $subject, $body, implode("\r\n", $headers))) {
            $_SESSION['workshop_contact_sent_at'] = time();
            $_SESSION['workshop_contact_token'] = bin2hex(random_bytes(32));
            header('Location: /workshop/?sendt=1#kontakt');
            exit;
        }

        $formStatus = 'Meldingen kunne ikke sendes akkurat nå. Send gjerne e-post direkte til post@rockeskolen.com.';
    }
}

$formSent = isset($_GET['sendt']) && $_GET['sendt'] === '1';

$plans = [
    [
        'title' => 'Bandverksted',
        'tag' => 'Samspill',
        'summary' => 'For ungdom i alle aldre som vil spille sammen, bygge låter og forstå rollen sin i bandet.',
        'points' => ['Oppvarming og groove', 'Låtstruktur og arrangement', 'Samspill, lytting og sceneøving'],
    ],
    [
        'title' => 'Låtskriving uten sperre',
        'tag' => 'Kreativitet',
        'summary' => 'En praktisk workshop for å komme fra idé til skisse uten å overtenke alt før musikken får starte.',
        'points' => ['Tekst, riff eller akkordidé', 'Vers, refreng og kontrast', 'Demo og enkel innspilling'],
    ],
    [
        'title' => 'Musikkproduksjon og beats',
        'tag' => 'Teknologi',
        'summary' => 'Kom i gang med lyd, beats, MIDI, arrangement og enkle produksjonsgrep i digitalt studio.',
        'points' => ['Beat og basslinje', 'Lydvalg og effekter', 'Fra loop til ferdig idé'],
    ],
    [
        'title' => 'Skolebenken live',
        'tag' => 'Teori i praksis',
        'summary' => 'Musikkteori koblet rett til instrument, øre og låter. Mindre pugging, mer aha.',
        'points' => ['Akkorder og skalaer', 'Kvintsirkelen i praksis', 'Hvordan høre det du ser'],
    ],
];
?><!doctype html>
<html lang="no">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
<?php rs_render_meta(
    'Workshop | Rockeskolen',
    'Kurs og workshops i band, låtskriving, musikkproduksjon og musikkteori i praksis.',
    'https://rockeskolen.com/workshop/',
    'https://rockeskolen.com/images/share/rockeskolen-2026.jpg',
    'Workshop på Rockeskolen'
); ?>
  <link rel="stylesheet" href="/includes/site.css?v=5">
  <style>
    @media (max-width: 640px) {
      .page-title h1 {
        font-size: clamp(38px, 11vw, 48px);
        overflow-wrap: anywhere;
      }
    }
  </style>
</head>
<body>
  <header class="page-header">
    <div class="topbar">
      <a class="brand" href="/" aria-label="Rockeskolen">
        <img src="/images/rock-logo.png" alt="Rockeskolen">
      </a>
      <nav class="nav" aria-label="Hovednavigasjon">
        <a href="/">Forside</a>
        <a href="#kontakt">Kontakt</a>
        <a href="https://portal.rockeskolen.com">Musikkportalen</a>
      </nav>
    </div>
  </header>

  <main class="page-shell">
    <section class="page-title">
      <p class="eyebrow">Kursplaner</p>
      <h1>Workshop på Rockeskolen.</h1>
      <p class="lead">
        Kurs, samlinger og workshops bygges rundt ekte musikkarbeid: spille sammen, lage noe, forstå mer og dra hjem med mer lyd i kroppen.
      </p>
    </section>

    <section class="section">
      <div class="resource-grid">
        <?php foreach ($plans as $plan): ?>
          <article class="resource-card">
            <span><?php echo htmlspecialchars($plan['tag'], ENT_QUOTES, 'UTF-8'); ?></span>
            <strong><?php echo htmlspecialchars($plan['title'], ENT_QUOTES, 'UTF-8'); ?></strong>
            <p><?php echo htmlspecialchars($plan['summary'], ENT_QUOTES, 'UTF-8'); ?></p>
            <ul>
              <?php foreach ($plan['points'] as $point): ?>
                <li><?php echo htmlspecialchars($point, ENT_QUOTES, 'UTF-8'); ?></li>
              <?php endforeach; ?>
            </ul>
          </article>
        <?php endforeach; ?>
      </div>
    </section>

    <section class="section contact-section" id="kontakt" aria-labelledby="contact-title">
      <div class="contact-copy">
        <p class="eyebrow">Ta kontakt</p>
        <p>Ta kontakt for et kurstilbud. Skriv gjerne hva dere ønsker kurs om, hvor mange personer det gjelder, og ønsket sted og tidspunkt. Vi kan foreslå et opplegg, men sted og tidspunkt må avtales nærmere.</p>
        <p class="contact-email">Du kan også skrive direkte til <a href="mailto:post@rockeskolen.com">post@rockeskolen.com</a>.</p>
      </div>

      <form class="contact-form" method="post" action="/workshop/#kontakt">
        <input type="hidden" name="contact_token" value="<?php echo htmlspecialchars((string) $_SESSION['workshop_contact_token'], ENT_QUOTES, 'UTF-8'); ?>">
        <div class="contact-honeypot" aria-hidden="true">
          <label for="website">Nettside</label>
          <input id="website" name="website" type="text" tabindex="-1" autocomplete="off">
        </div>

        <?php if ($formSent): ?>
          <div class="form-notice form-notice--success" role="status">Takk! Henvendelsen er sendt til Rockeskolen.</div>
        <?php elseif ($formStatus !== ''): ?>
          <div class="form-notice form-notice--error" role="alert"><?php echo htmlspecialchars($formStatus, ENT_QUOTES, 'UTF-8'); ?></div>
        <?php endif; ?>

        <div class="contact-field-row">
          <label>Navn <span aria-hidden="true">*</span>
            <input name="name" type="text" required autocomplete="name" maxlength="120" value="<?php echo htmlspecialchars($formValues['name'], ENT_QUOTES, 'UTF-8'); ?>">
          </label>
          <label>E-post <span aria-hidden="true">*</span>
            <input name="email" type="email" required autocomplete="email" maxlength="190" value="<?php echo htmlspecialchars($formValues['email'], ENT_QUOTES, 'UTF-8'); ?>">
          </label>
        </div>

        <div class="contact-field-row">
          <label>Skole eller organisasjon
            <input name="organization" type="text" autocomplete="organization" maxlength="190" value="<?php echo htmlspecialchars($formValues['organization'], ENT_QUOTES, 'UTF-8'); ?>">
          </label>
          <label>Hva gjelder det?
            <select name="interest">
              <option value="">Velg gjerne</option>
              <?php foreach (['Bandverksted', 'Låtskriving', 'Musikkproduksjon og beats', 'Musikkteori i praksis', 'Et annet opplegg'] as $interest): ?>
                <option value="<?php echo htmlspecialchars($interest, ENT_QUOTES, 'UTF-8'); ?>"<?php echo $formValues['interest'] === $interest ? ' selected' : ''; ?>><?php echo htmlspecialchars($interest, ENT_QUOTES, 'UTF-8'); ?></option>
              <?php endforeach; ?>
            </select>
          </label>
        </div>

        <label>Hva ser dere for dere? <span aria-hidden="true">*</span>
          <textarea name="message" required rows="6" maxlength="4000" placeholder="Skriv gjerne antall deltakere, alder, sted og ønsket tidspunkt."><?php echo htmlspecialchars($formValues['message'], ENT_QUOTES, 'UTF-8'); ?></textarea>
        </label>

        <div class="contact-submit">
          <button class="button primary" type="submit">Send henvendelse</button>
          <small>Opplysningene brukes bare for å svare på henvendelsen.</small>
        </div>
      </form>
    </section>
  </main>

  <footer class="footer">
    <div class="footer-inner">
      <strong>Rockeskolen Workshop</strong>
      <a href="mailto:post@rockeskolen.com">post@rockeskolen.com</a>
    </div>
  </footer>
</body>
</html>
