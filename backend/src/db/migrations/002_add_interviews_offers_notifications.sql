-- ============================================
-- 1. INTERVIEWS TABLE
-- Interview scheduling and tracking
-- ============================================
CREATE TABLE IF NOT EXISTS interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL UNIQUE REFERENCES applications(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    recruiter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    interview_type VARCHAR(50) NOT NULL CHECK (interview_type IN ('technical', 'hr', 'managerial', 'final')),
    round_number INTEGER DEFAULT 1,         -- Round 1, 2, etc.
    
    scheduled_at TIMESTAMPTZ NOT NULL,      -- Interview date/time
    duration_minutes INTEGER DEFAULT 60,
    
    interviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    meeting_link VARCHAR(500),              -- Google Meet, Zoom, Teams link
    meeting_type VARCHAR(50),               -- 'google_meet', 'zoom', 'teams', 'in_person'
    meeting_location VARCHAR(255),          -- Office location if in-person
    
    feedback_text TEXT,                     -- Post-interview feedback
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),  -- 1-5 star rating
    interviewer_notes TEXT,
    
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'rescheduled', 'cancelled')),
    
    reminder_sent_24h BOOLEAN DEFAULT FALSE,
    reminder_sent_1h BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interviews_application_id ON interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_interviews_job_id ON interviews(job_id);
CREATE INDEX IF NOT EXISTS idx_interviews_candidate_id ON interviews(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interviews_recruiter_id ON interviews(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_at ON interviews(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);

-- ============================================
-- 2. OFFERS TABLE
-- Job offers to candidates
-- ============================================
CREATE TABLE IF NOT EXISTS offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL UNIQUE REFERENCES applications(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    recruiter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    salary_offered INTEGER NOT NULL,
    salary_currency VARCHAR(10) DEFAULT 'PKR',
    benefits TEXT[] DEFAULT '{}',           -- Array of benefits
    joining_date DATE NOT NULL,
    
    offer_letter_url TEXT,                  -- PDF/Document URL
    offer_expiry_date DATE NOT NULL,        -- Usually 7 days from creation
    
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending',          -- Awaiting candidate response
        'accepted',         -- Candidate accepted offer
        'declined',         -- Candidate declined
        'expired',          -- Offer expired
        'rescinded'         -- Recruiter withdrew offer
    )),
    
    decline_reason VARCHAR(200),            -- Why candidate declined
    decline_feedback TEXT,                  -- Candidate optional feedback
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    declined_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offers_application_id ON offers(application_id);
CREATE INDEX IF NOT EXISTS idx_offers_job_id ON offers(job_id);
CREATE INDEX IF NOT EXISTS idx_offers_candidate_id ON offers(candidate_id);
CREATE INDEX IF NOT EXISTS idx_offers_recruiter_id ON offers(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);
CREATE INDEX IF NOT EXISTS idx_offers_expiry_date ON offers(offer_expiry_date);

-- ============================================
-- 3. NOTIFICATIONS TABLE
-- Track notifications sent to users
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    type VARCHAR(50) NOT NULL,              -- 'application_status_change', 'interview_scheduled', 'offer_received', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    related_entity_type VARCHAR(50),        -- 'application', 'interview', 'offer'
    related_entity_id UUID,
    
    is_read BOOLEAN DEFAULT FALSE,
    is_sent BOOLEAN DEFAULT TRUE,           -- false if failed to send
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================
-- 4. INTERVIEW FEEDBACK TABLE (Optional detailed feedback)
-- ============================================
CREATE TABLE IF NOT EXISTS interview_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_id UUID NOT NULL UNIQUE REFERENCES interviews(id) ON DELETE CASCADE,
    
    technical_score INTEGER CHECK (technical_score >= 0 AND technical_score <= 10),
    communication_score INTEGER CHECK (communication_score >= 0 AND communication_score <= 10),
    culture_fit_score INTEGER CHECK (culture_fit_score >= 0 AND culture_fit_score <= 10),
    
    strengths TEXT,                         -- What candidate did well
    areas_for_improvement TEXT,             -- Weak areas
    
    recommendation VARCHAR(50) DEFAULT 'maybe' CHECK (recommendation IN ('strong_yes', 'yes', 'maybe', 'no', 'strong_no')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interview_feedback_interview_id ON interview_feedback(interview_id);

-- ============================================
-- Apply updated_at trigger to new tables
-- ============================================
CREATE TRIGGER update_interviews_updated_at
    BEFORE UPDATE ON interviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offers_updated_at
    BEFORE UPDATE ON offers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interview_feedback_updated_at
    BEFORE UPDATE ON interview_feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
