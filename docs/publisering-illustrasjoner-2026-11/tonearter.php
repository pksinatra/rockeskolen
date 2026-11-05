<?php require __DIR__.'/db.inc.php';
// Tonearter og Fortegn (node 181, 216, 288) og to rester fra Noter (15, 163): bytter de siste lyse noteboksene med mørke visninger. "apply" skriver.
$apply = ($argv[1] ?? '') === 'apply';
$src = fn($file, $q) => 'https://rockeskolen.com/embed/'.$file.'?lang=no&amp;'.str_replace('&', '&amp;', $q);
$fr = fn($file, $q, $h, $t) => '<iframe style="background-color:#0b0b10;border-width:0;display:block;" src="'.$src($file, $q).'" width="100%" height="'.$h.'" title="'.htmlspecialchars($t).'" loading="lazy"></iframe>';
$big = fn($q, $h, $t, $file = 'mode.php') => '<figure class="rs-figur">'.$fr($file, $q, $h, $t).'</figure>';
$wid = fn($q, $h, $t, $file = 'mode.php') => '<aside class="rs-widget">'.$fr($file, $q, $h, $t).'</aside>';
$old = fn($pat) => '#<p[^>]*>\s*<iframe[^>]*src="https://(?:www\.)?rockeskolen\.com/tools/'.$pat.'"[^>]*>\s*</iframe>\s*</p>#';
$plan = [
  [15, $old('theory/whole-note-g\.html'), $wid('widget=g', 300, 'Her ligger G', 'staff.php')],
  [15, $old('theory/bars\.html'), $big('mode=meter&meters=4/4,3/4,6/8', 380, 'Hvor mange slag i takten?', 'staff.php')],
  [163, $old('notes/embed\.php\?mode=scale&amp;oct=4&amp;tempo=90&amp;root=C&amp;type=major&amp;output=notation'), $wid('scales=C:major&view=staff', 170, 'C-dur på noter')],
  [181, $old('notes/embed\.php\?mode=scale&amp;root=G&amp;type=major&amp;oct=4&amp;tempo=90&amp;output=notation'), $big('scales=G:major&view=staff&key=auto&title='.rawurlencode('G-dur med fast fortegn'), 240, 'G-dur med fast fortegn')],
  [181, $old('notes/embed\.php\?mode=scale&amp;root=G&amp;type=major&amp;oct=4&amp;tempo=90&amp;output=notation&amp;theoretical=1'), $big('scales=G:major&view=staff&title='.rawurlencode('G-dur med løst fortegn'), 240, 'G-dur med løst fortegn')],
  [216, $old('notes/embed\.php\?mode=scale&amp;root=D%23&amp;type=major&amp;oct=4&amp;tempo=90&amp;output=notation&amp;theoretical=1'), $big('scales=D%23:major&view=staff', 240, 'D#-dur på noter')],
  [216, $old('notes/embed\.php\?mode=scale&amp;root=Eb&amp;type=major&amp;oct=4&amp;tempo=90&amp;output=notation'), $big('scales=Eb:major&view=staff&key=auto', 240, 'Eb-dur på noter')],
  // Den eksisterende F♯/F-sammenligningen får G-durs toneartstegn, så F♯ står uten tegn og F får ♮.
  [181, '#title=F%E2%99%AF%20og%20F%20i%20G-dur"#', 'title=F%E2%99%AF%20og%20F%20i%20G-dur&amp;key=G"'],
  // To bokser i samme avsnitt blir én sammenligning med hvert sitt toneartstegn.
  [288, '#<p>\s*<iframe[^>]*root=C&amp;type=major[^>]*>\s*</iframe>\s*<iframe[^>]*root=C&amp;type=nat_minor[^>]*>\s*</iframe>\s*</p>#',
    $big('scales=C:major,C:minor&mark=diff&key=auto&title='.rawurlencode('C-dur og C-moll'), 730, 'C-dur og C-moll')],
];
$ids = array_unique(array_column($plan, 0));
$bodies = [];
foreach ($pdo->query("SELECT entity_id, revision_id, field_body_value v FROM {$p}node__field_body WHERE entity_id IN (".implode(',', $ids).")") as $r) $bodies[$r['entity_id']] = $r;
$bk = $WORK.'/drupal-backup-tonearter-'.date('Ymd-His'); @mkdir($bk);
foreach ($bodies as $nid => $r) file_put_contents("$bk/$nid.html", $r['v']);
$new = array_map(fn($r) => $r['v'], $bodies);
foreach ($plan as [$nid, $re, $rep]) {
  $n = preg_match_all($re, $new[$nid]);
  if ($n !== 1) exit("FEIL: $nid treff=$n for $re\n");
  $new[$nid] = preg_replace_callback($re, fn() => $rep, $new[$nid]);
  echo "ok $nid ", preg_replace('#.*src="https://rockeskolen\.com/embed/([^"]+)".*#', '$1', $rep), "\n";
}
foreach ($new as $nid => $v) {
  echo "node $nid: gamle igjen=", preg_match_all('#tools/(notes/embed|theory/)#', $v), "\n";
  file_put_contents("$bk/$nid.new.html", $v);
}
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
