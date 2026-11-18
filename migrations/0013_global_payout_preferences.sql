-- Run after migration 0012. Preserve existing US preferences while widening country selection.
CREATE TABLE IF NOT EXISTS collabo_payout_preferences_global (
 clerk_user_id TEXT PRIMARY KEY,
 country TEXT NOT NULL CHECK(country IN ('US','KE','JM','GB','CA','IN','NG','GH','UG','TZ','ZA','PH')),
 method TEXT NOT NULL,
 verification_status TEXT NOT NULL DEFAULT 'not_started',
 updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT OR REPLACE INTO collabo_payout_preferences_global(clerk_user_id,country,method,verification_status,updated_at)
SELECT clerk_user_id,country,method,verification_status,updated_at FROM collabo_payout_preferences;
DROP TABLE collabo_payout_preferences;
ALTER TABLE collabo_payout_preferences_global RENAME TO collabo_payout_preferences;
