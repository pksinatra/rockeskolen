<?php

declare(strict_types=1);

namespace Drupal\rs_kurs\Controller;

use Drupal\Core\Access\CsrfRequestHeaderAccessCheck;
use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\File\FileExists;
use Drupal\Core\File\FileSystemInterface;
use Drupal\Core\Link;
use Drupal\Core\Render\Markup;
use Drupal\Core\Url;
use Drupal\file\Entity\File;
use Drupal\rs_kurs\QuizStore;
use Drupal\user\Entity\User;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Where editors make tests and look up students' results.
 */
final class QuizAdminController extends ControllerBase {

  private const IMAGE_DIR = 'public://rs-tester';
  // Grenser for bilder: per fil, per side, per redaktør per døgn og for alle lærertestene til sammen.
  private const IMAGE_MAX = 3 * 1024 * 1024;
  private const IMAGE_MAX_SIDE = 4000;
  private const USER_DAY_MAX = 50 * 1024 * 1024;
  private const TOTAL_MAX = 1024 * 1024 * 1024;

  public function list(Request $request): array {
    $rows = [];
    foreach (QuizStore::all() as $quiz) {
      $rows[] = [
        Link::fromTextAndUrl($quiz['title'], Url::fromRoute('rs_kurs.quiz_edit', ['id' => $quiz['id']])),
        Markup::create('<code>' . $quiz['code'] . '</code>'),
        Link::fromTextAndUrl($request->getSchemeAndHttpHost() . '/test/' . $quiz['code'], Url::fromUserInput('/test/' . $quiz['code'])),
        count($quiz['questions']),
        $quiz['open'] ? $this->t('Åpen') : $this->t('Stengt'),
        Link::fromTextAndUrl($quiz['results'] . ' resultater', Url::fromRoute('rs_kurs.quiz_results', ['id' => $quiz['id']])),
      ];
    }
    return [
      'actions' => ['#markup' => Markup::create(
        '<p>Elevene åpner en test med lenken eller ved å skrive koden på <a href="/test">' . $request->getSchemeAndHttpHost() . '/test</a>. '
        . 'Resultatet lagres når eleven er logget inn.</p><p>'
        . Link::fromTextAndUrl('+ Ny test', Url::fromRoute('rs_kurs.quiz_add', [], ['attributes' => ['class' => ['button', 'button--primary']]]))->toString()
        . ' ' . Link::fromTextAndUrl('Finn elev', Url::fromRoute('rs_kurs.quiz_students', [], ['attributes' => ['class' => ['button']]]))->toString()
        . '</p>')],
      'table' => [
        '#type' => 'table',
        '#header' => ['Test', 'Kode', 'Lenke til elevene', 'Spørsmål', 'Status', 'Resultater'],
        '#rows' => $rows,
        '#empty' => 'Ingen tester ennå.',
      ],
      '#cache' => ['max-age' => 0],
    ];
  }

  public function edit(Request $request, ?string $id = NULL): array {
    $quiz = NULL;
    $results = 0;
    if ($id !== NULL) {
      $quiz = QuizStore::load((int) $id) ?? throw new NotFoundHttpException();
      $results = count(QuizStore::resultsForQuiz($quiz['id']));
    }
    return [
      '#markup' => Markup::create('<div id="rs-quiz-editor" class="rsq-editor"></div>'),
      '#attached' => [
        'library' => ['rs_kurs/quiz_editor'],
        'drupalSettings' => ['rsQuizEditor' => [
          'quiz' => $quiz,
          'results' => $results,
          'csrf' => \Drupal::csrfToken()->get(CsrfRequestHeaderAccessCheck::TOKEN_KEY),
          'saveUrl' => Url::fromRoute('rs_kurs.quiz_save')->toString(),
          'uploadUrl' => Url::fromRoute('rs_kurs.quiz_upload')->toString(),
          'listUrl' => Url::fromRoute('rs_kurs.quiz_admin')->toString(),
          'adminBase' => '/admin/content/tester/',
          'testBase' => $request->getSchemeAndHttpHost() . '/test/',
        ]],
      ],
      '#cache' => ['max-age' => 0],
    ];
  }

