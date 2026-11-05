<?php
require __DIR__.'/work.inc.php';
$app_root = dirname(__DIR__, 2).'/portal'; $site_path = 'sites/default'; $settings = []; $databases = [];
include $app_root.'/sites/default/settings.php';
$d = $databases['default']['default'];
$pdo = new PDO("mysql:host={$d['host']};port={$d['port']};dbname={$d['database']};charset=utf8mb4", $d['username'], $d['password'], [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$p = $d['prefix'];
