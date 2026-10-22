<?php
declare(strict_types=1);

function fe_metadata_config(string $key, mixed $fallback = null): mixed {
  if (function_exists('fe_config')) return fe_config($key, $fallback);

  static $config;
  if (!is_array($config)) {
    $projectRoot = dirname(__DIR__, 2);
    $root = is_file($projectRoot . '/site/config.example.php') ? $projectRoot . '/site' : $projectRoot . '/next';
    $defaults = is_file($root . '/config.example.php') ? require $root . '/config.example.php' : array();
    $local = is_file($root . '/config.local.php') ? require $root . '/config.local.php' : array();
    $config = array_merge(is_array($defaults) ? $defaults : array(), is_array($local) ? $local : array());
  }

  $environment = getenv('FE_' . strtoupper($key));
  if ($environment !== false && $environment !== '') return $environment;
  return $config[$key] ?? $fallback;
}

function fe_metadata_origin(): string {
  $configured = trim((string) fe_metadata_config('site_url', ''));
  $parts = parse_url($configured);
  if (!is_array($parts)
      || !in_array(strtolower((string) ($parts['scheme'] ?? '')), array('http', 'https'), true)
      || empty($parts['host'])
      || isset($parts['user']) || isset($parts['pass']) || isset($parts['query']) || isset($parts['fragment'])
      || !in_array((string) ($parts['path'] ?? ''), array('', '/'), true)) {
    throw new RuntimeException('FE_SITE_URL must be a valid origin without credentials, path, query or fragment.');
  }
  $origin = strtolower((string) $parts['scheme']) . '://' . strtolower((string) $parts['host']);
  if (isset($parts['port'])) $origin .= ':' . (int) $parts['port'];
  return $origin;
}

function fe_metadata_site_path(string $path): string {
  $cleanPath = (string) (parse_url($path, PHP_URL_PATH) ?? '/');
  $cleanPath = '/' . ltrim($cleanPath, '/');
  $base = rtrim((string) fe_metadata_config('site_base', ''), '/');
  if ($base !== '' && $base !== '/' && !str_starts_with($cleanPath, $base . '/') && $cleanPath !== $base) {
    $cleanPath = $base . ($cleanPath === '/' ? '/' : $cleanPath);
  }
  return $cleanPath;
}

function fe_metadata_absolute_url(string $path): string {
  if (preg_match('~^https?://~i', $path)) {
    $parts = parse_url($path);
    if (!is_array($parts) || empty($parts['host'])) throw new RuntimeException('Metadata URL is invalid.');
    return $path;
  }
  return fe_metadata_origin() . fe_metadata_site_path($path);
}

function fe_metadata_build(array $input): array {
  $siteName = 'Frequency Etherea';
  $pageTitle = trim((string) ($input['title'] ?? $siteName));
  $title = $pageTitle === $siteName ? $siteName : $pageTitle . ' · ' . $siteName;
  $description = trim((string) preg_replace('/\s+/u', ' ', strip_tags((string) ($input['description'] ?? ''))));
  $canonicalPath = $input['canonical_path'] ?? null;
  $imagePath = (string) ($input['image'] ?? '/assets/images/frequency-etherea-share-2026.jpg');

  return array(
    'title' => $title,
    'description' => $description,
    'canonical' => is_string($canonicalPath) && $canonicalPath !== '' ? fe_metadata_absolute_url($canonicalPath) : '',
    'og_title' => trim((string) ($input['og_title'] ?? $title)),
    'og_description' => trim((string) ($input['og_description'] ?? $description)),
    'og_url' => is_string($canonicalPath) && $canonicalPath !== '' ? fe_metadata_absolute_url($canonicalPath) : '',
    'og_image' => fe_metadata_absolute_url($imagePath),
    'og_image_alt' => trim((string) ($input['image_alt'] ?? 'Frequency Etherea over a violet cosmic soundscape')),
    'og_image_width' => isset($input['image_width']) ? (int) $input['image_width'] : 1200,
    'og_image_height' => isset($input['image_height']) ? (int) $input['image_height'] : 630,
    'og_type' => trim((string) ($input['og_type'] ?? 'website')),
    'twitter_card' => trim((string) ($input['twitter_card'] ?? 'summary_large_image')),
    'twitter_title' => trim((string) ($input['twitter_title'] ?? $input['og_title'] ?? $title)),
    'twitter_description' => trim((string) ($input['twitter_description'] ?? $input['og_description'] ?? $description)),
    'twitter_image' => fe_metadata_absolute_url((string) ($input['twitter_image'] ?? $imagePath)),
    'twitter_image_alt' => trim((string) ($input['twitter_image_alt'] ?? $input['image_alt'] ?? 'Frequency Etherea over a violet cosmic soundscape')),
    'robots' => trim((string) ($input['robots'] ?? 'index,follow,max-image-preview:large')),
    'json_ld' => array_values(array_filter((array) ($input['json_ld'] ?? array()), 'is_array')),
  );
}

