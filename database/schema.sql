-- Filipino Adaptive Quiz Application - Database Schema
-- PostgreSQL 15.x
-- Author: MiniMax Agent
-- Version: 1.0.0
-- Last Updated: 2025-11-18

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(255),
    preferred_language VARCHAR(10) DEFAULT 'tl',
    education_level VARCHAR(50),
    date_of_birth DATE,
    profile_image_url TEXT,
    bio TEXT,
    total_points INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin'))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_last_activity ON users(last_activity_date);

COMMENT ON TABLE users IS 'Stores user account information and profile data';

-- Topics Table
CREATE TABLE topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_tl VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_ceb VARCHAR(255),
    name_ilo VARCHAR(255),
    name_hil VARCHAR(255),
    description_tl TEXT,
    description_en TEXT,
    parent_topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
    subject_area VARCHAR(100),
    icon_name VARCHAR(50),
    color_code VARCHAR(7),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_topics_parent ON topics(parent_topic_id);
CREATE INDEX idx_topics_subject ON topics(subject_area);
CREATE INDEX idx_topics_active ON topics(is_active);

COMMENT ON TABLE topics IS 'Hierarchical topic/subject organization with multilingual support';

-- Questions Table
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_text_tl TEXT NOT NULL,
    question_text_en TEXT NOT NULL,
    question_text_ceb TEXT,
    question_text_ilo TEXT,
    question_text_hil TEXT,
    topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5) DEFAULT 3,
    question_type VARCHAR(50) DEFAULT 'multiple_choice',
    points INTEGER DEFAULT 1 CHECK (points > 0),
    explanation_tl TEXT,
    explanation_en TEXT,
    cultural_context TEXT,
    media_url TEXT,
    media_type VARCHAR(20),
    tags TEXT[],
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    incorrect_count INTEGER DEFAULT 0,
    correct_rate DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN (correct_count + incorrect_count) > 0 
            THEN (correct_count::DECIMAL / (correct_count + incorrect_count)) * 100
            ELSE 0
        END
    ) STORED
);

CREATE INDEX idx_questions_topic ON questions(topic_id);
CREATE INDEX idx_questions_difficulty ON questions(difficulty_level);
CREATE INDEX idx_questions_active ON questions(is_active);
CREATE INDEX idx_questions_tags ON questions USING GIN(tags);
CREATE INDEX idx_questions_correct_rate ON questions(correct_rate);

COMMENT ON TABLE questions IS 'Question bank with multilingual content and analytics';

-- Question Options Table
CREATE TABLE question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    option_text_tl TEXT NOT NULL,
    option_text_en TEXT NOT NULL,
    option_text_ceb TEXT,
    option_text_ilo TEXT,
    option_text_hil TEXT,
    is_correct BOOLEAN DEFAULT FALSE,
    partial_credit_percentage DECIMAL(5,2) DEFAULT 0.0 CHECK (partial_credit_percentage BETWEEN 0 AND 100),
    option_order INTEGER,
    explanation_tl TEXT,
    explanation_en TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_options_question ON question_options(question_id);
CREATE INDEX idx_options_correct ON question_options(is_correct);

COMMENT ON TABLE question_options IS 'Answer options for questions with partial credit support';

-- ============================================================================
-- QUIZ SESSION TABLES
-- ============================================================================

-- Quiz Sessions Table
CREATE TABLE quiz_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
    session_name VARCHAR(255),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    total_questions INTEGER NOT NULL,
    questions_answered INTEGER DEFAULT 0,
    raw_score DECIMAL(8,2) DEFAULT 0.0,
    max_possible_score DECIMAL(8,2),
    percentage_score DECIMAL(5,2),
    adjusted_score DECIMAL(8,2),
    time_spent_seconds INTEGER DEFAULT 0,
    scoring_algorithm VARCHAR(50) DEFAULT 'standard',
    difficulty_level INTEGER DEFAULT 3,
    language_used VARCHAR(10) DEFAULT 'tl',
    is_completed BOOLEAN DEFAULT FALSE,
    is_practice BOOLEAN DEFAULT FALSE,
    session_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user ON quiz_sessions(user_id);
