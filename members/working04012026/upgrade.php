<?php
require __DIR__ . '/config.php';
require_login();

$user = current_user();
$isPro = is_pro_user($user);

// Config
$PRICE_NOK = 29; // Price for ChordLink Pro in NOK (integer)
$CURRENCY  = 'NOK';

// PayPal Client ID (PayPal Developer dashboard)
// IMPORTANT: keep secrets out of git. Consider storing in env var.
$PAYPAL_CLIENT_ID = getenv('CHORDLINK_PAYPAL_CLIENT_ID') ?: 'YOUR_PAYPAL_CLIENT_ID';
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Upgrade to Pro | ChordLink</title>
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
      <a class="btn ghost" href="/members/account.php">Account</a>
      <a class="btn" href="/members/logout.php">Log out</a>
    </div>
  </div>

  <div class="card">
    <h1 class="h1">Upgrade to ChordLink Pro</h1>

    <div class="row" style="justify-content:space-between;">
      <span class="pill">Signed in as <strong style="color:var(--text);"><?= htmlspecialchars($user['email']) ?></strong></span>
      <span class="pill">Plan: <strong style="color:var(--text);"><?= $isPro ? "Pro" : "Free" ?></strong></span>
    </div>

    <hr class="sep">

    <?php if ($isPro): ?>
      <div class="alert ok">
        You’re already a <strong>Pro</strong> user 🎉
      </div>
      <div class="footer-links">
        <a class="link" href="/apps/chords/piano_chords_demo.php">Go to Piano Chord Finder</a>
        <a class="link" href="/apps/scales/piano_scales_demo.php">Go to Scale Finder</a>
        <a class="link" href="/apps/circles/circle_of_fifths_demo.php">Go to Circle of Fifths</a>
      </div>
    <?php else: ?>
      <div class="alert">
        As a <strong>Free</strong> user you can try a limited selection of chords/scales.
        With <strong>ChordLink Pro</strong> you get:
        <ul>
          <li>All chords and chord variations</li>
          <li>All scales and scale variations in every key</li>
          <li>Full access to upcoming tools</li>
          <li>Pro options and extended views</li>
        </ul>
      </div>

      <div style="margin-top:14px;" class="alert">
        <div class="h2" style="margin-bottom:6px;">Pay with PayPal</div>
        <div class="small">Price: <strong><?= (int)$PRICE_NOK ?> <?= htmlspecialchars($CURRENCY) ?></strong> (one-time purchase for Pro access).</div>

        <div id="paypal-button-container" style="margin-top:12px;"></div>
        <div class="small" id="paypal-status" style="margin-top:10px;"></div>
      </div>

      <script>
        const CL_PRICE    = <?= (int)$PRICE_NOK ?>;
        const CL_CURRENCY = <?= json_encode($CURRENCY) ?>;
      </script>

      <!-- PayPal JavaScript SDK -->
      <script src="https://www.paypal.com/sdk/js?client-id=<?= urlencode($PAYPAL_CLIENT_ID) ?>&currency=<?= urlencode($CURRENCY) ?>"></script>
      <script>
        const statusEl = document.getElementById('paypal-status');

        paypal.Buttons({
          createOrder: function(data, actions) {
            const valueStr = CL_PRICE.toFixed(2);
            return actions.order.create({
              purchase_units: [{
                amount: { value: valueStr, currency_code: CL_CURRENCY },
                description: "ChordLink Pro – one-time license"
              }]
            });
          },
          onApprove: function(data, actions) {
            statusEl.textContent = "Payment approved in PayPal — finalizing upgrade…";
            return actions.order.capture().then(function(details) {
              return fetch("/members/paypal_complete.php", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                  orderID: data.orderID,
                  payerID: data.payerID,
                  details: details
                })
              })
              .then(res => res.json())
              .then(res => {
                if (res && res.ok) {
                  statusEl.textContent = "You’re now upgraded to Pro 🎉";
                  setTimeout(()=>{ window.location.href = "/members/account.php"; }, 1200);
                } else {
                  statusEl.textContent = "Payment completed, but the server could not confirm the upgrade. Please contact us.";
                }
              })
              .catch(err => {
                console.error(err);
                statusEl.textContent = "Payment completed, but we could not reach the server. Please contact us.";
              });
            });
          },
          onError: function (err) {
            console.error(err);
            statusEl.textContent = "Something went wrong with the PayPal payment. Please try again.";
          },
          onCancel: function () {
            statusEl.textContent = "Payment cancelled.";
          }
        }).render('#paypal-button-container');
      </script>
    <?php endif; ?>
  </div>

  <div style="margin-top:14px;" class="alert">
  <div class="h2" style="margin-bottom:6px;">Pay with Stripe</div>

  <form method="post" action="/members/stripe_checkout.php" style="margin-bottom:10px;">
    <input type="hidden" name="type" value="pro_monthly">
    <button class="btn primary full" type="submit">Pro monthly (Stripe)</button>
  </form>

  <form method="post" action="/members/stripe_checkout.php">
    <input type="hidden" name="type" value="pro_yearly">
    <button class="btn full" type="submit">Pro yearly (Stripe)</button>
  </form>
</div>

</div>

</body>
</html>