function fe_metadata_escape(string $value): string {
  return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function fe_metadata_render(array $metadata): void {
  echo '<link rel="icon" href="' . fe_metadata_escape(fe_metadata_site_path('/assets/favicon.svg') . '?v=2') . '" type="image/svg+xml">' . "\n";
  echo '<title>' . fe_metadata_escape((string) $metadata['title']) . "</title>\n";
  echo '<meta name="description" content="' . fe_metadata_escape((string) $metadata['description']) . '">' . "\n";
  echo '<meta name="robots" content="' . fe_metadata_escape((string) $metadata['robots']) . '">' . "\n";
  if ((string) $metadata['canonical'] !== '') echo '<link rel="canonical" href="' . fe_metadata_escape((string) $metadata['canonical']) . '">' . "\n";
  echo '<meta property="og:site_name" content="Frequency Etherea">' . "\n";
  echo '<meta property="og:title" content="' . fe_metadata_escape((string) $metadata['og_title']) . '">' . "\n";
  echo '<meta property="og:description" content="' . fe_metadata_escape((string) $metadata['og_description']) . '">' . "\n";
  echo '<meta property="og:type" content="' . fe_metadata_escape((string) $metadata['og_type']) . '">' . "\n";
  if ((string) $metadata['og_url'] !== '') echo '<meta property="og:url" content="' . fe_metadata_escape((string) $metadata['og_url']) . '">' . "\n";
  echo '<meta property="og:image" content="' . fe_metadata_escape((string) $metadata['og_image']) . '">' . "\n";
  echo '<meta property="og:image:alt" content="' . fe_metadata_escape((string) $metadata['og_image_alt']) . '">' . "\n";
  echo '<meta property="og:image:width" content="' . (int) $metadata['og_image_width'] . '">' . "\n";
  echo '<meta property="og:image:height" content="' . (int) $metadata['og_image_height'] . '">' . "\n";
  echo '<meta name="twitter:card" content="' . fe_metadata_escape((string) $metadata['twitter_card']) . '">' . "\n";
  echo '<meta name="twitter:title" content="' . fe_metadata_escape((string) $metadata['twitter_title']) . '">' . "\n";
  echo '<meta name="twitter:description" content="' . fe_metadata_escape((string) $metadata['twitter_description']) . '">' . "\n";
  echo '<meta name="twitter:image" content="' . fe_metadata_escape((string) $metadata['twitter_image']) . '">' . "\n";
  echo '<meta name="twitter:image:alt" content="' . fe_metadata_escape((string) $metadata['twitter_image_alt']) . '">' . "\n";
  foreach ($metadata['json_ld'] as $block) {
    echo '<script type="application/ld+json">' . json_encode(
      $block,
      JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_THROW_ON_ERROR
    ) . "</script>\n";
  }
}

function fe_metadata_noindex_header(): void {
  if (!headers_sent()) header('X-Robots-Tag: noindex, nofollow, noarchive', true);
}
