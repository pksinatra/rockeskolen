ALTER TABLE chordlink_subscriptions
  MODIFY plan ENUM(
    'pro_monthly',
    'pro_yearly',
    'vip_monthly',
    'vip_yearly'
  ) NOT NULL,
  MODIFY status ENUM(
    'active',
    'trialing',
    'past_due',
    'canceled',
    'unpaid',
    'incomplete',
    'expired',
    'paused'
  ) NOT NULL;

CREATE TABLE IF NOT EXISTS chordlink_sso_tokens (
  token_hash CHAR(64) NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  destination VARCHAR(512) NOT NULL DEFAULT '/',
  ip_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  consumed_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (token_hash),
  KEY sso_user_id (user_id),
  KEY sso_expires_at (expires_at),
  CONSTRAINT chordlink_sso_tokens_user_fk
    FOREIGN KEY (user_id) REFERENCES chordlink_users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS chordlink_drupal_links (
  user_id INT UNSIGNED NOT NULL,
  drupal_uid INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY drupal_uid (drupal_uid),
  CONSTRAINT chordlink_drupal_links_user_fk
    FOREIGN KEY (user_id) REFERENCES chordlink_users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE chordlink_users
  ADD UNIQUE KEY chordlink_users_feide_id (feide_id);
