<?php
declare(strict_types=1);

// Kvintsirkelen – den moderniserte versjonen fra ChordLink, tilpasset Rockeskolen.
// ui.js, app.css og markup.html deles uendret med ChordLink. Alt verktøyet trenger
// fra siden kommer inn via window.CF_CONFIG.
// Norsk er standard; engelsk bare med ?lang=en (ingen cookie).
require_once dirname(__DIR__, 2) . '/shared/bootstrap.php';

$isNorwegian = rs_updated_lang() !== 'en';
$cfConfig = [
    'lang' => $isNorwegian ? 'nb' : 'en',
    'paid' => (bool) $isPro,
    'loggedIn' => (bool) $isLoggedIn,
    'upgradeUrl' => '/members/upgrade.php',
    'tierLabel' => 'VIP',
];
header('Content-Language: ' . ($isNorwegian ? 'nb' : 'en'));
?><!doctype html>
<html lang="<?= $isNorwegian ? 'nb' : 'en' ?>">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <?php chordlink_share_meta([]); ?>
  <?php chordlink_app_header_styles(); ?>
  <link rel="stylesheet" href="./app.css?v=20261122-1">
  <style>
    /* Rockeskolens uttrykk: mørkt/svart med røde aksenter. */
    :root {
      --cf-bg0: #07080c;
      --cf-bg1: #0b0b10;
      --cf-text: #f5f6f8;
      --cf-muted: #a9adb8;
      --cf-accent: #ef2029;
      --cf-tonic: rgba(239, 32, 41, .5);
      --cf-tonic-line: #ff4a52;
    }
    .cf-body {
      background:
        radial-gradient(900px 520px at 12% 0%, rgba(239, 32, 41, .12), transparent 60%),
        linear-gradient(180deg, var(--cf-bg0), var(--cf-bg1));
    }
    .cf-body .rs-app-help { color: var(--cf-text); }
  </style>
  <script>window.CF_CONFIG = <?= json_encode($cfConfig, JSON_UNESCAPED_SLASHES) ?>;</script>
  <script src="https://unpkg.com/tone@15.1.22/build/Tone.js" defer></script>
  <script src="./ui.js?v=20261122-1" defer></script>
</head>
<body class="cf-body">
<?php chordlink_app_header($isNorwegian ? 'Kvintsirkelen' : 'Circle of fifths'); ?>
<?php require __DIR__ . '/markup.html'; ?>
<?php rs_updated_help('fifths'); ?>
</body>
</html>
