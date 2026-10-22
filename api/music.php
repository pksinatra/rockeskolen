<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function music_response(array $payload, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function music_read_json(string $filename): array
{
    if (!is_file($filename) || !is_readable($filename)) {
        return [];
    }
    $decoded = json_decode((string) file_get_contents($filename), true);
    return is_array($decoded) ? $decoded : [];
}

function music_normalize_note(string $note): string
{
    $note = strtoupper(trim(str_replace(['♯', '♭'], ['#', 'B'], $note)));
    return preg_match('/^[A-G](?:#|B)?$/', $note) ? $note : '';
}

function music_root_matches(array $chord, string $root): bool
{
    $pitchClasses = [
        'C' => 0, 'B#' => 0, 'C#' => 1, 'DB' => 1,
        'D' => 2, 'D#' => 3, 'EB' => 3, 'E' => 4, 'FB' => 4,
        'E#' => 5, 'F' => 5, 'F#' => 6, 'GB' => 6,
        'G' => 7, 'G#' => 8, 'AB' => 8, 'A' => 9,
        'A#' => 10, 'BB' => 10, 'B' => 11, 'CB' => 11,
    ];
    $requestedPitch = $pitchClasses[$root] ?? null;
    $chordRoot = music_normalize_note((string) ($chord['root'] ?? ''));
    if ($requestedPitch !== null && ($pitchClasses[$chordRoot] ?? null) === $requestedPitch) {
        return true;
    }
    foreach (($chord['aliases'] ?? []) as $alias) {
        $normalizedAlias = music_normalize_note((string) $alias);
        if ($requestedPitch !== null && ($pitchClasses[$normalizedAlias] ?? null) === $requestedPitch) {
            return true;
        }
    }
    return false;
}

$type = strtolower(trim((string) ($_GET['type'] ?? '')));
$root = music_normalize_note((string) ($_GET['root'] ?? ''));
$slug = trim((string) ($_GET['slug'] ?? ''));
$dataDirectory = dirname(__DIR__) . '/assets/data';
$results = [];

if ($type === 'scale' || $type === 'chord_formula') {
    $filename = $type === 'scale' ? 'scales.json' : 'chords.json';
    foreach (music_read_json($dataDirectory . '/' . $filename) as $itemSlug => $data) {
        if (!is_array($data) || ($slug !== '' && $slug !== (string) $itemSlug)) {
            continue;
        }
        $results[] = [
            'type' => $type,
            'name' => (string) ($data['name_no'] ?? $data['name'] ?? $itemSlug),
            'root_note' => null,
            'instrument' => 'general',
            'slug' => (string) $itemSlug,
            'data' => $data,
        ];
    }
} elseif ($type === 'guitar_chord') {
    if ($root === '') {
        music_response(['success' => false, 'error' => 'Parameteren root må være en gyldig tone.'], 400);
    }
    $families = ['DB' => 'c', 'EB' => 'd', 'GB' => 'f', 'AB' => 'g', 'BB' => 'a', 'CB' => 'b', 'B#' => 'c', 'E#' => 'f'];
    $family = $families[$root] ?? strtolower($root[0]);
    $payload = music_read_json($dataDirectory . '/guitarchords_' . $family . '.json');
    foreach (($payload['chords'] ?? []) as $chord) {
        if (!is_array($chord) || !music_root_matches($chord, $root)) {
            continue;
        }
        $rowSlug = strtolower(preg_replace('/[^a-zA-Z0-9#+()]+/', '-', (string) ($chord['symbol'] ?? $chord['id'] ?? 'guitar-chord')));
        $rowSlug = trim($rowSlug, '-');
        if ($slug !== '' && $slug !== $rowSlug) {
            continue;
        }
        $results[] = [
            'type' => 'guitar_chord',
            'name' => (string) ($chord['name_no'] ?? $chord['name'] ?? $chord['symbol'] ?? $rowSlug),
            'root_note' => (string) ($chord['root'] ?? $root),
            'instrument' => 'guitar',
            'slug' => $rowSlug,
            'data' => $chord + ['slug' => $rowSlug],
        ];
    }
} else {
    music_response([
        'success' => false,
        'error' => 'Ukjent type. Bruk scale, chord_formula eller guitar_chord.',
    ], 400);
}

music_response([
    'success' => true,
    'count' => count($results),
    'results' => $results,
]);
