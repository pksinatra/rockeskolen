<?php
// Monsterprøven-embed for artikler i musikkportalen. Viser én delprøve med ?delprove=<slug>
// (toner, notelesing, intervaller, akkorder, skalaer, noteverdier, pauser). Selve spillet ligger i /tools/games/monsterproven/.
$_GET['embed'] = '1';
require $_SERVER['DOCUMENT_ROOT'] . '/tools/games/monsterproven/index.php';
