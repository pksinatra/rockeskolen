<?php
require $_SERVER['DOCUMENT_ROOT'] . '/members/config.php';

refresh_user_from_db();

$user = current_user();
$isLoggedIn = (bool)$user;

$selectedType = $_POST['type'] ?? 'vip_monthly';
if (!in_array($selectedType, ['vip_monthly', 'vip_yearly'], true)) {
    $selectedType = 'vip_monthly';
}

$prefillName  = trim($_POST['name'] ?? '');
$prefillEmail = trim($_POST['email'] ?? ($user['email'] ?? ''));

$formError = null;

// Hvis bruker allerede er logget inn og har tilgang, send til konto
if ($isLoggedIn && in_array(($user['role'] ?? ''), ['pro','vip','admin'], true)) {
    header("Location: /members/account.php");
    exit;
}

// Hvis skjema sendes inn, lagre navn+epost i session og send videre til Stripe
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['start_checkout'])) {
    $name  = trim($_POST['name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $type  = $_POST['type'] ?? 'vip_monthly';

    if (!in_array($type, ['vip_monthly', 'vip_yearly'], true)) {
        $type = 'vip_monthly';
    }

    if ($name === '') {
        $formError = 'Skriv inn navnet ditt.';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $formError = 'Skriv inn en gyldig e-postadresse.';
    } else {
        $_SESSION['pending_checkout'] = [
            'name'  => $name,
            'email' => $email,
            'type'  => $type,
        ];

        header("Location: /members/stripe_checkout.php?type=" . urlencode($type));
        exit;
    }
}
?>
<!doctype html>
<html lang="no">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Bli VIP-medlem | Rockeskolen</title>
  <link rel="stylesheet" href="/members/members.css?v=3">
  <style>
    .hero {
      padding: 26px;
      border-radius: 18px;
      background:
        radial-gradient(900px 400px at 0% 0%, rgba(255,92,122,.16), transparent 50%),
        radial-gradient(900px 500px at 100% 0%, rgba(84,210,242,.14), transparent 50%),
        radial-gradient(700px 500px at 50% 100%, rgba(178,139,255,.14), transparent 50%),
        rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.12);
      box-shadow: var(--shadow);
    }

    .hero-title {
      font-size: clamp(30px, 5vw, 52px);
      line-height: 1.02;
      margin: 0 0 10px;
      font-weight: 900;
      letter-spacing: -.02em;
    }

    .hero-lead {
      max-width: 780px;
      font-size: 17px;
      color: var(--muted);
      margin: 0 0 18px;
    }

    .hero-pills {
      display:flex;
      flex-wrap:wrap;
      gap:10px;
      margin: 16px 0 0;
    }

    .hero-pill {
      display:inline-flex;
      align-items:center;
      gap:8px;
      padding:9px 12px;
      border-radius:999px;
      font-size:13px;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.10);
      color: var(--text);
    }

    .sales-grid {
      display:grid;
      grid-template-columns: 1.15fr .85fr;
      gap: 18px;
      margin-top: 18px;
    }

    @media (max-width: 900px){
      .sales-grid { grid-template-columns: 1fr; }
    }

    .feature-list {
      display:grid;
      gap:12px;
      margin-top: 18px;
    }

    .feature-item {
      padding: 14px 15px;
      border-radius: 14px;
      background: rgba(255,255,255,0.045);
      border: 1px solid rgba(255,255,255,0.08);
    }

    .feature-item strong {
      display:block;
      margin-bottom:4px;
      font-size:16px;
    }

    .pricing-card {
      position: relative;
      overflow: hidden;
    }

    .pricing-badge {
      display:inline-block;
      margin-bottom: 12px;
      padding: 7px 10px;
      border-radius:999px;
      font-size:12px;
      font-weight:700;
      color:#061020;
      background: var(--grad);
    }

    .price-options {
      display:grid;
      gap:10px;
      margin: 14px 0 16px;
    }

    .price-option {
      display:block;
      border:1px solid rgba(255,255,255,0.12);
      border-radius:14px;
      padding: 14px;
      background: rgba(255,255,255,0.04);
      cursor:pointer;
    }

    .price-option input {
      margin-right: 8px;
      transform: translateY(1px);
    }

    .price-option.active {
      border-color: rgba(178,139,255,0.55);
      box-shadow: 0 0 0 3px rgba(178,139,255,0.14);
      background: rgba(255,255,255,0.07);
    }

    .price-line {
      display:flex;
      justify-content:space-between;
      gap:12px;
      align-items:baseline;
      flex-wrap:wrap;
    }

    .price-line strong {
      font-size:16px;
    }

    .price-note {
      font-size:13px;
      color: var(--muted);
      margin-top:4px;
    }

    .microcopy {
      font-size: 13px;
      color: var(--muted);
      margin-top: 12px;
    }

    .mini-login {
      margin-top: 16px;
      padding-top: 14px;
      border-top: 1px solid rgba(255,255,255,0.10);
    }

    .cta-top {
      margin-top: 18px;
      display:flex;
      gap:10px;
      flex-wrap:wrap;
    }

    .tiny {
      font-size:12px;
      color: var(--muted);
    }
  </style>
</head>
<body>

