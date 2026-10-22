<?php
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if ($path === '/access.php') { require __DIR__ . '/../../dist/access.php'; return; }
$root = realpath(__DIR__ . '/../../dist');
$file = realpath($root . ($path === '/' ? '/index.html' : $path));
if (!$file || !str_starts_with($file, $root . '/') || !is_file($file)) { http_response_code(404); return; }
$ext = pathinfo($file, PATHINFO_EXTENSION);
$types = ['html'=>'text/html', 'js'=>'text/javascript', 'css'=>'text/css'];
if (!isset($types[$ext])) { http_response_code(404); return; }
header('Content-Type: ' . $types[$ext]);
readfile($file);
