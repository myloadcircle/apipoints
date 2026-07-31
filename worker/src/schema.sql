-- APIPoints D1 Schema

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT DEFAULT '',
  name TEXT DEFAULT '',
  email_verified INTEGER DEFAULT 0,
  verification_token TEXT,
  verification_expires TEXT,
  password_reset_token TEXT,
  password_reset_expires TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS credits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id),
  balance INTEGER DEFAULT 5000,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS credit_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id),
  amount INTEGER NOT NULL,
  type TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  system_prompt TEXT DEFAULT '',
  model TEXT DEFAULT 'gpt-4o-mini',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS agent_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id TEXT NOT NULL REFERENCES agents(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  input TEXT DEFAULT '',
  output TEXT DEFAULT '',
  tokens_used INTEGER DEFAULT 0,
  credits_burned INTEGER DEFAULT 0,
  status TEXT DEFAULT 'success',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  name TEXT DEFAULT '',
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  last_used_at TEXT
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  plan TEXT DEFAULT 'free',
  status TEXT DEFAULT 'active',
  current_period_start TEXT,
  current_period_end TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS webhooks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  url TEXT NOT NULL,
  events TEXT DEFAULT '[]',
  active INTEGER DEFAULT 1,
  secret TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS api_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  credits_used INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_api_usage_user_time ON api_usage(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON api_usage(endpoint, created_at);

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
