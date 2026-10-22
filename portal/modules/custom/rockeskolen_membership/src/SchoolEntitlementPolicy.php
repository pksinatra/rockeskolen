<?php

declare(strict_types=1);

namespace Drupal\rockeskolen_membership;

/**
 * Pure policy helpers for school-package capacity decisions.
 */
final class SchoolEntitlementPolicy {

  /**
   * Returns whether a user may consume a seat in the selected contract.
   */
  public static function hasCapacity(
    string $affiliation,
    int $usedStudents,
    int $maxStudents,
    int $usedTeachers,
    ?int $maxTeachers,
    bool $alreadyAssigned,
  ): bool {
    if ($alreadyAssigned) {
      return TRUE;
    }
    if ($affiliation === 'student') {
      return $maxStudents > 0 && $usedStudents < $maxStudents;
    }
    if (in_array($affiliation, ['teacher', 'staff', 'manager'], TRUE)) {
      return $maxTeachers === NULL || $usedTeachers < $maxTeachers;
    }
    return FALSE;
  }

  /**
   * Maps Feide affiliations to the values accepted by the access table.
   */
  public static function normalizeAffiliation(string $affiliation): ?string {
    return match (strtolower(trim($affiliation))) {
      'student', 'pupil', 'elev' => 'student',
      'faculty', 'teacher', 'lærer', 'larer' => 'teacher',
      'employee', 'staff', 'ansatt' => 'staff',
      'manager', 'admin', 'administrator' => 'manager',
      default => NULL,
    };
  }

}
