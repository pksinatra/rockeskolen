<?php
// /apps/scales/api/scale.php
header('Content-Type: application/json; charset=utf-8');

function mod_int(int $n, int $m): int {
    $r = $n % $m;
    return $r < 0 ? $r + $m : $r;
}

// Pitchklasser (B, ikke H)
$NOTE_TO_PC = [
    'C'  => 0,
    'C#' => 1, 'DB' => 1,
    'D'  => 2,
    'D#' => 3, 'EB' => 3,
    'E'  => 4,
    'F'  => 5,
    'F#' => 6, 'GB' => 6,
    'G'  => 7,
    'G#' => 8, 'AB' => 8,
    'A'  => 9,
    'A#' => 10, 'BB' => 10,
    'B'  => 11,
];

// Hele skalabiblioteket (samme logikk som i JS-versjonen)
$SCALES = [

    // Vanlige skalaer
    'major' => [
        'group'     => 'common',
        'name'      => 'Dur (major)',
        'aliases'   => ['Ionisk', 'Diatonisk dur', 'Major scale'],
        'intervals' => [0,2,4,5,7,9,11],
        'degrees'   => ['1','2','3','4','5','6','7'],
    ],
    'nat_minor' => [
        'group'     => 'common',
        'name'      => 'Naturlig moll',
        'aliases'   => ['Ren moll','Eolisk','Natural minor'],
        'intervals' => [0,2,3,5,7,8,10],
        'degrees'   => ['1','2','b3','4','5','b6','b7'],
    ],
    'harm_minor' => [
        'group'     => 'common',
        'name'      => 'Harmonisk moll',
        'aliases'   => ['Harmonic minor'],
        'intervals' => [0,2,3,5,7,8,11],
        'degrees'   => ['1','2','b3','4','5','b6','7'],
    ],
    'mel_minor' => [
        'group'     => 'common',
        'name'      => 'Melodisk moll (opp)',
        'aliases'   => ['Melodic minor'],
        'intervals' => [0,2,3,5,7,9,11],
        'degrees'   => ['1','2','b3','4','5','6','7'],
    ],

    // Kirketonearter / modale
    'dorian' => [
        'group'     => 'modes',
        'name'      => 'Dorisk',
        'aliases'   => ['Dorian mode'],
        'intervals' => [0,2,3,5,7,9,10],
        'degrees'   => ['1','2','b3','4','5','6','b7'],
    ],
    'phrygian' => [
        'group'     => 'modes',
        'name'      => 'Frygisk',
        'aliases'   => ['Phrygian mode'],
        'intervals' => [0,1,3,5,7,8,10],
        'degrees'   => ['1','b2','b3','4','5','b6','b7'],
    ],
    'lydian' => [
        'group'     => 'modes',
        'name'      => 'Lydisk',
        'aliases'   => ['Lydian mode','Maj7#11'],
        'intervals' => [0,2,4,6,7,9,11],
        'degrees'   => ['1','2','3','#4','5','6','7'],
    ],
    'mixolydian' => [
        'group'     => 'modes',
        'name'      => 'Mixolydisk',
        'aliases'   => ['Mixolydian','Dominant scale'],
        'intervals' => [0,2,4,5,7,9,10],
        'degrees'   => ['1','2','3','4','5','6','b7'],
    ],
    'locrian' => [
        'group'     => 'modes',
        'name'      => 'Lokrisk',
        'aliases'   => ['Locrian mode'],
        'intervals' => [0,1,3,5,6,8,10],
        'degrees'   => ['1','b2','b3','4','b5','b6','b7'],
    ],

    // Pentatoniske
    'major_pent' => [
        'group'     => 'pent',
        'name'      => 'Pentaton dur',
        'aliases'   => ['Major pentatonic','Diatonisk pentaton'],
        'intervals' => [0,2,5,7,9],
        'degrees'   => ['1','2','3','5','6'],
    ],
    'minor_pent' => [
        'group'     => 'pent',
        'name'      => 'Pentaton moll',
        'aliases'   => ['Minor pentatonic'],
        'intervals' => [0,3,5,7,10],
        'degrees'   => ['1','b3','4','5','b7'],
    ],
    'pent_blues' => [
        'group'     => 'pent',
        'name'      => 'Pentaton blues',
        'aliases'   => ['Minor blues pentatonic'],
        'intervals' => [0,3,5,6,7,10],
        'degrees'   => ['1','b3','4','b5','5','b7'],
    ],
    'neutral_pent' => [
        'group'     => 'pent',
        'name'      => 'Pentaton nøytral',
        'aliases'   => ['Neutral pentatonic'],
        'intervals' => [0,2,5,7,10],
        'degrees'   => ['1','2','4','5','b7'],
    ],
    'mix_pent' => [
        'group'     => 'pent',
        'name'      => 'Septim (mixolydisk pentaton)',
        'aliases'   => ['Mixolydisk pentaton'],
        'intervals' => [0,2,5,7,9,10],
        'degrees'   => ['1','2','4','5','6','b7'],
    ],

    // Symmetriske / dim / heltone
    'half_whole_dim' => [
        'group'     => 'sym',
        'name'      => 'Dim halv–hel',
        'aliases'   => ['Half–Whole diminished','Dim for dominant','Auxiliary diminished blues'],
        'intervals' => [0,1,3,4,6,7,9,10],
    ],
    'whole_half_dim' => [
        'group'     => 'sym',
        'name'      => 'Dim hel–halv',
        'aliases'   => ['Whole–Half diminished','Auxiliary diminished'],
        'intervals' => [0,2,3,5,6,8,9,11],
    ],
    'whole_tone' => [
        'group'     => 'sym',
        'name'      => 'Heltone-skala',
        'aliases'   => ['Whole tone','Auxiliary augmented'],
        'intervals' => [0,2,4,6,8,10],
    ],
    'augmented_hex' => [
        'group'     => 'sym',
        'name'      => 'Augmentert skala',
        'aliases'   => ['Augmented hexatonic','Symmetrisk #5'],
        'intervals' => [0,3,4,7,8,11],
    ],
    'symmetric_six' => [
        'group'     => 'sym',
        'name'      => 'Symmetrisk sekstone',
        'aliases'   => ['Six-tone symmetrical'],
        'intervals' => [0,1,4,5,8,9],
    ],
    'nine_tone' => [
        'group'     => 'sym',
        'name'      => 'Nitoneskala',
        'aliases'   => ['Nine-tone scale'],
        'intervals' => [0,2,3,4,6,7,8,9,11],
    ],

    // Melodisk moll / jazz
    'lydian_aug' => [
        'group'     => 'melmm',
        'name'      => 'Lydisk augmentert',
        'aliases'   => ['Lydian augmented','Melodisk moll modus 3'],
        'intervals' => [0,2,4,6,8,9,11],
    ],
    'overtone' => [
        'group'     => 'melmm',
        'name'      => 'Lydisk dominant (overtone)',
        'aliases'   => ['Lydian dominant','Mixolydian #4','Melodisk moll modus 4'],
        'intervals' => [0,2,4,6,7,9,10],
    ],
    'lydian_minor' => [
        'group'     => 'melmm',
        'name'      => 'Lydisk moll',
        'aliases'   => ['Lydian minor'],
        'intervals' => [0,2,4,6,7,8,10],
    ],
    'altered' => [
        'group'     => 'melmm',
        'name'      => 'Superlokrisk (altered)',
        'aliases'   => ['Altered scale','Diminished whole-tone','Forminsket heltone','Melodisk moll modus 7'],
        'intervals' => [0,1,3,4,6,8,10],
    ],
    'diminished_lydian' => [
        'group'     => 'melmm',
        'name'      => 'Forminsket lydisk',
        'aliases'   => ['Diminished Lydian'],
        'intervals' => [0,2,3,6,7,8,10],
    ],
    'leading_whole_tone' => [
        'group'     => 'melmm',
        'name'      => 'Ledende heltone',
        'aliases'   => ['Leading whole tone'],
        'intervals' => [0,2,4,6,8,9,10],
    ],

    // Verdensmusikk / eksotiske
    'romanian_minor' => [
        'group'     => 'world',
        'name'      => 'Rumensk moll',
        'aliases'   => ['Romanian minor','Ukrainian Dorian'],
        'intervals' => [0,2,3,6,7,9,10],
    ],
    'phrygian_dom' => [
        'group'     => 'world',
        'name'      => 'Spansk sigøyner (frygisk dominant)',
        'aliases'   => ['Phrygian dominant','Spanish gypsy','Harmonisk moll modus 5'],
        'intervals' => [0,1,4,5,7,8,10],
    ],
    'double_harmonic' => [
        'group'     => 'world',
        'name'      => 'Dobbel harmonisk dur',
        'aliases'   => ['Double harmonic major','Byzantine','Arabic'],
        'intervals' => [0,1,4,5,7,8,11],
    ],
    'spanish_eight' => [
        'group'     => 'world',
        'name'      => 'Spansk åttetone',
        'aliases'   => ['Spanish eight-tone'],
        'intervals' => [0,1,3,4,5,6,8,10],
    ],
    'pelog' => [
        'group'     => 'world',
        'name'      => 'Pelog',
        'aliases'   => ['Javanesisk pelog'],
        'intervals' => [0,1,3,6,10,11],
    ],
    'enigmatic' => [
        'group'     => 'world',
        'name'      => 'Enigmatisk',
        'aliases'   => ['Enigmatic scale (Verdi)'],
        'intervals' => [0,1,4,6,8,10,11],
    ],
    'prometheus' => [
        'group'     => 'world',
        'name'      => 'Prometheisk',
        'aliases'   => ['Prometheus scale (Scriabin)'],
        'intervals' => [0,2,4,6,9,10],
    ],
    'prometheus_neap' => [
        'group'     => 'world',
        'name'      => 'Prometheisk neopolitansk',
        'aliases'   => ['Prometheus Neapolitan'],
        'intervals' => [0,1,4,6,9,10],
    ],
    'neap_major' => [
        'group'     => 'world',
        'name'      => 'Neopolitansk dur',
        'aliases'   => ['Neapolitan major'],
        'intervals' => [0,1,3,5,7,9,11],
    ],
    'neap_minor' => [
        'group'     => 'world',
        'name'      => 'Neopolitansk moll',
        'aliases'   => ['Neapolitan minor'],
        'intervals' => [0,1,3,5,7,8,10],
    ],

    // Andre / eksperimentelle
    'locrian_major' => [
        'group'     => 'other',
        'name'      => 'Lokrisk dur',
        'aliases'   => ['Locrian major','Locrian nat. 2'],
        'intervals' => [0,2,4,5,6,8,10],
    ],

    // Kromatisk
    'chromatic' => [
        'group'     => 'chrom',
        'name'      => 'Kromatisk skala',
        'aliases'   => ['Chromatic scale'],
        'intervals' => [0,1,2,3,4,5,6,7,8,9,10,11],
    ],
];

