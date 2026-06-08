<?php
require_once __DIR__ . '/includes/content.php';

$slug = rs_slugify($_GET['slug'] ?? '');
$article = rs_article_by_slug($slug);

if (!$article) {
    http_response_code(404);
    $pageTitle = 'Artikkel ikke funnet | Rockeskolen';
    $description = 'Artikkelen finnes ikke eller er ikke publisert.';
} else {
    $pageTitle = $article['title'] . ' | Rockeskolen';
    $description = rs_meta_from_text($article['ingress']);
}
?><!doctype html>
<html lang="no">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?php echo rs_h($pageTitle); ?></title>
  <meta name="description" content="<?php echo rs_h($description); ?>">
  <link rel="stylesheet" href="/includes/site.css?v=1">
</head>
<body>
  <header class="page-header">
    <div class="topbar">
      <a class="brand" href="/" aria-label="Rockeskolen">
        <img src="/images/rock-logo.png" alt="Rockeskolen">
      </a>
      <nav class="nav" aria-label="Hovednavigasjon">
        <a href="/tools/">Verktøy</a>
        <a href="/tools/#instrument">Instrumenter</a>
        <a href="/tools/#teori">Skolebenken</a>
        <a href="https://portal.rockeskolen.com">RDØ</a>
        <a href="/article.php?slug=fra-ide-til-ferdig-musikk">Om</a>
      </nav>
    </div>
  </header>

  <main class="page-shell">
    <?php if (!$article): ?>
      <section class="article-card">
        <h1>Artikkel ikke funnet.</h1>
        <p>Lenken kan være endret.</p>
        <a class="button primary" href="/">Til forsiden</a>
      </section>
    <?php else: ?>
      <section class="page-title">
        <p class="eyebrow">Rockeskolen</p>
        <h1><?php echo rs_h($article['title']); ?></h1>
        <?php if (!empty($article['published_at'])): ?>
          <p><?php echo rs_h(date('j. M Y', strtotime($article['published_at']))); ?></p>
        <?php endif; ?>
        <p class="lead"><?php echo rs_h($article['ingress']); ?></p>
      </section>

      <article class="article-card">
        <?php rs_render_rich_text($article['body']); ?>
      </article>
    <?php endif; ?>
  </main>
</body>
</html>
