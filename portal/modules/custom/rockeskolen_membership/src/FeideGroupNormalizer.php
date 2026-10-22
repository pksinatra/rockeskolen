<?php

declare(strict_types=1);

namespace Drupal\rockeskolen_membership;

/**
 * Converts verified Feide Groups API objects to resolver memberships.
 */
final class FeideGroupNormalizer {

  /**
   * Normalizes active school and basis-group memberships.
   *
   * @return array<int, array{org_unit_id: string, group_id: string, affiliation: string}>
   */
  public static function memberships(array $groups, ?int $now = NULL): array {
    return array_merge(
      self::schoolGroups($groups),
      self::basisGroups($groups, $now),
    );
  }

  /**
   * Keeps school groups for school-wide contracts.
   *
   * @return array<int, array{org_unit_id: string, group_id: string, affiliation: string}>
   */
  public static function schoolGroups(array $groups): array {
    $memberships = [];
    foreach ($groups as $group) {
      if (!is_array($group)
        || ($group['type'] ?? '') !== 'fc:org'
        || !in_array('primary_and_lower_secondary', (array) ($group['orgType'] ?? []), TRUE)) {
        continue;
      }
      $groupId = trim((string) ($group['id'] ?? ''));
      if (!preg_match('/:(NO[0-9]{9}|U[0-9]+)$/', $groupId, $match)) {
        continue;
      }
      $membership = is_array($group['membership'] ?? NULL) ? $group['membership'] : [];
      $affiliations = (array) ($membership['affiliation'] ?? []);
      $affiliation = in_array('faculty', $affiliations, TRUE)
        ? 'faculty'
        : (in_array('staff', $affiliations, TRUE) || in_array('employee', $affiliations, TRUE)
          ? 'staff'
          : (in_array('student', $affiliations, TRUE) ? 'student' : ''));
      if (SchoolEntitlementPolicy::normalizeAffiliation($affiliation) === NULL) {
        continue;
      }
      $memberships[] = [
        'org_unit_id' => $match[1],
        'group_id' => '',
        'affiliation' => $affiliation,
      ];
    }
    return $memberships;
  }

  /**
   * Keeps active basis groups and extracts their stable school identifier.
   *
   * @return array<int, array{org_unit_id: string, group_id: string, affiliation: string}>
   */
  public static function basisGroups(array $groups, ?int $now = NULL): array {
    $now ??= time();
    $memberships = [];
    foreach ($groups as $group) {
      if (!is_array($group)
        || ($group['type'] ?? '') !== 'fc:gogroup'
        || ($group['go_type'] ?? '') !== 'b') {
        continue;
      }
      $groupId = trim((string) ($group['id'] ?? ''));
      $parent = trim((string) ($group['parent'] ?? ''));
      $membership = is_array($group['membership'] ?? NULL) ? $group['membership'] : [];
      $affiliation = $membership['affiliation'] ?? '';
      if (is_array($affiliation)) {
        $affiliation = in_array('faculty', $affiliation, TRUE)
          ? 'faculty'
          : (in_array('student', $affiliation, TRUE) ? 'student' : '');
      }
      if ($groupId === '' || !preg_match('/:(NO[0-9]{9}|U[0-9]+)$/', $parent, $match)) {
        continue;
      }
      if (!self::isActiveAt($group, $now)) {
        continue;
      }
      if (SchoolEntitlementPolicy::normalizeAffiliation((string) $affiliation) === NULL) {
        continue;
      }
      $memberships[] = [
        'org_unit_id' => $match[1],
        'group_id' => $groupId,
        'affiliation' => (string) $affiliation,
      ];
    }
    return $memberships;
  }

  private static function isActiveAt(array $group, int $now): bool {
    foreach (['notBefore' => -1, 'notAfter' => 1] as $field => $direction) {
      if (empty($group[$field])) {
        continue;
      }
      $timestamp = strtotime((string) $group[$field]);
      if ($timestamp === FALSE) {
        return FALSE;
      }
      if (($direction < 0 && $now < $timestamp) || ($direction > 0 && $now > $timestamp)) {
        return FALSE;
      }
    }
    return TRUE;
  }

}
