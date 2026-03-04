
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE
-- Stores all users: candidates, recruiters, admins
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),              -- NULL for OAuth users
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('candidate', 'recruiter', 'admin')),
    auth_provider VARCHAR(20) NOT NULL DEFAULT 'local' CHECK (auth_provider IN ('local', 'google', 'github')),
    provider_id VARCHAR(255),                -- Google/GitHub user ID
    avatar_url TEXT,
    phone VARCHAR(20),
    location VARCHAR(255),
    linkedin_url TEXT,
    github_url TEXT,
    portfolio_url TEXT,
    bio TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    resume_mongo_id VARCHAR(50),             -- MongoDB ObjectId as string
    parsed_resume_mongo_id VARCHAR(50),      -- MongoDB ObjectId as string
    profile_completion INTEGER DEFAULT 0 CHECK (profile_completion >= 0 AND profile_completion <= 100),
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);
CREATE INDEX IF NOT EXISTS idx_users_provider_id ON users(provider_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- ============================================
-- 2. CANDIDATE PROFILES TABLE
-- Extra details for candidates
-- ============================================
CREATE TABLE IF NOT EXISTS candidate_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    headline VARCHAR(255),                   -- "Senior Frontend Developer"
    total_experience_years DECIMAL(4,1) DEFAULT 0,
    current_company VARCHAR(255),
    current_title VARCHAR(255),
    expected_salary_min INTEGER,
    expected_salary_max INTEGER,
    salary_currency VARCHAR(10) DEFAULT 'PKR',
    notice_period_days INTEGER DEFAULT 0,
    is_open_to_work BOOLEAN DEFAULT TRUE,
    preferred_job_types TEXT[] DEFAULT '{}',  -- PostgreSQL array
    preferred_locations TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_candidate_profiles_user_id ON candidate_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_open_to_work ON candidate_profiles(is_open_to_work);

-- ============================================
-- 3. CANDIDATE SKILLS TABLE
-- Skills associated with candidates
-- ============================================
CREATE TABLE IF NOT EXISTS candidate_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    years_of_experience DECIMAL(4,1) DEFAULT 0,
    proficiency_level VARCHAR(20) DEFAULT 'intermediate' 
        CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    is_ai_extracted BOOLEAN DEFAULT FALSE,   -- true if AI pulled from resume
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, skill_name)              -- One skill per user
);

CREATE INDEX IF NOT EXISTS idx_candidate_skills_user_id ON candidate_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_candidate_skills_skill_name ON candidate_skills(skill_name);

-- ============================================
-- 4. CANDIDATE EXPERIENCE TABLE
-- Work experience entries
-- ============================================
CREATE TABLE IF NOT EXISTS candidate_experience (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    start_date DATE NOT NULL,
    end_date DATE,                           -- NULL = current
    is_current BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_candidate_experience_user_id ON candidate_experience(user_id);

-- ============================================
-- 5. CANDIDATE EDUCATION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS candidate_education (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    degree VARCHAR(255) NOT NULL,
    institution VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    field_of_study VARCHAR(255),
    start_year INTEGER,
    end_year INTEGER,
    grade VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_candidate_education_user_id ON candidate_education(user_id);

-- ============================================
-- 6. JOBS TABLE
-- Job postings by recruiters
-- ============================================
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recruiter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    job_type VARCHAR(20) NOT NULL CHECK (job_type IN ('full-time', 'part-time', 'contract', 'internship')),
    workplace_type VARCHAR(20) NOT NULL DEFAULT 'on-site' CHECK (workplace_type IN ('on-site', 'remote', 'hybrid')),
    experience_level VARCHAR(20) NOT NULL CHECK (experience_level IN ('entry', 'mid', 'senior', 'lead', 'executive')),
    min_experience_years INTEGER DEFAULT 0,
    max_experience_years INTEGER DEFAULT 0,
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency VARCHAR(10) DEFAULT 'PKR',
    benefits TEXT[] DEFAULT '{}',            -- PostgreSQL array
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft', 'paused')),
    applications_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_recruiter_id ON jobs(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_jobs_experience_level ON jobs(experience_level);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_salary ON jobs(salary_min, salary_max);

-- ============================================
-- 7. JOB SKILLS TABLE
-- Required skills for a job
-- ============================================
CREATE TABLE IF NOT EXISTS job_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    min_years INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT TRUE,        -- must-have vs nice-to-have
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(job_id, skill_name)
);

CREATE INDEX IF NOT EXISTS idx_job_skills_job_id ON job_skills(job_id);
CREATE INDEX IF NOT EXISTS idx_job_skills_skill_name ON job_skills(skill_name);

-- ============================================
-- 8. APPLICATIONS TABLE
-- Candidate applications to jobs
-- ============================================
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resume_mongo_id VARCHAR(50),             -- MongoDB resume reference
    cover_letter TEXT,
    expected_salary INTEGER,
    notice_period_days INTEGER,
    status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'under_review', 'shortlisted', 'interview', 'offered', 'hired', 'rejected', 'withdrawn')),
    ai_match_score DECIMAL(5,2),             -- 0.00 to 100.00
    ai_analysis JSONB,                       -- Structured AI analysis
    recruiter_notes TEXT,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(job_id, candidate_id)             -- One application per job per candidate
);

CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_ai_match_score ON applications(ai_match_score DESC);
CREATE INDEX IF NOT EXISTS idx_applications_applied_at ON applications(applied_at DESC);

-- ============================================
-- 9. SAVED JOBS TABLE
-- Jobs bookmarked by candidates
-- ============================================
CREATE TABLE IF NOT EXISTS saved_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    saved_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id ON saved_jobs(user_id);

-- ============================================
-- 10. ACTIVITY LOG TABLE
-- Track all platform activity (for admin)
-- ============================================
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,            -- 'user_signup', 'job_posted', 'application_submitted'
    entity_type VARCHAR(50),                 -- 'user', 'job', 'application'
    entity_id UUID,
    metadata JSONB,                          -- Extra details
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log(action);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);

-- ============================================
-- 11. REFRESH TOKENS TABLE
-- Store refresh tokens for JWT rotation
-- ============================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    device_info VARCHAR(255),
    ip_address VARCHAR(45),
    expires_at TIMESTAMPTZ NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- Auto-update updated_at column
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidate_profiles_updated_at
    BEFORE UPDATE ON candidate_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidate_experience_updated_at
    BEFORE UPDATE ON candidate_experience
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();