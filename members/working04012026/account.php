<?php
require __DIR__ . '/config.php';
require_login();
// Refresh user role from DB (webhooks update DB, not your session)
$u = current_user();
$stmt = $pdo->prepare("SELECT id, email, role FROM " . USER_TABLE . " WHERE id = ? LIMIT 1");
$stmt->execute([(int)$u['id']]);
if ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
  set_current_user($row);   // updates $_SESSION['user_chordlink']
  $u = current_user();      // refresh local var
}

$u = current_user();
$isPro = is_pro_user($u);

$updated = null;
$updateError = null;

// Allow users to toggle email opt-in from the account page
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $optin = isset($_POST['marketing_opt_in']) ? 1 : 0;

    try {
        $stmt = $pdo->prepare("UPDATE " . USER_TABLE . " SET marketing_opt_in = ?, marketing_opt_in_at = IF(?, NOW(), marketing_opt_in_at) WHERE id = ?");
        $stmt->execute([$optin, $optin, (int)$u['id']]);
        $updated = true;
    } catch (Exception $e) {
        $updateError = "Could not save preferences (database not updated yet).";
    }
}
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Account | ChordLink</title>
  <link rel="stylesheet" href="/members/members.css?v=1">
</head>
<body>
  <div class="wrap">
    <div class="topbar">
      <div class="brand">
        <div class="title">ChordLink</div>
        <div class="sub">Members</div>
      </div>
      <div class="row">
        <a class="btn ghost" href="/">Home</a>
        <a class="btn" href="/members/logout.php">Log out</a>
      </div>
    </div>

    <div class="card">
      <h1 class="h1">Your account</h1>

      <div class="row" style="justify-content:space-between;">
        <span class="pill">Signed in as <strong style="color:var(--text);"><?= htmlspecialchars($u['email']) ?></strong></span>
        <span class="pill">Plan: <strong style="color:var(--text);"><?= $isPro ? 'Pro' : 'Free' ?></strong></span>
      </div>

      <?php if ($updated): ?>
        <div class="alert ok" style="margin-top:14px;">Saved.</div>
      <?php elseif ($updateError): ?>
        <div class="alert danger" style="margin-top:14px;"><?= htmlspecialchars($updateError) ?></div>
      <?php endif; ?>

      <hr class="sep">

      <form method="post">
        <div class="checkbox">
          <input type="checkbox" name="marketing_opt_in" value="1" <?= !empty($_POST) ? (isset($_POST['marketing_opt_in']) ? 'checked' : '') : '' ?>>
          <div>
            <div style="font-weight:700; color:var(--text);">Product updates (optional)</div>
            <div class="small">Email me about new versions and new tools.</div>
          </div>
        </div>

        <div style="margin-top:12px;">
          <button class="btn full" type="submit">Save preferences</button>
        </div>
      </form>

      <hr class="sep">

      <?php if ($isPro): ?>
        <div class="alert ok">
          You have full access to Pro features 🎉
        </div>
      <?php else: ?>
        <div class="alert">
          Want more? Unlock all chords, scales, and upcoming tools with <strong>ChordLink Pro</strong>.
        </div>
        <div style="margin-top:12px;">
          <a class="btn primary full" href="/members/upgrade.php">Upgrade to Pro</a>
        </div>
      <?php endif; ?>

      <div class="footer-links">
        <a class="link" href="/apps/chords/piano_chords_demo.php">Piano Chord Finder</a>
        <a class="link" href="/apps/scales/piano_scales_demo.php">Scale Finder</a>
        <a class="link" href="/apps/circles/circle_of_fifths_demo.php">Circle of Fifths</a>
      </div>
    </div>
  </div>
</body>
</html>
