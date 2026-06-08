<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once $_SERVER['DOCUMENT_ROOT'] . '/members/config.php';

$errors = [];
$email = '';

$redirect = safe_redirect('/members/account.php');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $pass  = $_POST['password'] ?? '';

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = "Ugyldig epost-adresse.";
    }

    if (!$errors) {
        $stmt = $pdo->prepare("SELECT id, email, password_hash, role FROM " . USER_TABLE . " WHERE email = ? AND is_active = 1");
        $stmt->execute([$email]);
        $u = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$u || !password_verify($pass, $u['password_hash'])) {
            $errors[] = "Feil epost-addresse or passord.";
        } else {
            set_current_user($u);
            header("Location: " . $redirect);
            exit;
        }
    }
}
?>
<!doctype html>
<html lang="no">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Logg inn | ChordLink for Rockeskolen</title>
  <link rel="stylesheet" href="/members/members.css?v=2">
</head>
<body>
  <div class="wrap">
    <div class="topbar">
      <div class="brand">
        <div class="title">ChordLink for Rockeskolen</div>
        <div class="sub">Medlemmer</div>
      </div>
      <a class="btn ghost" href="/members/">Hjem</a>
    </div>
    <div class="card">
<h1>Logg inn</h1>
<div class="kicker">Logg inn for å få tilgang til dine verktøy og medlemsfordeler.</div>

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

    </div>
  </div>
</body>
</html>
