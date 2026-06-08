<!DOCTYPE html>
<html lang="no">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Verktøy | Rockeskolen</title>

<style>
body{
  margin:0;
  font-family: system-ui, sans-serif;
  background:#0b0b0f;
  color:#fff;
}

/* HERO */
.hero{
  padding:80px 20px;
  text-align:center;
  background: radial-gradient(circle at top, rgba(255,0,80,.2), transparent);
}

.hero h1{
  font-size:48px;
  margin-bottom:10px;
}

.hero p{
  font-size:18px;
  opacity:.8;
}

/* GRID */
.tools{
  padding:40px 20px;
  max-width:1100px;
  margin:auto;
}

.grid{
  display:grid;
  grid-template-columns: repeat(auto-fit, minmax(240px,1fr));
  gap:20px;
}

.card{
  background:rgba(255,255,255,0.05);
  border-radius:16px;
  padding:20px;
  text-decoration:none;
  color:#fff;
  transition:.25s;
  border:1px solid rgba(255,255,255,.1);
}

.card:hover{
  transform: translateY(-6px) scale(1.02);
  box-shadow:0 20px 40px rgba(0,0,0,.4);
}

.card h3{
  margin:10px 0;
}

.badge{
  display:inline-block;
  font-size:12px;
  padding:4px 8px;
  border-radius:8px;
  background:#ff3b3b;
}

/* SECTIONS */
.section{
  padding:60px 20px;
  max-width:900px;
  margin:auto;
  text-align:center;
}

.section h2{
  font-size:32px;
  margin-bottom:10px;
}

.section p{
  opacity:.8;
}

/* CTA */
.cta{
  margin-top:20px;
}

.button{
  display:inline-block;
  padding:12px 20px;
  border-radius:10px;
  background: linear-gradient(135deg,#b00020,#ff3b3b);
  color:#fff;
  text-decoration:none;
  font-weight:bold;
  transition:.2s;
}

.button:hover{
  transform:scale(1.05);
}
</style>
</head>

<body>

<!-- HERO -->
<section class="hero">
  <h1>Musikkverktøy – samlet på ett sted</h1>
  <p>Utforsk akkorder, skalaer og musikkteori med interaktive verktøy</p>
</section>

<!-- TOOLS -->
<section class="tools">
  <div class="grid">

    <a href="/tools/chords/guitar/" class="card">
      <h3>Gitarakkorder</h3>
      <p>Finn og spill akkorder på gitar</p>
    </a>

    <a href="/tools/chords/piano/" class="card">
      <h3>Pianoakkorder</h3>
      <p>Se akkorder på klaviatur</p>
    </a>

    <a href="/tools/scales/guitar/" class="card">
      <h3>Gitarskalaer</h3>
      <p>Utforsk skalaer på gripebrettet</p>
    </a>

    <a href="/tools/scales/piano/" class="card">
      <h3>Pianoskalaer</h3>
      <p>Se skalaer på piano</p>
    </a>

    <a href="/tools/chords/notes/index.php" class="card">
      <h3>Akkordgenerator</h3>
      <p>Generer akkorder basert på noter</p>
    </a>

    <a href="/tools/chordlog/" class="card">
      <h3>ChordLog</h3>
      <p>Lag og organiser akkordprogresjoner</p>
      <span class="badge">VIP</span>
    </a>

  </div>
</section>

<!-- SECTION 1 -->
<section class="section">
  <h2>Lær musikk visuelt</h2>
  <p>
    Våre verktøy hjelper deg å forstå musikk gjennom visuelle representasjoner
    av akkorder, skalaer og harmonier.
  </p>
</section>

<!-- SECTION 2 -->
<section class="section">
  <h2>Bygget for musikere</h2>
  <p>
    Enten du spiller gitar, piano eller produserer musikk,
    gir disse verktøyene deg en rask og intuitiv måte å utforske lyd på.
  </p>
</section>

<!-- SECTION 3 -->
<section class="section">
  <h2>Fra idé til musikk</h2>
  <p>
    Bruk verktøyene til å finne akkorder, bygge progresjoner
    og utvikle dine egne låter.
  </p>
</section>

<!-- CTA -->
<section class="section">
  <h2>Få full tilgang</h2>
  <p>Oppgrader til VIP og lås opp alle funksjoner</p>
  <div class="cta">
    <a href="/members/upgrade.php" class="button">Bli VIP-medlem</a>
  </div>
</section>

</body>
</html>