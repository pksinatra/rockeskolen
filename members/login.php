<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once $_SERVER['DOCUMENT_ROOT'] . '/members/config.php';

$errors = [];
$email = '';

$redirect = safe_redirect('/members/portal.php');
$feideDestination = '/';
$redirectPath = parse_url($redirect, PHP_URL_PATH);
if ($redirectPath === '/members/portal.php') {
    parse_str((string) parse_url($redirect, PHP_URL_QUERY), $portalQuery);
    $candidate = $portalQuery['destination'] ?? '/';
    if (is_string($candidate) && $candidate !== '' && $candidate[0] === '/' && !str_starts_with($candidate, '//')) {
        $feideDestination = $candidate;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $pass  = $_POST['password'] ?? '';

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = "Ugyldig epost-adresse.";
    }

    if (!$errors) {
        $stmt = $pdo->prepare("SELECT id, email, password_hash, role, provider, feide_id FROM " . USER_TABLE . " WHERE email = ? AND is_active = 1");
        $stmt->execute([$email]);
        $u = $stmt->fetch(PDO::FETCH_ASSOC);

        $isFeide = $u && (
            ($u['provider'] ?? '') === 'feide'
            || !empty($u['feide_id'])
        );
        if ($isFeide) {
            $errors[] = "Denne kontoen bruker FEIDE. Velg FEIDE-innlogging nedenfor.";
        } elseif (!$u || !password_verify($pass, $u['password_hash'])) {
            $errors[] = "Feil e-postadresse eller passord.";
        } else {
            set_current_user($u);
            header("Location: " . $redirect);
            exit;
        }
    }
}

// Keep authentication errors on the page where the user started. The portal
// posts here to establish the Rockeskolen session, but should remain the
// visible login surface when credentials are rejected.
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $errors && $redirectPath === '/members/portal.php') {
    $portalErrorUrl = 'https://portal.rockeskolen.com/user/login?login_error=credentials&destination=' . rawurlencode($feideDestination);
    header('Location: ' . $portalErrorUrl, true, 303);
    exit;
}
?>
<!doctype html>
<html lang="no">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Logg inn | Rockeskolen</title>
  <link rel="stylesheet" href="/members/members.css?v=4">
</head>
<body>
  <div class="wrap">
    <div class="topbar">
      <div class="brand">
        <div class="title">Rockeskolen</div>
        <div class="sub">Innlogging</div>
      </div>
      <a class="btn ghost" href="/">Hjem</a>
    </div>
    <div class="card">
<h1>Logg inn med Rockeskolen-konto</h1>
<div class="kicker">Bruk e-postadressen og passordet du registrerte hos Rockeskolen.</div>

      <?php if ($errors): ?>
        <div class="alert danger" style="margin-top:14px;">
          <ul>
            <?php foreach ($errors as $e): ?>
              <li><?= htmlspecialchars($e) ?></li>
            <?php endforeach; ?>
          </ul>
        </div>
<h1>Ikke medlem?</h1>
<p class="small">
Registrer deg som gratis medlem hos Rockeskolen, og få begrenset tilgang.
<br><br>
<a class="link" href="/members/register.php<?= $redirect ? '?redirect=' . urlencode($redirect) : '' ?>">
Opprett konto
</a>
</p>

      <?php endif; ?>

      <form method="post" style="margin-top:14px;">
        <input type="hidden" name="redirect" value="<?= htmlspecialchars($redirect) ?>">

        <div class="grid">
          <div>
            <label>Email</label>
            <input type="email" name="email" value="<?= htmlspecialchars($email) ?>" autocomplete="email" required>
          </div>

          <div>
            <label>Passord</label>
            <input type="password" name="password" autocomplete="current-password" required>
          </div>
        </div>

        <div style="margin-top:14px;">
          <button class="btn primary full" type="submit">Logg inn</button>
        </div>
      </form>

      <div class="footer-links">
        <span>Ny her?</span>
        <a class="link" href="/members/register.php<?= $redirect ? '?redirect=' . urlencode($redirect) : '' ?>">Opprett gratis medlemskonto</a>
      </div>

      <div class="small" style="margin-top:10px;">
  <a class="link" href="/members/forgot.php">Glemt passordet?</a>
</div>

      <div class="auth-divider"><span>eller</span></div>
      <section class="feide-choice" aria-labelledby="feide-choice-title">
        <h2 id="feide-choice-title">Har du FEIDE?</h2>
        <p class="small">Elever og ansatte kan bruke skolekontoen sin i Rockeskolens Musikkportal.</p>
        <a class="btn feide full" href="https://portal.rockeskolen.com/user/login?destination=<?= rawurlencode($feideDestination) ?>">Gå til FEIDE-innlogging</a>
      </section>

    </div>
  </div>
</body>
</html>