<div class="wrap">
  <div class="topbar">
    <div class="brand">
      <div class="title">Rockeskolen</div>
      <div class="sub">VIP-medlemskap</div>
    </div>

    <div class="row">
      <?php if ($isLoggedIn): ?>
        <a class="btn ghost" href="/members/account.php">Min konto</a>
        <a class="btn" href="/members/logout.php">Logg ut</a>
      <?php else: ?>
        <a class="btn ghost" href="/members/login.php?redirect=/members/upgrade.php">Har du allerede konto?</a>
      <?php endif; ?>
    </div>
  </div>

  <section class="hero">
    <div class="pricing-badge">Superpris akkurat nå</div>
    <h1 class="hero-title">Bli VIP-medlem og få full tilgang med én gang</h1>
    <p class="hero-lead">
      Lås opp alle akkorder, skalaer og verktøy i Rockeskolen. Dette er medlemskapet for deg som vil ha hele verktøykassa tilgjengelig – uten sperrer og uten omveier.
    </p>

    <div class="cta-top">
      <a class="btn primary" href="#checkout">Start VIP – 29 kr/mnd</a>
      <?php if (!$isLoggedIn): ?>
        <a class="btn ghost" href="/members/login.php">Logg inn hvis du allerede er medlem</a>
      <?php endif; ?>
    </div>

    <div class="hero-pills">
      <span class="hero-pill">🎸 Alle akkorder og akkordvariasjoner</span>
      <span class="hero-pill">🎼 Alle skalaer i alle tonearter</span>
      <span class="hero-pill">⭕ Kvintsirkel og flere verktøy</span>
      <span class="hero-pill">🚀 Nye funksjoner fortløpende</span>
    </div>
  </section>

  <div class="sales-grid">
    <div class="card">

<h2 class="h2">Hvorfor VIP?</h2>

<div class="feature-list">

  <div class="feature-item">
    <strong>Full tilgang til hele Rockeskolen</strong>
    Åpne alle artikler, kurs, verktøy og ressurser – uten begrensninger.
  </div>

  <div class="feature-item">
    <strong>Alt av verktøy – uten sperrer</strong>
    Bruk akkordfinner, skalaer og andre verktøy fritt, når du trenger det.
  </div>

  <div class="feature-item">
    <strong>Lær mer – raskere</strong>
    Få tilgang til innhold som forklarer, inspirerer og utvikler deg som musiker.
  </div>

  <div class="feature-item">
    <strong>For deg som vil videre</strong>
    Enten du øver, spiller eller produserer – dette er neste nivå.
  </div>

</div>

   <hr class="sep">

      <div class="small">
        Gratis konto:
        <strong style="color:var(--text);">Vil du ha en gratis konto med begrenset tilgang, <a href="https://www.rockeskolen.com/members/register.php">starter du her</a>.</strong>
      </div>
    </div>

    <div class="card pricing-card" id="checkout">
      <div class="pricing-badge">Start her</div>
      <h2 class="h2">Kjøp VIP-medlemskap</h2>
      <div class="kicker">
        Skriv inn navn og e-post for å gå videre til checkout.
      </div>

      <?php if ($formError): ?>
        <div class="alert danger" style="margin-top:14px;">
          <?= htmlspecialchars($formError) ?>
        </div>
      <?php endif; ?>

      <form method="post" style="margin-top:14px;">
        <div>
          <label>Navn</label>
          <input type="text" name="name" value="<?= htmlspecialchars($prefillName) ?>" required autocomplete="name">
        </div>

        <div style="margin-top:12px;">
          <label>E-postadresse</label>
          <input type="email" name="email" value="<?= htmlspecialchars($prefillEmail) ?>" required autocomplete="email">
        </div>

        <div class="price-options">
          <label class="price-option <?= $selectedType === 'vip_monthly' ? 'active' : '' ?>">
            <input type="radio" name="type" value="vip_monthly" <?= $selectedType === 'vip_monthly' ? 'checked' : '' ?>>
            <div class="price-line">
              <strong>VIP månedlig</strong>
              <strong>29 kr / mnd</strong>
            </div>
            <div class="price-note">Lav terskel. Kom i gang med én gang.</div>
          </label>

          <label class="price-option <?= $selectedType === 'vip_yearly' ? 'active' : '' ?>">
            <input type="radio" name="type" value="vip_yearly" <?= $selectedType === 'vip_yearly' ? 'checked' : '' ?>>
            <div class="price-line">
              <strong>VIP årlig</strong>
              <strong>299 kr / år</strong>
            </div>
            <div class="price-note">Best verdi for deg som vet at du vil bruke verktøyene aktivt.</div>
          </label>
        </div>

        <button class="btn primary full" type="submit" id="checkoutBtn" name="start_checkout" value="1">
          Gå til checkout
        </button>

<script>
document.getElementById('checkoutBtn').addEventListener('click', function(){
  this.innerText = "Sender deg til betaling...";
});
</script>

        <div class="microcopy">
          Ved å gå videre oppretter du medlemskap som del av kjøpet. Har du allerede konto med denne e-postadressen, knyttes medlemskapet til den.
        </div>
      </form>

      <div class="mini-login">
        <div class="tiny">Allerede medlem?</div>
        <a class="link" href="/members/login.php">Logg inn her</a>
      </div>
    </div>
  </div>
</div>

<script>
  document.querySelectorAll('.price-option').forEach(function(el){
    el.addEventListener('click', function(){
      document.querySelectorAll('.price-option').forEach(function(x){
        x.classList.remove('active');
      });
      el.classList.add('active');
      const radio = el.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    });
  });
</script>

</body>
</html>