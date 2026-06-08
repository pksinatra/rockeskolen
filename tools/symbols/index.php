<?php
// /chordlink/api/symbols/index.php
header('Content-Type: application/json; charset=utf-8');

// Datafile: /chordlink/data/music_symbols.en.json
$lang = isset($_GET['lang']) ? strtolower(trim($_GET['lang'])) : 'en';
$lang = preg_replace('/[^a-z]/', '', $lang);
if ($lang === '') $lang = 'en';

$dataPath = dirname(__DIR__, 2) . "/data/music_symbols.$lang.json";

if (!file_exists($dataPath)) {
    http_response_code(500);
    echo json_encode([
        'error' => 'server_error',
        'message' => 'JSON file not found',
        'expected' => basename($dataPath)
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

$json = file_get_contents($dataPath);
if ($json === false) {
    http_response_code(500);
    echo json_encode([
        'error' => 'server_error',
        'message' => 'Could not read JSON file'
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

$data = json_decode($json, true);
if (!is_array($data)) {
    http_response_code(500);
    echo json_encode([
        'error' => 'server_error',
        'message' => 'Invalid JSON in data file'
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

$symbols = $data['symbols'] ?? [];
$version = $data['version'] ?? '1.0.0';
$locale  = $data['locale'] ?? $lang;

// Query params
$category = isset($_GET['category']) ? strtolower(trim($_GET['category'])) : null;
$search   = isset($_GET['search']) ? strtolower(trim($_GET['search'])) : null;
$limit    = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
$offset   = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
$sort     = isset($_GET['sort']) ? strtolower(trim($_GET['sort'])) : 'priority';

if ($limit <= 0) $limit = 100;
if ($limit > 500) $limit = 500;
if ($offset < 0) $offset = 0;

// Filter
$filtered = array_filter($symbols, function ($sym) use ($category, $search) {
    if ($category && strtolower($sym['category'] ?? '') !== $category) {
        return false;
    }
    if ($search) {
        $haystack = strtolower(
            ($sym['name'] ?? '') . ' ' .
            implode(' ', $sym['aliases'] ?? []) . ' ' .
            implode(' ', $sym['tags'] ?? []) . ' ' .
            ($sym['id'] ?? '')
        );
        if (strpos($haystack, $search) === false) {
            return false;
        }
    }
    return true;
});

// Sort
usort($filtered, function ($a, $b) use ($sort) {
    $an = $a['name'] ?? '';
    $bn = $b['name'] ?? '';
    switch ($sort) {
        case 'name':
            return strcasecmp($an, $bn);
        case 'id':
            return strcasecmp($a['id'] ?? '', $b['id'] ?? '');
        case 'priority':
        default:
            $pa = $a['priority'] ?? 999999;
            $pb = $b['priority'] ?? 999999;
            if ($pa === $pb) return strcasecmp($an, $bn);
            return $pa <=> $pb;
    }
});

// Pagination
$total = count($filtered);
$results = array_slice($filtered, $offset, $limit);

echo json_encode([
    'version' => $version,
    'locale'  => $locale,
    'count'   => $total,
    'limit'   => $limit,
    'offset'  => $offset,
    'symbols' => array_values($results)
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
