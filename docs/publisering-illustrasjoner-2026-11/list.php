<?php require __DIR__.'/db.inc.php';
$terms=[]; foreach($pdo->query("SELECT tid,name,vid FROM {$p}taxonomy_term_field_data") as $r) $terms[$r['tid']]=$r['name'];
$q="SELECT n.nid,n.type,n.title,n.status,
 (SELECT GROUP_CONCAT(field_musikkteori_target_id) FROM {$p}node__field_musikkteori m WHERE m.entity_id=n.nid) mt,
 (SELECT GROUP_CONCAT(field_praksis_target_id) FROM {$p}node__field_praksis m WHERE m.entity_id=n.nid) pr,
 (SELECT GROUP_CONCAT(field_artikkelserie_target_id) FROM {$p}node__field_artikkelserie m WHERE m.entity_id=n.nid) se,
 (SELECT field_delnummer_value FROM {$p}node__field_delnummer m WHERE m.entity_id=n.nid) del,
 COALESCE((SELECT field_body_value FROM {$p}node__field_body b WHERE b.entity_id=n.nid),(SELECT body_value FROM {$p}node__body b WHERE b.entity_id=n.nid),'') body
 FROM {$p}node_field_data n WHERE n.type IN ('musikkteori','musikk_i_praksis') ORDER BY n.type, mt, se, del, n.nid";
$tn=fn($s)=>$s?implode('/',array_map(fn($x)=>$terms[$x]??$x,explode(',',$s))):'-';
foreach($pdo->query($q) as $r){
 $b=$r['body']; file_put_contents($WORK."/nodes/{$r['nid']}.html",$b);
 preg_match_all('#<iframe[^>]*src="([^"]+)"#',$b,$if); preg_match_all('#<img[^>]*src="([^"]+)"#',$b,$im);
 $tl=preg_match_all('#\[[a-z_]+[^\]]*\]#',$b,$sc);
 printf("%d|%s|%s|%s|%s|del%s|%dch|if:%s|img:%s|sc:%s\n",$r['nid'],$r['status']?'':'UPUB',$r['title'],$tn($r['mt'].$r['pr']),$tn($r['se']),$r['del'],strlen(strip_tags($b)),
  implode(',',array_map(fn($u)=>preg_replace('#https?://[^/]+#','',$u),$if[1])),implode(',',array_map('basename',$im[1])),implode(',',array_unique($sc[0])));
}
