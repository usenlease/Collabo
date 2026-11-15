PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS projects (
 id TEXT PRIMARY KEY,
 owner_clerk_id TEXT NOT NULL,
 title TEXT NOT NULL CHECK(length(title) BETWEEN 3 AND 160),
 description TEXT NOT NULL DEFAULT '',
 category TEXT NOT NULL DEFAULT 'Other',
 location TEXT NOT NULL DEFAULT '',
 collaboration_mode TEXT NOT NULL DEFAULT 'Hybrid' CHECK(collaboration_mode IN ('Local','Remote','Hybrid')),
 status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','paused','closed')),
 created_at TEXT NOT NULL DEFAULT (datetime('now')),
 updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS projects_owner_idx ON projects(owner_clerk_id);
CREATE INDEX IF NOT EXISTS projects_status_idx ON projects(status,created_at);
CREATE TABLE IF NOT EXISTS applications (
 id TEXT PRIMARY KEY,
 project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
 applicant_clerk_id TEXT NOT NULL,
 message TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected')),
 created_at TEXT NOT NULL DEFAULT (datetime('now')),
 UNIQUE(project_id,applicant_clerk_id)
);
CREATE INDEX IF NOT EXISTS applications_project_idx ON applications(project_id);
CREATE TABLE IF NOT EXISTS milestones (
 id TEXT PRIMARY KEY,
 project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
 title TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','complete')),
 created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
