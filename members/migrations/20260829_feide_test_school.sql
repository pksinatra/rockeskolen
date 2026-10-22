-- Staging-only fixture for Feide's public Bjerke lower-education test users.
-- Requires 20260829_school_entitlements.sql first.
-- Remove or deactivate this contract before any production rollout.

INSERT INTO chordlink_schools
  (name, feide_org_unit_id, feide_owner_id, organization_number, active)
VALUES
  ('Bjerke grunnskole', 'NO876326126', 'NO713293725', '876326126', 1)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  feide_owner_id = VALUES(feide_owner_id),
  organization_number = VALUES(organization_number),
  active = 1;

INSERT INTO chordlink_school_contracts
  (school_id, product_id, status, starts_at, ends_at, customer_reference)
SELECT
  s.id,
  p.id,
  'active',
  '2026-08-01 00:00:00',
  '2027-07-31 23:59:59',
  'FEIDE-STAGING-BJERKE'
FROM chordlink_schools s
JOIN chordlink_school_products p ON p.code = 'school_200'
WHERE s.feide_org_unit_id = 'NO876326126'
  AND NOT EXISTS (
    SELECT 1
    FROM chordlink_school_contracts c
    WHERE c.school_id = s.id
      AND c.customer_reference = 'FEIDE-STAGING-BJERKE'
  );
