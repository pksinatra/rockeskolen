<?php
require_once __DIR__ . '/config.php';
require_login();

$u = current_user();
$isPro = in_array($u['role'], ['pro','admin'], true);
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Chord Charts – ChordLink</title>
<link rel="stylesheet" href="/members/members.css?v=2">
</head>

<body>

<div class="wrap">

  <!-- TOPBAR -->
  <div class="topbar">
    <div class="brand">
      <div class="title">ChordLink</div>
      <div class="sub">Members</div>
    </div>
    <div class="row">
      <a class="btn ghost" href="/members/account.php">Account</a>
      <a class="btn" href="/members/logout.php">Log out</a>
    </div>
  </div>

  <!-- CONTENT -->
  <div class="card">

    <h1 class="h1">Chord Charts</h1>
    <div class="kicker">
      Download your available chord charts and build your understanding of harmony.
    </div>

    <hr class="sep">

    <h2 class="h2">Available charts</h2>

    <!-- ESSENTIALS -->
    <div style="margin-top:14px;">
      <h3>ChordLink Piano Chord Chart – Essentials</h3>
      <p class="small">Core chord types: major, minor, 7 and maj7. Clean and easy to use.</p>

      <a href="/tools/charts/ChordLink_Piano_Chord_Chart-Essentials.pdf" 
         class="btn primary">
        Download Essentials
      </a>
    </div>

    <!-- MAJORS -->
    <div style="margin-top:18px;">
      <h3>ChordLink Piano Chord Chart – Essential Majors</h3>
      <p class="small">All major chords presented clearly across keys.</p>

      <a href="/tools/charts/ChordLink_Piano_Chord_Chart-Essential_Majors.pdf" 
         class="btn primary">
        Download Major Chart
      </a>
    </div>

    <!-- MINORS -->
    <div style="margin-top:18px;">
      <h3>ChordLink Piano Chord Chart – Essential Minors</h3>
      <p class="small">All minor chords in a clean and visual layout.</p>

      <a href="/tools/charts/ChordLink_Piano_Chord_Chart-Essential_Minors.pdf" 
         class="btn primary">
        Download Minor Chart
      </a>
    </div>

    <!-- PRO VERSION -->
    <div style="margin-top:18px;">
      <h3>ChordLink Piano Chord Chart – Essentials Pro</h3>
      <p class="small">Extended version with more keys and expanded coverage.</p>

      <?php if ($isPro): ?>
        <a href="/tools/charts/ChordLink_Piano_Chord_Chart-Essentials_Pro.pdf" 
           class="btn primary">
          Download Extended Chart
        </a>
      <?php else: ?>
        <a href="/members/upgrade.php" class="btn">
          Unlock Pro version
        </a>
        <div class="small" style="margin-top:6px;">
          Available with ChordLink Pro
        </div>
      <?php endif; ?>
    </div>

    <hr class="sep">

    <!-- COMING -->
    <div class="alert">
      <strong>More charts coming soon</strong>
      <ul style="margin-top:6px;">
        <li>Extended chords</li>
        <li>Chord inversions</li>
        <li>Progressions & harmonic maps</li>
      </ul>
    </div>

    <!-- LINKS -->
    <div class="footer-links">
      <a class="link" href="/tools/chords/piano/">Piano Chord Finder</a>
      <a class="link" href="/tools/scales/piano/">Scale Finder</a>
      <a class="link" href="/tools/circles/fifths/">Circle of Fifths</a>
    </div>

  </div>
</div>

</body>
</html>