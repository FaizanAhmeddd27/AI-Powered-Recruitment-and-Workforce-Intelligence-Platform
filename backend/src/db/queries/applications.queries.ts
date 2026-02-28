export const ApplicationQueries = {
  // CREATE
  createApplication: `
    INSERT INTO applications (job_id, candidate_id, resume_mongo_id, cover_letter, expected_salary, notice_period_days)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `,

  // READ
  findById: `
    SELECT a.*, 
           j.title as job_title, j.company as job_company, j.location as job_location,
           u.full_name as candidate_name, u.email as candidate_email, u.avatar_url as candidate_avatar
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    JOIN users u ON a.candidate_id = u.id
    WHERE a.id = $1
  `,

  // Check if already applied
  checkExisting: `
    SELECT id FROM applications WHERE job_id = $1 AND candidate_id = $2
  `,

  // Candidate's applications
  getCandidateApplications: `
    SELECT a.*, j.title as job_title, j.company as job_company, j.location as job_location,
           j.salary_min, j.salary_max, j.job_type
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    WHERE a.candidate_id = $1
    ORDER BY a.applied_at DESC
    LIMIT $2 OFFSET $3
  `,

  getCandidateApplicationsCount: `
    SELECT COUNT(*) as total FROM applications WHERE candidate_id = $1
  `,

  // Job's applications (for recruiter)
  getJobApplications: `
    SELECT a.*, u.full_name as candidate_name, u.email as candidate_email,
           u.avatar_url as candidate_avatar, u.location as candidate_location,
           u.parsed_resume_mongo_id
    FROM applications a
    JOIN users u ON a.candidate_id = u.id
    WHERE a.job_id = $1
    ORDER BY a.ai_match_score DESC NULLS LAST, a.applied_at DESC
    LIMIT $2 OFFSET $3
  `,

  getJobApplicationsCount: `
    SELECT COUNT(*) as total FROM applications WHERE job_id = $1
  `,

  // UPDATE
  updateStatus: `
    UPDATE applications 
    SET status = $2, reviewed_at = NOW()
    WHERE id = $1
    RETURNING *
  `,

  updateAiScore: `
    UPDATE applications 
    SET ai_match_score = $2, ai_analysis = $3
    WHERE id = $1
    RETURNING *
  `,

  addRecruiterNotes: `
    UPDATE applications SET recruiter_notes = $2 WHERE id = $1 RETURNING *
  `,

  // STATS
  getCandidateStats: `
    SELECT 
      COUNT(*) as total_applications,
      COUNT(*) FILTER (WHERE status = 'pending') as pending,
      COUNT(*) FILTER (WHERE status = 'under_review') as under_review,
      COUNT(*) FILTER (WHERE status = 'shortlisted') as shortlisted,
      COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
      COUNT(*) FILTER (WHERE status = 'hired') as hired,
      ROUND(AVG(ai_match_score)::numeric, 2) as avg_match_score
    FROM applications WHERE candidate_id = $1
  `,

  getRecruiterStats: `
    SELECT 
      COUNT(DISTINCT j.id) as total_jobs,
      COUNT(DISTINCT j.id) FILTER (WHERE j.status = 'active') as active_jobs,
      COUNT(a.id) as total_applications,
      COUNT(a.id) FILTER (WHERE a.status = 'shortlisted') as shortlisted,
      COUNT(a.id) FILTER (WHERE a.status = 'hired') as hired
    FROM jobs j
    LEFT JOIN applications a ON j.id = a.job_id
    WHERE j.recruiter_id = $1
  `,

  // ADMIN
  getApplicationStats: `
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE applied_at > NOW() - INTERVAL '7 days') as this_week,
      COUNT(*) FILTER (WHERE applied_at > NOW() - INTERVAL '30 days') as this_month,
      ROUND(AVG(ai_match_score)::numeric, 2) as avg_match_score
    FROM applications
  `,

  getRecentApplications: `
    SELECT a.*, j.title as job_title, j.company as job_company,
           u.full_name as candidate_name
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    JOIN users u ON a.candidate_id = u.id
    ORDER BY a.applied_at DESC
    LIMIT $1
  `,
};