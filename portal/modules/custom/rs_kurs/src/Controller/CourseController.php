<?php

declare(strict_types=1);

namespace Drupal\rs_kurs\Controller;

use Drupal\Core\Access\CsrfRequestHeaderAccessCheck;
use Drupal\Core\Controller\ControllerBase;
use Drupal\rs_kurs\CourseAccess;
use Drupal\rs_kurs\CoursePage;
use Drupal\rs_kurs\CourseRegistry;
use Drupal\rs_kurs\ProgressMerge;
use Drupal\rs_kurs\ProgressStore;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Serves the course apps, their lessons and the progress API.
 */
final class CourseController extends ControllerBase {

  /**
   * Renders the course shell. Lesson code is loaded per lesson.
   */
  public function page(string $slug): Response {
    $course = CourseRegistry::bySlug($slug) ?? throw new NotFoundHttpException();
    $account = $this->currentUser();
    $lessons = [];
    foreach ($course['lessons'] as $index => $lesson) {
      $lessons[] = $lesson + ['open' => CourseAccess::canViewLesson($account, $index)];
    }
    $here = '/kurs/' . $course['slug'];
    $config = [
      'id' => $course['id'],
      'slug' => $course['slug'],
      'storage' => $course['storage'],
      'lessons' => $lessons,
      'loggedIn' => $account->isAuthenticated(),
      'uid' => (int) $account->id(),
      'csrf' => $account->isAuthenticated() ? \Drupal::csrfToken()->get(CsrfRequestHeaderAccessCheck::TOKEN_KEY) : '',
      'api' => '/api/kurs/' . $course['id'] . '/progress',
      'lessonUrl' => $here . '/leksjon/',
      'loginUrl' => '/user/login?destination=' . rawurlencode($here),
      'vipUrl' => 'https://rockeskolen.com/members/upgrade.php?destination=' . rawurlencode($here),
    ];
    $base = base_path() . $this->moduleHandler()->getModule('rs_kurs')->getPath() . '/assets/';
    $html = CoursePage::html($course, $config, $base, is_file(DRUPAL_ROOT . $base . $course['slug'] . '.js'));

    return new Response($html, 200, [
      'Content-Type' => 'text/html; charset=utf-8',
      'Cache-Control' => 'private, no-store',
    ]);
  }

  /**
   * Sends one lesson's code, but only to users who may see it.
   */
  public function lessonScript(string $slug, string $lesson): Response {
    $course = CourseRegistry::bySlug($slug) ?? throw new NotFoundHttpException();
    $index = (int) $lesson - 1;
    if ($index < 0 || $index >= CourseRegistry::lessonCount($course)) {
      throw new NotFoundHttpException();
    }
    $headers = [
      'Content-Type' => 'application/javascript; charset=utf-8',
      'Cache-Control' => 'private, no-store',
      'X-Content-Type-Options' => 'nosniff',
    ];
    if (!CourseAccess::canViewLesson($this->currentUser(), $index)) {
      return new Response("/* Denne leksjonen krever VIP. */\n", 403, $headers);
    }
    $file = dirname(__DIR__, 2) . '/lessons/' . $course['slug'] . '/' . ($index + 1) . '.js.inc';
    if (!is_file($file)) {
      throw new NotFoundHttpException();
    }
    return new Response((string) file_get_contents($file), 200, $headers);
  }

  public function getProgress(string $course): JsonResponse {
    $definition = $this->course($course);
    $lessons = CourseRegistry::lessonCount($definition);
    $row = ProgressStore::load((int) $this->currentUser()->id(), $definition['id']);
    return $this->json(ProgressMerge::toArray($row['done'], $row['scores'], $lessons));
  }

  /**
   * Records one completed lesson: { lesson, score }. Lesson is 1-based.
   */
  public function postProgress(string $course, Request $request): JsonResponse {
    $definition = $this->course($course);
    $lessons = CourseRegistry::lessonCount($definition);
    $body = $this->body($request);
    $lesson = $body['lesson'] ?? NULL;
    $score = $body['score'] ?? NULL;
    if (!is_int($lesson) || $lesson < 1 || $lesson > $lessons) {
      return $this->json(['error' => 'Ugyldig leksjon.'], 400);
    }
    if (!ProgressMerge::isScore($score)) {
      return $this->json(['error' => 'Resultatet må være et heltall fra 0 til 100.'], 400);
    }
    $account = $this->currentUser();
    if (!CourseAccess::canViewLesson($account, $lesson - 1)) {
      return $this->json(['error' => 'Denne leksjonen krever VIP.'], 403);
    }
    $row = ProgressStore::update((int) $account->id(), $definition['id'],
      static fn(int $done, string $scores): array => ProgressMerge::merge($done, $scores, [$lesson - 1 => $score], $lessons));
    return $this->json(ProgressMerge::toArray($row['done'], $row['scores'], $lessons));
  }

  /**
   * Merges progress saved in the browser before login: { done, scores }.
   */
  public function syncProgress(string $course, Request $request): JsonResponse {
    $definition = $this->course($course);
    $lessons = CourseRegistry::lessonCount($definition);
    $body = $this->body($request);
    $done = $body['done'] ?? NULL;
    $scores = $body['scores'] ?? [];
    if (!is_int($done) || $done < 0 || $done >= (1 << $lessons) || !is_array($scores) || !array_is_list($scores) || count($scores) > $lessons) {
      return $this->json(['error' => 'Ugyldig progresjon.'], 400);
    }
    $account = $this->currentUser();
    $allowed = static fn(int $index): bool => CourseAccess::canViewLesson($account, $index);
    $row = ProgressStore::update((int) $account->id(), $definition['id'],
      static fn(int $old, string $oldScores): array => ProgressMerge::mergeClient($old, $oldScores, $done, $scores, $lessons, $allowed));
    return $this->json(ProgressMerge::toArray($row['done'], $row['scores'], $lessons));
  }

  private function course(string $id): array {
    return CourseRegistry::get((int) $id) ?? throw new NotFoundHttpException();
  }

  private function body(Request $request): array {
    try {
      $body = json_decode($request->getContent(), TRUE, 4, JSON_THROW_ON_ERROR);
    }
    catch (\JsonException) {
      return [];
    }
    return is_array($body) ? $body : [];
  }

  private function json(array $data, int $status = 200): JsonResponse {
    $response = new JsonResponse($data, $status);
    $response->headers->set('Cache-Control', 'private, no-store');
    return $response;
  }

}
