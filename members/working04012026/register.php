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
        $errors[] = "Invalid email address.";
    }
    if (strlen($pass) < 8) {
        $errors[] = "Password must be at least 8 characters long.";
    }
    if ($pass !== $pass2) {
        $errors[] = "The passwords do not match.";
    }

    if (!$errors) {
        $stmt = $pdo->prepare("SELECT id FROM " . USER_TABLE . " WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            $errors[] = "An account with this email address already exists.";
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
  <title>Create account | ChordLink</title>
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
      <h1 class="h1">Create a free account</h1>
      <div class="kicker">Free accounts unlock the demos and let you get updates about new apps.</div>

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
            <label>Password (min 8 characters)</label>
            <input type="password" name="password" autocomplete="new-password" required>
          </div>

          <div>
            <label>Repeat password</label>
            <input type="password" name="password2" autocomplete="new-password" required>
          </div>

          <div class="checkbox">
            <input type="checkbox" name="marketing_opt_in" value="1" <?= !empty($_POST['marketing_opt_in']) ? 'checked' : '' ?>>
            <div>
              <div style="font-weight:700; color:var(--text);">Keep me posted (optional)</div>
              <div class="small">Email me about new versions and new tools.</div>
            </div>
          </div>
        </div>

        <div style="margin-top:14px;">
          <button class="btn primary full" type="submit">Create account</button>
        </div>
      </form>

      <div class="footer-links">
        <span>Already have an account?</span>
        <a class="link" href="/members/login.php<?= $redirect ? '?redirect=' . urlencode($redirect) : '' ?>">Log in</a>
      </div>
    </div>
  </div>
</body>
</html>
