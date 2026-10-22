<?php
declare(strict_types=1);
require_once $_SERVER['DOCUMENT_ROOT'].'/members/config.php';
require_once $_SERVER['DOCUMENT_ROOT'].'/includes/app-header.php';
require_once $_SERVER['DOCUMENT_ROOT'].'/includes/meta.php';
function rs_symbol_category(string $name): string {
  $groups=['Noter'=>['note','notehode'],'Pauser'=>['pause'],'Nøkler'=>['nøkkel'],'Fortegn'=>['kryss','b♭','oppløsningstegn'],'Takt og repetisjon'=>['taktstrek','startstrek','sluttstrek','repetisjon','vanlig takt','alla breve','coda','segno','da capo','dal segno','fine','volti','simile'],'Artikulasjon og ornamenter'=>['fermate','staccato','tenuto','aksent','marcato','bue','trill','omvending','mordent','schleifer','staccatissimo'],'Pust og pauser'=>['pustetegn','cesur'],'Dynamikk'=>['piano','forte','mezzo','crescendo','sforzando','rinforzando','niente'],'Tempo'=>['ritardando','rallentando','accelerando','stringendo','a tempo','rubato','mosso','largo','adagio','andante','moderato','allegro','presto'],'Oktavtegn'=>['oktav','kvintendels'],'Akkordsymboler'=>['dur','dim','sus','akkord','treklang','forstørret','tone'],'Strengeinstrumenter'=>['pizzicato','arco','bartók','sul tasto','ponticello','sordino','col legno','tremolo'],'Pedal og spilleteknikk'=>['pedal','una corda','tre corde'],'Notehoder og oppsett'=>['kryssnotehode','diamantnotehode','firkantnotehode','sirkelnotehode','klammer','system','bjelke'],'Andre symboler'=>['metronom','simile','rimshot','cross-stick','cymbal','generell midi']];
  $value=mb_strtolower($name,'UTF-8');
  foreach($groups as $category=>$needles) foreach($needles as $needle) if($value===$needle||(mb_strlen($needle,'UTF-8')>1&&str_contains($value,$needle))) return $category;
  return 'Andre symboler';
}
$symbols=[];$handle=fopen(__DIR__.'/music_symbols_master_no.csv','rb');
if($handle!==false){fgetcsv($handle,null,',','"','');while(($row=fgetcsv($handle,null,',','"',''))!==false){if(count($row)<3||trim((string)$row[1])==='')continue;$symbols[]=['symbol'=>trim((string)$row[0]),'name'=>trim((string)$row[1]),'explanation'=>rtrim(trim((string)$row[2]),'.').'.','category'=>rs_symbol_category(trim((string)$row[1]))];}fclose($handle);}
$categories=array_values(array_unique(array_column($symbols,'category')));
$h=static fn(string $v):string=>htmlspecialchars($v,ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8');
?>
<!doctype html><html lang="nb"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<?php rs_render_meta('Musikksymboler – søkbart oppslagsverk | Rockeskolen','Finn noter, pauser, nøkler, fortegn, dynamikk, akkordsymboler og andre musikksymboler med forklaringer.','https://rockeskolen.com/tools/symbols/'); ?>
<link rel="stylesheet" href="/includes/app-header.css?v=1"><link rel="stylesheet" href="./symbols.css?v=20260831-1">
<script src="https://unpkg.com/vexflow@4.2.5/build/cjs/vexflow.js"></script><script src="./symbols.js?v=20260831-1" defer></script></head>
<body><?php rs_render_app_header('tools'); ?><main class="symbols-page">
<header class="symbols-hero"><p class="eyebrow">Musikkteori · komplett oppslagsverk</p><h1>Musikksymboler</h1><p>Finn symbolet eller begrepet du lurer på, se hvordan det brukes i noter, og få en kort forklaring.</p></header>
<section class="symbol-search" aria-label="Søk og filtrering"><label for="symbol-query">Søk etter symbol eller begrep</label><div class="search-field"><span aria-hidden="true">⌕</span><input id="symbol-query" type="search" placeholder="Prøv «pause», «kryss», «akkord» eller «sterkt»" autocomplete="off"><button id="clear-search" type="button" hidden>Nullstill</button></div><div class="category-list" aria-label="Kategorier"><button type="button" class="is-active" data-category="alle">Alle</button><?php foreach($categories as $category): ?><button type="button" data-category="<?= $h($category) ?>"><?= $h($category) ?></button><?php endforeach; ?></div><p class="result-count" aria-live="polite"><strong id="visible-count"><?= count($symbols) ?></strong> oppslag</p></section>
<section id="symbol-grid" class="symbol-grid" aria-label="Musikksymboler"><?php foreach($symbols as $i=>$item): ?><article class="symbol-card" data-name="<?= $h(mb_strtolower($item['name'],'UTF-8')) ?>" data-description="<?= $h(mb_strtolower($item['explanation'],'UTF-8')) ?>" data-symbol="<?= $h($item['symbol']) ?>" data-category="<?= $h($item['category']) ?>"><div class="notation" data-symbol-index="<?= $i ?>" data-name="<?= $h($item['name']) ?>" data-symbol="<?= $h($item['symbol']) ?>" aria-hidden="true"><span class="unicode-fallback"><?= $h($item['symbol']) ?></span></div><div class="symbol-copy"><p class="category"><?= $h($item['category']) ?></p><h2><?= $h($item['name']) ?></h2><p><?= $h($item['explanation']) ?></p></div></article><?php endforeach; ?></section>
<div id="no-results" class="no-results" hidden><h2>Ingen symboler funnet</h2><p>Prøv et kortere søkeord eller velg «Alle».</p></div>
</main></body></html>
