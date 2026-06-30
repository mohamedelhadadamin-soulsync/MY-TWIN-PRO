
-- تشغيل في محرر SQL بلوحة تحكم Supabase
CREATE TABLE IF NOT EXISTS proactive_notifications (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT,
  body TEXT,
  type TEXT DEFAULT 'emotional_support',
  emotion TEXT DEFAULT 'neutral',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_proactive_user ON proactive_notifications(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS sync_history (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  events_total INT DEFAULT 0,
  events_today INT DEFAULT 0,
  recommendation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sync_user ON sync_history(user_id, created_at DESC);

