<?php

declare(strict_types=1);

namespace Drupal\rockeskolen_membership;

use PDO;

/**
 * Resolves school access from active contracts and verified Feide groups.
 */
final class SchoolEntitlementResolver {

  /**
   * Finds and records the strongest matching school entitlement.
   *
   * Each membership must contain org_unit_id, optional group_id and
   * affiliation. Callers must only pass group data verified by Feide.
   *
   * @return array{allowed: bool, reason: string, contract_id?: int, affiliation?: string}
   */
  public function resolve(
    PDO $pdo,
    int $membershipUserId,
    string $feideSubject,
    array $memberships = [],
  ): array {
    $subjectHash = hash('sha256', $feideSubject);
    $existing = $this->existingActiveContract($pdo, $membershipUserId, $subjectHash);
    if ($existing !== NULL) {
      $this->touchAccess($pdo, (int) $existing['id']);
      return [
        'allowed' => TRUE,
        'reason' => 'existing_active_school_access',
        'contract_id' => (int) $existing['contract_id'],
        'affiliation' => (string) $existing['affiliation'],
      ];
    }

    foreach ($memberships as $membership) {
      $orgUnitId = trim((string) ($membership['org_unit_id'] ?? ''));
      $groupId = trim((string) ($membership['group_id'] ?? ''));
      $affiliation = SchoolEntitlementPolicy::normalizeAffiliation(
        (string) ($membership['affiliation'] ?? ''),
      );
      if ($orgUnitId === '' || $affiliation === NULL) {
        continue;
      }
      $contract = $this->matchingContract($pdo, $orgUnitId, $groupId);
      if ($contract === NULL) {
        continue;
      }
      $contractId = (int) $contract['id'];
      $alreadyAssigned = $this->hasAssignment($pdo, $contractId, $subjectHash);
      [$usedStudents, $usedTeachers] = $this->seatUsage($pdo, $contractId);
      $maxStudents = (int) ($contract['max_students_override'] ?? $contract['max_students']);
      $maxTeachersValue = $contract['max_teachers_override'] ?? $contract['max_teachers'];
      $maxTeachers = $maxTeachersValue === NULL ? NULL : (int) $maxTeachersValue;
      if (!SchoolEntitlementPolicy::hasCapacity(
        $affiliation,
        $usedStudents,
        $maxStudents,
        $usedTeachers,
        $maxTeachers,
        $alreadyAssigned,
      )) {
        $this->audit($pdo, $membershipUserId, $contractId, $subjectHash, 'denied', 'capacity_exceeded');
        return ['allowed' => FALSE, 'reason' => 'capacity_exceeded'];
      }
      $this->recordAccess(
        $pdo,
        $contractId,
        $membershipUserId,
        $subjectHash,
        $groupId !== '' ? $groupId : NULL,
        $affiliation,
      );
      $this->audit($pdo, $membershipUserId, $contractId, $subjectHash, 'allowed', 'active_school_contract');
      return [
        'allowed' => TRUE,
        'reason' => 'active_school_contract',
        'contract_id' => $contractId,
        'affiliation' => $affiliation,
      ];
    }

    $this->audit($pdo, $membershipUserId, NULL, $subjectHash, 'denied', 'no_active_school_contract');
    return ['allowed' => FALSE, 'reason' => 'no_active_school_contract'];
  }

  private function existingActiveContract(PDO $pdo, int $membershipUserId, string $subjectHash): ?array {
    $statement = $pdo->prepare(
      "SELECT a.id, a.contract_id, a.affiliation
         FROM chordlink_school_user_access a
         JOIN chordlink_school_contracts c ON c.id = a.contract_id
         JOIN chordlink_schools s ON s.id = c.school_id
        WHERE a.feide_subject_hash = ?
          AND a.membership_user_id = ?
          AND a.active = 1
          AND c.status = 'active'
          AND c.starts_at <= NOW()
          AND c.ends_at >= NOW()
          AND s.active = 1
        ORDER BY c.ends_at DESC
        LIMIT 1"
    );
    $statement->execute([$subjectHash, $membershipUserId]);
    $row = $statement->fetch(PDO::FETCH_ASSOC);
    return $row ?: NULL;
  }