CREATE INDEX idx_sessions_topic ON quiz_sessions(topic_id);
CREATE INDEX idx_sessions_completed ON quiz_sessions(completed_at);
CREATE INDEX idx_sessions_is_completed ON quiz_sessions(is_completed);
CREATE INDEX idx_sessions_user_completed ON quiz_sessions(user_id, completed_at);

COMMENT ON TABLE quiz_sessions IS 'Individual quiz session tracking with comprehensive scoring';

-- Quiz Answers Table
CREATE TABLE quiz_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES quiz_sessions(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
    selected_option_id UUID REFERENCES question_options(id) ON DELETE SET NULL,
    confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 5),
    is_correct BOOLEAN,
    points_earned DECIMAL(6,2),
    points_possible DECIMAL(6,2),
    time_taken_seconds INTEGER,
    answer_sequence INTEGER,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    was_bookmarked BOOLEAN DEFAULT FALSE,
    notes TEXT
);

CREATE INDEX idx_answers_session ON quiz_answers(session_id);
CREATE INDEX idx_answers_question ON quiz_answers(question_id);
CREATE INDEX idx_answers_user_question ON quiz_answers(session_id, question_id);
CREATE INDEX idx_answers_bookmarked ON quiz_answers(was_bookmarked) WHERE was_bookmarked = TRUE;

COMMENT ON TABLE quiz_answers IS 'Individual answer records with timing and confidence tracking';

-- ============================================================================
-- PROGRESS AND ANALYTICS TABLES
-- ============================================================================

-- User Progress Table
CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
    questions_attempted INTEGER DEFAULT 0,
    questions_correct INTEGER DEFAULT 0,
    questions_incorrect INTEGER DEFAULT 0,
    average_accuracy DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN questions_attempted > 0 
            THEN (questions_correct::DECIMAL / questions_attempted) * 100
            ELSE 0
        END
    ) STORED,
    average_time_per_question INTEGER,
    total_time_spent INTEGER DEFAULT 0,
    current_difficulty_level INTEGER DEFAULT 1,
    recommended_difficulty INTEGER DEFAULT 1,
    total_points_earned INTEGER DEFAULT 0,
    best_score DECIMAL(5,2),
    last_score DECIMAL(5,2),
    consecutive_correct INTEGER DEFAULT 0,
    consecutive_incorrect INTEGER DEFAULT 0,
    first_attempted TIMESTAMP,
    last_attempted TIMESTAMP,
    strength_score DECIMAL(5,2),
    mastery_level VARCHAR(20) DEFAULT 'beginner',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, topic_id)
);

CREATE INDEX idx_progress_user ON user_progress(user_id);
CREATE INDEX idx_progress_topic ON user_progress(topic_id);
CREATE INDEX idx_progress_strength ON user_progress(strength_score);
CREATE INDEX idx_progress_mastery ON user_progress(mastery_level);

COMMENT ON TABLE user_progress IS 'Aggregated user performance metrics per topic';

-- Daily Activity Log Table
CREATE TABLE daily_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL,
    quizzes_completed INTEGER DEFAULT 0,
    questions_answered INTEGER DEFAULT 0,
    total_points_earned INTEGER DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0,
    average_accuracy DECIMAL(5,2),
    topics_studied UUID[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, activity_date)
);

CREATE INDEX idx_activity_user ON daily_activity_log(user_id);
CREATE INDEX idx_activity_date ON daily_activity_log(activity_date);
CREATE INDEX idx_activity_user_date ON daily_activity_log(user_id, activity_date);

COMMENT ON TABLE daily_activity_log IS 'Daily user activity aggregation for streak and analytics';

-- ============================================================================
-- GAMIFICATION TABLES
-- ============================================================================

