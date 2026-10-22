-- School and class entitlements for Feide-authenticated users.
-- Apply only after taking a database backup and verifying the migration in staging.

CREATE TABLE IF NOT EXISTS chordlink_school_products (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(32) NOT NULL,
  name VARCHAR(96) NOT NULL,
  scope ENUM('class', 'school', 'owner') NOT NULL,
  max_students INT UNSIGNED NOT NULL,
  max_teachers INT UNSIGNED DEFAULT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY school_product_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO chordlink_school_products
  (code, name, scope, max_students, max_teachers)
VALUES
  ('small_class', 'Liten klasse', 'class', 10, 10),
  ('class', 'Klasse', 'class', 24, 10),
  ('large_class', 'Stor klasse', 'class', 50, 15),
  ('school_200', 'Skole 200', 'school', 200, NULL),
  ('school_500', 'Skole 500', 'school', 500, NULL),
  ('school_1000', 'Skole 1 000', 'school', 1000, NULL),
  ('school_2500', 'Skole 2 500', 'school', 2500, NULL)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  scope = VALUES(scope),
  max_students = VALUES(max_students),
  max_teachers = VALUES(max_teachers),
  active = 1;

CREATE TABLE IF NOT EXISTS chordlink_schools (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(191) NOT NULL,
  feide_org_unit_id VARCHAR(191) NOT NULL,
  feide_owner_id VARCHAR(191) DEFAULT NULL,
  organization_number VARCHAR(16) DEFAULT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY school_feide_org_unit (feide_org_unit_id),
  KEY school_feide_owner (feide_owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS chordlink_school_contracts (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  school_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  status ENUM('draft', 'active', 'suspended', 'expired', 'canceled') NOT NULL DEFAULT 'draft',
  starts_at DATETIME NOT NULL,
  ends_at DATETIME NOT NULL,
  max_students_override INT UNSIGNED DEFAULT NULL,
  max_teachers_override INT UNSIGNED DEFAULT NULL,
  customer_reference VARCHAR(191) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY school_contract_active (school_id, status, starts_at, ends_at),
  CONSTRAINT school_contract_school_fk FOREIGN KEY (school_id)
    REFERENCES chordlink_schools (id),
  CONSTRAINT school_contract_product_fk FOREIGN KEY (product_id)
    REFERENCES chordlink_school_products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS chordlink_school_contract_groups (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  contract_id INT UNSIGNED NOT NULL,
  feide_group_id VARCHAR(255) NOT NULL,
  display_name VARCHAR(191) NOT NULL,
  group_type VARCHAR(64) NOT NULL DEFAULT 'basis_group',
  school_year VARCHAR(16) DEFAULT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY contract_feide_group (contract_id, feide_group_id),
  KEY feide_group_active (feide_group_id, active),
  CONSTRAINT school_contract_group_contract_fk FOREIGN KEY (contract_id)
    REFERENCES chordlink_school_contracts (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS chordlink_school_user_access (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  contract_id INT UNSIGNED NOT NULL,
  membership_user_id INT UNSIGNED NOT NULL,
  feide_subject_hash CHAR(64) NOT NULL,
  feide_group_id VARCHAR(255) DEFAULT NULL,
  affiliation ENUM('student', 'teacher', 'staff', 'manager') NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  first_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at DATETIME DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY contract_feide_subject (contract_id, feide_subject_hash),
  KEY contract_active_affiliation (contract_id, active, affiliation),
  KEY membership_user_active (membership_user_id, active),
  CONSTRAINT school_user_access_contract_fk FOREIGN KEY (contract_id)
    REFERENCES chordlink_school_contracts (id) ON DELETE CASCADE,
  CONSTRAINT school_user_access_member_fk FOREIGN KEY (membership_user_id)
    REFERENCES chordlink_users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS chordlink_school_access_audit (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  membership_user_id INT UNSIGNED DEFAULT NULL,
  contract_id INT UNSIGNED DEFAULT NULL,
  feide_subject_hash CHAR(64) NOT NULL,
  decision ENUM('allowed', 'denied') NOT NULL,
  reason VARCHAR(64) NOT NULL,
  context_json JSON DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY audit_subject_created (feide_subject_hash, created_at),
  KEY audit_contract_created (contract_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
