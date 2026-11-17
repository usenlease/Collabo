CREATE TABLE IF NOT EXISTS user_notifications (id TEXT PRIMARY KEY, recipient_clerk_id TEXT NOT NULL, title TEXT NOT NULL, message TEXT NOT NULL, link TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), read_at TEXT);
CREATE INDEX IF NOT EXISTS idx_user_notifications_recipient ON user_notifications(recipient_clerk_id,created_at DESC);
