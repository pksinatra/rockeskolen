<?php require __DIR__.'/db.inc.php';
// Node 161: halv–hel dim passer over 7♭9, hel–halv dim over dim7 (teksten hadde det omvendt).
$apply = ($argv[1] ?? '') === 'apply';
$r = $pdo->query("SELECT revision_id, field_body_value v FROM {$p}node__field_body WHERE entity_id=161")->fetch();
$rep = [
  'deretter heltone – og gjentas.<br>Brukes over <strong data-start="816" data-end="833">dim7-akkorder</strong>.</p>'
    => 'deretter heltone – og gjentas.<br>Brukes over <strong data-start="816" data-end="833">dominant7♭9-akkorder</strong>, ofte som alterert fargeskala.</p>',
  'deretter halvtone – og gjentas.<br>Brukes over <strong data-start="1008" data-end="1032">dominant7♭9-akkorder</strong>, ofte som alterert fargeskala.</p>'
    => 'deretter halvtone – og gjentas.<br>Brukes over <strong data-start="1008" data-end="1032">dim7-akkorder</strong>.</p>',
  'Prøv å improvisere over en C7♭9 med hel–halv dim' => 'Prøv å improvisere over en C7♭9 med halv–hel dim',
];
foreach ($rep as $a => $b) if (substr_count($r['v'], $a) !== 1) exit("FEIL: fant ikke nøyaktig én gang: ".substr($a, 0, 60)."\n");
$v = strtr($r['v'], $rep);
echo "endringer: ", count($rep), ", lengde ", strlen($r['v']), " -> ", strlen($v), "\n";
if (!$apply) exit("Tørrkjøring\n");
$bk = $WORK.'/drupal-backup-161-'.date('Ymd-His'); mkdir($bk); file_put_contents("$bk/161.html", $r['v']);
$pdo->beginTransaction();
$a = $pdo->prepare("UPDATE {$p}node__field_body SET field_body_value=? WHERE entity_id=161 AND revision_id=? AND field_body_value=?"); $a->execute([$v, $r['revision_id'], $r['v']]);
$b = $pdo->prepare("UPDATE {$p}node_revision__field_body SET field_body_value=? WHERE entity_id=161 AND revision_id=?"); $b->execute([$v, $r['revision_id']]);
if ($a->rowCount() !== 1 || $b->rowCount() !== 1) { $pdo->rollBack(); exit("FEIL: ingenting skrevet\n"); }
$pdo->commit(); echo "skrevet 161 (rev {$r['revision_id']}), backup $bk\n";
