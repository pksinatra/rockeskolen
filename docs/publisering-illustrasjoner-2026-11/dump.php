<?php require __DIR__.'/db.inc.php';
$ids = array_slice($argv,1);
foreach ($pdo->query("SELECT n.nid, n.title, b.field_body_value v FROM {$p}node_field_data n JOIN {$p}node__field_body b ON b.entity_id=n.nid WHERE n.nid IN (".implode(',',array_map('intval',$ids)).")") as $r) { @mkdir($WORK.'/nodes'); file_put_contents($WORK."/nodes/{$r['nid']}.html", $r['v']); echo "{$r['nid']} {$r['title']}\n"; }
