<?php

declare(strict_types=1);

namespace Drupal\rs_kurs;

/**
 * Packs and merges course progress. Merging only ever improves a row.
 */
final class ProgressMerge {

  public const NOT_ATTEMPTED = 255;
  public const MAX_LESSONS = 32;

  /**
   * Returns a scores string of exactly $lessons bytes.
   */
  public static function normalize(string $scores, int $lessons): string {
    $scores = substr($scores, 0, $lessons);
    return str_pad($scores, $lessons, chr(self::NOT_ATTEMPTED));
  }

  /**
   * Merges completed lessons and results into stored progress.
   *
   * @param array<int, int> $results
   *   Zero-based lesson index => result 0–100. Each one marks the lesson done.
   *
   * @return array{done: int, scores: string}
   */
  public static function merge(int $done, string $scores, array $results, int $lessons): array {
    $scores = self::normalize($scores, $lessons);
    foreach ($results as $index => $score) {
      $done |= 1 << $index;
      $old = ord($scores[$index]);
      if ($old === self::NOT_ATTEMPTED || $score > $old) {
        $scores[$index] = chr($score);
      }
    }
    return ['done' => $done, 'scores' => $scores];
  }

  /**
   * Merges a client bitmask and score list (from localStorage) into progress.
   *
   * A lesson counts only when its bit is set; a missing score then counts
   * as 100, since the client only stores a score for scored lessons.
   *
   * @return array{done: int, scores: string}
   */
  public static function mergeClient(int $done, string $scores, int $clientDone, array $clientScores, int $lessons, callable $allowed): array {
    $results = [];
    for ($i = 0; $i < $lessons; $i++) {
      if (!($clientDone & (1 << $i)) || !$allowed($i)) {
        continue;
      }
      $score = $clientScores[$i] ?? NULL;
      $results[$i] = self::isScore($score) ? (int) $score : 100;
    }
    return self::merge($done, $scores, $results, $lessons);
  }

  public static function isScore(mixed $value): bool {
    return is_int($value) && $value >= 0 && $value <= 100;
  }

  /**
   * @return array{done: int, scores: array<int, int|null>}
   */
  public static function toArray(int $done, string $scores, int $lessons): array {
    $scores = self::normalize($scores, $lessons);
    $list = [];
    for ($i = 0; $i < $lessons; $i++) {
      $value = ord($scores[$i]);
      $list[] = $value === self::NOT_ATTEMPTED ? NULL : $value;
    }
    return ['done' => $done & ((1 << $lessons) - 1), 'scores' => $list];
  }

}
