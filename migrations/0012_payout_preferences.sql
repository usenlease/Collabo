-- Payout preferences only. Bank account credentials and check addresses are not stored here.
CREATE TABLE IF NOT EXISTS collabo_payout_preferences (
 clerk_user_id TEXT PRIMARY KEY,
 country TEXT NOT NULL DEFAULT 'US' CHECK(country='US'),
 method TEXT NOT NULL CHECK(method IN ('direct_deposit','check')),
 verification_status TEXT NOT NULL DEFAULT 'not_started',
 updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
