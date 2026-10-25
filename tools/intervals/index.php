<?php
declare(strict_types=1);

// Intervaller – hentet fra ChordLinks intervallverktøy og tilpasset Rockeskolen.
// Norsk er standard; engelsk bare med ?lang=en (ingen cookie).
require_once dirname(__DIR__) . '/shared/bootstrap.php';

$isNorwegian = rs_updated_lang() !== 'en';
$lang = $isNorwegian ? 'no' : 'en';
$score = filter_var($_GET['score'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0, 'max_range' => 10]]);
$description = $isNorwegian
    ? 'Utforsk musikalske intervaller, tren gehøret og test deg i Rockeskolens intervallquiz.'
    : 'Explore musical intervals, train your ear and test yourself in Rockeskolen’s interval quiz.';
if ($score !== false && $score !== null) {
    $description = $isNorwegian
        ? "Jeg fikk {$score} av 10 riktige i Rockeskolens intervallquiz. Klarer du å slå det?"
        : "I got {$score} out of 10 right in Rockeskolen’s interval quiz. Can you beat me?";
}

$html = file_get_contents(__DIR__ . '/index.html');
if ($html === false) {
    http_response_code(500);
    exit('Unable to load interval tool.');
}

ob_start();
chordlink_share_meta([
    'title' => $isNorwegian ? 'Intervaller | Rockeskolen' : 'Intervals | Rockeskolen',
    'description' => $description,
]);
$shareMeta = (string) ob_get_clean();

ob_start();
chordlink_app_header_styles();
$headerStyles = (string) ob_get_clean();

ob_start();
chordlink_app_header($isNorwegian ? 'Intervaller' : 'Intervals');
$appHeader = (string) ob_get_clean();

$steps = $isNorwegian
    ? [
        'Velg Utforsk og lær for å høre et intervall og se tonene på klaviaturet.',
        'Velg grunntone, avspillingsmåte og lyd etter behov.',
        'Åpne Quiz, trykk Start quiz og velg intervallet du hører.',
        'Etter ti oppgaver kan du dele resultatet eller prøve på nytt.',
      ]
    : [
        'Choose Explore & learn to hear an interval and see its notes on the keyboard.',
        'Choose a root note, playback direction, and sound as needed.',
        'Open Quiz, press Start quiz, and choose the interval you hear.',
        'After ten questions, share your result or try again.',
      ];
$appHelp = '<details class="rs-app-help"><summary>' . ($isNorwegian ? 'Hjelp' : 'Help') . '</summary><ol>';
foreach ($steps as $step) {
    $appHelp .= '<li>' . rs_updated_h($step) . '</li>';
}
$appHelp .= '</ol></details>';

// Rockeskolens tittel og delingsdata erstatter verktøyets egne.
$html = preg_replace('/<title>.*?<meta name="twitter:image"[^>]*>\s*/s', $shareMeta, $html, 1) ?? $html;
$html = str_replace(
    ['<html lang="en">', '</head>', '<body>', '</body>'],
    ['<html lang="' . ($isNorwegian ? 'nb' : 'en') . '">', $headerStyles . "\n</head>", '<body>' . $appHeader, $appHelp . '</body>'],
    $html
);

header('Content-Type: text/html; charset=UTF-8');
header('Content-Language: ' . ($isNorwegian ? 'nb' : 'en'));
echo $html;
