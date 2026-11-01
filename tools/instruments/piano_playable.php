<?php
// Spillbart piano har flyttet til /tools/instruments/piano/. Behold ?lang=en og andre parametere.
$query = $_SERVER['QUERY_STRING'] ?? '';
header('Location: /tools/instruments/piano/' . ($query !== '' ? '?' . $query : ''), true, 301);
exit;
