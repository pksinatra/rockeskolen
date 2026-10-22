<?php
declare(strict_types=1);

require $_SERVER['DOCUMENT_ROOT'] . '/members/config.php';
require_database();
refresh_user_from_db();

$admin = current_user();
if (!$admin || ($admin['role'] ?? '') !== 'admin') {
    http_response_code(403);
    exit('Ingen tilgang');
}

$stmt = $pdo->query(
    "SELECT u.id, u.email, u.role, u.created_at,
            s.plan AS subscription_plan,
            s.status AS subscription_status,
            s.current_period_end,
            s.cancel_at_period_end,
            l.drupal_uid
       FROM " . USER_TABLE . " u
       LEFT JOIN chordlink_subscriptions s
         ON s.id = (
           SELECT MAX(s2.id) FROM chordlink_subscriptions s2 WHERE s2.user_id = u.id
         )
       LEFT JOIN chordlink_drupal_links l ON l.user_id = u.id
      ORDER BY u.id DESC"
);
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

function admin_plan_label(?string $plan): string {
    return match ($plan) {
        'vip_monthly' => 'VIP månedlig',
        'vip_yearly' => 'VIP årlig',
        'pro_monthly' => 'Pro månedlig',
        'pro_yearly' => 'Pro årlig',
        default => 'Ingen betaling',
    };
}

function admin_status_label(?string $status): string {
    return match ($status) {
        'active' => 'Aktiv',
        'trialing' => 'Prøveperiode',
        'past_due' => 'Forfalt',
        'canceled' => 'Avsluttet',
        'unpaid' => 'Ikke betalt',
        'incomplete' => 'Ufullført',
        'expired' => 'Utløpt',
        'paused' => 'Pauset',
        default => '—',
    };
}
?><!doctype html>
<html lang="no">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Medlemsadministrasjon | Rockeskolen</title>
  <link rel="stylesheet" href="/members/members.css?v=5">
  <style>
    .member-table-wrap{overflow-x:auto;margin-top:16px}
    .member-table{width:100%;border-collapse:collapse;min-width:940px}
    .member-table th,.member-table td{padding:12px 10px;border-bottom:1px solid rgba(255,255,255,.09);text-align:left;vertical-align:top}
    .member-table th{color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.04em}
    .member-table td{font-size:14px}
    .status-dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:7px;background:#7c8290}
    .status-dot.ok{background:#44ce78}.status-dot.warn{background:#ffb347}
    .member-meta{display:block;margin-top:4px;color:var(--muted);font-size:12px}
    .admin-summary{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}
  </style>
</head>
<body>
<div class="wrap">
  <div class="topbar">
    <div class="brand">
      <a href="/" aria-label="Rockeskolen"><img class="brand-logo" src="/images/rock-logo.png" alt="Rockeskolen"></a>
      <div class="sub">Medlemsadministrasjon</div>
    </div>
    <div class="row">
      <a class="btn ghost" href="/members/account.php">Min konto</a>
      <a class="btn logout" href="<?= htmlspecialchars(member_logout_url(), ENT_QUOTES, 'UTF-8') ?>">Logg ut</a>
    </div>
  </div>

  <div class="card">
    <h1 class="h1">Medlemmer</h1>
    <div class="admin-summary">
      <span class="pill"><?= count($users) ?> medlemskontoer</span>
      <span class="pill">Betaling og Drupal-kobling vises samlet</span>
    </div>

    <div class="member-table-wrap">
      <table class="member-table">
        <thead><tr>
          <th>ID</th><th>Medlem</th><th>Rolle</th><th>Betaling</th><th>Drupal/portal</th><th>Opprettet</th>
        </tr></thead>
        <tbody>
        <?php foreach ($users as $user):
          $paymentActive = in_array($user['subscription_status'], ['active', 'trialing'], true);
          $drupalLinked = (int)($user['drupal_uid'] ?? 0) > 0;
        ?>
          <tr>
            <td><?= (int)$user['id'] ?></td>
            <td><strong><?= htmlspecialchars((string)$user['email'], ENT_QUOTES, 'UTF-8') ?></strong></td>
            <td><?= htmlspecialchars(strtoupper((string)$user['role']), ENT_QUOTES, 'UTF-8') ?></td>
            <td>
              <span class="status-dot <?= $paymentActive ? 'ok' : ($user['subscription_status'] ? 'warn' : '') ?>"></span>
              <strong><?= htmlspecialchars(admin_status_label($user['subscription_status']), ENT_QUOTES, 'UTF-8') ?></strong>
              <span class="member-meta"><?= htmlspecialchars(admin_plan_label($user['subscription_plan']), ENT_QUOTES, 'UTF-8') ?></span>
              <?php if (!empty($user['current_period_end'])): ?>
                <span class="member-meta"><?= !empty($user['cancel_at_period_end']) ? 'Avsluttes' : 'Fornyes' ?> <?= htmlspecialchars(date('d.m.Y', strtotime((string)$user['current_period_end'])), ENT_QUOTES, 'UTF-8') ?></span>
              <?php endif; ?>
            </td>
            <td>
              <span class="status-dot <?= $drupalLinked ? 'ok' : 'warn' ?>"></span>
              <strong><?= $drupalLinked ? 'Koblet' : 'Ikke koblet' ?></strong>
              <span class="member-meta"><?= $drupalLinked ? 'Drupal-ID ' . (int)$user['drupal_uid'] : 'Venter på første portalåpning' ?></span>
            </td>
            <td><?= htmlspecialchars(date('d.m.Y H:i', strtotime((string)$user['created_at'])), ENT_QUOTES, 'UTF-8') ?></td>
          </tr>
        <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </div>
</div>
</body>
</html>
