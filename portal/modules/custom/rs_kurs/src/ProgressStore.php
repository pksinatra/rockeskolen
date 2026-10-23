<?php

declare(strict_types=1);

namespace Drupal\rs_kurs;

/**
 * Reads and writes rs_course_progress.
 */
final class ProgressStore {

  private const TABLE = 'rs_course_progress';

  /**
   * @return array{done: int, scores: string}
   */
  public static function load(int $uid, int $course): array {
    $row = \Drupal::database()->select(self::TABLE, 'p')
      ->fields('p', ['done', 'scores'])
      ->condition('uid', $uid)
      ->condition('course', $course)
      ->execute()
      ->fetchAssoc();
    return $row ? ['done' => (int) $row['done'], 'scores' => (string) $row['scores']] : ['done' => 0, 'scores' => ''];
  }

  /**
   * Applies $merge to the stored row inside a locked transaction.
   *
   * @param callable(int, string): array{done: int, scores: string} $merge
   *
   * @return array{done: int, scores: string}
   */
  public static function update(int $uid, int $course, callable $merge): array {
    $db = \Drupal::database();
    $transaction = $db->startTransaction();
    $row = $db->query(
      'SELECT [done], [scores] FROM {' . self::TABLE . '} WHERE [uid] = :uid AND [course] = :course FOR UPDATE',
      [':uid' => $uid, ':course' => $course]
    )->fetchAssoc();
    $old = $row ? ['done' => (int) $row['done'], 'scores' => (string) $row['scores']] : ['done' => 0, 'scores' => ''];
    $new = $merge($old['done'], $old['scores']);
    if (!$row || $new !== $old) {
      $db->merge(self::TABLE)
        ->keys(['uid' => $uid, 'course' => $course])
        ->fields(['done' => $new['done'], 'scores' => $new['scores'], 'updated' => \Drupal::time()->getRequestTime()])
        ->execute();
    }
    unset($transaction);
    return $new;
  }

  public static function deleteUser(int $uid): void {
    \Drupal::database()->delete(self::TABLE)->condition('uid', $uid)->execute();
  }

}
