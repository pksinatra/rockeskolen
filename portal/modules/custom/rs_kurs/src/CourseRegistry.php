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
    10 => [
      'slug' => 'gi-ut-din-egen-musikk',
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

  public static function lessonCount(array $course): int {
    return count($course['lessons']);
  }

}
