-- Apply only after backing up D1. Existing application records remain unchanged.
CREATE TABLE IF NOT EXISTS project_needs (
 id TEXT PRIMARY KEY, project_id TEXT NOT NULL, position INTEGER NOT NULL,
 item_name TEXT NOT NULL, quantity INTEGER NOT NULL CHECK(quantity BETWEEN 1 AND 10000),
 details TEXT NOT NULL DEFAULT '', UNIQUE(project_id,position)
);
CREATE INDEX IF NOT EXISTS idx_project_needs_project ON project_needs(project_id);
CREATE TABLE IF NOT EXISTS role_applications (
 id TEXT PRIMARY KEY, project_id TEXT NOT NULL, need_id TEXT NOT NULL,
 applicant_clerk_id TEXT NOT NULL, experience TEXT NOT NULL DEFAULT '',
 offered_quantity INTEGER NOT NULL DEFAULT 1 CHECK(offered_quantity BETWEEN 1 AND 10000),
 rate_amount REAL NOT NULL CHECK(rate_amount >= 0), currency TEXT NOT NULL,
 rate_period TEXT NOT NULL, message TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','declined')),
 created_at TEXT NOT NULL DEFAULT (datetime('now')),
 updated_at TEXT NOT NULL DEFAULT (datetime('now')),
 UNIQUE(project_id,need_id,applicant_clerk_id)
);
CREATE INDEX IF NOT EXISTS idx_role_applications_project ON role_applications(project_id,status);
CREATE TABLE IF NOT EXISTS project_team_messages (
 id TEXT PRIMARY KEY, project_id TEXT NOT NULL, sender_clerk_id TEXT NOT NULL,
 body TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_team_messages_project ON project_team_messages(project_id,created_at);