-- Achievements Table
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL,
    name_tl VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    description_tl TEXT,
    description_en TEXT,
    badge_icon_url TEXT,
    badge_color VARCHAR(7),
    achievement_type VARCHAR(50) NOT NULL,
    requirement_criteria JSONB NOT NULL,
    points_reward INTEGER DEFAULT 0,
    rarity_level VARCHAR(20) DEFAULT 'common',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_achievements_type ON achievements(achievement_type);
CREATE INDEX idx_achievements_rarity ON achievements(rarity_level);

COMMENT ON TABLE achievements IS 'Achievement definitions with multilingual content';

-- User Achievements Table
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    progress_data JSONB DEFAULT '{}',
    is_completed BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_completed ON user_achievements(is_completed);
CREATE INDEX idx_user_achievements_earned ON user_achievements(earned_at);

COMMENT ON TABLE user_achievements IS 'User achievement progress and completion tracking';

-- Leaderboard Table (Materialized View)
CREATE TABLE leaderboard_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(100),
    period_type VARCHAR(20) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_points INTEGER DEFAULT 0,
    quizzes_completed INTEGER DEFAULT 0,
    questions_answered INTEGER DEFAULT 0,
    average_score DECIMAL(5,2),
    rank INTEGER,
    previous_rank INTEGER,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, period_type, period_start)
);

CREATE INDEX idx_leaderboard_period ON leaderboard_cache(period_type, period_start);
CREATE INDEX idx_leaderboard_rank ON leaderboard_cache(rank);
CREATE INDEX idx_leaderboard_user ON leaderboard_cache(user_id);

COMMENT ON TABLE leaderboard_cache IS 'Cached leaderboard rankings for performance';

-- ============================================================================
-- CONTENT MANAGEMENT TABLES
-- ============================================================================

-- User Settings Table
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'light',
    font_size VARCHAR(20) DEFAULT 'medium',
    default_language VARCHAR(10) DEFAULT 'tl',
    enable_sound BOOLEAN DEFAULT TRUE,
    enable_animations BOOLEAN DEFAULT TRUE,
    show_explanations BOOLEAN DEFAULT TRUE,
    auto_advance BOOLEAN DEFAULT FALSE,
    difficulty_preference INTEGER DEFAULT 3,
    questions_per_quiz INTEGER DEFAULT 20,
    enable_negative_scoring BOOLEAN DEFAULT FALSE,
    enable_confidence_scoring BOOLEAN DEFAULT FALSE,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_settings_user ON user_settings(user_id);

COMMENT ON TABLE user_settings IS 'User preferences and configuration';

-- Bookmarks Table
CREATE TABLE bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, question_id)
);

CREATE INDEX idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_question ON bookmarks(question_id);

COMMENT ON TABLE bookmarks IS 'User bookmarked questions for review';

-- Study Plans Table
CREATE TABLE study_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target_topics UUID[],
    daily_question_goal INTEGER DEFAULT 20,
    weekly_quiz_goal INTEGER DEFAULT 5,
    target_completion_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_study_plans_user ON study_plans(user_id);
CREATE INDEX idx_study_plans_active ON study_plans(is_active);

COMMENT ON TABLE study_plans IS 'User-created study plans and goals';

-- ============================================================================
-- SECURITY AND AUDIT TABLES
-- ============================================================================

-- User Sessions Table (for JWT refresh tokens)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT NOT NULL,
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(refresh_token);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

COMMENT ON TABLE user_sessions IS 'Active user sessions and refresh token management';

-- Audit Log Table
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_created ON audit_log(created_at);

COMMENT ON TABLE audit_log IS 'Comprehensive audit trail for security and compliance';

-- Suspicious Activity Table
CREATE TABLE suspicious_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id UUID REFERENCES quiz_sessions(id) ON DELETE SET NULL,
    activity_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'low',
    details JSONB,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by UUID REFERENCES users(id),
    is_resolved BOOLEAN DEFAULT FALSE,
    notes TEXT
);

CREATE INDEX idx_suspicious_user ON suspicious_activity(user_id);
CREATE INDEX idx_suspicious_session ON suspicious_activity(session_id);
CREATE INDEX idx_suspicious_severity ON suspicious_activity(severity);
CREATE INDEX idx_suspicious_resolved ON suspicious_activity(is_resolved);