  public function results(string $id): array {
    $quiz = QuizStore::load((int) $id) ?? throw new NotFoundHttpException();
    $results = QuizStore::resultsForQuiz($quiz['id']);
    $users = User::loadMultiple(array_unique(array_map(static fn(array $r): int => (int) $r['uid'], $results)));
    $rows = [];
    foreach ($results as $r) {
      $rows[] = [
        $this->studentLink($users[$r['uid']] ?? NULL, (int) $r['uid']),
        $r['score'] . ' av ' . $r['total'],
        $this->marks($r['correct']),
        $this->date((int) $r['created']),
      ];
    }
    return [
      'intro' => ['#markup' => Markup::create('<h2>' . htmlspecialchars($quiz['title'], ENT_QUOTES) . '</h2><p>Kode <code>' . $quiz['code'] . '</code>. '
        . 'Hvert forsøk vises for seg, nyeste først. ✓ og ✗ viser spørsmålene i rekkefølge.</p><p>'
        . Link::fromTextAndUrl('Rediger testen', Url::fromRoute('rs_kurs.quiz_edit', ['id' => $quiz['id']]))->toString() . ' · '
        . Link::fromTextAndUrl('Alle tester', Url::fromRoute('rs_kurs.quiz_admin'))->toString() . '</p>')],
      'table' => [
        '#type' => 'table',
        '#header' => ['Elev', 'Riktige', 'Spørsmål', 'Levert'],
        '#rows' => $rows,
        '#empty' => 'Ingen resultater ennå.',
      ],
      '#cache' => ['max-age' => 0],
    ];
  }

  /**
   * Search for a student by name or e-mail address.
   */
  public function students(Request $request): array {
    $q = trim((string) $request->query->get('q', ''));
    $build = ['form' => ['#markup' => Markup::create(
      '<form method="get" class="rsq-search"><label for="rsq-q">Navn eller e-post</label> '
      . '<input id="rsq-q" name="q" class="form-text" value="' . htmlspecialchars($q, ENT_QUOTES) . '" minlength="2" required> '
      . '<button type="submit" class="button button--primary">Søk</button></form>')],
      '#cache' => ['max-age' => 0],
    ];
    if (mb_strlen($q) < 2) {
      return $build;
    }
    $storage = $this->entityTypeManager()->getStorage('user');
    $query = $storage->getQuery()->accessCheck(FALSE)->condition('uid', 0, '>')->range(0, 50)->sort('name');
    $or = $query->orConditionGroup()->condition('name', $q, 'CONTAINS')->condition('mail', $q, 'CONTAINS');
    $users = $storage->loadMultiple($query->condition($or)->execute());
    $counts = QuizStore::countForUsers(array_map('intval', array_keys($users)));
    $rows = [];
    foreach ($users as $user) {
      $rows[] = [$this->studentLink($user, (int) $user->id()), $user->getEmail(), (int) ($counts[$user->id()] ?? 0)];
    }
    $build['table'] = [
      '#type' => 'table',
      '#header' => ['Elev', 'E-post', 'Resultater'],
      '#rows' => $rows,
      '#empty' => 'Fant ingen brukere.',
    ];
    return $build;
  }

  public function student(string $uid): array {
    $user = User::load((int) $uid) ?? throw new NotFoundHttpException();
    $rows = [];
    foreach (QuizStore::resultsForUser((int) $user->id()) as $r) {
      $rows[] = [
        $r['title'] === NULL ? 'Slettet test' : Link::fromTextAndUrl($r['title'], Url::fromRoute('rs_kurs.quiz_results', ['id' => $r['quiz']])),
        $r['score'] . ' av ' . $r['total'],
        $this->marks($r['correct']),
        $this->date((int) $r['created']),
      ];
    }
    return [
      'intro' => ['#markup' => Markup::create('<h2>' . htmlspecialchars($user->getDisplayName(), ENT_QUOTES) . '</h2><p>'
        . htmlspecialchars((string) $user->getEmail(), ENT_QUOTES) . '</p><p>'
        . Link::fromTextAndUrl('Finn en annen elev', Url::fromRoute('rs_kurs.quiz_students'))->toString() . '</p>')],
      'table' => [
        '#type' => 'table',
        '#header' => ['Test', 'Riktige', 'Spørsmål', 'Levert'],
        '#rows' => $rows,
        '#empty' => 'Eleven har ikke levert noen tester.',
      ],
      '#cache' => ['max-age' => 0],
    ];
  }

