<?php

declare(strict_types=1);

namespace Drupal\rockeskolen_membership;

/**
 * Notices for Feide users whose school or class has no Rockeskolen contract.
 */
final class SchoolAccessNotice {

  /**
   * Picks the audience from verified Feide memberships.
   *
   * Teachers, staff and managers get the teacher notice. Everyone else,
   * including users without group data, gets the pupil notice.
   *
   * @param array<int, array{affiliation?: string}> $memberships
   */
  public static function audience(array $memberships): string {
    foreach ($memberships as $membership) {
      $affiliation = SchoolEntitlementPolicy::normalizeAffiliation(
        (string) ($membership['affiliation'] ?? ''),
      );
      if (in_array($affiliation, ['teacher', 'staff', 'manager'], TRUE)) {
        return 'teacher';
      }
    }
    return 'student';
  }

  /**
   * Returns the notice as HTML.
   */
  public static function html(string $audience): string {
    if ($audience === 'teacher') {
      return '<strong>Skolen din har ikke avtale ennå</strong><br>'
        . 'Du er logget inn med FEIDE, men skolen din har ikke avtale med Rockeskolen. '
        . 'Ta kontakt med skoleledelsen eller kommunen for å få tilgang for klassen eller skolen. '
        . '<a href="https://rockeskolen.com/skoler/">Les om skoleavtaler</a>';
    }
    return '<strong>Klassen din har ikke tilgang ennå</strong><br>'
      . 'Du er logget inn med FEIDE, men skolen din har ikke avtale med Rockeskolen. '
      . 'Spør læreren din om klassen eller skolen kan få tilgang.';
  }

}
