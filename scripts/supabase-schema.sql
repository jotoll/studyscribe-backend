-- Dicttr Database Schema for Supabase SQL Editor
-- Execute this in Supabase Dashboard > SQL Editor

-- 1. Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    stripe_customer_id TEXT UNIQUE,
    subscription_status TEXT DEFAULT 'free',
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create transcriptions table
CREATE TABLE IF NOT EXISTS transcriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subject TEXT,
    original_text TEXT,
    enhanced_text TEXT,
    audio_file_url TEXT,
    audio_duration INTEGER,
    file_size INTEGER,
    confidence_score NUMERIC(4,3),
    language TEXT DEFAULT 'es',
    is_public BOOLEAN DEFAULT FALSE,
    processing_status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create documents_v2 table
CREATE TABLE IF NOT EXISTS documents_v2 (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transcription_id UUID REFERENCES transcriptions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    doc_id TEXT NOT NULL,
    meta JSONB DEFAULT '{"curso": "", "asignatura": "", "idioma": "es"}',
    blocks JSONB NOT NULL DEFAULT '[]',
    version INTEGER DEFAULT 1,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create study_materials table
CREATE TABLE IF NOT EXISTS study_materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transcription_id UUID REFERENCES transcriptions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    content JSONB NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT UNIQUE,
    stripe_price_id TEXT,
    status TEXT NOT NULL,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create usage_metrics table
CREATE TABLE IF NOT EXISTS usage_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    transcription_count INTEGER DEFAULT 0,
    audio_minutes INTEGER DEFAULT 0,
    ai_requests INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create indexes
CREATE INDEX IF NOT EXISTS idx_transcriptions_user_id ON transcriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_created_at ON transcriptions(created_at);
CREATE INDEX IF NOT EXISTS idx_transcriptions_subject ON transcriptions(subject);
CREATE INDEX IF NOT EXISTS idx_documents_v2_user_id ON documents_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_v2_transcription_id ON documents_v2(transcription_id);
CREATE INDEX IF NOT EXISTS idx_study_materials_user_id ON study_materials(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_user_date ON usage_metrics(user_id, date);

-- 8. Create RLS (Row Level Security) policies
-- Policies for users
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

-- Policies for transcriptions
CREATE POLICY "Users can view own transcriptions" ON transcriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transcriptions" ON transcriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transcriptions" ON transcriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transcriptions" ON transcriptions FOR DELETE USING (auth.uid() = user_id);

-- Policies for documents_v2
CREATE POLICY "Users can view own documents" ON documents_v2 FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own documents" ON documents_v2 FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own documents" ON documents_v2 FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own documents" ON documents_v2 FOR DELETE USING (auth.uid() = user_id);

-- Policies for study_materials
CREATE POLICY "Users can view own study materials" ON study_materials FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own study materials" ON study_materials FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for usage_metrics
CREATE POLICY "Users can view own usage" ON usage_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own usage" ON usage_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 9. Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transcriptions_updated_at 
    BEFORE UPDATE ON transcriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_v2_updated_at 
    BEFORE UPDATE ON documents_v2 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at 
    BEFORE UPDATE ON subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Create exec_sql function for programmatic access
CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    EXECUTE sql;
END;
$$;

-- Success message
SELECT '✅ Dicttr database schema created successfully!' as status;