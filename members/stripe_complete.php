<?php
declare(strict_types=1);

require __DIR__ . '/config.php';
require_database();
require_once __DIR__ . '/stripe_membership.php';
require_once __DIR__ . '/../vendor/stripe/init.php';

$sessionId = $_GET['session_id'] ?? '';
if (!is_string($sessionId) || !preg_match('/^cs_(?:test|live)_[A-Za-z0-9]+$/', $sessionId)) {
    header('Location: /members/upgrade.php');
    exit;
}

\Stripe\Stripe::setApiKey(CHORDLINK_STRIPE_SECRET_KEY);
\Stripe\Stripe::setCABundlePath(__DIR__ . '/../_certs/cacert.pem');

$activation = null;
$paymentConfirmed = false;
$activationError = null;
$drupalLinked = false;
$needsPassword = false;
$reference = substr($sessionId, -10);

try {
    $checkout = \Stripe\Checkout\Session::retrieve($sessionId);
    $paymentConfirmed = (string)($checkout->mode ?? '') === 'subscription'
        && (string)($checkout->payment_status ?? '') === 'paid'
        && !empty($checkout->subscription);
    if (!$paymentConfirmed) {
        throw new RuntimeException('Checkout session is not a paid subscription.');
    }

    $subscription = \Stripe\Subscription::retrieve((string)$checkout->subscription);
    $activation = rs_store_stripe_subscription($pdo, $subscription, [
        'user_id' => (int)($checkout->metadata->user_id ?? 0),
        'email' => (string)($checkout->metadata->email ?? $checkout->customer_details->email ?? ''),
        'type' => (string)($checkout->metadata->type ?? ''),
    ]);

    if (!in_array((string)$activation['role'], VIP_ROLES, true)) {
        throw new RuntimeException('Paid subscription did not produce VIP access.');
    }

    set_current_user([
        'id' => (int)$activation['user_id'],
        'email' => (string)$activation['email'],
        'role' => (string)$activation['role'],
    ]);
    unset($_SESSION['pending_checkout']);

    $link = $pdo->prepare('SELECT drupal_uid FROM chordlink_drupal_links WHERE user_id = ? LIMIT 1');
    $link->execute([(int)$activation['user_id']]);
    $drupalLinked = (int)$link->fetchColumn() > 0;
    $passwordState = $pdo->prepare(
        'SELECT password_setup_required FROM ' . USER_TABLE . ' WHERE id = ? LIMIT 1'
    );
    $passwordState->execute([(int)$activation['user_id']]);
    $needsPassword = (bool)$passwordState->fetchColumn();
}
catch (Throwable $exception) {
    error_log('Stripe checkout activation error [' . $reference . ']: ' . $exception->getMessage());
    $activationError = $exception->getMessage();
}
?><!doctype html>
<html lang="no"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/members/members.css?v=5">
<title><?php echo $activation ? 'VIP aktivert' : 'Betalingsstatus'; ?> | Rockeskolen</title>
<style>
  .activation-steps{display:grid;gap:12px;margin-top:18px}
  .activation-step{display:grid;grid-template-columns:34px 1fr;gap:12px;padding:15px;border:1px solid rgba(255,255,255,.1);border-radius:14px;background:rgba(255,255,255,.035)}
  .activation-step-number{display:grid;place-items:center;width:32px;height:32px;border-radius:50%;background:rgba(237,28,36,.18);color:#fff;font-weight:900}
  .activation-step strong{display:block;margin-bottom:4px}
  .activation-step p{margin:0;color:var(--muted);line-height:1.5}
  .activation-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}
  .activation-reference{margin-top:14px;color:var(--muted);font-size:12px}
</style>
</head><body>
<div class="wrap">
  <div class="topbar">
    <div class="brand">
      <a href="/" aria-label="Rockeskolen"><img class="brand-logo" src="/images/rock-logo.png" alt="Rockeskolen"></a>
      <div class="sub">VIP-medlemskap</div>
    </div>
  </div>

  <div class="card">
    <?php if ($activation): ?>
      <div class="alert ok">Betalingen er bekreftet og VIP-tilgangen er aktiv.</div>
      <h1 class="h1" style="margin-top:16px;"><?php echo $needsPassword ? 'VIP aktivert – opprett passord' : 'VIP aktivert'; ?></h1>
      <p class="kicker">Kontoen er opprettet for <strong><?php echo htmlspecialchars((string)$activation['email'], ENT_QUOTES, 'UTF-8'); ?></strong>. Du er allerede logget inn i denne nettleseren.</p>

      <div class="activation-steps">
        <?php if ($needsPassword): ?>
          <div class="activation-step">
            <span class="activation-step-number">1</span>
            <div>
              <strong>Opprett passord fra e-posten</strong>
              <p>Vi har sendt en lenke til e-postadressen din. Lenken varer i én time. Finner du den ikke, kan du be om en ny.</p>
            </div>
          </div>
        <?php endif; ?>
        <div class="activation-step">
          <span class="activation-step-number"><?php echo $needsPassword ? '2' : '1'; ?></span>
          <div>
            <strong><?php echo $drupalLinked ? 'Musikkportalen er koblet til medlemskapet' : 'Koble medlemskapet til musikkportalen'; ?></strong>
            <p><?php echo $drupalLinked
                ? 'Drupal-identiteten din er allerede koblet, og VIP-rollen synkroniseres automatisk.'
                : 'Åpne portalen én gang for å opprette eller koble Drupal-brukeren og aktivere VIP der.'; ?></p>
          </div>
        </div>
      </div>

      <div class="activation-actions">
        <a class="btn primary" href="/members/portal.php">Åpne og koble portalen</a>
        <a class="btn" href="/members/account.php">Se medlemskapet</a>
        <?php if ($needsPassword): ?><a class="btn ghost" href="/members/forgot.php">Send ny passordlenke</a><?php endif; ?>
      </div>
    <?php elseif ($paymentConfirmed): ?>
      <div class="alert danger">Betalingen er bekreftet, men kontoaktiveringen ble ikke fullført automatisk.</div>
      <h1 class="h1" style="margin-top:16px;">Ikke betal på nytt</h1>
      <p class="kicker">Kjøpet er registrert hos Stripe. Kontakt <a class="link" href="mailto:post@rockeskolen.com?subject=VIP-aktivering%20<?php echo rawurlencode($reference); ?>">post@rockeskolen.com</a>, så kobler vi kontoen uten en ny betaling.</p>
      <div class="activation-reference">Referanse: <?php echo htmlspecialchars($reference, ENT_QUOTES, 'UTF-8'); ?></div>
    <?php else: ?>
      <div class="alert danger">Vi kunne ikke bekrefte en fullført betaling.</div>
      <h1 class="h1" style="margin-top:16px;">VIP er ikke aktivert</h1>
      <p class="kicker">Kontroller betalingsstatusen hos Stripe eller kontakt <a class="link" href="mailto:post@rockeskolen.com">post@rockeskolen.com</a> før du prøver igjen.</p>
      <div class="activation-reference">Referanse: <?php echo htmlspecialchars($reference, ENT_QUOTES, 'UTF-8'); ?></div>
    <?php endif; ?>
  </div>
</div>
</body></html>
