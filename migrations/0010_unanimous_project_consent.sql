-- Apply to the Cloud Collabo production D1 database before deploying consent endpoints.
CREATE TABLE IF NOT EXISTS project_change_requests (
 id TEXT PRIMARY KEY,
 project_id TEXT NOT NULL,
 initiator_clerk_id TEXT NOT NULL,
 action TEXT NOT NULL CHECK(action IN ('delete')),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','executed')),
 message TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (datetime('now')),
 decided_at TEXT
);
CREATE TABLE IF NOT EXISTS project_change_approvals (
 request_id TEXT NOT NULL REFERENCES project_change_requests(id),
 collaborator_clerk_id TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
 decided_at TEXT,
 PRIMARY KEY(request_id,collaborator_clerk_id)
);
CREATE INDEX IF NOT EXISTS project_change_requests_project_idx ON project_change_requests(project_id,created_at);
