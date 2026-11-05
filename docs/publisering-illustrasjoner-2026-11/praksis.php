<?php require __DIR__.'/db.inc.php';
// Musikk i praksis – Låtskriving, Øving og Samspill (node 261–276): setter inn mørke, spillbare illustrasjoner ved bestemte overskrifter. "apply" skriver.
$apply = ($argv[1] ?? '') === 'apply';
$src = fn($file, $q) => 'https://rockeskolen.com/embed/'.$file.'?lang=no'.($q === '' ? '' : '&amp;'.str_replace('&', '&amp;', $q));
$fr = fn($file, $q, $h, $t) => '<iframe style="background-color:#0b0b10;border-width:0;display:block;" src="'.$src($file, $q).'" width="100%" height="'.$h.'" title="'.htmlspecialchars($t).'" loading="lazy"></iframe>';
$big = fn($file, $q, $h, $t) => '<figure class="rs-figur">'.$fr($file, $q, $h, $t).'</figure>';
$wid = fn($file, $q, $h, $t) => '<aside class="rs-widget">'.$fr($file, $q, $h, $t).'</aside>';
$T = fn($s) => '&title='.rawurlencode($s);
// [node, 'før' (stor figur foran overskriften) | 'etter' (widget rett etter overskriften), overskrift, html]
$plan = [
  [261, 'etter', 'Gjenta noe enkelt', $wid('groove.php', 'widget=pad', 270, 'Lag en melodi')],
  [262, 'før', 'Fire måter å ta vare på musikken', $big('chord.php', 'mode=sketch&bars=Am:A4-C5-E5'.$T('Skisse A: A – C – E over Am'), 480, 'Skisse A: A – C – E over Am')],
  [263, 'før', '3. Hva hvis akkordene kommer først?', $big('chord.php', 'mode=sketch&bars=Am|Am:A4-C5-E5;Fmaj7|Fmaj7:A4-C5-E5;C6|C6:A4-C5-E5'.$T('Samme melodi, tre akkorder'), 540, 'Samme melodi, tre akkorder')],
  [264, 'før', 'Prøv akkordene i Rockeskolens verktøykasse', $big('chord.php', 'mode=sketch&bars=Am:A4-C5-E5,Fmaj7:A4-C5-E5,C:G4-E4-C4,G:B4-D5-G5'.$T('Fire takter: Am – Fmaj7 – C – G'), 480, 'Fire takter: Am – Fmaj7 – C – G')],
  [264, 'før', '7. Hva gjør du når du står fast', $big('form.php', 'form=vers_refreng', 410, 'Vers og refreng')],
  [265, 'etter', 'Lag en gjenkjennelig kontur', $wid('melody.php', 'widget=shapes', 290, 'Melodiformer')],
  [265, 'før', 'Når en melodi får sin egen identitet', $big('melody.php', 'preset=jakob', 700, 'Tegn en melodi')],
  [266, 'før', 'Prøv akkordene i Rockeskolens verktøykasse', $big('chord.php', 'mode=sketch&bars=Vers|Am,Fmaj7,C,G;Refreng|C,G,Am,F'.$T('Vers og refreng – samme akkorder, ny rekkefølge'), 480, 'Vers og refreng')],
  [267, 'før', 'Teksten behøver ikke passe i et regneark', $big('rhythm.php', 'mode=meter&presets=4/4,3/4', 320, 'Tunge og lette slag')],
  [268, 'før', 'Tempo gjør mer enn å øke hastigheten', $big('rhythm.php', 'mode=pattern&presets=rock,halftime,four,shuffle', 400, 'Samme puls, forskjellig rytme')],
  [268, 'etter', 'Tempo gjør mer enn å øke hastigheten', $wid('pulse.php', 'widget=tempo', 275, 'Hverdagstempo')],
  [272, 'før', 'Når langsom øving ikke er nok', $big('rhythm.php', 'mode=subdivision', 360, 'Del opp pulsen')],
  [272, 'før', 'Bruk Rockeskolens verktøy', $big('rhythm.php', 'mode=metronome&bpm=60', 360, 'Metronom')],
  [274, 'før', 'Helheten er viktigere enn enkeltprestasjonen', $big('groove.php', '', 605, 'Spill med i grooven')],
  [275, 'etter', 'Pulsen – musikkens felles holdepunkt', $wid('pulse.php', 'widget=tap', 340, 'Finn pulsen')],
  [275, 'før', 'Bass og trommer – et rytmisk samarbeid', $big('rhythm.php', 'mode=pattern&presets=straight8&swing=60', 385, 'Straight eller swing')],
  [276, 'før', 'Dynamikk – musikkens pust', $big('rhythm.php', 'mode=pattern&presets=rock,fill', 400, 'Komp og fill')],
];
$ids = array_values(array_unique(array_column($plan, 0)));
$bodies = [];
foreach ($pdo->query("SELECT entity_id, revision_id, field_body_value v FROM {$p}node__field_body WHERE entity_id IN (".implode(',', $ids).")") as $r) $bodies[$r['entity_id']] = $r;
$bk = $WORK.'/drupal-backup-praksis-'.date('Ymd-His'); @mkdir($bk);
$new = [];
foreach ($bodies as $nid => $r) { file_put_contents("$bk/$nid.html", $r['v']); $new[$nid] = $r['v']; if (strpos($r['v'], 'rockeskolen.com/embed/') !== false) echo "MERK: $nid har allerede embed\n"; }
foreach ($plan as [$nid, $where, $head, $html]) {
  preg_match_all('#<h([234])[^>]*>.*?</h\1>#s', $new[$nid], $m, PREG_OFFSET_CAPTURE);
  $hits = array_values(array_filter($m[0], fn($x) => mb_strpos(trim(html_entity_decode(strip_tags($x[0]))), $head) !== false));
  if (count($hits) !== 1) exit("FEIL: $nid fant «$head» ".count($hits)." ganger\n");
  [$tag, $off] = $hits[0];
  $at = $where === 'før' ? $off : $off + strlen($tag);
  $new[$nid] = substr($new[$nid], 0, $at).$html.substr($new[$nid], $at);
  printf("%d  %-5s %-48s %s\n", $nid, $where, mb_substr($head, 0, 48), preg_replace('#.*embed/([^"]+)".*#', '$1', $html));
}
foreach ($new as $nid => $v) file_put_contents("$bk/$nid.new.html", $v);
if (!$apply) { echo "Tørrkjøring. Filer: $bk\n"; exit; }
$pdo->beginTransaction();
foreach ($new as $nid => $v) {
  $rev = $bodies[$nid]['revision_id'];
  $a = $pdo->prepare("UPDATE {$p}node__field_body SET field_body_value=? WHERE entity_id=? AND revision_id=? AND field_body_value=?"); $a->execute([$v, $nid, $rev, $bodies[$nid]['v']]);
  $b = $pdo->prepare("UPDATE {$p}node_revision__field_body SET field_body_value=? WHERE entity_id=? AND revision_id=?"); $b->execute([$v, $nid, $rev]);
  if ($a->rowCount() !== 1 || $b->rowCount() !== 1) { $pdo->rollBack(); exit("FEIL: $nid endret underveis; ingenting skrevet\n"); }
  echo "skrevet $nid (rev $rev)\n";
}
$pdo->commit(); echo "Backup: $bk\n";
