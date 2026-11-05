<?php require __DIR__.'/work.inc.php'; // php sect.php NODE "overskrift-start" [maks tegn]
[$_, $n, $w] = $argv; $max = (int)($argv[3] ?? 1500);
$v = file_get_contents($WORK."/nodes/$n.html");
$parts = preg_split("#(<h[234][^>]*>.*?</h[234]>)#s", $v, -1, PREG_SPLIT_DELIM_CAPTURE);
for ($i = 1; $i < count($parts); $i += 2) { $h = trim(html_entity_decode(strip_tags($parts[$i])));
  if (str_starts_with($h, $w)) { $b = str_replace(['</p>','<br>','</li>','</tr>','</td>','</th>'], ["\n","\n","\n","\n"," | "," | "], $parts[$i+1] ?? '');
    echo "== $n | $h\n", mb_substr(trim(preg_replace("#[ \t]+#", " ", preg_replace("#\n\s*\n+#", "\n", html_entity_decode(strip_tags($b))))), 0, $max), "\n\n"; } }