  public function save(Request $request): JsonResponse {
    try {
      $body = json_decode($request->getContent(), TRUE, 8, JSON_THROW_ON_ERROR);
    }
    catch (\JsonException) {
      return $this->json(['error' => 'Ugyldige data.'], 400);
    }
    if (!is_array($body)) {
      return $this->json(['error' => 'Ugyldige data.'], 400);
    }
    $id = $body['id'] ?? NULL;
    if ($id !== NULL && (!is_int($id) || !QuizStore::load($id))) {
      return $this->json(['error' => 'Fant ikke testen.'], 404);
    }
    $checked = QuizStore::validate($body, function (int $fid): ?string {
      $file = File::load($fid);
      return $file && str_starts_with($file->getFileUri(), self::IMAGE_DIR . '/')
        ? \Drupal::service('file_url_generator')->generateString($file->getFileUri())
        : NULL;
    });
    if (isset($checked['error'])) {
      return $this->json(['error' => $checked['error']], 400);
    }
    return $this->json(['quiz' => QuizStore::save($id, $checked['quiz'], (int) $this->currentUser()->id())]);
  }

  /**
   * Stores an image for a question. Only PNG, JPEG, GIF and WebP up to 3 MB.
   */
  public function upload(Request $request): JsonResponse {
    $upload = $request->files->get('file');
    if (!$upload instanceof UploadedFile || !$upload->isValid()) {
      return $this->json(['error' => 'Fikk ikke tak i bildet.'], 400);
    }
    if ($upload->getSize() > self::IMAGE_MAX) {
      return $this->json(['error' => 'Bildet kan være høyst 3 MB.'], 400);
    }
    $info = @getimagesize($upload->getPathname());
    $ext = [IMAGETYPE_PNG => 'png', IMAGETYPE_JPEG => 'jpg', IMAGETYPE_GIF => 'gif', IMAGETYPE_WEBP => 'webp'][$info[2] ?? 0] ?? NULL;
    if ($ext === NULL) {
      return $this->json(['error' => 'Bruk et bilde i PNG, JPEG, GIF eller WebP.'], 400);
    }
    if ($info[0] > self::IMAGE_MAX_SIDE || $info[1] > self::IMAGE_MAX_SIDE) {
      return $this->json(['error' => 'Bildet kan være høyst ' . self::IMAGE_MAX_SIDE . ' piksler på hver side.'], 400);
    }
    // Samlet størrelse på bildene i lærertestene, eventuelt bare én brukers bilder fra et tidspunkt.
    $used = static function (?int $uid = NULL, int $since = 0): int {
      $db = \Drupal::database();
      $query = $db->select('file_managed', 'f')
        ->condition('uri', $db->escapeLike(self::IMAGE_DIR . '/') . '%', 'LIKE')
        ->condition('created', $since, '>=');
      if ($uid !== NULL) {
        $query->condition('uid', $uid);
      }
      $query->addExpression('COALESCE(SUM([filesize]), 0)');
      return (int) $query->execute()->fetchField();
    };
    if ($used((int) $this->currentUser()->id(), \Drupal::time()->getRequestTime() - 86400) + $upload->getSize() > self::USER_DAY_MAX) {
      return $this->json(['error' => 'Du har lastet opp 50 MB med bilder det siste døgnet. Prøv igjen senere.'], 429);
    }
    if ($used() + $upload->getSize() > self::TOTAL_MAX) {
      return $this->json(['error' => 'Lærertestene har nådd grensen på 1 GB med bilder. Slett gamle tester eller kontakt administrator.'], 507);
    }
    $dir = self::IMAGE_DIR;
    \Drupal::service('file_system')->prepareDirectory($dir, FileSystemInterface::CREATE_DIRECTORY | FileSystemInterface::MODIFY_PERMISSIONS);
    $file = \Drupal::service('file.repository')->writeData(
      (string) file_get_contents($upload->getPathname()),
      $dir . '/' . bin2hex(random_bytes(8)) . '.' . $ext,
      FileExists::Rename
    );
    return $this->json([
      'fid' => (int) $file->id(),
      'url' => \Drupal::service('file_url_generator')->generateString($file->getFileUri()),
    ]);
  }

  public function delete(string $id): JsonResponse {
    $quiz = QuizStore::load((int) $id) ?? throw new NotFoundHttpException();
    QuizStore::delete($quiz['id']);
    return $this->json(['deleted' => TRUE]);
  }

  private function studentLink(?User $user, int $uid): Link|string {
    return $user
      ? Link::fromTextAndUrl($user->getDisplayName(), Url::fromRoute('rs_kurs.quiz_student', ['uid' => $uid]))
      : 'Slettet bruker';
  }

  private function marks(string $correct): string {
    return strtr($correct, ['1' => '✓', '0' => '✗']);
  }

  private function date(int $time): string {
    return \Drupal::service('date.formatter')->format($time, 'short');
  }

  private function json(array $data, int $status = 200): JsonResponse {
    $response = new JsonResponse($data, $status);
    $response->headers->set('Cache-Control', 'private, no-store');
    return $response;
  }

}