COMMENT ON TABLE suspicious_activity IS 'Anti-cheating and fraud detection logs';

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function: Update timestamp on row modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON topics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Update question statistics
CREATE OR REPLACE FUNCTION update_question_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE questions
    SET 
        usage_count = usage_count + 1,
        correct_count = CASE WHEN NEW.is_correct THEN correct_count + 1 ELSE correct_count END,
        incorrect_count = CASE WHEN NOT NEW.is_correct THEN incorrect_count + 1 ELSE incorrect_count END
    WHERE id = NEW.question_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_question_stats_trigger
AFTER INSERT ON quiz_answers
FOR EACH ROW EXECUTE FUNCTION update_question_stats();

-- Function: Update user streak
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
    last_activity DATE;
    days_diff INTEGER;
BEGIN
    SELECT last_activity_date INTO last_activity FROM users WHERE id = NEW.user_id;
    
    IF last_activity IS NULL THEN
        UPDATE users SET current_streak = 1, last_activity_date = NEW.activity_date WHERE id = NEW.user_id;
    ELSE
        days_diff := NEW.activity_date - last_activity;
        
        IF days_diff = 1 THEN
            UPDATE users 
            SET 
                current_streak = current_streak + 1,
                longest_streak = GREATEST(longest_streak, current_streak + 1),
                last_activity_date = NEW.activity_date
            WHERE id = NEW.user_id;
        ELSIF days_diff > 1 THEN
            UPDATE users SET current_streak = 1, last_activity_date = NEW.activity_date WHERE id = NEW.user_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_streak_trigger
AFTER INSERT ON daily_activity_log
FOR EACH ROW EXECUTE FUNCTION update_user_streak();

-- Function: Calculate mastery level
CREATE OR REPLACE FUNCTION calculate_mastery_level(accuracy DECIMAL, attempts INTEGER)
RETURNS VARCHAR AS $$
BEGIN
    IF attempts < 10 THEN
        RETURN 'beginner';
    ELSIF accuracy >= 90 AND attempts >= 50 THEN
        RETURN 'expert';
    ELSIF accuracy >= 80 AND attempts >= 30 THEN
        RETURN 'advanced';
    ELSIF accuracy >= 70 AND attempts >= 20 THEN
        RETURN 'intermediate';
    ELSE
        RETURN 'beginner';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function: Get user performance summary
CREATE OR REPLACE FUNCTION get_user_performance_summary(p_user_id UUID)
RETURNS TABLE (
    total_quizzes BIGINT,
    total_questions BIGINT,
    overall_accuracy DECIMAL,
    total_time_hours DECIMAL,
    current_streak INTEGER,
    total_achievements INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT qs.id)::BIGINT,
        COUNT(qa.id)::BIGINT,
        ROUND(AVG(CASE WHEN qa.is_correct THEN 100 ELSE 0 END), 2),
        ROUND(SUM(qs.time_spent_seconds)::DECIMAL / 3600, 2),
        u.current_streak,
        COUNT(DISTINCT ua.id)::BIGINT
    FROM users u
    LEFT JOIN quiz_sessions qs ON u.id = qs.user_id AND qs.is_completed = TRUE
    LEFT JOIN quiz_answers qa ON qs.id = qa.session_id
    LEFT JOIN user_achievements ua ON u.id = ua.user_id AND ua.is_completed = TRUE
    WHERE u.id = p_user_id
    GROUP BY u.id, u.current_streak;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: Active users with performance summary
CREATE VIEW v_active_users AS
SELECT 
    u.id,
    u.username,
    u.full_name,
    u.total_points,
    u.current_streak,
    COUNT(DISTINCT qs.id) as total_quizzes,
    COUNT(DISTINCT qa.id) as total_questions,
    ROUND(AVG(CASE WHEN qa.is_correct THEN 100 ELSE 0 END), 2) as accuracy,
    u.last_activity_date
