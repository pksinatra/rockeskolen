<?php

declare(strict_types=1);

namespace Drupal\rs_kurs\Controller;

use Drupal\Core\Access\CsrfRequestHeaderAccessCheck;
use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Render\Markup;
use Drupal\rs_kurs\QuizPage;
use Drupal\rs_kurs\QuizStore;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Lets students open an editor's test with its code and saves their results.
 */
final class QuizController extends ControllerBase {

  /**
   * A field for the code. /test?kode=ABC123 goes straight to the test.
   */
  public function entry(Request $request): array|RedirectResponse {
    $code = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', (string) $request->query->get('kode', '')));
    if (strlen($code) === 6) {
      return new RedirectResponse('/test/' . $code);
    }
    $error = $request->query->has('kode') ? '<p class="rs-kurs-lead"><strong>Koden har seks tegn. Prøv igjen.</strong></p>' : '';
    return [
      '#markup' => Markup::create('<div class="rs-kurs-overview">'
        . '<p class="rs-kurs-lead">Skriv koden du har fått av læreren din.</p>' . $error
        . '<form action="/test" method="get" class="rs-quiz-code">'
        . '<label for="rs-quiz-kode">Kode</label> '
        . '<input id="rs-quiz-kode" name="kode" maxlength="6" autocomplete="off" autocapitalize="characters" spellcheck="false" required> '
        . '<button type="submit" class="button button--primary">Start</button>'
        . '</form></div>'),
      '#attached' => ['library' => ['rs_kurs/quiz_entry']],
      '#cache' => ['max-age' => 0],
    ];
  }

  public function page(string $code): Response {
    if ($code !== strtoupper($code)) {
      return new RedirectResponse('/test/' . strtoupper($code), 301);
    }
    $quiz = QuizStore::byCode($code);
    $account = $this->currentUser();
    $here = '/test/' . $code;
    $config = [
      'found' => $quiz !== NULL,
      'open' => $quiz['open'] ?? FALSE,
      'intro' => $quiz['intro'] ?? '',
      'questions' => $quiz && $quiz['open'] ? $quiz['questions'] : [],
      'loggedIn' => $account->isAuthenticated(),
      'name' => $account->isAuthenticated() ? $account->getDisplayName() : '',
      'csrf' => $account->isAuthenticated() ? \Drupal::csrfToken()->get(CsrfRequestHeaderAccessCheck::TOKEN_KEY) : '',
      'api' => '/api/test/' . $code . '/resultat',
      'loginUrl' => '/user/login?destination=' . rawurlencode($here),
      'entryUrl' => '/test',
    ];
    $base = base_path() . $this->moduleHandler()->getModule('rs_kurs')->getPath() . '/assets/';
    $title = $quiz['title'] ?? 'Fant ikke testen';
    return new Response(QuizPage::html($title, $config, $base), $quiz ? 200 : 404, [
      'Content-Type' => 'text/html; charset=utf-8',
      'Cache-Control' => 'private, no-store',
    ]);
  }

  /**
   * Saves a finished attempt: { answers: [option index or null, …] }.
   */
  public function postResult(string $code, Request $request): JsonResponse {
    $quiz = QuizStore::byCode($code);
    if (!$quiz) {
      return $this->json(['error' => 'Fant ikke testen.'], 404);
    }
    if (!$quiz['open']) {
      return $this->json(['error' => 'Testen er stengt.'], 403);
    }
    try {
      $body = json_decode($request->getContent(), TRUE, 4, JSON_THROW_ON_ERROR);
    }
    catch (\JsonException) {
      $body = NULL;
    }
    // Poengene regnes ut på serveren, ikke i nettleseren.
    $correct = QuizStore::check($quiz['questions'], is_array($body) ? ($body['answers'] ?? NULL) : NULL);
    if ($correct === NULL) {
      return $this->json(['error' => 'Svarene passer ikke til testen. Last siden på nytt.'], 400);
    }
    QuizStore::addResult($quiz['id'], (int) $this->currentUser()->id(), $correct);
    return $this->json(['score' => count(array_filter($correct)), 'total' => count($correct)]);
  }

  private function json(array $data, int $status = 200): JsonResponse {
    $response = new JsonResponse($data, $status);
    $response->headers->set('Cache-Control', 'private, no-store');
    return $response;
  }

}
