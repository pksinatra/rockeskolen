<?php

declare(strict_types=1);

namespace Drupal\rs_kurs;

/**
 * Reads, validates and writes editors' tests and students' results.
 */
final class QuizStore {

  private const QUIZ = 'rs_quiz';
  private const RESULT = 'rs_quiz_result';
  // No 0/O or 1/I/L, so the code is easy to read aloud and type.
  private const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  public const MAX_QUESTIONS = 50;
  public const MAX_IMAGES = 20;
  public const PLAY = ['none', 'melodic', 'harmonic'];
  // Spelled notes: letter, optional accidental, octave. Bb is B flat, never H.
  public const NOTE = '/^[A-G](##|#|bb|b)?[2-6]$/';

  public static function load(int $id): ?array {
    $row = \Drupal::database()->select(self::QUIZ, 'q')->fields('q')->condition('id', $id)->execute()->fetchAssoc();
    return $row ? self::row($row) : NULL;
  }

  public static function byCode(string $code): ?array {
    $row = \Drupal::database()->select(self::QUIZ, 'q')->fields('q')->condition('code', strtoupper($code))->execute()->fetchAssoc();
    return $row ? self::row($row) : NULL;
  }

  /**
   * All tests, newest first, with the number of results.
   */
  public static function all(): array {
    $db = \Drupal::database();
    $counts = $db->query('SELECT [quiz], COUNT(*) AS [n] FROM {' . self::RESULT . '} GROUP BY [quiz]')->fetchAllKeyed();
    $rows = $db->select(self::QUIZ, 'q')->fields('q')->orderBy('changed', 'DESC')->execute()->fetchAll(\PDO::FETCH_ASSOC);
    return array_map(static fn(array $row): array => self::row($row) + ['results' => (int) ($counts[$row['id']] ?? 0)], $rows);
  }

