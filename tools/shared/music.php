<?php
// Read-only, versioned data snapshot. No database or membership writes.
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
$type = $_GET['type'] ?? '';
$file = null;
if ($type === 'scale') $file = 'scales.json';
if ($type === 'chord_formula') $file = 'chord-formulas.json';
if ($type === 'guitar_chord') {
    $notes = ['C'=>0,'B#'=>0,'C#'=>1,'DB'=>1,'D'=>2,'D#'=>3,'EB'=>3,'E'=>4,'FB'=>4,'F'=>5,'E#'=>5,'F#'=>6,'GB'=>6,'G'=>7,'G#'=>8,'AB'=>8,'A'=>9,'A#'=>10,'BB'=>10,'B'=>11,'CB'=>11];
    $root = $_GET['root'] ?? '';
    $root = is_string($root) ? strtoupper(str_replace(['♯','♭'], ['#','b'], trim($root))) : '';
    if (isset($notes[$root])) $file = 'guitar-'.$notes[$root].'.json';
}
if (!$file || !is_file(__DIR__.'/data/'.$file)) {
    http_response_code(400);
    echo json_encode(['success'=>false,'error'=>'Invalid music query']);
    exit;
}
readfile(__DIR__.'/data/'.$file);