FROM users u
LEFT JOIN quiz_sessions qs ON u.id = qs.user_id AND qs.is_completed = TRUE
LEFT JOIN quiz_answers qa ON qs.id = qa.session_id
WHERE u.is_active = TRUE
GROUP BY u.id;

-- View: Question bank with statistics
CREATE VIEW v_questions_with_stats AS
SELECT 
    q.id,
    q.question_text_tl,
    q.question_text_en,
    q.difficulty_level,
    q.points,
    t.name_tl as topic_name,
    q.usage_count,
    q.correct_rate,
    COUNT(qo.id) as option_count
FROM questions q
LEFT JOIN topics t ON q.topic_id = t.id
LEFT JOIN question_options qo ON q.id = qo.question_id
WHERE q.is_active = TRUE
GROUP BY q.id, t.name_tl;

-- View: Recent quiz activity
CREATE VIEW v_recent_quiz_activity AS
SELECT 
    qs.id as session_id,
    u.username,
    t.name_tl as topic_name,
    qs.percentage_score,
    qs.questions_answered,
    qs.total_questions,
    qs.time_spent_seconds,
    qs.completed_at
FROM quiz_sessions qs
JOIN users u ON qs.user_id = u.id
LEFT JOIN topics t ON qs.topic_id = t.id
WHERE qs.is_completed = TRUE
ORDER BY qs.completed_at DESC;

-- ============================================================================
-- INITIAL DATA SEEDING
-- ============================================================================

-- Insert default achievements
INSERT INTO achievements (code, name_tl, name_en, description_tl, description_en, achievement_type, requirement_criteria, points_reward, rarity_level) VALUES
('FIRST_QUIZ', 'Unang Hakbang', 'First Steps', 'Kumpletuhin ang unang quiz', 'Complete your first quiz', 'milestone', '{"quizzes_completed": 1}', 10, 'common'),
('STREAK_7', 'Tapat na Mag-aaral', 'Persistent Learner', '7 araw na sunod-sunod na pag-aaral', '7-day learning streak', 'streak', '{"streak_days": 7}', 50, 'rare'),
('PERFECT_SCORE', 'Perpekto', 'Perfect Score', '100% sa anumang quiz', '100% score on any quiz', 'performance', '{"perfect_scores": 1}', 25, 'uncommon'),
('QUIZ_50', 'Tagahamon', 'Knowledge Seeker', '50 quiz na nakumpleto', '50 quizzes completed', 'milestone', '{"quizzes_completed": 50}', 100, 'rare'),
('SPEED_MASTER', 'Mabilis na Isip', 'Speed Demon', 'Kumpletuhin ang quiz sa loob ng 5 minuto', 'Complete quiz in under 5 minutes', 'performance', '{"time_limit_seconds": 300}', 30, 'uncommon'),
('MULTILINGUAL', 'Multingual', 'Multilingual', 'Magsagot sa 3 magkaibang wika', 'Answer in 3 different languages', 'diversity', '{"languages_used": 3}', 40, 'rare'),
('COMEBACK', 'Muling Pagbabalik', 'Comeback King', 'Taasan ang score ng 30% sa parehong paksa', 'Improve score by 30% in same topic', 'improvement', '{"score_improvement_percentage": 30}', 35, 'uncommon');

-- Insert sample topics (will be expanded with actual content)
INSERT INTO topics (name_tl, name_en, subject_area, icon_name, display_order) VALUES
('Gramatika ng Filipino', 'Filipino Grammar', 'Language', 'book', 1),
('Kasaysayan ng Pilipinas', 'Philippine History', 'History', 'clock', 2),
('Agham at Kalikasan', 'Science and Nature', 'Science', 'flask', 3),
('Matematika', 'Mathematics', 'Math', 'calculator', 4),
('Kultura at Sining', 'Culture and Arts', 'Arts', 'palette', 5);

COMMENT ON DATABASE CURRENT_DATABASE() IS 'Filipino Adaptive Quiz Application - Production Database';