  /**
   * Saves a validated test and returns it. A new test gets a code.
   */
  public static function save(?int $id, array $quiz, int $uid): array {
    $db = \Drupal::database();
    $now = \Drupal::time()->getRequestTime();
    $fields = [
      'title' => $quiz['title'],
      'intro' => $quiz['intro'],
      'open' => $quiz['open'] ? 1 : 0,
      'data' => json_encode($quiz['questions'], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
      'changed' => $now,
    ];
    if ($id) {
      $db->update(self::QUIZ)->fields($fields)->condition('id', $id)->execute();
      return self::load($id);
    }
    do {
      $code = '';
      for ($k = 0; $k < 6; $k++) {
        $code .= self::CODE_CHARS[random_int(0, strlen(self::CODE_CHARS) - 1)];
      }
    } while ($db->select(self::QUIZ, 'q')->condition('code', $code)->countQuery()->execute()->fetchField());
    $id = (int) $db->insert(self::QUIZ)->fields($fields + ['code' => $code, 'uid' => $uid, 'created' => $now])->execute();
    return self::load($id);
  }

  public static function delete(int $id): void {
    $db = \Drupal::database();
    $db->delete(self::RESULT)->condition('quiz', $id)->execute();
    $db->delete(self::QUIZ)->condition('id', $id)->execute();
  }

  /**
   * @param bool[] $correct One entry per question.
   */
  public static function addResult(int $quiz, int $uid, array $correct): void {
    \Drupal::database()->insert(self::RESULT)->fields([
      'quiz' => $quiz,
      'uid' => $uid,
      'score' => count(array_filter($correct)),
      'total' => count($correct),
      'correct' => implode('', array_map(static fn(bool $ok): string => $ok ? '1' : '0', $correct)),
      'created' => \Drupal::time()->getRequestTime(),
    ])->execute();
  }

  public static function resultsForQuiz(int $quiz): array {
    return \Drupal::database()->select(self::RESULT, 'r')->fields('r')
      ->condition('quiz', $quiz)->orderBy('created', 'DESC')->execute()->fetchAll(\PDO::FETCH_ASSOC);
  }

  public static function resultsForUser(int $uid): array {
    $query = \Drupal::database()->select(self::RESULT, 'r')->fields('r');
    $query->leftJoin(self::QUIZ, 'q', '[q].[id] = [r].[quiz]');
    $query->addField('q', 'title');
    $query->addField('q', 'code');
    return $query->condition('r.uid', $uid)->orderBy('r.created', 'DESC')->execute()->fetchAll(\PDO::FETCH_ASSOC);
  }

  /**
   * Number of results per user, for the student search.
   *
   * @param int[] $uids
   */
  public static function countForUsers(array $uids): array {
    if (!$uids) {
      return [];
    }
    return \Drupal::database()->query('SELECT [uid], COUNT(*) FROM {' . self::RESULT . '} WHERE [uid] IN (:uids[]) GROUP BY [uid]', [':uids[]' => $uids])->fetchAllKeyed();
  }

  public static function deleteUser(int $uid): void {
    \Drupal::database()->delete(self::RESULT)->condition('uid', $uid)->execute();
  }

  /**
   * Checks a test from the editor and returns it in stored form.
   *
   * @param callable(int): ?string $imageUrl
   *   Returns the URL of an uploaded test image, or NULL if the file is unknown.
   *
   * @return array{quiz?: array, error?: string}
   */
  public static function validate(array $input, callable $imageUrl): array {
    $text = static fn($value): string => is_string($value) ? trim(str_replace("\r\n", "\n", $value)) : '';
    $title = $text($input['title'] ?? '');
    $intro = $text($input['intro'] ?? '');
    if ($title === '' || mb_strlen($title) > 200) {
      return ['error' => 'Testen må ha en tittel på høyst 200 tegn.'];
    }
    if (mb_strlen($intro) > 2000) {
      return ['error' => 'Innledningen kan ha høyst 2000 tegn.'];
    }
    $questions = $input['questions'] ?? NULL;
    if (!is_array($questions) || !array_is_list($questions) || !$questions || count($questions) > self::MAX_QUESTIONS) {
      return ['error' => 'Testen må ha fra 1 til ' . self::MAX_QUESTIONS . ' spørsmål.'];
    }
    if (count(array_filter($questions, static fn($q): bool => is_array($q) && is_array($q['image'] ?? NULL))) > self::MAX_IMAGES) {
      return ['error' => 'En test kan ha høyst ' . self::MAX_IMAGES . ' bilder.'];
    }
    $out = [];
    foreach ($questions as $k => $q) {
      $n = 'Spørsmål ' . ($k + 1) . ': ';
      if (!is_array($q)) {
        return ['error' => $n . 'ugyldig.'];
      }
      $type = ($q['type'] ?? '') === 'truefalse' ? 'truefalse' : 'choice';
      $question = $text($q['text'] ?? '');
      if ($question === '' || mb_strlen($question) > 500) {
        return ['error' => $n . 'skriv spørsmålet (høyst 500 tegn).'];
      }
      if ($type === 'truefalse') {
        $options = ['Sant', 'Usant'];
      }
      else {
        $options = is_array($q['options'] ?? NULL) ? array_map($text, array_values($q['options'])) : [];
        if (count($options) < 2 || count($options) > 6) {
          return ['error' => $n . 'flervalg må ha fra 2 til 6 svar.'];
        }
        foreach ($options as $option) {
          if ($option === '' || mb_strlen($option) > 200) {
            return ['error' => $n . 'alle svarene må fylles ut (høyst 200 tegn).'];
          }
        }
        if (count(array_unique($options)) !== count($options)) {
          return ['error' => $n . 'to svar er like.'];
        }
      }
      $right = $q['right'] ?? NULL;
      if (!is_int($right) || $right < 0 || $right >= count($options)) {
        return ['error' => $n . 'velg hvilket svar som er riktig.'];
      }
      $image = NULL;
      if (is_array($q['image'] ?? NULL)) {
        $fid = $q['image']['fid'] ?? NULL;
        $url = is_int($fid) ? $imageUrl($fid) : NULL;
        if ($url === NULL) {
          return ['error' => $n . 'bildet finnes ikke lenger. Last det opp på nytt.'];
        }
        $image = ['fid' => $fid, 'url' => $url, 'alt' => mb_substr($text($q['image']['alt'] ?? ''), 0, 200)];
      }
      $notes = preg_split('/\s+/', $text($q['notes'] ?? ''), -1, PREG_SPLIT_NO_EMPTY);
      if (count($notes) > 8) {
        return ['error' => $n . 'bruk høyst 8 toner.'];
      }
      foreach ($notes as $note) {
        if (!preg_match(self::NOTE, $note)) {
          return ['error' => $n . '«' . $note . '» er ikke et tonenavn. Skriv for eksempel C4, F#4 eller Bb3.'];
        }
      }
      $play = $q['play'] ?? 'none';
      $play = in_array($play, self::PLAY, TRUE) ? $play : 'none';
      $staff = ($q['staff'] ?? FALSE) === TRUE;
      if (!$notes) {
        $play = 'none';
        $staff = FALSE;
      }
      if ($staff) {
        foreach ($notes as $note) {
          if (!self::onTrebleStaff($note)) {
            return ['error' => $n . 'notelinjen med G-nøkkel viser toner fra G3 til C6. ' . $note . ' ligger utenfor.'];
          }
        }
      }
      $out[] = [
        'type' => $type,
        'text' => $question,
        'options' => $options,
        'right' => $right,
        'image' => $image,
        'notes' => implode(' ', $notes),
        'play' => $play,
        'staff' => $staff,
      ];
    }
    return ['quiz' => ['title' => $title, 'intro' => $intro, 'open' => ($input['open'] ?? TRUE) !== FALSE, 'questions' => $out]];
  }

  /**
   * Which answers are right. $answers has one option index (or NULL) per question.
   *
   * @return bool[]|null
   *   NULL if the answers do not fit the test.
   */
  public static function check(array $questions, mixed $answers): ?array {
    if (!is_array($answers) || !array_is_list($answers) || count($answers) !== count($questions)) {
      return NULL;
    }
    $correct = [];
    foreach ($questions as $k => $q) {
      $answer = $answers[$k];
      if ($answer !== NULL && (!is_int($answer) || $answer < 0 || $answer >= count($q['options']))) {
        return NULL;
      }
      $correct[] = $answer === $q['right'];
    }
    return $correct;
  }

  /**
   * The letter's place on the staff, counted from G3, must lie between G3 and C6.
   */
  private static function onTrebleStaff(string $note): bool {
    $step = strpos('CDEFGAB', $note[0]) + 7 * (int) substr($note, -1);
    return $step >= 4 + 7 * 3 && $step <= 7 * 6;
  }

  private static function row(array $row): array {
    return [
      'id' => (int) $row['id'],
      'code' => $row['code'],
      'title' => $row['title'],
      'intro' => $row['intro'],
      'open' => (bool) $row['open'],
      'questions' => json_decode($row['data'], TRUE) ?: [],
      'uid' => (int) $row['uid'],
      'created' => (int) $row['created'],
      'changed' => (int) $row['changed'],
    ];
  }

}
