<?php

declare(strict_types=1);

namespace Drupal\rs_kurs;

/**
 * Builds the standalone page where a student takes an editor's test.
 */
final class QuizPage {

  public static function html(string $title, array $config, string $base): string {
    $h = static fn(string $value): string => htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
    $json = json_encode($config, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    // Filens endringstid i adressen, så nettleseren henter nye versjoner.
    $v = static fn(string $file): string => $h($base . $file . (is_file(DRUPAL_ROOT . $base . $file) ? '?v=' . filemtime(DRUPAL_ROOT . $base . $file) : ''));

    return <<<HTML
<!DOCTYPE html>
<html lang="nb">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex">
<title>{$h($title)} | Rockeskolens Musikkportal</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Noto+Music&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{$v('kurs.css')}">
</head>
<body>
<header class="top">
  <a class="brand" href="/">Rockeskolen<small>Rockeskolens Musikkportal</small></a>
</header>

<main class="course quiz">
  <div class="course-head"><h1>{$h($title)}</h1></div>
  <section class="lesson" id="quiz" aria-live="polite"></section>
</main>

<script id="rs-quiz-config" type="application/json">{$json}</script>
<script src="{$v('kurs.js')}"></script>
<script src="{$v('quiz-music.js')}"></script>
<script src="{$v('quiz.js')}"></script>
</body>
</html>
HTML;
  }

}
