<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/members/config.php';

$token = $_GET['token'] ?? '';
$hash  = hash('sha256', $token);
$error = null;
$done  = false;

$stmt = $pdo->prepare(
  "SELECT id FROM " . USER_TABLE . "
   WHERE password_reset_token = ?
   AND password_reset_expires > NOW()
   LIMIT 1"
);
$stmt->execute([$hash]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    $error = "Lenken er ugyldig eller har utløpt.";
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $user) {
    $pass = $_POST['password'] ?? '';

    if (strlen($pass) < 8) {
        $error = "Passordet må være minst 8 tegn.";
    } else {
        $hashPass = password_hash($pass, PASSWORD_DEFAULT);

        $stmt = $pdo->prepare(
            "UPDATE " . USER_TABLE . "
             SET password_hash = ?, password_reset_token = NULL, password_reset_expires = NULL
             WHERE id = ?"
        );
        $stmt->execute([$hashPass, (int)$user['id']]);

        $done = true;

        // 🔥 Auto redirect etter 2 sek
        header("refresh:2;url=/members/login.php?reset=1");
    }
}
?>
<!doctype html>
<html lang="no">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Nytt passord | Rockeskolen</title>
<link rel="stylesheet" href="/members/members.css?v=1">
</head>
<body>

<div class="wrap">
  <div class="topbar">
    <div class="brand">
      <div class="title">Rockeskolen</div>
      <div class="sub">Medlemmer</div>
    </div>
  </div>

  <div class="card">
    <h1 class="h1">Sett nytt passord</h1>

    <?php if ($done): ?>
      <div class="alert ok">
        Passordet ditt er oppdatert 🎉<br>
        Du sendes til innlogging...
      </div>

    <?php elseif ($error): ?>
      <div class="alert danger">
        <?= htmlspecialchars($error) ?>
      </div>

    <?php else: ?>
      <form method="post" style="margin-top:14px;">
        <label>Nytt passord</label>
        <input type="password" name="password" required>

        <div style="margin-top:14px;">
          <button class="btn primary full" type="submit">Lagre nytt passord</button>
        </div>
      </form>
    <?php endif; ?>

  </div>
</div>

</body>
</html>