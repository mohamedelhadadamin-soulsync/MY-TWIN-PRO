-- جداول Twin State الجديدة

CREATE TABLE IF NOT EXISTS twin_internal_states (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    mood TEXT DEFAULT 'calm',
    energy_level FLOAT DEFAULT 0.8,
    curiosity FLOAT DEFAULT 0.7,
    bond_depth FLOAT DEFAULT 0.1,
    last_thought TEXT,
    pending_questions TEXT[] DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS relationship_economy (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    trust FLOAT DEFAULT 0.3,
    intimacy FLOAT DEFAULT 0.1,
    respect FLOAT DEFAULT 0.5,
    shared_history FLOAT DEFAULT 0.0,
    conflict_recovery FLOAT DEFAULT 0.8,
    attachment TEXT DEFAULT 'secure',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS twin_goals (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    goal_id TEXT NOT NULL,
    title_ar TEXT,
    title_en TEXT,
    progress FLOAT DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS twin_personalities (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    openness FLOAT DEFAULT 0.75,
    conscientiousness FLOAT DEFAULT 0.80,
    extraversion FLOAT DEFAULT 0.55,
    agreeableness FLOAT DEFAULT 0.85,
    neuroticism FLOAT DEFAULT 0.25,
    humor FLOAT DEFAULT 0.60,
    patience FLOAT DEFAULT 0.85,
    confidence FLOAT DEFAULT 0.70,
    empathy FLOAT DEFAULT 0.90,
    curiosity FLOAT DEFAULT 0.80,
    emotional_stability FLOAT DEFAULT 0.80,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
