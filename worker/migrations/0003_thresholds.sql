-- Threshold Alerts table
CREATE TABLE IF NOT EXISTS thresholds (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  model_id TEXT NOT NULL,
  cost_threshold REAL,
  latency_threshold REAL,
  notification_channel TEXT NOT NULL DEFAULT 'email' CHECK(notification_channel IN ('email', 'webhook', 'slack')),
  webhook_url TEXT,
  slack_webhook_url TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_thresholds_user ON thresholds(user_id);
CREATE INDEX IF NOT EXISTS idx_thresholds_model ON thresholds(model_id);

-- Track last notification time per threshold (rate limiting)
CREATE TABLE IF NOT EXISTS threshold_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  threshold_id TEXT NOT NULL REFERENCES thresholds(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  notified_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_threshold_notif_time ON threshold_notifications(threshold_id, notified_at);
