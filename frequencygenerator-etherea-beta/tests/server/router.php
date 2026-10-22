<?php
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if ($path === '/health') { echo 'ok'; return; }
if ($path === '/access.php') { require __DIR__ . '/../../public/access.php'; return; }
http_response_code(404);
