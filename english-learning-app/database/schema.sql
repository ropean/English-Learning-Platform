-- =====================================================
-- 英语学习平台 - 数据库 Schema
-- Supabase PostgreSQL
-- =====================================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. 用户表（由 Supabase Auth 自动管理，这里只是参考）
-- =====================================================
-- Supabase 会自动创建 auth.users 表
-- 我们不需要手动创建用户表

-- =====================================================
-- 2. 词汇表
-- =====================================================
CREATE TABLE IF NOT EXISTS words (
  id SERIAL PRIMARY KEY,
  word VARCHAR(100) UNIQUE NOT NULL,
  pronunciation VARCHAR(100),
  audio_url TEXT,
  part_of_speech VARCHAR(50),
  level VARCHAR(10) NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  meaning_cn TEXT,
  definition_en TEXT NOT NULL,
  example_en TEXT,
  example_cn TEXT,
  category VARCHAR(50),
  frequency_rank INTEGER,
  synonyms TEXT[],
  antonyms TEXT[],
  source VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引优化查询
CREATE INDEX idx_words_level ON words(level);
CREATE INDEX idx_words_frequency ON words(frequency_rank);
CREATE INDEX idx_words_category ON words(category);

-- =====================================================
-- 3. 用户进度表
-- =====================================================
CREATE TABLE IF NOT EXISTS user_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  current_level VARCHAR(10) DEFAULT 'A1',
  streak_days INTEGER DEFAULT 0,
  last_study_date DATE,
  words_learned INTEGER DEFAULT 0,
  quizzes_taken INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  total_answers INTEGER DEFAULT 0,
  mastered_words INTEGER[] DEFAULT '{}',
  badges TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_user_progress_user ON user_progress(user_id);

-- =====================================================
-- 4. 用户已掌握单词表
-- =====================================================
CREATE TABLE IF NOT EXISTS user_mastered_words (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id INTEGER REFERENCES words(id) ON DELETE CASCADE,
  mastery_level INTEGER DEFAULT 1 CHECK (mastery_level BETWEEN 1 AND 5),
  review_count INTEGER DEFAULT 0,
  last_reviewed_at TIMESTAMP,
  next_review_at TIMESTAMP,
  mastered_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, word_id)
);

-- 创建索引
CREATE INDEX idx_user_mastered_words_user ON user_mastered_words(user_id);
CREATE INDEX idx_user_mastered_words_next_review ON user_mastered_words(next_review_at);