$action = $_GET['action'] ?? null;

// action=list → returner hele biblioteket (brukes av skalafinneren)
if ($action === 'list') {
    echo json_encode(['scales' => $SCALES], JSON_UNESCAPED_UNICODE);
    exit;
}

// Ellers: noter for én bestemt root/scale
$rootName = isset($_GET['root']) ? strtoupper($_GET['root']) : 'C';
$scaleKey = $_GET['scale'] ?? 'major';
$octave   = isset($_GET['oct']) ? intval($_GET['oct']) : 4;

if (!isset($NOTE_TO_PC[$rootName])) {
    http_response_code(400);
    echo json_encode(['error' => 'Ukjent grunntone: '.$rootName], JSON_UNESCAPED_UNICODE);
    exit;
}
if (!isset($SCALES[$scaleKey])) {
    http_response_code(400);
    echo json_encode(['error' => 'Ukjent skalatype: '.$scaleKey], JSON_UNESCAPED_UNICODE);
    exit;
}

$rootPc   = $NOTE_TO_PC[$rootName];
$scaleDef = $SCALES[$scaleKey];

// C4 = 60 → generer én oktav + toppoktav
$rootMidi = ($octave + 1) * 12 + $rootPc;
$NAMES_SHARP = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

$notesOut = [];
foreach ($scaleDef['intervals'] as $iv) {
    $m   = $rootMidi + $iv;
    $pc  = mod_int($m, 12);
    $nm  = $NAMES_SHARP[$pc];
    $oct = intval(floor($m / 12) - 1);
    $notesOut[] = [
        'midi' => $m,
        'name' => $nm.$oct,
    ];
}
$top = $rootMidi + 12;
$pcTop = mod_int($top, 12);
$nameTop = $NAMES_SHARP[$pcTop];
$octTop  = intval(floor($top / 12) - 1);
$notesOut[] = [
    'midi' => $top,
    'name' => $nameTop.$octTop,
];

echo json_encode([
    'root'      => $rootName,
    'scaleKey'  => $scaleKey,
    'scaleName' => $scaleDef['name'],
    'group'     => $scaleDef['group'],
    'aliases'   => $scaleDef['aliases'],
    'intervals' => $scaleDef['intervals'],
    'degrees'   => $scaleDef['degrees'] ?? null,
    'octave'    => $octave,
    'notes'     => $notesOut,
], JSON_UNESCAPED_UNICODE);
