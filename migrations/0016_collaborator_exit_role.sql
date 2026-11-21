ALTER TABLE collabo_collaborator_exits ADD COLUMN application_id TEXT;
CREATE INDEX IF NOT EXISTS idx_collabo_exits_role ON collabo_collaborator_exits(project_id,application_id,status);
