<?php
// /chordlink/api/music-symbols/symbol.php
header('Content-Type: application/json; charset=utf-8');

$lang = $_GET['lang'] ?? 'en';
$dataPath = "/data/music_symbols.$lang.json";
$id = isset($_GET['id']) ? strtolower(trim($_GET['id'])) : null;
if (!$id) {
    http_response_code(400);
    echo json_encode(['error' => 'bad_request', 'message' => 'Missing symbol id.']);
    exit;
}

if (!file_exists($dataPath)) {
    http_response_code(500);
    echo json_encode(['error' => 'server_error', 'message' => 'music_symbols.en.json not found']);
    exit;
}

$json = file_get_contents($dataPath);
$data = json_decode($json, true);
if (!is_array($data)) {
    http_response_code(500);
    echo json_encode(['error' => 'server_error', 'message' => 'Invalid JSON in music_symbols.en.json']);
    exit;
}

$symbols = $data['symbols'] ?? [];
$version = $data['version'] ?? '1.0.0';
$locale  = $data['locale'] ?? 'en';

$found = null;
foreach ($symbols as $sym) {
    if (strtolower($sym['id']) === $id) {
        $found = $sym;
        break;
    }
}

if (!$found) {
    http_response_code(404);
    echo json_encode(['error' => 'not_found', 'message' => "No symbol with id '{$id}' found."]);
    exit;
}

echo json_encode([
    'version' => $version,
    'locale'  => $locale,
    'symbol'  => $found
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
