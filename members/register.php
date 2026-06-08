<?php
require __DIR__ . '/config.php';

$errors = [];
$email  = '';

$redirect = safe_redirect('/members/account.php');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $redirect = safe_redirect('/members/account.php');

    $email = trim($_POST['email'] ?? '');
    $pass  = $_POST['password'] ?? '';
    $pass2 = $_POST['password2'] ?? '';
    $optin = isset($_POST['marketing_opt_in']) ? 1 : 0;

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = "Ugyldig email-addresse. ";
    }
    if (strlen($pass) < 8) {
        $errors[] = "Passordet må være minst 8 tegn. ";
    }
    if ($pass !== $pass2) {
        $errors[] = "Passordene passer ikke. ";
    }

    if (!$errors) {
        $stmt = $pdo->prepare("SELECT id FROM " . USER_TABLE . " WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            $errors[] = "En konto med denne epost-adressen eksisterer allerede. ";
        } else {
            $hash = password_hash($pass, PASSWORD_DEFAULT);

            // If your DB doesn't have these columns yet, add them:
            // marketing_opt_in TINYINT(1) NOT NULL DEFAULT 0
            // marketing_opt_in_at DATETIME NULL
            $stmt = $pdo->prepare(
                "INSERT INTO " . USER_TABLE . "
                 (email, password_hash, marketing_opt_in, marketing_opt_in_at)
                 VALUES (?, ?, ?, ?)"
            );
            $stmt->execute([
                $email,
                $hash,
                $optin,
                $optin ? date('Y-m-d H:i:s') : null
            ]);

            $id = $pdo->lastInsertId();
            set_current_user([
                'id'    => $id,
                'email' => $email,
                'role'  => 'free',
            ]);

            header("Her: " . $redirect);
            exit;
        }
    }
}
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Opprett konto | ChordLink</title>
  <link rel="stylesheet" href="/members/members.css?v=1">
</head>
<body>
  <div class="wrap">
    <div class="topbar">
      <div class="brand">
        <div class="title">ChordLink</div>
        <div class="sub">Medlemmer</div>
      </div>
      <a class="btn ghost" href="https://portal.rockeskolen.com/">Hjem</a>
    </div>
    <div class="card">
<h1 class="h1">Opprett konto</h1>
<div class="kicker">
Med en gratis konto får du tilgang til flere verktøy
og oppdateringer om nye ressurser og funksjoner.
</div>

      <?php if ($errors): ?>
        <div class="alert danger" style="margin-top:14px;">
          <ul>
            <?php foreach ($errors as $e): ?>
              <li><?= htmlspecialchars($e) ?></li>
            <?php endforeach; ?>
          </ul>
        </div>
      <?php endif; ?>

      <form method="post" style="margin-top:14px;">
        <input type="hidden" name="redirect" value="<?= htmlspecialchars($redirect) ?>">

        <div class="grid">
          <div>
            <label>Email</label>
            <input type="email" name="email" value="<?= htmlspecialchars($email) ?>" autocomplete="email" required>
          </div>

          <div>
            <label>Passord (min 8 tegn)</label>
            <input type="password" name="password" autocomplete="new-password" required>
          </div>

          <div>
            <label>Repeter passord</label>
            <input type="password" name="password2" autocomplete="new-password" required>
          </div>

          <div class="checkbox">
            <input type="checkbox" name="marketing_opt_in" value="1" <?= !empty($_POST['marketing_opt_in']) ? 'checked' : '' ?>>
            <div>
              <div style="font-weight:700; color:var(--text);">Hold meg informert (valgfritt)</div>
              <div class="small">Oppdater meg om nye verktøy.</div>
            </div>
          </div>
        </div>

        <div style="margin-top:14px;">
          <button class="btn primary full" type="submit">Opprett konto</button>
        </div>
      </form>

      <div class="footer-links">
        <span>Har du allerede konto?</span>
        <a class="link" href="/members/login.php<?= $redirect ? '?redirect=' . urlencode($redirect) : '' ?>">Logg inn</a>
      </div>
    </div>
  </div>
</body>
</html>
