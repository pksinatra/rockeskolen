<?php require __DIR__.'/db.inc.php';
$apply = ($argv[1] ?? '') === 'apply';
$r = $pdo->query("SELECT revision_id, field_body_value v FROM {$p}node__field_body WHERE entity_id=174")->fetch();
$s = '<p>Vanligvis bygges akkorder ut fra <strong>skalaer og intervaller</strong>, og navngis ut fra sin <strong>grunntone</strong> og <strong>kvalitet</strong> (dur, moll osv.).</p>';
$anchor = 'eller programmeres digitalt.</p>';
if (substr_count($r['v'], $s) !== 2 || substr_count($r['v'], $anchor.$s) !== 1) exit("FEIL: uventet innhold\n");
$v = str_replace($anchor.$s, $anchor, $r['v']);
echo "forekomster etter: ", substr_count($v, $s), ", lengde ", strlen($r['v']), " -> ", strlen($v), "\n";
if (!$apply) exit("Tørrkjøring\n");
$bk = $WORK.'/drupal-backup-174-'.date('Ymd-His'); mkdir($bk); file_put_contents("$bk/174.html", $r['v']);
$pdo->beginTransaction();
$a = $pdo->prepare("UPDATE {$p}node__field_body SET field_body_value=? WHERE entity_id=174 AND revision_id=? AND field_body_value=?"); $a->execute([$v, $r['revision_id'], $r['v']]);
$b = $pdo->prepare("UPDATE {$p}node_revision__field_body SET field_body_value=? WHERE entity_id=174 AND revision_id=?"); $b->execute([$v, $r['revision_id']]);
if ($a->rowCount() !== 1 || $b->rowCount() !== 1) { $pdo->rollBack(); exit("FEIL: ingenting skrevet\n"); }
$pdo->commit(); echo "skrevet 174 (rev {$r['revision_id']}), backup $bk\n";
