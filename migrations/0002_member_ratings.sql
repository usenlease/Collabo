-- Run on both preview and production D1 before enabling ratings.
CREATE TABLE IF NOT EXISTS member_ratings (
 id TEXT PRIMARY KEY,
 project_id TEXT NOT NULL,
 rater_clerk_id TEXT NOT NULL,
 rated_clerk_id TEXT NOT NULL,
 stars INTEGER NOT NULL CHECK(stars BETWEEN 1 AND 5),
 comment TEXT NOT NULL DEFAULT '',
 created_at TEXT NOT NULL DEFAULT (datetime('now')),
 updated_at TEXT NOT NULL DEFAULT (datetime('now')),
 UNIQUE(project_id,rater_clerk_id,rated_clerk_id)
);
CREATE INDEX IF NOT EXISTS idx_member_ratings_target ON member_ratings(rated_clerk_id);
