<?php require __DIR__.'/db.inc.php';
// Skalaer (node 17, 154–161, 222–228): bytter de lyse skala-, piano- og akkord/skala-boksene med mørke mode.php-visninger. "apply" skriver.
$apply = ($argv[1] ?? '') === 'apply';
$nodes = [17, 154, 155, 156, 157, 158, 159, 160, 161, 222, 223, 224, 225, 226, 227, 228];
$src = fn($q) => 'https://rockeskolen.com/embed/mode.php?lang=no&amp;'.str_replace('&', '&amp;', $q);
$fr = fn($q, $h, $t) => '<iframe style="background-color:#0b0b10;border-width:0;display:block;" src="'.$src($q).'" width="100%" height="'.$h.'" title="'.htmlspecialchars($t).'" loading="lazy"></iframe>';
$big = fn($q, $h, $t) => '<figure class="rs-figur">'.$fr($q, $h, $t).'</figure>';
$wid = fn($q, $h, $t) => '<aside class="rs-widget">'.$fr($q, $h, $t).'</aside>';

$TYPE = ['major' => 'major', 'nat_minor' => 'minor', 'harm_minor' => 'harmonic_minor', 'mel_minor' => 'melodic_minor', 'pent_blues' => 'minor_blues',
  'major_pent' => 'major_pent', 'minor_pent' => 'minor_pent', 'whole_tone' => 'whole_tone', 'half_whole_dim' => 'half_whole_dim', 'whole_half_dim' => 'whole_half_dim',
  'dorian' => 'dorian', 'phrygian' => 'phrygian', 'lydian' => 'lydian', 'mixolydian' => 'mixolydian', 'locrian' => 'locrian'];
// Kirketoneart-artiklene bruker modusnavnet for hovedskalaen.
$MODE = [222 => ['major', 'ionian&mark=none'], 227 => ['minor', 'aeolian']];
$CHORD = ['C3,E3,G3' => 'C', 'A3,C4,E4' => 'Am', 'D3,F3,A3' => 'Dm', 'E3,G3,B3' => 'Em', 'F3,A3,C4' => 'F', 'F3,A3,C4,E4,B4' => 'Fmaj7%2311',
  'G3,B3,D4' => 'G', 'G2,B2,D3,F3' => 'G7', 'B3,D4,F4' => 'Bdim', 'B2,D3,F3,A3' => 'Bm7b5'];
$MAIN = [154 => 'C:major', 155 => 'A:minor', 156 => 'A:harmonic_minor', 157 => 'A:melodic_minor', 222 => 'C:ionian&mark=none', 223 => 'D:dorian',
  224 => 'E:phrygian', 225 => 'F:lydian', 226 => 'G:mixolydian', 227 => 'A:aeolian', 228 => 'B:locrian'];
$NAME = ['major' => '%s-dur', 'minor' => '%s-moll', 'harmonic_minor' => 'harmonisk %s-moll', 'melodic_minor' => 'melodisk %s-moll', 'minor_blues' => '%s-bluesskala',
  'major_pent' => '%s dur-pentatonisk', 'minor_pent' => '%s moll-pentatonisk', 'whole_tone' => '%s heltoneskala', 'half_whole_dim' => '%s halv–hel dim', 'whole_half_dim' => '%s hel–halv dim',
  'dorian' => '%s-dorisk', 'phrygian' => '%s-frygisk', 'lydian' => '%s-lydisk', 'mixolydian' => '%s-mixolydisk', 'locrian' => '%s-lokrisk', 'ionian' => '%s-jonisk', 'aeolian' => '%s-eolisk'];
$VIEWT = ['staff' => ' på noter', 'keys' => ' på piano', 'steps' => ': hel- og halvtonetrinn'];

