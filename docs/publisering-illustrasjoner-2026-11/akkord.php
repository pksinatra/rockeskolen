<?php require __DIR__.'/db.inc.php';
// Akkorder og harmoni (node 174–178): bytter de hvite akkordboksene med chord.php. "apply" skriver.
$apply = ($argv[1] ?? '') === 'apply';
$src = fn($q) => 'https://rockeskolen.com/embed/chord.php?lang=no&amp;'.str_replace('&', '&amp;', $q);
$fr = fn($q, $h, $t) => '<iframe style="background-color:#0b0b10;border-width:0;display:block;" src="'.$src($q).'" width="100%" height="'.$h.'" title="'.$t.'" loading="lazy"></iframe>';
$big = fn($q, $h, $t) => '<figure class="rs-figur">'.$fr($q, $h, $t).'</figure>';
$wid = fn($q, $h, $t) => '<aside class="rs-widget">'.$fr($q, $h, $t).'</aside>';
$box = fn($c) => '#<p>\s*<iframe[^>]*src="https://www\.rockeskolen\.com/tools/chords/notes/embed\.php\?chord='.preg_quote($c, '#').'&amp;mode=key"[^>]*>\s*</iframe>\s*</p>#';
// [node, mønster (regex) som må treffe nøyaktig én gang, erstatning]
$plan = [
 [174, $box('Emaj7'), $big('chord=Emaj7', 345, 'Emaj7 på noter og piano')],
 [174, $box('C'), $big('mode=build', 530, 'Bygg en treklang')],
 [175, $box('C'), $big('chord=C', 345, 'C-dur på noter og piano')],
 [175, $box('Am'), $big('chord=Am&compare=A', 400, 'A-moll sammenlignet med A-dur')],
 [175, $box('Cdim'), $big('chord=Cdim&compare=Cm', 400, 'Cdim sammenlignet med C-moll')],
 [175, $box('Caug'), $big('chord=Caug&compare=C', 400, 'Caug sammenlignet med C-dur')],
 [175, $box('Csus4'), $big('chord=Csus4&compare=C', 400, 'Csus4 sammenlignet med C-dur')],
 [175, $box('Cadd9'), $big('chord=Cadd9&compare=C', 400, 'Cadd9 sammenlignet med C-dur')],
 [176, $box('C9'), $big('chord=C9&compare=Cadd9', 400, 'C9 sammenlignet med Cadd9')],
 [176, $box('Cadd9'), ''],
 [176, $box('C11'), $big('chord=C11&compare=C9', 400, 'C11 sammenlignet med C9')],
 [176, $box('C13'), $big('chord=C13&compare=C9', 400, 'C13 sammenlignet med C9')],
 [177, '#'.substr($box('G7'), 1, -1).'\s*'.substr($box('C'), 1, -1).'#', $big('mode=resolve', 430, 'G7 går til C')],
 [178, '#(<p>Det samme mønsteret kan flyttes til hvilken som helst toneart\.</p>)#u', '$1'.$big('mode=degrees', 400, 'Én akkord på hvert trinn')],
];
$bodies = [];
foreach ($pdo->query("SELECT entity_id, revision_id, field_body_value v FROM {$p}node__field_body WHERE entity_id IN (174,175,176,177,178)") as $r) $bodies[$r['entity_id']] = $r;
$bk = $WORK.'/drupal-backup-akkord-'.date('Ymd-His'); @mkdir($bk);
foreach ($bodies as $nid => $r) file_put_contents("$bk/$nid.html", $r['v']);
$new = array_map(fn($r) => $r['v'], $bodies);
foreach ($plan as [$nid, $re, $rep]) {
  $n = preg_match_all($re, $new[$nid]);
  if ($n !== 1) exit("FEIL: $nid treff=$n for $re\n");
  $new[$nid] = preg_replace($re, $rep, $new[$nid]);
  echo "ok $nid ", substr(preg_replace('#\\\\.#', '', $re), 0, 90), "\n";
}
foreach ($new as $nid => $v) {
  $left = preg_match_all('#tools/chords/notes/#', $v); $add = substr_count($v, 'embed/chord.php');
  echo "node $nid: gamle bokser igjen=$left, chord.php=$add\n";
  file_put_contents("$bk/$nid.new.html", $v);
}
if (!$apply) { echo "Tørrkjøring. Filer: $bk\n"; exit; }
$pdo->beginTransaction();
foreach ($new as $nid => $v) {
  if ($v === $bodies[$nid]['v']) continue;
  $rev = $bodies[$nid]['revision_id'];
  $a = $pdo->prepare("UPDATE {$p}node__field_body SET field_body_value=? WHERE entity_id=? AND revision_id=? AND field_body_value=?"); $a->execute([$v, $nid, $rev, $bodies[$nid]['v']]);
  $b = $pdo->prepare("UPDATE {$p}node_revision__field_body SET field_body_value=? WHERE entity_id=? AND revision_id=?"); $b->execute([$v, $nid, $rev]);
  if ($a->rowCount() !== 1 || $b->rowCount() !== 1) { $pdo->rollBack(); exit("FEIL: $nid endret underveis; ingenting skrevet\n"); }
  echo "skrevet $nid (rev $rev)\n";
}
$pdo->commit(); echo "Backup: $bk\n";
