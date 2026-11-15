PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS users (
  clerk_user_id TEXT PRIMARY KEY,
  display_name TEXT,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('member','admin')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS collabos (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(clerk_user_id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  collaboration_type TEXT NOT NULL CHECK(collaboration_type IN ('Local','Remote','Hybrid')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','completed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TEXT,
  reviewed_by TEXT REFERENCES users(clerk_user_id)
);
CREATE INDEX IF NOT EXISTS collabos_status_created ON collabos(status,created_at);
CREATE INDEX IF NOT EXISTS collabos_owner ON collabos(owner_id);
CREATE TABLE IF NOT EXISTS collabo_photos (
  id TEXT PRIMARY KEY,
  collabo_id TEXT NOT NULL REFERENCES collabos(id),
  object_key TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS collabo_photos_key ON collabo_photos(object_key);
CREATE TABLE IF NOT EXISTS admin_audit (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL REFERENCES users(clerk_user_id),
  collabo_id TEXT NOT NULL REFERENCES collabos(id),
  action TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