-- =====================================================
-- 5. 测验记录表
-- =====================================================
CREATE TABLE IF NOT EXISTS quiz_results (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  level VARCHAR(10) NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  accuracy DECIMAL(5,2),
  points_earned INTEGER DEFAULT 0,
  time_spent INTEGER,
  completed_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_quiz_results_user ON quiz_results(user_id);
CREATE INDEX idx_quiz_results_completed ON quiz_results(completed_at);

-- =====================================================
-- 6. 测验详细记录表（可选）
-- =====================================================
CREATE TABLE IF NOT EXISTS quiz_answers (
  id SERIAL PRIMARY KEY,
  quiz_id INTEGER REFERENCES quiz_results(id) ON DELETE CASCADE,
  word_id INTEGER REFERENCES words(id),
  user_answer TEXT,
  correct_answer TEXT,
  is_correct BOOLEAN,
  answered_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_quiz_answers_quiz ON quiz_answers(quiz_id);

-- =====================================================
-- 7. 徽章表
-- =====================================================
CREATE TABLE IF NOT EXISTS badges (
  id SERIAL PRIMARY KEY,
  badge_key VARCHAR(50) UNIQUE NOT NULL,
  name_cn VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  description TEXT,
  icon VARCHAR(10),
  condition_type VARCHAR(50),
  condition_value INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_badges_key ON badges(badge_key);

-- =====================================================
-- 8. 用户徽章关联表
-- =====================================================
CREATE TABLE IF NOT EXISTS user_badges (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id INTEGER REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- 创建索引
CREATE INDEX idx_user_badges_user ON user_badges(user_id);

-- =====================================================
-- 9. 学习记录表
-- =====================================================
CREATE TABLE IF NOT EXISTS study_sessions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type VARCHAR(20) CHECK (session_type IN ('learn', 'quiz', 'review')),
  level VARCHAR(10),
  words_studied INTEGER DEFAULT 0,
  duration INTEGER,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_study_sessions_user ON study_sessions(user_id);
CREATE INDEX idx_study_sessions_started ON study_sessions(started_at);

-- =====================================================
-- 10. 用户设置表
-- =====================================================
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme VARCHAR(20) DEFAULT 'light',
  language VARCHAR(10) DEFAULT 'zh-CN',
  notification_enabled BOOLEAN DEFAULT TRUE,
  daily_goal INTEGER DEFAULT 10,
  review_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 初始化徽章数据
-- =====================================================
INSERT INTO badges (badge_key, name_cn, name_en, description, icon, condition_type, condition_value)
VALUES
  ('first_word', '初学者', 'Beginner', '学习第一个单词', '🌱', 'words_count', 1),
  ('word_master_10', '词汇新手', 'Word Novice', '掌握10个单词', '📚', 'words_count', 10),
  ('word_master_50', '词汇达人', 'Word Master', '掌握50个单词', '📖', 'words_count', 50),
  ('word_master_100', '词汇大师', 'Word Expert', '掌握100个单词', '🎓', 'words_count', 100),
  ('quiz_master_5', '练习者', 'Practitioner', '完成5次测验', '✏️', 'quiz_count', 5),
  ('quiz_master_20', '测验专家', 'Quiz Expert', '完成20次测验', '📝', 'quiz_count', 20),
  ('accuracy_80', '精准射手', 'Sharpshooter', '总体正确率达到80%', '🎯', 'accuracy', 80),
  ('streak_7', '坚持不懈', 'Persistent', '连续学习7天', '🔥', 'streak', 7),
  ('streak_30', '习惯养成', 'Habit Former', '连续学习30天', '⭐', 'streak', 30),
  ('points_500', '积分达人', 'Point Collector', '获得500积分', '💎', 'points', 500),
  ('points_1000', '积分大师', 'Point Master', '获得1000积分', '👑', 'points', 1000)
ON CONFLICT (badge_key) DO NOTHING;

-- =====================================================
-- Row Level Security (RLS) 策略
-- =====================================================

-- 为所有用户相关表启用 RLS
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_mastered_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- 用户进度表策略
CREATE POLICY "Users can view own progress"
ON user_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
ON user_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
ON user_progress FOR UPDATE
USING (auth.uid() = user_id);

-- 已掌握单词表策略
CREATE POLICY "Users can view own mastered words"
ON user_mastered_words FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mastered words"
ON user_mastered_words FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 测验记录表策略
CREATE POLICY "Users can view own quiz results"
ON quiz_results FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz results"
ON quiz_results FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 测验答案表策略
CREATE POLICY "Users can view own quiz answers"
ON quiz_answers FOR SELECT
USING (EXISTS (
  SELECT 1 FROM quiz_results
  WHERE quiz_results.id = quiz_answers.quiz_id
  AND quiz_results.user_id = auth.uid()
));

CREATE POLICY "Users can insert own quiz answers"
ON quiz_answers FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM quiz_results
  WHERE quiz_results.id = quiz_answers.quiz_id
  AND quiz_results.user_id = auth.uid()
));

-- 用户徽章表策略
CREATE POLICY "Users can view own badges"
ON user_badges FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own badges"
ON user_badges FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 学习记录表策略
CREATE POLICY "Users can view own study sessions"
ON study_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study sessions"
ON study_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 用户设置表策略
CREATE POLICY "Users can view own settings"
ON user_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
ON user_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
ON user_settings FOR UPDATE
USING (auth.uid() = user_id);

-- 词汇表和徽章表：所有人可读
CREATE POLICY "Words are viewable by everyone"
ON words FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Badges are viewable by everyone"
ON badges FOR SELECT
TO authenticated, anon
USING (true);

-- =====================================================
-- 触发器：自动更新 updated_at 字段
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为相关表创建触发器
CREATE TRIGGER update_user_progress_updated_at
BEFORE UPDATE ON user_progress
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON user_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 完成！
-- =====================================================
-- 现在你可以开始使用数据库了。
-- 记得在 Supabase Dashboard 中查看表结构是否正确创建。