$re = '#<p[^>]*>\s*(?:🎧\s*)?(?:<(?:strong|em)[^>]*>)?\s*<iframe[^>]*src="https://(?:www\.)?rockeskolen\.com/tools/(?<k>notes/embed|notes/chordscale|scales/piano/include)\.php\?(?<q>[^"]+)"[^>]*>\s*</iframe>\s*(?:</(?:strong|em)>)?\s*</p>#u';
// Node 223: D-moll og D-dorisk på to små pianoer i samme avsnitt blir én sammenligning.
$pair = '#<p[^>]*>\s*<iframe[^>]*scales/piano/include\.php\?root=D&amp;scale=nat_minor[^>]*>\s*</iframe>\s*<iframe[^>]*scales/piano/include\.php\?root=D&amp;scale=dorian[^>]*>\s*</iframe>\s*</p>#';
$bodies = [];
foreach ($pdo->query("SELECT entity_id, revision_id, field_body_value v FROM {$p}node__field_body WHERE entity_id IN (".implode(',', $nodes).")") as $r) $bodies[$r['entity_id']] = $r;
$bk = $WORK.'/drupal-backup-skala-'.date('Ymd-His'); @mkdir($bk);
$new = [];
foreach ($nodes as $nid) {
  $v = $bodies[$nid]['v']; file_put_contents("$bk/$nid.html", $v);
  if ($nid === 223) {
    if (preg_match_all($pair, $v) !== 1) exit("FEIL: 223 pianopar\n");
    $v = preg_replace($pair, $big('scales=D:minor,D:dorian&mark=diff', 700, 'D-moll og D-dorisk'), $v);
    echo "223  pianopar          -> full  scales=D:minor,D:dorian&mark=diff\n";
  }
  preg_match_all($re, $v, $m, PREG_SET_ORDER | PREG_OFFSET_CAPTURE);
  // 1. Tolk hver boks.
  $items = [];
  foreach ($m as $x) {
    parse_str(html_entity_decode($x['q'][0]), $a);
    $it = ['raw' => $x[0][0], 'off' => $x[0][1], 'kind' => $x['k'][0], 'a' => $a];
    if ($x['k'][0] === 'notes/chordscale') {
      $it['chord'] = $CHORD[$a['chord']] ?? null;
      $it['title'] = $a['title'];
      if ($it['title'] === 'F-dur med tonen B') $it['q'] = 'sets='.rawurlencode('F-dur med B').'|F4-A4-B4*-C5&chord=F&title='.rawurlencode($a['title']);
      else $it['q'] = 'scales='.$MAIN[$nid].'&chord='.$it['chord'].($nid === 157 ? '&dir=both' : '').'&title='.rawurlencode($a['title']);
      $it['view'] = 'full';
    } else {
      $type = $TYPE[$a['type'] ?? $a['scale']] ?? exit("FEIL: ukjent skala i $nid\n");
      if (isset($MODE[$nid]) && $type === $MODE[$nid][0]) $type = $MODE[$nid][1];
      $it['scale'] = $a['root'].':'.$type;
      $it['out'] = $x['k'][0] === 'scales/piano/include' ? 'piano' : $a['output'];
      $it['dir'] = $type === 'melodic_minor' || ($a['direction'] ?? '') === 'both' ? 'both' : 'up';
    }
    $items[] = $it;
  }
  if (!$items) exit("FEIL: ingen bokser i $nid\n");
  // 2. Velg visning. Uten egen stor illustrasjon blir notelinjen stor; pianoet blir da trinnvisning.
  $hasFull = (bool) array_filter($items, fn($i) => $i['kind'] === 'notes/chordscale' || ($i['out'] ?? '') === 'both');
  $fullScales = [];
  foreach ($items as &$it) {
    if (isset($it['view'])) continue;
    if ($it['out'] === 'both' || ($it['out'] === 'notation' && !$hasFull)) { $it['view'] = 'full'; $fullScales[] = $it['scale']; }
    elseif ($it['out'] === 'notation') $it['view'] = 'staff';
    else $it['view'] = in_array($it['scale'], $fullScales) ? 'steps' : 'keys';
  }
  unset($it);
  // 3. Spørring; identiske widgets i samme artikkel blir trinnvisning.
  $seen = [];
  foreach ($items as &$it) {
    if (!isset($it['q'])) {
      $mk = fn($view) => 'scales='.$it['scale'].($view === 'full' ? '' : '&view='.$view).($it['dir'] === 'both' ? '&dir=both' : '');
      $it['q'] = $mk($it['view']);
      if (in_array($it['q'], $seen)) { $it['view'] = $it['view'] === 'steps' ? 'keys' : 'steps'; $it['q'] = $mk($it['view']); }
    }
    $seen[] = $it['q'];
    [$root, $type] = isset($it['scale']) ? explode(':', preg_replace('/&.*/', '', $it['scale'])) : [null, null];
    $name = $it['title'] ?? sprintf($NAME[$type], $root);
    $title = isset($it['title']) ? $name : $name.($VIEWT[$it['view']] ?? ' på noter og piano');
    $h = ['full' => isset($it['chord']) || isset($it['title']) ? 760 : ($it['dir'] === 'both' ? 700 : 660), 'staff' => 170, 'keys' => 215, 'steps' => 230][$it['view']];
    $it['new'] = $it['view'] === 'full' ? $big($it['q'], $h, $title) : $wid($it['q'], $h, $title);
    printf("%d  %-17s %-9s -> %-5s %s\n", $nid, $it['kind'], $it['out'] ?? 'akkord', $it['view'], $it['q']);
  }
  unset($it);
  // 4. Bytt bakfra, så forskyvningene stemmer.
  foreach (array_reverse($items) as $it) $v = substr_replace($v, $it['new'], $it['off'], strlen($it['raw']));
  $left = preg_match_all('#tools/(notes/embed|notes/chordscale|scales/piano/include)\.php#', $v);
  if ($left) exit("FEIL: $nid har $left gamle bokser igjen\n");
  echo "node $nid: gamle igjen=$left, mode.php=", substr_count($v, 'embed/mode.php'), "\n";
  file_put_contents("$bk/$nid.new.html", $v);
  $new[$nid] = $v;
}
if (!$apply) { echo "Tørrkjøring. Filer: $bk\n"; exit; }
$pdo->beginTransaction();
foreach ($new as $nid => $v) {
  if ($v === $bodies[$nid]['v']) continue;
  $rev = $bodies[$nid]['revision_id'];
  $a = $pdo->prepare("UPDATE {$p}node__field_body SET field_body_value=? WHERE entity_id=? AND revision_id=? AND field_body_value=?"); $a->execute([$v, $nid, $rev, $bodies[$nid]['v']]);
  $b = $pdo->prepare("UPDATE {$p}node_revision__field_body SET field_body_value=? WHERE entity_id=? AND revision_id=?"); $b->execute([$v, $nid, $rev]);
  if ($a->rowCount() !== 1 || $b->rowCount() !== 1) { $pdo->rollBack(); exit("FEIL: $nid endret underveis; ingenting skrevet\n"); }
  echo "skrevet $nid (rev $rev)\n";
}
$pdo->commit(); echo "Backup: $bk\n";
