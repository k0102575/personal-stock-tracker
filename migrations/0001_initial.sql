CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  brand TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  volume_or_unit TEXT NOT NULL DEFAULT '',
  current_quantity REAL NOT NULL DEFAULT 0,
  minimum_quantity REAL NOT NULL DEFAULT 0,
  purchase_source TEXT NOT NULL DEFAULT '',
  purchase_date TEXT,
  opened_date TEXT,
  expiry_date TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  memo TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);
CREATE INDEX IF NOT EXISTS idx_items_expiry_date ON items(expiry_date);
CREATE INDEX IF NOT EXISTS idx_items_updated_at ON items(updated_at DESC);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
