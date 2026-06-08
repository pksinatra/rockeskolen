<?php
require __DIR__ . '/config.php';
require_login();
// Refresh user role from DB (webhooks update DB, not your session)
$u = current_user();

$stmt = $pdo->prepare("SELECT id, email, role, marketing_opt_in FROM " . USER_TABLE . " WHERE id = ? LIMIT 1");
$stmt->execute([(int)$u['id']]);
if ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
  set_current_user($row);   // updates $_SESSION['user_chordlink']
  $u = $row;                // ← viktig: bruk DB-raden her
}
$subscription = get_active_subscription((int)$u['id']);

$marketingOptIn = !empty($u['marketing_opt_in']);
$isPro = in_array($u['role'], PRO_ROLES, true);

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
        $updateError = "Kunne ikke lagre preferansene (databasen ble ikke oppdatert).";
    }
}
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Konto | ChordLink</title>
  <link rel="stylesheet" href="/members/members.css?v=1">
</head>
<body>
  <div class="wrap">
    <div class="topbar">
      <div class="brand">
        <div class="title">ChordLink for Rockeskolen</div>
        <div class="sub">VIP Medlemmer</div>
      </div>
      <div class="row">
        <a class="btn ghost" href="/">Hjem</a>
        <a class="btn" href="/members/logout.php">Logg ut</a>
      </div>
    </div>

    <div class="card">
      <h1 class="h1">Ditt medlemsskap</h1>
<h2 class="h2" style="margin-top:10px;">Tilgjengelige verktøy</h2>

<div class="apps-grid">

  <a class="app-card" href="/tools/chords/piano/">
    <div class="app-icon">🎹</div>
    <div class="app-title">Piano-akkorder</div>
  </a>

  <a class="app-card" href="/tools/scales/piano/">
    <div class="app-icon">🎼</div>
    <div class="app-title">Skalaer</div>
  </a>

  <a class="app-card" href="/tools/chords/guitar/">
    <div class="app-icon">🎸</div>
    <div class="app-title">Gitar-akkorder</div>
  </a>

  <a class="app-card" href="/tools/circles/fifths/">
    <div class="app-icon">⭕</div>
    <div class="app-title">Kvintsirkelen</div>
  </a>
<?php if ($subscription): ?>
  <h2 class="h2">Medlemsskap</h2>

  <div class="card" style="margin-top:10px;">
    <div class="row" style="justify-content:space-between;">
      <div>
        <strong>Plan:</strong>
        <?= htmlspecialchars(ucwords(str_replace('_', ' ', $subscription['plan']))) ?>
      </div>
      <div>
        <strong>Status:</strong>
        <?= htmlspecialchars(ucfirst($subscription['status'])) ?>
      </div>
    </div>

    <div class="small" style="margin-top:6px;">
      Fornyes <?= date('j M Y', strtotime($subscription['current_period_end'])) ?>
    </div>
  </div>
<?php endif; ?>

</div>

      <div class="row" style="justify-content:space-between;">
        <span class="pill">Logget inn som <strong style="color:var(--text);"><?= htmlspecialchars($u['email']) ?></strong></span>
        <span class="pill">Plan: <strong style="color:var(--text);"><?= $isPro ? 'Pro' : 'Free' ?></strong></span>
      </div>

      <?php if ($updated): ?>
        <div class="alert ok" style="margin-top:14px;">Registrert.</div>
      <?php elseif ($updateError): ?>
        <div class="alert danger" style="margin-top:14px;"><?= htmlspecialchars($updateError) ?></div>
      <?php endif; ?>

      <hr class="sep">

<?php if (!$marketingOptIn): ?>
  <form method="post">
    <div class="checkbox">
      <input type="checkbox" name="marketing_opt_in" value="1">
      <div>
        <div style="font-weight:700; color:var(--text);">
          Produktoppdateringer (valgfritt)
        </div>
        <div class="small">
          Send meg oppdatering når det kommer nye verktøy.
        </div>
      </div>
    </div>

    <div style="margin-top:12px;">
      <button class="btn full" type="submit">Lagre valg</button>
    </div>
  </form>
<?php else: ?>
  <div class="alert ok">
    Du er registrert for å få varsel om oppdateringer ✨
    <div class="small">
      Du kan melde deg av tjenesten når som helst direkte fra våre e-poster. 
    </div>
  </div>
<?php endif; ?>

      <hr class="sep">

      <?php if ($isPro): ?>
        <div class="alert ok">
          Du har full tilgang til alle funksjonene i ChordLink for Rockeskolen. 🎉
        </div>
      <?php else: ?>
        <div class="alert">
          Vil du ha mere? Lås opp alle akkordene, skalaene og kommende verktøy med <strong>Rockeskolen VIP</strong> medlemsskap.
        </div>
        <div style="margin-top:12px;">
          <a class="btn primary full" href="/members/upgrade.php">Oppgrader til VIP</a>
        </div>
      <?php endif; ?>

      <div class="footer-links">
        <a class="link" href="/tools/chords/piano/">Piano-akkorder</a>
        <a class="link" href="/tools/chords/piano/">Gitar-akkorder</a>
        <a class="link" href="/tools/scales/piano/">Skalaer</a>
        <a class="link" href="/tools/circles/fifths/">Kvintsirkelen</a>
        <a class="link" href="/tools/circles/tuners/">Stemmegaffel</a>        
      </div>
    </div>
  </div>
</body>
</html>
