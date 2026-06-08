<?php
require __DIR__ . '/config.php';

$errors = [];
$email = '';

$redirect = safe_redirect('/members/account.php');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $pass  = $_POST['password'] ?? '';

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = "Invalid email address.";
    }

    if (!$errors) {
        $stmt = $pdo->prepare("SELECT id, email, password_hash, role FROM " . USER_TABLE . " WHERE email = ? AND is_active = 1");
        $stmt->execute([$email]);
        $u = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$u || !password_verify($pass, $u['password_hash'])) {
            $errors[] = "Invalid email address or password.";
        } else {
            set_current_user($u);
            header("Location: " . $redirect);
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
  <title>Log in | ChordLink</title>
  <link rel="stylesheet" href="/members/members.css?v=1">
</head>
<body>
  <div class="wrap">
    <div class="topbar">
      <div class="brand">
        <div class="title">ChordLink</div>
        <div class="sub">Members</div>
      </div>
      <a class="btn ghost" href="/">Home</a>
    </div>

    <div class="card">
      <h1 class="h1">Log in</h1>
      <div class="kicker">Use your free account to access apps and updates.</div>

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
            <label>Password</label>
            <input type="password" name="password" autocomplete="current-password" required>
          </div>
        </div>

        <div style="margin-top:14px;">
          <button class="btn primary full" type="submit">Log in</button>
        </div>
      </form>

      <div class="footer-links">
        <span>New here?</span>
        <a class="link" href="/members/register.php<?= $redirect ? '?redirect=' . urlencode($redirect) : '' ?>">Create a free account</a>
      </div>
    </div>
  </div>
</body>
</html>
