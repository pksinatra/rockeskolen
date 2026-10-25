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
    // Filens endringstid i adressen, så nettleseren henter nye versjoner.
    $version = static fn(string $file): string => is_file(DRUPAL_ROOT . $base . $file) ? '?v=' . filemtime(DRUPAL_ROOT . $base . $file) : '';
    $courseScript = $hasCourseScript
      ? '<script src="' . $h($base . $course['slug'] . '.js' . $version($course['slug'] . '.js')) . '"></script>'
      : '';
    $cssVersion = $version('kurs.css');
    $description = $course['module'];
    $url = 'https://portal.rockeskolen.com' . $here;
    $image = 'https://portal.rockeskolen.com/sites/default/files/share/rockeskolen-portal.jpg';

    $html = <<<HTML
<!DOCTYPE html>
<html lang="nb">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{$h($course['title'])} | Rockeskolens Musikkportal</title>
<meta name="description" content="{$h($description)}">
<link rel="canonical" href="{$h($url)}">
<meta property="og:locale" content="nb_NO">
<meta property="og:site_name" content="Rockeskolen">
<meta property="og:type" content="website">
<meta property="og:title" content="{$h($course['title'])} | Rockeskolens Musikkportal">
<meta property="og:description" content="{$h($description)}">
<meta property="og:url" content="{$h($url)}">
<meta property="og:image" content="{$h($image)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{$h($course['title'])} | Rockeskolens Musikkportal">
<meta name="twitter:description" content="{$h($description)}">
<meta name="twitter:image" content="{$h($image)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{$h($base)}kurs.css{$h($cssVersion)}">
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
