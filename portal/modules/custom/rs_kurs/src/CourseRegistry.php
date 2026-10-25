<?php

declare(strict_types=1);

namespace Drupal\rs_kurs;

/**
 * The courses in the music portal. Lesson code lives in courses/{slug}/.
 */
final class CourseRegistry {

  private const COURSES = [
    1 => [
      'slug' => 'musikkteori',
      'area' => 'Musikkteori',
      'path' => ['title' => 'Skalaer', 'url' => '/taxonomy/term/35'],
      'title' => 'Musikkteori fra bunnen',
      'module' => 'Modul 1: Durskalaen. Fire korte leksjoner der du hører, ser og spiller.',
      'storage' => 'rs-kurs-teori-m1',
      'lessons' => [
        ['title' => 'Halvtoner og heltoner', 'sub' => 'Avstanden mellom to toner'],
        ['title' => 'Mønsteret i durskalaen', 'sub' => 'Hel, hel, halv …'],
        ['title' => 'Bygg G-dur', 'sub' => 'Bruk mønsteret selv'],
        ['title' => 'Hør forskjellen', 'sub' => 'Lytteprøve'],
      ],
    ],
    2 => [
      'slug' => 'rytme',
      'area' => 'Musikkteori',
      'path' => ['title' => 'Rytme', 'url' => '/taxonomy/term/120'],
      'title' => 'Rytme',
      'module' => 'Modul 1: Puls, takt og notverdier. Fire korte leksjoner der du lytter, teller og spiller.',
      'storage' => 'rs-kurs-rytme-m1',
      'lessons' => [
        ['title' => 'Pulsen', 'sub' => 'Det jevne slaget i musikken'],
        ['title' => 'Takt og betoning', 'sub' => '3/4 eller 4/4?'],
        ['title' => 'Notverdier', 'sub' => 'Hvor lenge varer tonen?'],
        ['title' => 'Hør rytmen', 'sub' => 'Lytteprøve'],
      ],
    ],
    10 => [
      'slug' => 'gi-ut-din-egen-musikk',
      'area' => 'Musikk i praksis',
      'path' => ['title' => 'Gi ut din egen musikk', 'url' => '/gi-ut-din-egen-musikk'],
      'title' => 'Gi ut din egen musikk',
      'module' => 'Modul 1: Før utgivelsen. Rettigheter, fordeling og en plan fram til utgivelsesdagen.',
      'storage' => 'rs-kurs-utgivelse-m1',
      'lessons' => [
        ['title' => 'Låten og innspillingen', 'sub' => 'To ting som eies hver for seg'],
        ['title' => 'TONO og Gramo', 'sub' => 'Hvem betaler deg?'],
        ['title' => 'Fordel låten', 'sub' => 'Hvem skrev hva'],
        ['title' => 'Lag en utgivelsesplan', 'sub' => 'Fra master til utgivelsesdag'],
      ],
    ],
  ];

  public static function get(int $id): ?array {
    return isset(self::COURSES[$id]) ? ['id' => $id] + self::COURSES[$id] : NULL;
  }

  public static function bySlug(string $slug): ?array {
    foreach (self::COURSES as $id => $course) {
      if ($course['slug'] === $slug) {
        return ['id' => $id] + $course;
      }
    }
    return NULL;
  }

  /**
   * All courses in order, each with its ID.
   */
  public static function all(): array {
    $courses = [];
    foreach (self::COURSES as $id => $course) {
      $courses[] = ['id' => $id] + $course;
    }
    return $courses;
  }

  public static function lessonCount(array $course): int {
    return count($course['lessons']);
  }

}
