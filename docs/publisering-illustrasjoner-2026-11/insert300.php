<?php require __DIR__.'/db.inc.php';
// Setter inn trappe-illustrasjonen i node 300 etter «Det er nettopp dette som gjør skalaer interessante.». "apply" skriver.
$apply = ($argv[1] ?? '') === 'apply';
$nid = 300; $anchor = 'Det er nettopp dette som gjør skalaer interessante.';
$html = '<figure class="rs-figur"><iframe style="background-color:#0b0b10;border-width:0;display:block;" src="https://rockeskolen.com/embed/ladder.php?lang=no&amp;mode=stairs" width="100%" height="560" title="Like trinn – eller blandede?" loading="lazy"></iframe></figure>';
$r = $pdo->query("SELECT b.revision_id, b.field_body_value v FROM {$p}node__field_body b WHERE b.entity_id=$nid")->fetch();
$h = $r['v']; file_put_contents($WORK."/node300-backup-".date('Ymd-His').".html", $h);
if (str_contains($h, 'mode=stairs')) exit("finnes allerede\n");
if (substr_count($h, $anchor) !== 1) exit("FEIL: ankeret finnes ".substr_count($h, $anchor)." ganger\n");
$end = strpos($h, '</p>', strpos($h, $anchor)) + 4;
$new = substr($h, 0, $end).$html.substr($h, $end);
echo "sett inn etter: ", substr($h, $end - 70, 70), "\n";
if (!$apply) exit("Tørrkjøring.\n");
$pdo->beginTransaction();
$a = $pdo->prepare("UPDATE {$p}node__field_body SET field_body_value=? WHERE entity_id=? AND revision_id=? AND field_body_value=?"); $a->execute([$new, $nid, $r['revision_id'], $h]);
$b = $pdo->prepare("UPDATE {$p}node_revision__field_body SET field_body_value=? WHERE entity_id=? AND revision_id=?"); $b->execute([$new, $nid, $r['revision_id']]);
if ($a->rowCount() !== 1 || $b->rowCount() !== 1) { $pdo->rollBack(); exit("FEIL: ingenting skrevet\n"); }
$pdo->commit(); echo "skrevet node $nid (rev {$r['revision_id']})\n";
