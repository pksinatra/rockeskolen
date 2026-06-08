<?php
/**
 * build_music_symbols_json.php
 *
 * Browser-based CSV -> JSON converter for music symbols.
 * Place this file together with music_symbols_master_en.csv
 * and open it in your browser.
 */

mb_internal_encoding('UTF-8');
$lang = $_GET['lang'] ?? 'en';
$lang = preg_replace('/[^a-z]/', '', $lang);
if ($lang === '') $lang = 'en';

$inputFile  = __DIR__ . "/music_symbols_master_{$lang}.csv";
$outputFile = dirname(__DIR__, 2) . "/data/music_symbols.{$lang}.json";
// ---------- CONFIG ----------
// $inputFile  = __DIR__ . '/music_symbols_master_en.csv';
// $outputFile = dirname(__DIR__, 2) . '/data/music_symbols.en.json'; // /chordlink/api/music_symbols.en.json
$version    = '1.0.0';
$locale     = 'en';
// ----------------------------

run_converter($inputFile, $outputFile, $version, $locale);

function run_converter(string $inputFile, string $outputFile, string $version, string $locale): void
{
    header('Content-Type: text/html; charset=utf-8');

    echo "<h1>Music Symbols JSON Builder</h1>";

    if (!file_exists($inputFile)) {
        echo "<p><strong>Error:</strong> Input file not found: {$inputFile}</p>";
        return;
    }

    $handle = fopen($inputFile, 'r');
    if ($handle === false) {
        echo "<p><strong>Error:</strong> Could not open CSV file.</p>";
        return;
    }

    $header = fgetcsv($handle);
    if ($header === false) {
        echo "<p><strong>Error:</strong> CSV file appears to be empty.</p>";
        fclose($handle);
        return;
    }

    $symbols = [];
    $rowIndex = 0;

    while (($row = fgetcsv($handle)) !== false) {
        $rowIndex++;

        if (count($row) < 3) {
            continue;
        }

        $symbolChar  = trim($row[0]);
        $name        = trim($row[1]);
        $explanation = trim($row[2]);

        if ($symbolChar === '' && $name === '') {
            continue;
        }

        $id          = build_id_from_name($name, $symbolChar, $rowIndex);
        $category    = infer_category($name, $symbolChar);
        $subcategory = infer_subcategory($name, $symbolChar, $category);
        $unicode     = infer_unicode($symbolChar);
        $isTextual   = infer_is_textual($symbolChar);
        $isCombining = infer_is_combining($name, $category);

        if ($explanation !== '' && !preg_match('/[.!?]$/u', $explanation)) {
            $explanation .= '.';
        }

        $symbols[] = [
            'id'           => $id,
            'symbol'       => $symbolChar,
            'name'         => $name,
            'category'     => $category,
            'subcategory'  => $subcategory,
            'explanation'  => $explanation,
            'unicode'      => $unicode,
            'aliases'      => [],
            'tags'         => [],
            'is_textual'   => $isTextual,
            'is_combining' => $isCombining,
            'priority'     => $rowIndex
        ];
    }

    fclose($handle);

    $output = [
        'version' => $version,
        'locale'  => $locale,
        'symbols' => $symbols
    ];

    $json = json_encode($output, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

    if ($json === false) {
        echo "<p><strong>Error:</strong> JSON encoding failed.</p>";
        return;
    }

    if (file_put_contents($outputFile, $json) === false) {
        echo "<p><strong>Error:</strong> Failed to write output file: {$outputFile}</p>";
        return;
    }

    echo "<p><strong>Success!</strong> Wrote JSON to: <code>" . htmlspecialchars($outputFile, ENT_QUOTES, 'UTF-8') . "</code></p>";
    echo "<p>Number of symbols: " . count($symbols) . "</p>";
    echo "<p>You can now use this JSON in your /api/music-symbols endpoints.</p>";
}

// ---------- Helper functions ----------

function build_id_from_name(string $name, string $symbolChar, int $rowIndex): string
{
    $base = $name !== '' ? $name : $symbolChar;
    $base = mb_strtolower($base);
    $base = preg_replace('/[^a-z0-9]+/u', '_', $base);
    $base = trim($base, '_');

    if ($base === '') {
        $base = 'symbol_' . $rowIndex;
    }

    return $base;
}

function infer_category(string $name, string $symbolChar): string
{
    $n = mb_strtolower($name);

    if (str_contains($n, 'note')) return 'note';
    if (str_contains($n, 'rest')) return 'rest';
    if (str_contains($n, 'clef')) return 'clef';
    if (str_contains($n, 'sharp') || str_contains($n, 'flat') || str_contains($n, 'natural')) return 'accidental';
    if (str_contains($n, 'time') && !str_contains($n, 'multi')) return 'time_signature';
    if (str_contains($n, 'barline') || str_contains($n, 'repeat') || str_contains($n, 'percent repeat')) return 'barline';
    if (str_contains($n, 'fermata')) return 'articulation';
    if (str_contains($n, 'accent') || str_contains($n, 'staccato') || str_contains($n, 'tenuto')) return 'articulation';
    if (str_contains($n, 'trill') || str_contains($n, 'turn') || str_contains($n, 'mordent') || str_contains($n, 'schleifer')) return 'ornament';
    if (str_contains($n, 'breath') || str_contains($n, 'caesura')) return 'articulation';

    if (preg_match('/\b(p|f|mf|mp|sfz|sffz|sfp|sfpp)\b/i', $symbolChar) ||
        preg_match('/\b(piano|forte|mezzo|niente|subito)\b/i', $n)) {
        return 'dynamic';
    }
    if (str_contains($n, 'crescendo') || str_contains($n, 'decrescendo')) return 'dynamic';

    if (preg_match('/\b(rit|rall|accel|largo|adagio|andante|moderato|allegro|presto|prestissimo|rubato|meno mosso|più mosso|a tempo)\b/i', $n)) {
        return 'tempo';
    }

    if (str_contains($n, 'coda') || str_contains($n, 'segno') || str_contains($n, 'da capo') ||
        str_contains($n, 'dal segno') || str_contains($n, 'fine')) {
        return 'navigation';
    }

    if (in_array($symbolChar, ['Δ', 'ø', 'o', '+'], true) ||
        preg_match('/\b(sus|add|alt|no)\b/i', $symbolChar) ||
        preg_match('/\b(sus|add|alt|no)\b/i', $n)) {
        return 'chord_symbol';
    }

    if (str_contains($n, 'pizzicato') || str_contains($n, 'sul tasto') ||
        str_contains($n, 'sul pont') || str_contains($n, 'sordino') ||
        str_contains($n, 'col legno') || str_contains($n, 'tremolo')) {
        return 'string_technique';
    }

    if (str_contains($n, 'pedal') || str_contains($n, 'una corda') || str_contains($n, 'tre corde')) {
        return 'piano_technique';
    }

    if (str_contains($n, 'rimshot') || str_contains($n, 'cross stick') || str_contains($n, 'cymbal')) {
        return 'percussion';
    }

    if (str_contains($n, 'ottava') || str_contains($n, 'quindicesima')) {
        return 'octave';
    }

    if (str_contains($n, 'brace') || str_contains($n, 'bracket') || str_contains($n, 'grand staff')) {
        return 'layout';
    }

    if (str_contains($n, 'metronome') || str_contains($n, 'midi')) {
        return 'other';
    }

    return 'other';
}

function infer_subcategory(string $name, string $symbolChar, string $category): ?string
{
    $n = mb_strtolower($name);

    if ($category === 'note' || $category === 'rest') {
        return 'note_value';
    }
    if ($category === 'dynamic') {
        if (str_contains($n, 'crescendo') || str_contains($n, 'decrescendo')) {
            return 'hairpin';
        }
        return 'dynamic_level';
    }
    if ($category === 'tempo') {
        if (preg_match('/\b(largo|adagio|andante|moderato|allegro|presto|prestissimo)\b/i', $n)) {
            return 'italian_term';
        }
        return 'change';
    }
    if ($category === 'barline' && str_contains($n, 'repeat')) {
        return 'repeat';
    }
    if ($category === 'chord_symbol') {
        return 'jazz';
    }
    return null;
}

function infer_unicode(string $symbolChar): array
{
    if ($symbolChar === '' || mb_strlen($symbolChar) !== 1) {
        return [];
    }

    $codepoint = mb_ord($symbolChar, 'UTF-8');
    if ($codepoint === false) {
        return [];
    }

    if ($codepoint < 128) {
        return [];
    }

    $hex = strtoupper(dechex($codepoint));
    return ['U+' . $hex];
}

function infer_is_textual(string $symbolChar): bool
{
    if ($symbolChar === '') {
        return false;
    }

    $len = mb_strlen($symbolChar, 'UTF-8');
    for ($i = 0; $i < $len; $i++) {
        $ch = mb_substr($symbolChar, $i, 1, 'UTF-8');
        $code = mb_ord($ch, 'UTF-8');
        if ($code > 127) {
            return false;
        }
    }
    return true;
}

function infer_is_combining(string $name, string $category): bool
{
    $n = mb_strtolower($name);

    if (in_array($category, ['articulation', 'ornament'], true)) {
        return true;
    }
    if (str_contains($n, 'accent') || str_contains($n, 'staccato') ||
        str_contains($n, 'tenuto') || str_contains($n, 'trill') ||
        str_contains($n, 'fermata') || str_contains($n, 'turn')) {
        return true;
    }

    return false;
}
