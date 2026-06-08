<?php
// /chordlink/api/music-symbols/index.php
header('Content-Type: application/json; charset=utf-8');

$dataPath = __DIR__ . '/../music_symbols.en.json';

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

$category = isset($_GET['category']) ? strtolower(trim($_GET['category'])) : null;
$search   = isset($_GET['search']) ? strtolower(trim($_GET['search'])) : null;
$limit    = isset($_GET['limit']) ? (int) $_GET['limit'] : 100;
$offset   = isset($_GET['offset']) ? (int) $_GET['offset'] : 0;
$sort     = isset($_GET['sort']) ? strtolower(trim($_GET['sort'])) : 'priority';

if ($limit <= 0) $limit = 100;
if ($limit > 500) $limit = 500;
if ($offset < 0) $offset = 0;

// Filter
$filtered = array_filter($symbols, function ($sym) use ($category, $search) {
    if ($category && strtolower($sym['category']) !== $category) {
        return false;
    }
    if ($search) {
        $haystack = strtolower(
            $sym['name'] . ' ' .
            implode(' ', $sym['aliases'] ?? []) . ' ' .
            implode(' ', $sym['tags'] ?? []) . ' ' .
            $sym['id']
        );
        if (strpos($haystack, $search) === false) {
            return false;
        }
    }
    return true;
});

// Sort
usort($filtered, function ($a, $b) use ($sort) {
    switch ($sort) {
        case 'name':
            return strcasecmp($a['name'], $b['name']);
        case 'id':
            return strcasecmp($a['id'], $b['id']);
        case 'priority':
        default:
            $pa = $a['priority'] ?? 999;
            $pb = $b['priority'] ?? 999;
            if ($pa === $pb) return strcasecmp($a['name'], $b['name']);
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
