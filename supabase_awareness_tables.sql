-- ============================================================
-- MyTwin AI v17.0.0 – جداول Awareness Score & Twin Brain
-- ============================================================

-- 1. إضافة عمود درجة الوعي إلى جدول profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS awareness_score FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS awareness_score_updated_at TIMESTAMPTZ;

-- 2. جدول حالة التوأم (يُستخدم من Identity Service)
CREATE TABLE IF NOT EXISTS twin_states (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    traits TEXT[] DEFAULT '{}',
    evolution_stage INT DEFAULT 0,
    twin_name TEXT DEFAULT 'MyTwin',
    interaction_count INT DEFAULT 0,
    description_ar TEXT,
    description_en TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. جدول سجل استخدام الذاكرة (لتتبع الذكريات المستخدمة في المحادثات)
CREATE TABLE IF NOT EXISTS memory_usage_log (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    memory_type TEXT NOT NULL, -- 'emotional', 'reflection', 'identity', 'relationship'
    memory_id TEXT,
    context_used TEXT,
    response_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. إضافة نوع الإشعار "proactive" مع awareness_score إلى جدول proactive_notifications
ALTER TABLE proactive_notifications 
ADD COLUMN IF NOT EXISTS awareness_score_at_time FLOAT;

-- 5. فهرس لتحسين أداء استعلامات الوعي
CREATE INDEX IF NOT EXISTS idx_emotional_memory_user_created 
ON emotional_memory(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reflection_insights_user_created 
ON reflection_insights(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_proactive_notifications_user_created 
ON proactive_notifications(user_id, created_at DESC);
