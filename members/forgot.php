<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/members/config.php';

$sent = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');

    if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $stmt = $pdo->prepare(
            "SELECT id FROM " . USER_TABLE . " WHERE email = ? AND is_active = 1 LIMIT 1"
        );
        $stmt->execute([$email]);

        if ($u = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $token = bin2hex(random_bytes(32));
            $hash  = hash('sha256', $token);

            $stmt = $pdo->prepare(
                "UPDATE " . USER_TABLE . "
                 SET password_reset_token = ?, password_reset_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR)
                 WHERE id = ?"
            );
            $stmt->execute([$hash, (int)$u['id']]);

            $link = "https://www.rockeskolen.com/members/reset.php?token=$token";

            mail(
                $email,
                "Nullstill ditt passord for Rockeskolen.com",
                "Klikk på linken under for å nullstille ditt passord:\n\n$link\n\nLinken er gyldig i 1 time."
            );
        }
    }

    $sent = true;
}
?>
<!doctype html>
<html lang="no">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Glemt passord | Rockeskolen</title>
  <link rel="stylesheet" href="/members/members.css?v=1">
</head>
<body>

<div class="wrap">
  <div class="topbar">
    <div class="brand">
      <div class="title">Rockeskolen</div>
      <div class="sub">Medlemmer</div>
    </div>
    <a class="btn ghost" href="/members/login.php">Logg inn</a>
  </div>

  <div class="card">
    <h1 class="h1">Glemt passord</h1>
    <div class="kicker">
      Skriv inn e-postadressen din, så sender vi deg en lenke for å lage et nytt passord.
    </div>

    <?php if ($sent): ?>
      <div class="alert ok" style="margin-top:14px;">
        Hvis e-postadressen finnes i systemet, har vi sendt deg en lenke for å nullstille passordet ✉️
      </div>

      <div class="small" style="margin-top:10px;">
        Sjekk også søppelpost dersom du ikke finner e-posten.
      </div>

    <?php else: ?>
      <form method="post" style="margin-top:14px;">
        <div>
          <label>E-postadresse</label>
          <input type="email" name="email" required autocomplete="email">
        </div>

        <div style="margin-top:14px;">
          <button class="btn primary full" type="submit">Send reset-lenke</button>
        </div>
      </form>
    <?php endif; ?>

    <div class="footer-links">
      <a class="link" href="/members/login.php">Tilbake til innlogging</a>
    </div>

  </div>
</div>

</body>
</html>