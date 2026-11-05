<?php require __DIR__.'/db.inc.php';
// Musikk i praksis – Utgivelse, Rettigheter og Markedsføring (node 235–243): setter inn SVG-figurene fra figurer-mip/figurer.json foran bestemte overskrifter. "apply" skriver.
$apply = ($argv[1] ?? '') === 'apply';
$figs = json_decode(file_get_contents(dirname(__DIR__).'/figurer-musikk-i-praksis-2026-11/figurer.json'), true);
$e = fn($s) => htmlspecialchars($s, ENT_QUOTES);
$ids = array_values(array_unique(array_column($figs, 'node')));
$bodies = [];
foreach ($pdo->query("SELECT entity_id, revision_id, field_body_value v FROM {$p}node__field_body WHERE entity_id IN (".implode(',', $ids).")") as $r) $bodies[$r['entity_id']] = $r;
$bk = $WORK.'/drupal-backup-utgivelse-'.date('Ymd-His'); @mkdir($bk);
$new = [];
foreach ($bodies as $nid => $r) { file_put_contents("$bk/$nid.html", $r['v']); $new[$nid] = $r['v']; if (strpos($r['v'], 'images/musikk-i-praksis/') !== false) exit("FEIL: $nid har allerede figurer\n"); }
foreach ($figs as $f) {
  $nid = $f['node'];
  $html = '<figure class="rs-figur"><a href="'.$f['url'].'" target="_blank" rel="noopener"><img src="'.$f['url'].'" alt="'.$e($f['alt']).'" width="'.$f['width'].'" height="'.$f['height'].'" loading="lazy"></a><figcaption>'.$e($f['caption']).'</figcaption></figure>';
  preg_match_all('#<h([234])[^>]*>.*?</h\1>#s', $new[$nid], $m, PREG_OFFSET_CAPTURE);
  $hits = array_values(array_filter($m[0], fn($x) => mb_strpos(trim(html_entity_decode(strip_tags($x[0]))), $f['where']) === 0));
  if (count($hits) !== 1) exit("FEIL: $nid fant «{$f['where']}» ".count($hits)." ganger\n");
  $at = $hits[0][1];
  $new[$nid] = substr($new[$nid], 0, $at).$html.substr($new[$nid], $at);
  printf("%d  %-22s før «%s»\n", $nid, $f['file'], $f['where']);
}
foreach ($new as $nid => $v) file_put_contents("$bk/$nid.new.html", $v);
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
