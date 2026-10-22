<?php
namespace Symfony\Component\EventDispatcher { interface EventSubscriberInterface {} }
namespace {
define('DRUPAL_ROOT','/private/tmp/rs-portal-preview/portal');
require '/Users/pk/Documents/Codex/rockeskolen/docs/chordprog-portal-2026-09-28/release/CanonicalResponseSubscriber.php';
$c = new \Drupal\rockeskolen_structure_qa\EventSubscriber\CanonicalResponseSubscriber();
$m = new ReflectionMethod($c,'renderToolCatalog');
$front = $m->invoke($c,'Test','Åpne',true);
$tools = $m->invoke($c,'Test','Åpne',false);
if (substr_count($front,'<h3>ChordFlow</h3>')!==1 || str_contains($front,'<h3>Kvintsirkelen</h3>')) throw new Exception('Front card replacement failed');
if (!str_contains($tools,'<h3>Kvintsirkelen</h3>') || !str_contains($tools,'https://rockeskolen.com/tools/chordprog/')) throw new Exception('Tools catalogue regression');
if (str_contains($tools,'rockeskolen.comhttps:')) throw new Exception('Malformed URL');
echo "Front: one ChordFlow, no fifths card; tools: fifths retained, local ChordProg URL valid.\n";

}
