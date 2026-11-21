CREATE TABLE IF NOT EXISTS collabo_collaborator_exits (
 id TEXT PRIMARY KEY,
 project_id TEXT NOT NULL,
 applicant_clerk_id TEXT NOT NULL,
 requested_by TEXT NOT NULL,
 request_type TEXT NOT NULL CHECK(request_type IN ('withdrawal','termination')),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','completed','declined')),
 reason TEXT NOT NULL,
 initiator_note TEXT,
 created_at TEXT NOT NULL DEFAULT (datetime('now')),
 resolved_at TEXT,
 resolved_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_collabo_exits_project ON collabo_collaborator_exits(project_id,created_at);
CREATE INDEX IF NOT EXISTS idx_collabo_exits_member ON collabo_collaborator_exits(project_id,applicant_clerk_id,status);
