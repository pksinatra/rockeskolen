<?php
require_once __DIR__ . '/includes/content.php';

$slug = rs_slugify($_GET['slug'] ?? '');
$tool = rs_tool_by_slug($slug);

if (!$tool) {
    http_response_code(404);
    $pageTitle = 'Verktøy ikke funnet | Rockeskolen';
    $description = 'Verktøyet finnes ikke eller er ikke publisert.';
} else {
    $pageTitle = $tool['title'] . ' | Rockeskolen';
    $description = rs_meta_from_text($tool['short_description']);
}
?><!doctype html>
<html lang="no">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?php echo rs_h($pageTitle); ?></title>
  <meta name="description" content="<?php echo rs_h($description); ?>">
  <link rel="stylesheet" href="/includes/site.css?v=2">
</head>
<body>
  <header class="page-header">
    <div class="topbar">
      <a class="brand" href="/" aria-label="Rockeskolen">
        <img src="/images/rock-logo.png" alt="Rockeskolen">
      </a>
      <nav class="nav" aria-label="Hovednavigasjon">
        <a href="/workshop/index.php">Workshop</a>
        <a href="https://portal.rockeskolen.com">Portal</a>
      </nav>
    </div>
  </header>

  <main class="page-shell">
    <?php if (!$tool): ?>
      <section class="article-card">
        <h1>Verktøy ikke funnet.</h1>
        <p>Lenken kan være endret, eller verktøyet kan ligge i beta.</p>
        <a class="button primary" href="/tools/">Til verktøy</a>
      </section>
    <?php else: ?>
      <section class="page-title">
        <p class="eyebrow"><?php echo rs_h($tool['category']); ?></p>
        <h1><?php echo rs_h($tool['title']); ?></h1>
        <p class="lead"><?php echo rs_h($tool['short_description']); ?></p>
        <div class="actions">
          <a class="button primary" href="<?php echo rs_h($tool['app_url']); ?>"><?php echo rs_h($tool['cta_label']); ?></a>
          <a class="button" href="/tools/">Alle verktøy</a>
        </div>
      </section>

      <article class="article-card">
        <div class="meta">
          <span class="pill"><?php echo rs_h($tool['category']); ?></span>
          <span class="pill"><?php echo rs_h($tool['product_status']); ?></span>
        </div>
        <?php rs_render_rich_text($tool['body']); ?>
      </article>
    <?php endif; ?>
  </main>
</body>
</html>
