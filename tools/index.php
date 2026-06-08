<?php
$pageTitle = "ChordLink Tools";
$pageDescription = "Explore interactive music tools for chords, scales, piano, guitar, theory and songwriting.";

$tools = [
  [
    "category" => "Chords",
    "items" => [
      ["title" => "Piano Chords", "url" => "/tools/chords/piano/", "status" => "live", "desc" => "Explore chords directly on a piano keyboard."],
      ["title" => "Guitar Chords", "url" => "/tools/chords/guitar/", "status" => "live", "desc" => "View and understand guitar chord shapes."],
    ]
  ],
  [
    "category" => "Scales",
    "items" => [
      ["title" => "Piano Scales", "url" => "/tools/scales/piano/", "status" => "live", "desc" => "See scales mapped visually on the piano."],
    ]
  ],
  [
    "category" => "Circles",
    "items" => [
      ["title" => "Circle of Fifths", "url" => "/tools/circles/fifths/", "status" => "live", "desc" => "Explore keys, relationships and harmonic movement."],
    ]
  ],
  [
    "category" => "Wheels",
    "items" => [
      ["title" => "Ambient Orbit", "url" => "/tools/wheels/ambient-orbit/", "status" => "beta", "desc" => "A visual tool for ambient harmonic exploration."],
      ["title" => "Chords Orbit", "url" => "/tools/wheels/chords-orbit/", "status" => "beta", "desc" => "Explore chord movement in a circular layout."],
    ]
  ],
  [
    "category" => "Instruments",
    "items" => [
      ["title" => "Playable Piano", "url" => "/tools/instruments/piano_playable.php", "status" => "live", "desc" => "Play notes directly in the browser."],
      ["title" => "Tuners", "url" => "/tools/tuners/", "status" => "live", "desc" => "Simple tuning tools for musicians."],
    ]
  ],
];
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <title><?= htmlspecialchars($pageTitle) ?></title>
  <meta name="description" content="<?= htmlspecialchars($pageDescription) ?>">

  <style>
    :root {
      --bg: #0d0d10;
      --panel: #17171d;
      --panel-soft: #202029;
      --text: #f5f5f7;
      --muted: #b8b8c7;
      --green: #00ff9d;
      --red: #ff355e;
      --orange: #ff8a00;
      --line: rgba(255,255,255,0.1);
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background:
        radial-gradient(circle at top left, rgba(255,53,94,.16), transparent 32rem),
        radial-gradient(circle at bottom right, rgba(0,255,157,.12), transparent 32rem),
        var(--bg);
      color: var(--text);
    }

    .cl-tools-page {
      max-width: 1180px;
      margin: 0 auto;
      padding: 4rem 1.25rem;
    }

    .hero {
      margin-bottom: 3rem;
      max-width: 760px;
    }

    .eyebrow {
      color: var(--green);
      font-weight: 700;
      letter-spacing: .08em;
      text-transform: uppercase;
      font-size: .8rem;
      margin-bottom: .75rem;
    }

    h1 {
      font-size: clamp(2.4rem, 6vw, 5rem);
      line-height: .95;
      margin: 0 0 1rem;
    }

    .lead {
      color: var(--muted);
      font-size: 1.18rem;
      line-height: 1.6;
      margin: 0;
    }

    .category {
      margin: 3rem 0;
    }

    .category h2 {
      font-size: 1.6rem;
      margin: 0 0 1rem;
    }

    .tool-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1rem;
    }

    .tool-card {
      display: block;
      position: relative;
      padding: 1.25rem;
      border-radius: 18px;
      background:
        linear-gradient(var(--panel), var(--panel)) padding-box,
        linear-gradient(135deg, var(--red), var(--orange), var(--green)) border-box;
      border: 1px solid transparent;
      text-decoration: none;
      color: inherit;
      min-height: 160px;
      transition: transform .18s ease, background .18s ease, box-shadow .18s ease;
    }

    .tool-card:hover {
      transform: translateY(-4px);
      background:
        linear-gradient(var(--panel-soft), var(--panel-soft)) padding-box,
        linear-gradient(135deg, var(--green), var(--orange), var(--red)) border-box;
      box-shadow: 0 18px 45px rgba(0,0,0,.35);
    }

    .tool-card h3 {
      margin: 0 0 .55rem;
      font-size: 1.25rem;
    }

    .tool-card p {
      color: var(--muted);
      line-height: 1.5;
      margin: 0;
    }

    .status {
      display: inline-flex;
      align-items: center;
      margin-bottom: .8rem;
      padding: .25rem .55rem;
      border-radius: 999px;
      font-size: .72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .04em;
      background: rgba(255,255,255,.08);
      color: var(--muted);
    }

    .status.live {
      color: #09120d;
      background: var(--green);
    }

    .status.beta {
      color: #130b00;
      background: var(--orange);
    }

    .footer-note {
      margin-top: 4rem;
      padding-top: 2rem;
      border-top: 1px solid var(--line);
      color: var(--muted);
      font-size: .95rem;
    }
  </style>
</head>

<body>
  <main class="cl-tools-page">

    <section class="hero">
      <div class="eyebrow">ChordLink</div>
      <h1>Music tools for chords, scales and songwriting.</h1>
      <p class="lead">
        Explore interactive tools for understanding music visually.
        ChordLink connects theory, instruments and creativity in one growing toolkit.
      </p>
    </section>

    <?php foreach ($tools as $section): ?>
      <section class="category">
        <h2><?= htmlspecialchars($section["category"]) ?></h2>

        <div class="tool-grid">
          <?php foreach ($section["items"] as $tool): ?>
            <a class="tool-card" href="<?= htmlspecialchars($tool["url"]) ?>">
              <span class="status <?= htmlspecialchars($tool["status"]) ?>">
                <?= htmlspecialchars($tool["status"]) ?>
              </span>

              <h3><?= htmlspecialchars($tool["title"]) ?></h3>
              <p><?= htmlspecialchars($tool["desc"]) ?></p>
            </a>
          <?php endforeach; ?>
        </div>
      </section>
    <?php endforeach; ?>

    <div class="footer-note">
      ChordLink is under active development. More tools for ukulele, notes, chords, scales, progressions and harmonic systems are coming.
    </div>

  </main>
</body>
</html>