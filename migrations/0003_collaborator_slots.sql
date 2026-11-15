CREATE TABLE IF NOT EXISTS project_collaborator_slots (
 id TEXT PRIMARY KEY,
 project_id TEXT NOT NULL,
 slot_number INTEGER NOT NULL CHECK(slot_number BETWEEN 1 AND 10),
 role_title TEXT NOT NULL,
 requirements TEXT NOT NULL DEFAULT '',
 UNIQUE(project_id,slot_number)
);
CREATE INDEX IF NOT EXISTS idx_project_collaborator_slots_project ON project_collaborator_slots(project_id);
