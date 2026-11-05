<?php require __DIR__.'/db.inc.php';
$tables = $pdo->query("SHOW TABLES LIKE '{$p}cache\\_%'")->fetchAll(PDO::FETCH_COLUMN);
foreach ($tables as $t) { if (!str_starts_with($t, $p.'cache_')) continue; $pdo->exec("TRUNCATE TABLE `$t`"); echo "tømt $t\n"; }
