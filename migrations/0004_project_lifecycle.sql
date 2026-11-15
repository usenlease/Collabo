-- Separate lifecycle stage from the existing project visibility status.
-- Existing projects remain intact; legacy open projects appear as Posted until the Initiator updates them.
CREATE TABLE IF NOT EXISTS project_lifecycle (
 project_id TEXT PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
 stage TEXT NOT NULL CHECK(stage IN ('posted','open','ongoing','closed')),
 updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS project_lifecycle_stage_idx ON project_lifecycle(stage);
