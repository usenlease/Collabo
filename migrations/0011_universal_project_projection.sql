-- Universal projection, actual ledger, participant valuation and milestones.
CREATE TABLE IF NOT EXISTS collabo_projection_settings (
 project_id TEXT PRIMARY KEY, currency TEXT NOT NULL DEFAULT 'KES',
 projected_revenue REAL NOT NULL DEFAULT 0, projected_expenses REAL NOT NULL DEFAULT 0,
 success_fee_percent REAL NOT NULL DEFAULT 5,
 closure_status TEXT NOT NULL DEFAULT 'active',
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS collabo_projection_participants (
 id TEXT PRIMARY KEY, project_id TEXT NOT NULL, display_name TEXT NOT NULL,
 role_name TEXT NOT NULL, contribution_type TEXT NOT NULL, contribution_details TEXT NOT NULL DEFAULT '',
 contribution_value REAL NOT NULL CHECK(contribution_value>=0),
 profit_share_percent REAL, member_clerk_id TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_projection_participants ON collabo_projection_participants(project_id);
CREATE TABLE IF NOT EXISTS collabo_projection_entries (
 id TEXT PRIMARY KEY, project_id TEXT NOT NULL, entry_type TEXT NOT NULL CHECK(entry_type IN ('income','expense')),
 category TEXT NOT NULL, description TEXT NOT NULL, amount REAL NOT NULL CHECK(amount>0),
 entry_date TEXT NOT NULL, created_by TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_projection_entries ON collabo_projection_entries(project_id);
CREATE TABLE IF NOT EXISTS collabo_projection_milestones (
 id TEXT PRIMARY KEY, project_id TEXT NOT NULL, title TEXT NOT NULL, stage TEXT NOT NULL DEFAULT 'planned',
 notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS collabo_projection_payments (
 id TEXT PRIMARY KEY, project_id TEXT NOT NULL, participant_id TEXT NOT NULL,
 amount REAL NOT NULL CHECK(amount>0), reference TEXT NOT NULL, created_by TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
