-- Compute (Daytona) tables
CREATE TABLE IF NOT EXISTS tenant_wallets (
  tenant_id TEXT PRIMARY KEY,
  organization_name TEXT DEFAULT '',
  tier TEXT DEFAULT 'free',
  credit_balance_usd REAL DEFAULT 0.0,
  monthly_spend_cap_usd REAL DEFAULT 0.0,
  monthly_usage_usd REAL DEFAULT 0.0,
  active_sandboxes INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS compute_usage_ledger (
  ledger_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  sandbox_id TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  units_consumed REAL NOT NULL,
  daytona_wholesale_cost REAL NOT NULL,
  apipoints_margin_pct REAL NOT NULL,
  apipoints_retail_charged REAL NOT NULL,
  timestamp TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS compute_sandboxes (
  sandbox_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  daytona_sandbox_id TEXT,
  status TEXT DEFAULT 'provisioning',
  resource_type TEXT DEFAULT 'vcpu',
  vcpu_count REAL DEFAULT 1,
  memory_mb INTEGER DEFAULT 512,
  gpu_type TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  stopped_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_ledger_tenant_time ON compute_usage_ledger(tenant_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_sandboxes_tenant ON compute_sandboxes(tenant_id, status);
