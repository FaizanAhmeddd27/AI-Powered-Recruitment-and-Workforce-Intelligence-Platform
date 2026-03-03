export const JobQueries = {
  // CREATE
  createJob: `
    INSERT INTO jobs (recruiter_id, title, company, department, description, location,
                      job_type, workplace_type, experience_level, min_experience_years,
                      max_experience_years, salary_min, salary_max, salary_currency, benefits, expires_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING *
  `,

  addJobSkill: `
    INSERT INTO job_skills (job_id, skill_name, min_years, is_required)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (job_id, skill_name) DO NOTHING
    RETURNING *
  `,

  // READ
  findById: `
    SELECT j.*, u.full_name as recruiter_name, u.avatar_url as recruiter_avatar
    FROM jobs j
    JOIN users u ON j.recruiter_id = u.id
    WHERE j.id = $1
  `,

  getJobSkills: `
    SELECT * FROM job_skills WHERE job_id = $1 ORDER BY is_required DESC, skill_name
  `,

  // BROWSE JOBS (with filters)
  searchJobs: `
    SELECT j.*, u.full_name as recruiter_name
    FROM jobs j
    JOIN users u ON j.recruiter_id = u.id
    WHERE j.status = 'active'
      AND ($1::text IS NULL OR j.location ILIKE '%' || $1 || '%')
      AND ($2::text IS NULL OR j.job_type = $2)
      AND ($3::text IS NULL OR j.experience_level = $3)
      AND ($4::text IS NULL OR j.workplace_type = $4)
      AND ($5::int IS NULL OR j.salary_min >= $5)
      AND ($6::int IS NULL OR j.salary_max <= $6)
      AND ($7::text IS NULL OR j.title ILIKE '%' || $7 || '%' OR j.company ILIKE '%' || $7 || '%')
    ORDER BY j.created_at DESC
    LIMIT $8 OFFSET $9
  `,

  searchJobsCount: `
    SELECT COUNT(*) as total
    FROM jobs j
    WHERE j.status = 'active'
      AND ($1::text IS NULL OR j.location ILIKE '%' || $1 || '%')
      AND ($2::text IS NULL OR j.job_type = $2)
      AND ($3::text IS NULL OR j.experience_level = $3)
      AND ($4::text IS NULL OR j.workplace_type = $4)
      AND ($5::int IS NULL OR j.salary_min >= $5)
      AND ($6::int IS NULL OR j.salary_max <= $6)
      AND ($7::text IS NULL OR j.title ILIKE '%' || $7 || '%' OR j.company ILIKE '%' || $7 || '%')
  `,

  // RECRUITER's jobs
  getRecruiterJobs: `
    SELECT * FROM jobs WHERE recruiter_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3
  `,

  getRecruiterJobsCount: `
    SELECT COUNT(*) as total FROM jobs WHERE recruiter_id = $1
  `,

  // UPDATE
  updateJob: `
    UPDATE jobs 
    SET title = COALESCE($2, title),
        company = COALESCE($3, company),
        department = COALESCE($4, department),
        description = COALESCE($5, description),
        location = COALESCE($6, location),
        job_type = COALESCE($7, job_type),
        workplace_type = COALESCE($8, workplace_type),
        experience_level = COALESCE($9, experience_level),
        min_experience_years = COALESCE($10, min_experience_years),
        max_experience_years = COALESCE($11, max_experience_years),
        salary_min = COALESCE($12, salary_min),
        salary_max = COALESCE($13, salary_max),
        salary_currency = COALESCE($14, salary_currency),
        benefits = COALESCE($15, benefits),
        status = COALESCE($16, status)
    WHERE id = $1 AND recruiter_id = $17
    RETURNING *
  `,

  incrementApplicationCount: `
    UPDATE jobs SET applications_count = applications_count + 1 WHERE id = $1
  `,

  incrementViewCount: `
    UPDATE jobs SET views_count = views_count + 1 WHERE id = $1
  `,

  closeJob: `
    UPDATE jobs SET status = 'closed' WHERE id = $1 AND recruiter_id = $2 RETURNING *
  `,

  // ADMIN STATS
  getJobStats: `
    SELECT 
      COUNT(*) as total_jobs,
      COUNT(*) FILTER (WHERE status = 'active') as active_jobs,
      COUNT(*) FILTER (WHERE status = 'closed') as closed_jobs,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as jobs_this_week
    FROM jobs
  `,
};