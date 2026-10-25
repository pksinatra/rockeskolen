<?php

declare(strict_types=1);

/**
 * Prints one complete, consistent SEO and social-sharing metadata set.
 */
function rs_render_meta(
    string $title,
    string $description,
    string $canonical,
    string $image = 'https://rockeskolen.com/images/share/rockeskolen-2026.jpg',
    string $imageAlt = 'Rockeskolens Musikkportal – musikkunnskap, verktøy og skaperglede',
    string $type = 'website',
    string $locale = 'nb_NO'
): void {
    $escape = static fn(string $value): string => htmlspecialchars(
        $value,
        ENT_QUOTES | ENT_SUBSTITUTE,
        'UTF-8'
    );
    ?>
  <title><?= $escape($title) ?></title>
  <meta name="description" content="<?= $escape($description) ?>">
  <link rel="canonical" href="<?= $escape($canonical) ?>">
  <meta property="og:locale" content="<?= $escape($locale) ?>">
  <meta property="og:site_name" content="Rockeskolen">
  <meta property="og:type" content="<?= $escape($type) ?>">
  <meta property="og:title" content="<?= $escape($title) ?>">
  <meta property="og:description" content="<?= $escape($description) ?>">
  <meta property="og:url" content="<?= $escape($canonical) ?>">
  <meta property="og:image" content="<?= $escape($image) ?>">
  <meta property="og:image:secure_url" content="<?= $escape($image) ?>">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="<?= $escape($imageAlt) ?>">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="<?= $escape($title) ?>">
  <meta name="twitter:description" content="<?= $escape($description) ?>">
  <meta name="twitter:image" content="<?= $escape($image) ?>">
  <meta name="twitter:image:alt" content="<?= $escape($imageAlt) ?>">
<?php
}
