-- Existing approved participants retain their existing history access.
-- Newly approved participants receive the actual approval timestamp.
ALTER TABLE role_applications ADD COLUMN approved_at TEXT;
UPDATE role_applications SET approved_at='1970-01-01 00:00:00' WHERE status='approved' AND approved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_role_applications_chat_join ON role_applications(project_id,applicant_clerk_id,status,approved_at);
