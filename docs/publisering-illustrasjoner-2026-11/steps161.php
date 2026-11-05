<?php require __DIR__.'/db.inc.php';
// Node 161: trinnwidgetene for de to dim-skalaene blir store figurer rett under hver skala, så de ikke flyter inn i neste avsnitt.
$apply = ($argv[1] ?? '') === 'apply';
$r = $pdo->query("SELECT revision_id, field_body_value v FROM {$p}node__field_body WHERE entity_id=161")->fetch();
$re = '#<aside class="rs-widget">(<iframe[^>]*scales=C:(half_whole|whole_half)_dim&amp;view=steps"[^>]*height=")230("[^>]*></iframe>)</aside>#';
if (preg_match_all($re, $r['v']) !== 2) exit("FEIL: fant ikke de to trinnwidgetene\n");
$v = preg_replace($re, '<figure class="rs-figur">${1}170${3}</figure>', $r['v']);
echo "rs-widget igjen: ", substr_count($v, 'rs-widget'), ", figurer: ", substr_count($v, 'rs-figur'), "\n";
if (!$apply) exit("Tørrkjøring\n");
$bk = $WORK.'/drupal-backup-161-steps-'.date('Ymd-His'); mkdir($bk); file_put_contents("$bk/161.html", $r['v']);
$pdo->beginTransaction();
$a = $pdo->prepare("UPDATE {$p}node__field_body SET field_body_value=? WHERE entity_id=161 AND revision_id=? AND field_body_value=?"); $a->execute([$v, $r['revision_id'], $r['v']]);
$b = $pdo->prepare("UPDATE {$p}node_revision__field_body SET field_body_value=? WHERE entity_id=161 AND revision_id=?"); $b->execute([$v, $r['revision_id']]);
if ($a->rowCount() !== 1 || $b->rowCount() !== 1) { $pdo->rollBack(); exit("FEIL: ingenting skrevet\n"); }
$pdo->commit(); echo "skrevet 161 (rev {$r['revision_id']}), backup $bk\n";
