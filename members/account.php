<?php
declare(strict_types=1);

require __DIR__ . '/config.php';
require_login();
require_database();
header('Cache-Control: no-store, no-cache, must-revalidate');
header('Pragma: no-cache');
// Refresh user role from DB (webhooks update DB, not your session)
$u = current_user();

$stmt = $pdo->prepare("SELECT id, email, role, marketing_opt_in, provider, feide_id,
                              CASE
                                WHEN provider = 'feide' OR (feide_id IS NOT NULL AND feide_id <> '') THEN 0
                                ELSE password_setup_required
                              END AS needs_password
                         FROM " . USER_TABLE . " WHERE id = ? LIMIT 1");
$stmt->execute([(int)$u['id']]);
if ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
  set_current_user($row);   // updates $_SESSION['user_chordlink']
  $u = $row;                // ← viktig: bruk DB-raden her
}
$subscription = get_active_subscription((int)$u['id']);

$marketingOptIn = !empty($u['marketing_opt_in']);
$needsPassword = !empty($u['needs_password']);
$hasPaidAccess = has_rockeskolen_access($u);
$roleLabel = match ($u['role']) {
    'vip' => 'VIP',
    'pro' => 'VIP',
    'admin' => 'Administrator',
    default => 'Gratis',
};
$planLabel = match ($subscription['plan'] ?? '') {
    'vip_monthly' => 'VIP månedlig',
    'vip_yearly' => 'VIP årlig',
    'pro_monthly' => 'VIP månedlig',
    'pro_yearly' => 'VIP årlig',
    default => 'Ingen aktiv betaling',
};
$statusLabel = match ($subscription['status'] ?? '') {
    'active' => 'Aktiv',
    'trialing' => 'Prøveperiode',
    'past_due' => 'Forfalt',
    default => 'Ikke aktiv',
};
$drupalLink = $pdo->prepare('SELECT drupal_uid FROM chordlink_drupal_links WHERE user_id = ? LIMIT 1');
$drupalLink->execute([(int)$u['id']]);
$drupalUid = (int)$drupalLink->fetchColumn();
$portalLinked = $drupalUid > 0;
if ($portalLinked && $hasPaidAccess) {
    $portalStatusLabel = 'VIP aktiv';
    $portalDescription = 'VIP-tilgangen er aktiv i musikkportalen.';
    $portalActionLabel = 'Åpne musikkportalen';
}
elseif ($portalLinked) {
    $portalStatusLabel = 'Koblet';
    $portalDescription = 'Kontoen er koblet til musikkportalen. Medlemsnivået er VIP.';
    $portalActionLabel = 'Åpne musikkportalen';
}
elseif ($hasPaidAccess) {
    $portalStatusLabel = 'Ikke koblet';
    $portalDescription = 'VIP-medlemskapet er aktivt, men kontoen må kobles til musikkportalen.';
    $portalActionLabel = 'Koble VIP til musikkportalen';
}
else {
    $portalStatusLabel = 'Ikke koblet';
    $portalDescription = 'Kontoen er ikke koblet til musikkportalen.';
    $portalActionLabel = 'Koble til musikkportalen';
}

$updated = null;
$updateError = null;
$passwordUpdated = false;
$passwordError = null;
if (empty($_SESSION['account_csrf_token'])) {
    $_SESSION['account_csrf_token'] = bin2hex(random_bytes(32));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $csrf = (string)($_POST['csrf_token'] ?? '');
    $validCsrf = $csrf !== '' && hash_equals((string)$_SESSION['account_csrf_token'], $csrf);
    $action = (string)($_POST['action'] ?? '');

    if (!$validCsrf) {
        $passwordError = 'Skjemaet er utløpt. Last inn siden på nytt og prøv igjen.';
    }
    elseif ($action === 'set_password' && $needsPassword) {
        $password = (string)($_POST['password'] ?? '');
        $passwordConfirm = (string)($_POST['password_confirm'] ?? '');
        if (strlen($password) < 8) {
            $passwordError = 'Passordet må være minst 8 tegn.';
        }
        elseif (!hash_equals($password, $passwordConfirm)) {
            $passwordError = 'Passordene er ikke like.';
        }
        else {
            $stmt = $pdo->prepare(
                'UPDATE ' . USER_TABLE . '
                    SET password_hash = ?, password_reset_token = NULL,
                        password_reset_expires = NULL, password_setup_required = 0
                  WHERE id = ?'
            );
            $stmt->execute([password_hash($password, PASSWORD_DEFAULT), (int)$u['id']]);
            $needsPassword = false;
            $passwordUpdated = true;
            $_SESSION['account_csrf_token'] = bin2hex(random_bytes(32));
            session_regenerate_id(true);
        }
    }
    elseif ($action === 'marketing') {
        $optin = isset($_POST['marketing_opt_in']) ? 1 : 0;
        try {
            $stmt = $pdo->prepare("UPDATE " . USER_TABLE . " SET marketing_opt_in = ?, marketing_opt_in_at = IF(?, NOW(), marketing_opt_in_at) WHERE id = ?");
            $stmt->execute([$optin, $optin, (int)$u['id']]);
            $marketingOptIn = (bool)$optin;
            $updated = true;
        } catch (Exception $e) {
            $updateError = "Kunne ikke lagre preferansene (databasen ble ikke oppdatert).";
        }
    }
}
?>
<!doctype html>
<html lang="no">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Min konto | Rockeskolen</title>
  <link rel="stylesheet" href="/members/members.css?v=6">
