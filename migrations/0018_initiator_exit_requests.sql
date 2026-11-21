CREATE TABLE IF NOT EXISTS collabo_initiator_exit_requests (
 id TEXT PRIMARY KEY,
 project_id TEXT NOT NULL,
 requested_by TEXT NOT NULL,
 exit_option TEXT NOT NULL CHECK(exit_option IN ('transfer','pause','close')),
 reason TEXT NOT NULL,
 proposed_successor TEXT NOT NULL DEFAULT '',
 obligations TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','declined','completed')),
 created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_initiator_exit_project ON collabo_initiator_exit_requests(project_id,created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_initiator_exit_pending ON collabo_initiator_exit_requests(project_id) WHERE status='pending';
