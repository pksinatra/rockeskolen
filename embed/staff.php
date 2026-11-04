<?php
// Noter-serien: mørke notelinjer med lyd for artikler i musikkportalen. Styres med URL-parametere, se staff.js.
$lang = ($_GET['lang'] ?? 'no') === 'en' ? 'en' : 'no';
$widget = preg_replace('/[^a-z0-9]/', '', (string) ($_GET['widget'] ?? ''));
?>
<!doctype html>
<html lang="<?= $lang ?>">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title><?= $lang === 'en' ? 'The staff' : 'Notelinjene' ?></title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap">
  <link rel="stylesheet" href="lab.css?v=20261104-1">
</head>
<body<?= $widget ? ' class="widget"' : '' ?>>
  <main class="lab" id="app" data-widget="<?= $widget ?>"></main>
  <script src="https://unpkg.com/vexflow@4.2.5/build/cjs/vexflow.js"></script>
  <script src="lab.js?v=20261104-1"></script>
  <script src="staff.js?v=20261104-1"></script>
  <script src="/embed/autoheight.js?v=20261025-1"></script>
</body>
</html>