</head>
<body class="account-page">
  <div class="wrap">
    <div class="topbar">
      <div class="brand">
        <div class="title">Rockeskolen</div>
        <div class="sub">Medlemskonto</div>
      </div>
      <div class="row">
        <a class="btn ghost" href="/">Hjem</a>
        <a class="btn logout" href="<?= htmlspecialchars(member_logout_url(), ENT_QUOTES, 'UTF-8') ?>">Logg ut av Rockeskolen</a>
      </div>
    </div>

    <?php if ($needsPassword || $passwordUpdated || $passwordError): ?>
      <div class="card password-card">
        <?php if ($passwordUpdated): ?>
          <div class="alert ok">Passordet er opprettet. Du kan nå logge inn på vanlig måte.</div>
        <?php else: ?>
          <h1 class="h1" style="margin-top:0;">Opprett passord</h1>
          <p class="small">Velg et passord du kan bruke neste gang du logger inn på Rockeskolen.</p>
          <?php if ($passwordError): ?><div class="alert danger" style="margin-top:12px;"><?= htmlspecialchars($passwordError, ENT_QUOTES, 'UTF-8') ?></div><?php endif; ?>
          <form method="post" style="margin-top:14px;">
            <input type="hidden" name="action" value="set_password">
            <input type="hidden" name="csrf_token" value="<?= htmlspecialchars((string)$_SESSION['account_csrf_token'], ENT_QUOTES, 'UTF-8') ?>">
            <div class="grid">
              <div>
                <label for="new-password">Nytt passord</label>
                <input id="new-password" type="password" name="password" minlength="8" autocomplete="new-password" required>
              </div>
              <div>
                <label for="new-password-confirm">Gjenta passordet</label>
                <input id="new-password-confirm" type="password" name="password_confirm" minlength="8" autocomplete="new-password" required>
              </div>
            </div>
            <div style="margin-top:14px;"><button class="btn primary" type="submit">Opprett passord</button></div>
          </form>
        <?php endif; ?>
      </div>
    <?php endif; ?>

    <div class="card account-overview">
      <div class="account-kicker">Kontooversikt</div>
      <h1 class="h1">Ditt medlemskap</h1>

<?php if ($subscription): ?>
  <h2 class="h2" style="margin-top:22px;">Medlemskap</h2>

  <div class="card membership-card" style="margin-top:10px;">
    <div class="row" style="justify-content:space-between;">
      <div>
        <strong>Plan:</strong>
        <?= htmlspecialchars($planLabel, ENT_QUOTES, 'UTF-8') ?>
      </div>
      <div>
        <strong>Status:</strong>
        <?= htmlspecialchars($statusLabel, ENT_QUOTES, 'UTF-8') ?>
      </div>
    </div>

    <div class="small" style="margin-top:6px;">
      Fornyes <?= htmlspecialchars(date('d.m.Y', strtotime((string)$subscription['current_period_end'])), ENT_QUOTES, 'UTF-8') ?>
    </div>
  </div>
<?php endif; ?>

      <div class="row" style="justify-content:space-between;">
        <span class="pill">Logget inn som <strong style="color:var(--text);"><?= htmlspecialchars($u['email']) ?></strong></span>
        <span class="pill">Medlemsnivå: <strong style="color:var(--text);"><?= htmlspecialchars($roleLabel, ENT_QUOTES, 'UTF-8') ?></strong></span>
      </div>

      <div class="card portal-card" style="margin-top:14px;">
        <div class="row" style="justify-content:space-between;align-items:flex-start;gap:16px;">
          <div>
            <strong>Rockeskolens Musikkportal</strong>
            <div class="small" style="margin-top:5px;">
              <?= htmlspecialchars($portalDescription, ENT_QUOTES, 'UTF-8') ?>
            </div>
          </div>
          <span class="pill"><strong style="color:var(--text);"><?= htmlspecialchars($portalStatusLabel, ENT_QUOTES, 'UTF-8') ?></strong></span>
        </div>
        <div style="margin-top:12px;">
          <a class="btn primary" href="/members/portal.php"><?= htmlspecialchars($portalActionLabel, ENT_QUOTES, 'UTF-8') ?></a>
        </div>
      </div>

      <?php if ($updated): ?>
        <div class="alert ok" style="margin-top:14px;">Registrert.</div>
      <?php elseif ($updateError): ?>
        <div class="alert danger" style="margin-top:14px;"><?= htmlspecialchars($updateError) ?></div>
      <?php endif; ?>

      <hr class="sep">

<?php if (!$marketingOptIn): ?>
  <form method="post">
    <input type="hidden" name="action" value="marketing">
    <input type="hidden" name="csrf_token" value="<?= htmlspecialchars((string)$_SESSION['account_csrf_token'], ENT_QUOTES, 'UTF-8') ?>">
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

      <?php if ($hasPaidAccess): ?>
        <div class="alert ok">
          Du har full tilgang til Rockeskolens medlemsinnhold og verktøy. 🎉
        </div>
      <?php else: ?>
        <div class="alert">
          Vil du ha mer? Lås opp alle akkordene, skalaene og kommende verktøy med <strong>Rockeskolen VIP</strong>-medlemskap.
        </div>
        <div style="margin-top:12px;">
          <a class="btn primary full" href="/members/upgrade.php">Oppgrader til VIP</a>
        </div>
      <?php endif; ?>

    </div>
  </div>
</body>
</html>
