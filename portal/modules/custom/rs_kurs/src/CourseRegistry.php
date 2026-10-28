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
    3 => [
      'slug' => 'intervaller',
      'area' => 'Musikkteori',
      'path' => ['title' => 'Intervaller', 'url' => '/taxonomy/term/36'],
      'title' => 'Intervaller',
      'module' => 'Modul 1: Avstanden mellom to toner. Fire korte leksjoner der du teller, bygger og hører intervaller.',
      'storage' => 'rs-kurs-intervaller-m1',
      'lessons' => [
        ['title' => 'Tell trinnene', 'sub' => 'Fra prim til oktav'],
        ['title' => 'Stor, liten eller ren?', 'sub' => 'Intervallets kvalitet'],
        ['title' => 'Bygg intervallet', 'sub' => 'Finn tonen på tangentene'],
        ['title' => 'Hør intervallet', 'sub' => 'Lytteprøve'],
      ],
    ],
    4 => [
      'slug' => 'akkorder-og-harmoni',
      'area' => 'Musikkteori',
      'path' => ['title' => 'Akkorder og harmoni', 'url' => '/taxonomy/term/37'],
      'title' => 'Akkorder og harmoni',
      'module' => 'Modul 1: Treklanger og trinnakkorder. Fire korte leksjoner der du bygger, hører og bruker akkorder.',
      'storage' => 'rs-kurs-akkorder-m1',
      'lessons' => [
        ['title' => 'Bygg en durakkord', 'sub' => 'Grunntone, ters og kvint'],
        ['title' => 'Dur eller moll?', 'sub' => 'Tersen avgjør'],
        ['title' => 'Akkordene i tonearten', 'sub' => 'Trinnakkorder i dur'],
        ['title' => 'Hør akkordrekken', 'sub' => 'Lytteprøve'],
      ],
    ],
    5 => [
      'slug' => 'tonearter',
      'area' => 'Musikkteori',
      'path' => ['title' => 'Tonearter', 'url' => '/taxonomy/term/38'],
      'title' => 'Tonearter og kvintsirkelen',
      'module' => 'Modul 1: Fortegn, kvintsirkelen og parallelltonearter. Fire korte leksjoner der du finner, ser og hører tonearten.',
      'storage' => 'rs-kurs-tonearter-m1',
      'lessons' => [
        ['title' => 'Fortegn i dur', 'sub' => 'Hvorfor G-dur har F♯'],
        ['title' => 'Kvintsirkelen', 'sub' => 'Ett fortegn per kvint'],
        ['title' => 'Parallelltonearter', 'sub' => 'Dur og moll med samme fortegn'],
        ['title' => 'Hør tonearten', 'sub' => 'Lytteprøve'],
      ],
    ],
    6 => [
      'slug' => 'melodi',
      'area' => 'Musikkteori',
      'path' => ['title' => 'Melodi', 'url' => '/taxonomy/term/39'],
      'title' => 'Melodi',
      'module' => 'Modul 1: Retning, bevegelse og avslutning. Fire korte leksjoner der du hører, ser og spiller melodier.',
      'storage' => 'rs-kurs-melodi-m1',
      'lessons' => [
        ['title' => 'Melodiens retning', 'sub' => 'Opp eller ned?'],
        ['title' => 'Trinn og sprang', 'sub' => 'Hvordan melodien beveger seg'],
        ['title' => 'Hør avslutningen', 'sub' => 'Lytteprøve'],
        ['title' => 'Spill etter gehør', 'sub' => 'Finn tonene selv'],
      ],
    ],
    7 => [
      'slug' => 'form-og-struktur',
      'area' => 'Musikkteori',
      'path' => ['title' => 'Form og struktur', 'url' => '/taxonomy/term/40'],
      'title' => 'Form og struktur',
      'module' => 'Modul 1: Takter, deler og låtform. Fire korte leksjoner der du teller, hører og kjenner igjen formen.',
      'storage' => 'rs-kurs-form-m1',
      'lessons' => [
        ['title' => 'Tell takter', 'sub' => 'Fire og åtte takter'],
        ['title' => 'Like eller ulike?', 'sub' => 'A og B'],
        ['title' => 'Delene i en låt', 'sub' => 'Vers, refreng og C-del'],
        ['title' => 'Hør formen', 'sub' => 'Lytteprøve'],
      ],
    ],
    8 => [
      'slug' => 'latskriving',
      'area' => 'Musikk i praksis',
      'path' => ['title' => 'Låtskriving – fra idé til ferdig låt', 'url' => '/artikkelserie/110'],
      'title' => 'Låtskriving',
      'module' => 'Modul 1: Akkorder, melodi, tekst og form. Fire korte leksjoner der du lager byggesteinene i en låt.',
      'storage' => 'rs-kurs-latskriving-m1',
      'lessons' => [
        ['title' => 'Akkordrekken', 'sub' => 'Lag din egen loop'],
        ['title' => 'Melodi over akkordene', 'sub' => 'Akkordtoner'],
        ['title' => 'Ord og stavelser', 'sub' => 'Tekst som sitter'],
        ['title' => 'Bygg låtformen', 'sub' => 'Fra intro til outro'],
      ],
    ],
    9 => [
      'slug' => 'musikkproduksjon',
      'area' => 'Musikk i praksis',
      'path' => ['title' => 'Musikk i praksis', 'url' => '/musikk-i-praksis'],
      'title' => 'Musikkproduksjon',
      'module' => 'Modul 1: Loop, lyd og signalvei. Fire korte leksjoner der du programmerer, lytter og mikser.',
      'storage' => 'rs-kurs-produksjon-m1',
      'lessons' => [
        ['title' => 'Lag en loop', 'sub' => 'Trommemaskin med 16 steg'],
        ['title' => 'Bass, mellomtone og diskant', 'sub' => 'Lytteprøve med EQ'],
        ['title' => 'Stereobildet', 'sub' => 'Panorering'],
        ['title' => 'Signalkjeden', 'sub' => 'Fra mikrofon til høyttaler'],
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
    11 => [
      'slug' => 'noter',
      'area' => 'Musikkteori',
      'path' => ['title' => 'Noter', 'url' => '/taxonomy/term/34'],
      'title' => 'Noter',
      'module' => 'Notelinjer, noteverdier, pauser og taktart. Fire korte leksjoner der du leser og teller.',
      'storage' => 'rs-kurs-noter-m1',
      'lessons' => [
        ['title' => 'Notelinjer og G-nøkkel', 'sub' => 'Linjer, mellomrom og hjelpelinjer'],
        ['title' => 'Noteverdier og pauser', 'sub' => 'Hvor lenge varer det?'],
        ['title' => 'Takt og taktart', 'sub' => 'Hva tallene betyr'],
        ['title' => 'Lesetest', 'sub' => 'Ti noter på rad'],
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
