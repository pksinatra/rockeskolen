<?php
// Only the isolated standalone apps load this adapter. No article/embed files change.
require_once $_SERVER['DOCUMENT_ROOT'] . '/members/config.php';
require_once $_SERVER['DOCUMENT_ROOT'] . '/includes/meta.php';
function rs_updated_lang(): string {
    // Norsk er standard. Engelsk bare når ?lang=en står i URL-en; ingen cookie.
    $lang = $_GET['lang'] ?? 'nb';
    return is_string($lang) && $lang === 'en' ? 'en' : 'nb';
}
$lang = rs_updated_lang();
header('Cache-Control: private, no-store');
$user = current_user();
$isLoggedIn = (bool) $user;
$isPro = has_rockeskolen_access($user);
if (($_GET['demo'] ?? '') === '1') $isPro = false;
function rs_updated_h(string $s): string { return htmlspecialchars($s, ENT_QUOTES, 'UTF-8'); }
function chordlink_share_meta(array $meta): void {
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $lang = rs_updated_lang();
    $catalog = [
        '/tools/chords/piano/' => [
            'Pianoakkorder | Rockeskolen',
            'Utforsk pianoakkorder, omvendinger, akkordtoner og intervaller direkte på tangentene.',
            'Piano chords | Rockeskolen',
            'Explore piano chords, inversions, chord tones, intervals and playback directly on the keyboard.',
        ],
        '/tools/chords/guitar/' => [
            'Gitarakkorder | Rockeskolen',
            'Finn gitarakkorder, grep og alternative former, og hør hvordan akkordene låter.',
            'Guitar chords | Rockeskolen',
            'Find guitar chords, voicings and alternative shapes, and hear how the chords sound.',
        ],
        '/tools/scales/piano/' => [
            'Pianoskalaer | Rockeskolen',
            'Se og hør skalaer på piano. Utforsk toner, intervaller og mønstre i alle tonearter.',
            'Piano scales | Rockeskolen',
            'See and hear piano scales. Explore notes, intervals and patterns in every key.',
        ],
        '/tools/scales/guitar/' => [
            'Gitarskalaer | Rockeskolen',
            'Utforsk skalaer som spillbare mønstre på gitarhalsen, med toner og intervaller.',
            'Guitar scales | Rockeskolen',
            'Explore scales as playable fretboard patterns, with notes and intervals.',
        ],
        '/tools/circles/fifths/' => [
            'Kvintsirkelen | Rockeskolen',
            'Utforsk tonearter, fortegn, akkorder og harmoniske forbindelser i en interaktiv kvintsirkel.',
            'Circle of fifths | Rockeskolen',
            'Explore keys, accidentals, chords and harmonic relationships in an interactive circle of fifths.',
        ],
        '/tools/tuners/' => [
            'Tuner og stemmetoner | Rockeskolen',
            'Stem instrumentet med referansetoner og praktiske tunere for gitar, bass og ukulele.',
            'Tuner and reference tones | Rockeskolen',
            'Tune your instrument with reference tones and practical tuners for guitar, bass and ukulele.',
        ],
    ];
    $copy = $catalog[$path] ?? NULL;
    $title = $copy ? ($lang === 'en' ? $copy[2] : $copy[0]) : str_replace('ChordLink', 'Rockeskolen', (string) ($meta['title'] ?? 'Rockeskolen'));
    $description = $copy ? ($lang === 'en' ? $copy[3] : $copy[1]) : (string) ($meta['description'] ?? 'Praktiske musikkverktøy fra Rockeskolen.');
    $canonical = 'https://rockeskolen.com' . $path . ($lang === 'en' ? '?lang=en' : '');
    rs_render_meta($title, $description, $canonical, 'https://rockeskolen.com/images/share/rockeskolen-2026.jpg', $title, 'website', $lang === 'en' ? 'en_US' : 'nb_NO');
}
function chordlink_app_header_styles(): void {
    global $user, $isPro;
    echo '<link rel="stylesheet" href="/tools/shared/site.css?v=20260927-1">';
    echo '<script>window.RS_LANG='.json_encode(rs_updated_lang()).';window.CL_IS_LOGGED_IN='.($user?'true':'false').';window.CL_IS_PRO='.($isPro?'true':'false').';window.CL_LOGGED_IN='.($user?'true':'false').';window.CL_UPGRADE_URL="/members/upgrade.php";</script>';
    echo '<script src="/tools/shared/language.js?v=20261022-1" defer></script>';
}
function chordlink_app_header(string $title): void {
    global $user;
    $en = rs_updated_lang() === 'en';
    echo '<header class="rs-updated-header"><a href="/">Rockeskolen</a><nav aria-label="'.($en?'Navigation':'Navigasjon').'"><a href="/tools/">'.($en?'Tools':'Verktøy').'</a><a href="https://portal.rockeskolen.com">Musikkportalen</a>';
    $url = $user ? '/members/account.php' : '/members/login.php?redirect='.rawurlencode($_SERVER['REQUEST_URI'] ?? '/tools/');
    echo '<a href="'.rs_updated_h($url).'">'.($user?($en?'Account':'Min konto'):($en?'Log in':'Logg inn')).'</a><span class="rs-language" aria-label="Language / Språk">';
    foreach (['nb'=>'Norsk','en'=>'English'] as $code=>$label) {
        $query = $_GET; $query['lang'] = $code;
        echo '<a lang="'.$code.'" href="?'.rs_updated_h(http_build_query($query)).'"'.($code===rs_updated_lang()?' aria-current="true"':'').'>'.$label.'</a>';
    }
    echo '</span></nav></header>';
}
function rs_updated_help(string $app): void {
    $help = json_decode(file_get_contents(__DIR__.'/help.json'), true);
    $lines = $help[$app][rs_updated_lang()==='en'?0:1] ?? [];
    echo '<details class="rs-app-help"><summary>'.(rs_updated_lang()==='en'?'Help':'Hjelp').'</summary><ol>';
    foreach ($lines as $line) echo '<li>'.rs_updated_h($line).'</li>';
    echo '</ol></details>';
}
