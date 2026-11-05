<?php require __DIR__.'/db.inc.php';
// Noter-serien (node 163–166): bytter de hvite /tools/theory/-boksene med staff.php. "apply" skriver.
$apply = ($argv[1] ?? '') === 'apply';
$src = fn($q) => 'https://rockeskolen.com/embed/staff.php?lang=no&amp;'.str_replace('&', '&amp;', $q);
$fr = fn($q, $h, $t) => '<iframe style="background-color:#0b0b10;border-width:0;display:block;" src="'.$src($q).'" width="100%" height="'.$h.'" title="'.$t.'" loading="lazy"></iframe>';
$big = fn($q, $h, $t) => '<figure class="rs-figur">'.$fr($q, $h, $t).'</figure>';
$wid = fn($q, $h, $t) => '<aside class="rs-widget">'.$fr($q, $h, $t).'</aside>';
$theory = fn($f) => '#<iframe[^>]*src="https://www\.rockeskolen\.com/tools/theory/'.preg_quote($f, '#').'"[^>]*>\s*</iframe>#';
// [node, mønster (regex) som må treffe nøyaktig én gang, erstatning]
$plan = [
 [163, '#<br>\s*'.substr($theory('staff.html'), 1, -1).'\s*(&nbsp;)?\s*<br>#', '</p>'.$big('mode=staff', 330, 'Linjer, mellomrom og nøkkel').'<p>'],
 // clefs-boksen og den doble setningen etter den (står allerede etter første boks)
 [163, '#<p>\s*'.substr($theory('clefs.html'), 1, -1).'\s*Både linjene og mellomrommene representerer ulike toner\.\s*</p>#u', ''],
 [163, '#<p[^>]*>\s*'.substr($theory('staff-clef.html'), 1, -1).'\s*</p>#', $wid('widget=g', 300, 'Her ligger G')],
 [164, '#<p>\s*'.substr($theory('whole-note.html'), 1, -1).'\s*</p>#', ''],
 [164, '#(<h3[^>]*>Helnote</h3>)#', $big('mode=values&value=16', 470, 'Hvor lenge varer tonen?').'$1'],
 [164, '#<p>\s*'.substr($theory('half-notes.html'), 1, -1).'\s*</p>#', ''],
 [164, '#<p>\s*'.substr($theory('quarter-notes.html'), 1, -1).'\s*</p>#', ''],
 [164, '#<p>\s*'.substr($theory('eight-notes.html'), 1, -1).'\s*</p>#', ''],
 [164, '#<p>\s*'.substr($theory('sixteenth-notes.html'), 1, -1).'\s*</p>#', ''],
 [164, '#(= 16 sekstendedeler</p></li></ul>)#', '$1'.$big('mode=tree', 400, 'Fra helnote til sekstendedeler')],
 [165, '#<p>\s*'.substr($theory('notes-rests.html'), 1, -1).'\s*</p>#', $big('mode=values&kind=rests&kinds=notes,rests,alt&value=4', 520, 'Hvor lenge varer stillheten?')],
 [165, '#<p>\s*'.substr($theory('whole-rest.html'), 1, -1).'\s*</p>#', ''],
 [165, '#<p>\s*'.substr($theory('half-rests.html'), 1, -1).'\s*</p>#', ''],
 [165, '#<p>\s*'.substr($theory('quarter-rests.html'), 1, -1).'\s*</p>#', ''],
 [165, '#<p>\s*'.substr($theory('eight-rests.html'), 1, -1).'\s*</p>#', ''],
 [165, '#<p>\s*'.substr($theory('sixteenth-rests.html'), 1, -1).'\s*</p>#', ''],
 [165, '#<p[^>]*>\s*'.substr($theory('rests-overview.html'), 1, -1).'\s*</p>#', $big('mode=tree&kind=rests', 460, 'Fra helpause til sekstendedelspauser')],
 [166, '#<p>\s*'.substr($theory('pulse.html'), 1, -1).'\s*</p>#', $big('mode=meter&meters=pulse,4/4', 380, 'Fra puls til takt')],
 [166, '#<p[^>]*>\s*'.substr($theory('bar.html'), 1, -1).'\s*</p>#', ''],
 [166, '#<p[^>]*>\s*'.substr($theory('4-4.html'), 1, -1).'\s*</p>#', $big('mode=meter&meters=4/4,3/4,6/8', 380, 'Hvor mange slag i takten?')],
 [166, '#<p[^>]*>\s*'.substr($theory('3-4.html'), 1, -1).'\s*</p>#', ''],
 [166, '#<p[^>]*>\s*'.substr($theory('6-8.html'), 1, -1).'\s*</p>#', ''],
];
$bodies = [];
foreach ($pdo->query("SELECT entity_id, revision_id, field_body_value v FROM {$p}node__field_body WHERE entity_id IN (163,164,165,166)") as $r) $bodies[$r['entity_id']] = $r;
$bk = $WORK.'/drupal-backup-noter-'.date('Ymd-His'); @mkdir($bk);
foreach ($bodies as $nid => $r) file_put_contents("$bk/$nid.html", $r['v']);
$new = array_map(fn($r) => $r['v'], $bodies);
foreach ($plan as [$nid, $re, $rep]) {
  $n = preg_match_all($re, $new[$nid]);
  if ($n !== 1) exit("FEIL: $nid treff=$n for $re\n");
  $new[$nid] = preg_replace($re, $rep, $new[$nid]);
  echo "ok $nid ", substr(preg_replace('#\\\\.#', '', $re), 0, 90), "\n";
}
foreach ($new as $nid => $v) {
  $left = preg_match_all('#tools/theory/#', $v); $add = substr_count($v, 'embed/staff.php');
  echo "node $nid: tools/theory igjen=$left, staff.php=$add\n";
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
