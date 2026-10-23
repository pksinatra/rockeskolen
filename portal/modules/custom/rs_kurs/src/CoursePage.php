<?php

declare(strict_types=1);

namespace Drupal\rs_kurs;

/**
 * Builds the standalone course page around the shared course shell.
 */
final class CoursePage {

  public static function html(array $course, array $config, string $base, bool $hasCourseScript): string {
    $here = '/kurs/' . $course['slug'];
    $h = static fn(string $value): string => htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
    $json = json_encode($config, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    $count = count($course['lessons']);
    $courseScript = $hasCourseScript
      ? '<script src="' . $h($base . $course['slug'] . '.js') . '"></script>'
      : '';

    $html = <<<HTML
<!DOCTYPE html>
<html lang="nb">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{$h($course['title'])} | Rockeskolens Musikkportal</title>
<link rel="canonical" href="https://portal.rockeskolen.com{$h($here)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{$h($base)}kurs.css">
</head>
<body>
<header class="top">
  <a class="brand" href="/">Rockeskolen<small>Rockeskolens Musikkportal</small></a>
</header>

<main class="course">
  <div class="course-head">
    <h1>{$h($course['title'])}</h1>
    <p>{$h($course['module'])}</p>
    <div class="progress" aria-live="polite">
      <div class="progress-row"><span id="progText">0 av {$count} leksjoner fullført</span><strong id="progPct">0 %</strong></div>
      <div class="bar"><span id="progBar"></span></div>
    </div>
  </div>

  <div class="layout">
    <nav aria-label="Leksjoner"><ol class="lessons" id="lessonList"></ol></nav>
    <section class="lesson" id="lesson" aria-live="polite"></section>
  </div>
</main>

<script id="rs-kurs-config" type="application/json">{$json}</script>
<script src="{$h($base)}kurs.js"></script>
{$courseScript}
<script>RSKurs.start();</script>
</body>
</html>
HTML;
    return $html;
  }

}