  private function matchingContract(PDO $pdo, string $orgUnitId, string $groupId): ?array {
    $statement = $pdo->prepare(
      "SELECT c.id, c.max_students_override, c.max_teachers_override,
              p.max_students, p.max_teachers, p.scope
         FROM chordlink_school_contracts c
         JOIN chordlink_school_products p ON p.id = c.product_id AND p.active = 1
         JOIN chordlink_schools s ON s.id = c.school_id AND s.active = 1
         LEFT JOIN chordlink_school_contract_groups g
           ON g.contract_id = c.id AND g.active = 1 AND g.feide_group_id = ?
        WHERE s.feide_org_unit_id = ?
          AND c.status = 'active'
          AND c.starts_at <= NOW()
          AND c.ends_at >= NOW()
          AND (p.scope IN ('school', 'owner') OR (p.scope = 'class' AND g.id IS NOT NULL))
        ORDER BY CASE p.scope WHEN 'class' THEN 1 WHEN 'school' THEN 2 ELSE 3 END,
                 c.ends_at DESC
        LIMIT 1"
    );
    $statement->execute([$groupId, $orgUnitId]);
    $row = $statement->fetch(PDO::FETCH_ASSOC);
    return $row ?: NULL;
  }

  private function hasAssignment(PDO $pdo, int $contractId, string $subjectHash): bool {
    $statement = $pdo->prepare(
      'SELECT 1 FROM chordlink_school_user_access WHERE contract_id = ? AND feide_subject_hash = ? LIMIT 1'
    );
    $statement->execute([$contractId, $subjectHash]);
    return (bool) $statement->fetchColumn();
  }

  /** @return array{0: int, 1: int} */
  private function seatUsage(PDO $pdo, int $contractId): array {
    $statement = $pdo->prepare(
      "SELECT
         COUNT(DISTINCT CASE WHEN affiliation = 'student' THEN feide_subject_hash END) AS students,
         COUNT(DISTINCT CASE WHEN affiliation <> 'student' THEN feide_subject_hash END) AS teachers
       FROM chordlink_school_user_access
       WHERE contract_id = ? AND active = 1"
    );
    $statement->execute([$contractId]);
    $usage = $statement->fetch(PDO::FETCH_ASSOC) ?: [];
    return [(int) ($usage['students'] ?? 0), (int) ($usage['teachers'] ?? 0)];
  }

  private function recordAccess(
    PDO $pdo,
    int $contractId,
    int $membershipUserId,
    string $subjectHash,
    ?string $groupId,
    string $affiliation,
  ): void {
    $statement = $pdo->prepare(
      "INSERT INTO chordlink_school_user_access
        (contract_id, membership_user_id, feide_subject_hash, feide_group_id,
         affiliation, active, first_seen_at, last_seen_at, revoked_at)
       VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW(), NULL)
       ON DUPLICATE KEY UPDATE
         membership_user_id = VALUES(membership_user_id),
         feide_group_id = VALUES(feide_group_id),
         affiliation = VALUES(affiliation),
         active = 1,
         last_seen_at = NOW(),
         revoked_at = NULL"
    );
    $statement->execute([
      $contractId,
      $membershipUserId,
      $subjectHash,
      $groupId,
      $affiliation,
    ]);
  }

  private function touchAccess(PDO $pdo, int $accessId): void {
    $statement = $pdo->prepare(
      'UPDATE chordlink_school_user_access SET last_seen_at = NOW() WHERE id = ?'
    );
    $statement->execute([$accessId]);
  }

  private function audit(
    PDO $pdo,
    int $membershipUserId,
    ?int $contractId,
    string $subjectHash,
    string $decision,
    string $reason,
  ): void {
    $statement = $pdo->prepare(
      'INSERT INTO chordlink_school_access_audit
        (membership_user_id, contract_id, feide_subject_hash, decision, reason)
       VALUES (?, ?, ?, ?, ?)'
    );
    $statement->execute([$membershipUserId, $contractId, $subjectHash, $decision, $reason]);
  }

}
