<?php
// Read-only music API. Guitar chords come from the shared ChordLink
// music_library table; the versioned snapshots in data/ are the fallback.
// No database or membership writes.
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
$type = $_GET['type'] ?? '';
$file = null;
$guitarRoot = null;
if ($type === 'scale') $file = 'scales.json';
if ($type === 'chord_formula') $file = 'chord-formulas.json';
if ($type === 'guitar_chord') {
    $notes = ['C'=>0,'B#'=>0,'C#'=>1,'DB'=>1,'D'=>2,'D#'=>3,'EB'=>3,'E'=>4,'FB'=>4,'F'=>5,'E#'=>5,'F#'=>6,'GB'=>6,'G'=>7,'G#'=>8,'AB'=>8,'A'=>9,'A#'=>10,'BB'=>10,'B'=>11,'CB'=>11];
    $root = $_GET['root'] ?? '';
    $root = is_string($root) ? strtoupper(str_replace(['♯','♭'], ['#','b'], trim($root))) : '';
    if (isset($notes[$root])) {
        $file = 'guitar-'.$notes[$root].'.json';
        $guitarRoot = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'][$notes[$root]];
    }
}
if (!$file || !is_file(__DIR__.'/data/'.$file)) {
    http_response_code(400);
    echo json_encode(['success'=>false,'error'=>'Invalid music query']);
    exit;
}

if ($guitarRoot !== null) {
    $rows = rs_guitar_chords_from_db($guitarRoot);
    if ($rows) {
        header('X-Music-Source: database');
        echo json_encode(['success'=>true,'source'=>'mysql','count'=>count($rows),'results'=>$rows], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
        exit;
    }
}
header('X-Music-Source: snapshot');
readfile(__DIR__.'/data/'.$file);

function rs_guitar_chords_from_db(string $root): ?array
{
    $localConfig = dirname(__DIR__, 2).'/members/config.local.php';
    if (is_file($localConfig)) require_once $localConfig;
    $host = getenv('CHORDLINK_DB_HOST') ?: '';
    $name = getenv('CHORDLINK_DB_NAME') ?: '';
    $user = getenv('CHORDLINK_DB_USER') ?: '';
    if ($host === '' || $name === '' || $user === '') return null;
    try {
        $pdo = new PDO("mysql:host=$host;dbname=$name;charset=utf8mb4", $user, getenv('CHORDLINK_DB_PASS') ?: '', [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT=>3]);
        $stmt = $pdo->prepare("SELECT id, type, name, root_note, instrument, slug, data FROM music_library WHERE type = 'guitar_chord' AND instrument = 'guitar' AND root_note = ? ORDER BY root_note, name");
        $stmt->execute([$root]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Throwable $e) {
        error_log('Rockeskolen music API: '.$e->getMessage());
        return null;
    }
    foreach ($rows as &$row) {
        $row['id'] = (int)$row['id'];
        $row['data'] = json_decode($row['data'], true);
    }
    return $rows;
}
