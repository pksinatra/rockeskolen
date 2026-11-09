<?php require __DIR__.'/db.inc.php';
// Node 289 Kvintsirkelen og beslektede tonearter: setter publiseringsstatus til 1 på noden og gjeldende revisjon. "apply" skriver.
$apply = ($argv[1] ?? '') === 'apply';
$nid = 289;
$r = $pdo->query("SELECT vid, status, title FROM {$p}node_field_data WHERE nid=$nid")->fetch();
echo "{$r['title']}: status {$r['status']}, revisjon {$r['vid']}\n";
if ((int) $r['status'] === 1) exit("Allerede publisert\n");
if (!$apply) exit("Tørrkjøring\n");
$pdo->beginTransaction();
$a = $pdo->prepare("UPDATE {$p}node_field_data SET status=1 WHERE nid=? AND vid=? AND status=0"); $a->execute([$nid, $r['vid']]);
$b = $pdo->prepare("UPDATE {$p}node_field_revision SET status=1 WHERE nid=? AND vid=?"); $b->execute([$nid, $r['vid']]);
if ($a->rowCount() !== 1 || $b->rowCount() !== 1) { $pdo->rollBack(); exit("FEIL: ingenting skrevet\n"); }
$pdo->commit(); echo "publisert $nid (revisjon {$r['vid']})\n";
