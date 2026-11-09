<?php require __DIR__.'/db.inc.php';
// Node 288 Varianttonearter: de to like progresjonsspillerne (C – F – Fm – C og C – Ab – Bb – C) blir én mørk visning med trinn og lånte akkorder i rødt. "apply" skriver.
$apply = ($argv[1] ?? '') === 'apply';
$nid = 288;
$q = 'lang=no&amp;mode=sketch&amp;key=C&amp;bars='.rawurlencode('F-dur til F-moll').'|C,F,Fm,C;'.rawurlencode('Rockeriff').'|C,Ab,Bb,C&amp;title='.rawurlencode('Lånte akkorder fra C-moll');
$html = '<figure class="rs-figur"><iframe style="background-color:#0b0b10;border-width:0;display:block;" src="https://rockeskolen.com/embed/chord.php?'.$q.'" width="100%" height="500" title="Lånte akkorder fra C-moll" loading="lazy"></iframe></figure>';
$re = '#<p>\s*<iframe[^>]*progression\.php\?chords=C,F,Fm,C&amp;[^>]*>\s*</iframe>\s*<iframe[^>]*progression\.php\?chords=C,Ab,Bb,C&amp;[^>]*>\s*</iframe>\s*</p>#';
$r = $pdo->query("SELECT revision_id, field_body_value v FROM {$p}node__field_body WHERE entity_id=$nid")->fetch();
if (preg_match_all($re, $r['v']) !== 1) exit("FEIL: fant ikke de to spillerne nøyaktig én gang\n");
$v = preg_replace_callback($re, fn() => $html, $r['v']);
echo "progresjonsspillere igjen: ", substr_count($v, 'progression.php'), ", chord.php: ", substr_count($v, 'embed/chord.php'), "\n";
if (!$apply) exit("Tørrkjøring\n");
$bk = $WORK.'/drupal-backup-288-'.date('Ymd-His'); mkdir($bk); file_put_contents("$bk/$nid.html", $r['v']);
$pdo->beginTransaction();
$a = $pdo->prepare("UPDATE {$p}node__field_body SET field_body_value=? WHERE entity_id=? AND revision_id=? AND field_body_value=?"); $a->execute([$v, $nid, $r['revision_id'], $r['v']]);
$b = $pdo->prepare("UPDATE {$p}node_revision__field_body SET field_body_value=? WHERE entity_id=? AND revision_id=?"); $b->execute([$v, $nid, $r['revision_id']]);
if ($a->rowCount() !== 1 || $b->rowCount() !== 1) { $pdo->rollBack(); exit("FEIL: ingenting skrevet\n"); }
$pdo->commit(); echo "skrevet $nid (rev {$r['revision_id']}), backup $bk\n";
