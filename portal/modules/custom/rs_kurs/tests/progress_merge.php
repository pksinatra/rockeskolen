<?php
declare(strict_types=1);

require dirname(__DIR__) . '/src/ProgressMerge.php';

use Drupal\rs_kurs\ProgressMerge;

$failures = [];
$assertSame = static function (mixed $expected, mixed $actual, string $label) use (&$failures): void {
    if ($expected !== $actual) {
        $failures[] = $label . ': expected ' . var_export($expected, true)
            . ', got ' . var_export($actual, true);
    }
};
$view = static fn(array $row): array => ProgressMerge::toArray($row['done'], $row['scores'], 4);

$row = ProgressMerge::merge(0, '', [0 => 100], 4);
$assertSame(['done' => 1, 'scores' => [100, null, null, null]], $view($row), 'First lesson');
$assertSame(4, strlen($row['scores']), 'One byte per lesson');

$row = ProgressMerge::merge($row['done'], $row['scores'], [3 => 80], 4);
$assertSame(['done' => 9, 'scores' => [100, null, null, 80]], $view($row), 'Fourth lesson');

$row = ProgressMerge::merge($row['done'], $row['scores'], [3 => 60], 4);
$assertSame([100, null, null, 80], $view($row)['scores'], 'Worse result never overwrites');

$row = ProgressMerge::merge($row['done'], $row['scores'], [3 => 0], 4);
$assertSame([100, null, null, 80], $view($row)['scores'], 'Zero never overwrites');

$row = ProgressMerge::merge($row['done'], $row['scores'], [3 => 100], 4);
$assertSame([100, null, null, 100], $view($row)['scores'], 'Better result wins');

$fresh = ProgressMerge::merge(0, '', [1 => 0], 4);
$assertSame([null, 0, null, null], $view($fresh)['scores'], 'Zero is a result, not 255');

$allowed = static fn(int $i): bool => $i === 0;
$synced = ProgressMerge::mergeClient(0, '', 0b0011, [null, 90], 4, $allowed);
$assertSame(['done' => 1, 'scores' => [100, null, null, null]], $view($synced), 'Sync skips lessons the user cannot see');

$synced = ProgressMerge::mergeClient(1, chr(100) . "\xFF\xFF\xFF", 0b1010, [null, 40, null, 'x'], 4, static fn(): bool => true);
$assertSame(['done' => 11, 'scores' => [100, 40, null, 100]], $view($synced), 'Sync ORs done and fills missing scores');

$synced = ProgressMerge::mergeClient(1, chr(100) . "\xFF\xFF\xFF", 0, [50, 50], 4, static fn(): bool => true);
$assertSame(['done' => 1, 'scores' => [100, null, null, null]], $view($synced), 'Scores without done bit are ignored');

$assertSame(['done' => 15, 'scores' => [null, null, null, null]], ProgressMerge::toArray(0xFFFF, '', 4), 'Done bits beyond the course are masked');

foreach ([0, 100, 55] as $ok) {
    $assertSame(true, ProgressMerge::isScore($ok), "Score $ok");
}
foreach ([-1, 101, 50.0, '50', null] as $bad) {
    $assertSame(false, ProgressMerge::isScore($bad), 'Score ' . var_export($bad, true));
}

if ($failures) {
    fwrite(STDERR, implode(PHP_EOL, $failures) . PHP_EOL);
    exit(1);
}
echo "OK\n";
