<?php
// Akkorder og harmoni: mørke akkordvisninger med noter, piano og lyd for artikler i musikkportalen. Styres med URL-parametere, se chord.js.
$lang = ($_GET['lang'] ?? 'no') === 'en' ? 'en' : 'no';
?>
<!doctype html>
<html lang="<?= $lang ?>">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title><?= $lang === 'en' ? 'Chords' : 'Akkorder' ?></title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap">
  <link rel="stylesheet" href="lab.css?v=20261104-1">
</head>
<body>
  <main class="lab" id="app"></main>
  <script src="https://unpkg.com/vexflow@4.2.5/build/cjs/vexflow.js"></script>
  <script src="lab.js?v=20261104-1"></script>
  <script src="chord.js?v=20261105-2"></script>
  <script src="/embed/autoheight.js?v=20261025-1"></script>
</body>
</html>
