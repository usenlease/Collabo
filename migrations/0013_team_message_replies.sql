ALTER TABLE project_team_messages ADD COLUMN reply_to_id TEXT REFERENCES project_team_messages(id);
CREATE INDEX IF NOT EXISTS idx_team_message_reply_parent ON project_team_messages(reply_to_id);
