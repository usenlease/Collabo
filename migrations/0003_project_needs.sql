CREATE TABLE IF NOT EXISTS project_needs (id TEXT PRIMARY KEY, project_id TEXT NOT NULL, position INTEGER NOT NULL CHECK(position BETWEEN 1 AND 10), item_name TEXT NOT NULL, quantity INTEGER NOT NULL CHECK(quantity BETWEEN 1 AND 10000), details TEXT NOT NULL DEFAULT '', UNIQUE(project_id,position));
CREATE INDEX IF NOT EXISTS idx_project_needs_project ON project_needs(project_id);
