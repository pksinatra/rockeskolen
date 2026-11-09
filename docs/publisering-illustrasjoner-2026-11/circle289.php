<?php require __DIR__.'/db.inc.php';
// Node 289 Kvintsirkelen og beslektede tonearter: setter inn embed/circle.php foran overskriften «Akkordrekker». "apply" skriver.
$apply = ($argv[1] ?? '') === 'apply';
$nid = 289; $head = 'Akkordrekker';
$html = '<figure class="rs-figur"><iframe style="background-color:#0b0b10;border-width:0;display:block;" src="https://rockeskolen.com/embed/circle.php?lang=no&amp;key=C" width="100%" height="600" title="Beslektede tonearter i kvintsirkelen" loading="lazy"></iframe></figure>';
$r = $pdo->query("SELECT revision_id, field_body_value v FROM {$p}node__field_body WHERE entity_id=$nid")->fetch();
if (strpos($r['v'], 'embed/circle.php') !== false) exit("FEIL: $nid har allerede sirkelen\n");
preg_match_all('#<h([234])[^>]*>.*?</h\1>#s', $r['v'], $m, PREG_OFFSET_CAPTURE);
$hits = array_values(array_filter($m[0], fn($x) => trim(html_entity_decode(strip_tags($x[0]))) === $head));
if (count($hits) !== 1) exit("FEIL: fant «{$head}» ".count($hits)." ganger\n");
$v = substr($r['v'], 0, $hits[0][1]).$html.substr($r['v'], $hits[0][1]);
echo "setter inn foran «{$head}», lengde ", strlen($r['v']), " -> ", strlen($v), "\n";
if (!$apply) exit("Tørrkjøring\n");
$bk = $WORK.'/drupal-backup-289-'.date('Ymd-His'); mkdir($bk); file_put_contents("$bk/$nid.html", $r['v']);
$pdo->beginTransaction();
$a = $pdo->prepare("UPDATE {$p}node__field_body SET field_body_value=? WHERE entity_id=? AND revision_id=? AND field_body_value=?"); $a->execute([$v, $nid, $r['revision_id'], $r['v']]);
$b = $pdo->prepare("UPDATE {$p}node_revision__field_body SET field_body_value=? WHERE entity_id=? AND revision_id=?"); $b->execute([$v, $nid, $r['revision_id']]);
if ($a->rowCount() !== 1 || $b->rowCount() !== 1) { $pdo->rollBack(); exit("FEIL: ingenting skrevet\n"); }
$pdo->commit(); echo "skrevet $nid (rev {$r['revision_id']}), backup $bk\n";
