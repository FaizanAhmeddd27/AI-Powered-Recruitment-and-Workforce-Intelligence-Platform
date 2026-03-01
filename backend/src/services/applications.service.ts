import { query, queryOne, queryMany, transaction } from "../config/db";
import { getCache, setCache } from "../config/redis";
import { ApplicationQueries } from "../db/queries/applications.queries";
import { JobQueries } from "../db/queries/jobs.queries";
import { AppError } from "../middleware/error.middleware";
import { ApplicationStatus } from "../models/types/application.types";
import {
  CacheKeys,
  CacheDuration,
  invalidateApplicationCaches,
  invalidateJobCaches,
  invalidateCandidateCaches,
  invalidateRecruiterCaches,
  invalidateAdminCaches,
  cachedFetch,
} from "./cache.service";
import logger from "../utils/logger.utils";


export const applyForJob = async (
  candidateId: string,
  jobId: string,
  data: {
    cover_letter?: string | null;
    expected_salary?: number | null;
    notice_period_days?: number | null;
    resume_mongo_id?: string | null;
  }
): Promise<any> => {
  // 1. Check if job exists and is active
  const job = await queryOne<{ id: string; status: string; recruiter_id: string }>(
    `SELECT id, status, recruiter_id FROM jobs WHERE id = $1`,
    [jobId]
  );

  if (!job) {
    throw new AppError("Job not found", 404);
  }

  if (job.status !== "active") {
    throw new AppError("This job is no longer accepting applications", 400);
  }

  // 2. Prevent recruiter from applying to own job
  if (job.recruiter_id === candidateId) {
    throw new AppError("You cannot apply to your own job posting", 400);
  }

  // 3. Check if already applied
  const existing = await queryOne(ApplicationQueries.checkExisting, [
    jobId,
    candidateId,
  ]);

  if (existing) {
    throw new AppError("You have already applied for this job", 409);
  }

  // 4. Check if candidate has a resume (optional but recommended)
  const candidate = await queryOne<{ resume_mongo_id: string | null; role: string }>(
    `SELECT resume_mongo_id, role FROM users WHERE id = $1`,
    [candidateId]
  );

  if (!candidate) {
    throw new AppError("Candidate not found", 404);
  }

  if (candidate.role !== "candidate") {
    throw new AppError("Only candidates can apply for jobs", 403);
  }

  // Use provided resume_mongo_id or candidate's default
  const resumeMongoId = data.resume_mongo_id || candidate.resume_mongo_id;

  // 5. Create application in a transaction
  const application = await transaction(async (client) => {
    // Insert application
    const appResult = await client.query(ApplicationQueries.createApplication, [
      jobId,
      candidateId,
      resumeMongoId || null,
      data.cover_letter || null,
      data.expected_salary || null,
      data.notice_period_days || null,
    ]);

    const newApp = appResult.rows[0];

    // Increment job applications count
    await client.query(JobQueries.incrementApplicationCount, [jobId]);

    // Log activity
    await client.query(
      `INSERT INTO activity_log (user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        candidateId,
        "application_submitted",
        "application",
        newApp.id,
        JSON.stringify({ job_id: jobId }),
      ]
    );

    return newApp;
  });

  // 6. Invalidate relevant caches
  await invalidateApplicationCaches(jobId, candidateId);
  await invalidateJobCaches(jobId);
  await invalidateAdminCaches();

  logger.info(
    `Application submitted: candidate=${candidateId}, job=${jobId}, app=${application.id}`
  );

  return application;
};

export const getCandidateApplications = async (
  candidateId: string,
  options: {
    status?: string;
    page: number;
    limit: number;
    sort_by: string;
    sort_order: string;
  }
): Promise<{
  applications: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const { page, limit, sort_by, sort_order, status } = options;
  const offset = (page - 1) * limit;

  // Build query
  let whereClause = "WHERE a.candidate_id = $1";
  const params: any[] = [candidateId];
  let paramIndex = 2;

  if (status) {
    whereClause += ` AND a.status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  // Validate sort column
  const allowedSortColumns: Record<string, string> = {
    applied_at: "a.applied_at",
    ai_match_score: "a.ai_match_score",
    status: "a.status",
    updated_at: "a.updated_at",
  };

  const sortColumn = allowedSortColumns[sort_by] || "a.applied_at";
  const sortDir = sort_order === "asc" ? "ASC" : "DESC";

  // Count query
  const countSql = `
    SELECT COUNT(*) as total
    FROM applications a
    ${whereClause}
  `;
  const countResult = await queryOne<{ total: string }>(countSql, params);
  const total = parseInt(countResult?.total || "0", 10);

  // List query
  const listSql = `
    SELECT a.id, a.job_id, a.status, a.ai_match_score, a.cover_letter,
           a.expected_salary, a.notice_period_days, a.applied_at, a.reviewed_at, a.updated_at,
           j.title as job_title, j.company as job_company, j.location as job_location,
           j.salary_min, j.salary_max, j.job_type, j.workplace_type, j.status as job_status
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    ${whereClause}
    ORDER BY ${sortColumn} ${sortDir}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  const applications = await queryMany(listSql, [...params, limit, offset]);

  return {
    applications,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};


export const getJobApplications = async (
  jobId: string,
  recruiterId: string,
  options: {
    status?: string;
    page: number;
    limit: number;
    sort_by: string;
    sort_order: string;
  }
): Promise<{
  applications: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  // 1. Verify recruiter owns this job
  const job = await queryOne<{ recruiter_id: string }>(
    `SELECT recruiter_id FROM jobs WHERE id = $1`,
    [jobId]
  );

  if (!job) {
    throw new AppError("Job not found", 404);
  }

  if (job.recruiter_id !== recruiterId) {
    throw new AppError("You can only view applications for your own jobs", 403);
  }

  const { page, limit, sort_by, sort_order, status } = options;
  const offset = (page - 1) * limit;

  // Build query
  let whereClause = "WHERE a.job_id = $1";
  const params: any[] = [jobId];
  let paramIndex = 2;

  if (status) {
    whereClause += ` AND a.status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  // Validate sort column
  const allowedSortColumns: Record<string, string> = {
    applied_at: "a.applied_at",
    ai_match_score: "a.ai_match_score",
    status: "a.status",
    updated_at: "a.updated_at",
  };

  const sortColumn = allowedSortColumns[sort_by] || "a.ai_match_score";
  const sortDir = sort_order === "asc" ? "ASC" : "DESC";

  // Count
  const countSql = `
    SELECT COUNT(*) as total
    FROM applications a
    ${whereClause}
  `;
  const countResult = await queryOne<{ total: string }>(countSql, params);
  const total = parseInt(countResult?.total || "0", 10);

  // List with candidate info
  const listSql = `
    SELECT a.id, a.job_id, a.candidate_id, a.status, a.ai_match_score,
           a.ai_analysis, a.cover_letter, a.expected_salary, a.notice_period_days,
           a.recruiter_notes, a.applied_at, a.reviewed_at, a.updated_at,
           a.resume_mongo_id,
           u.full_name as candidate_name, u.email as candidate_email,
           u.avatar_url as candidate_avatar, u.location as candidate_location,
           u.phone as candidate_phone, u.parsed_resume_mongo_id,
           cp.headline as candidate_headline, cp.total_experience_years as candidate_experience,
           cp.current_company as candidate_current_company
    FROM applications a
    JOIN users u ON a.candidate_id = u.id
    LEFT JOIN candidate_profiles cp ON u.id = cp.user_id
    ${whereClause}
    ORDER BY ${sortColumn} ${sortDir} NULLS LAST
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  const applications = await queryMany(listSql, [...params, limit, offset]);

  // For each application, get candidate skills
  const applicationsWithSkills = await Promise.all(
    applications.map(async (app: any) => {
      const skills = await queryMany(
        `SELECT skill_name, years_of_experience, proficiency_level
         FROM candidate_skills
         WHERE user_id = $1
         ORDER BY years_of_experience DESC
         LIMIT 10`,
        [app.candidate_id]
      );
      return { ...app, candidate_skills: skills };
    })
  );

  return {
    applications: applicationsWithSkills,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};


export const getApplicationById = async (
  applicationId: string,
  requesterId: string,
  requesterRole: string
): Promise<any> => {
  const application = await queryOne(ApplicationQueries.findById, [
    applicationId,
  ]);

  if (!application) {
    throw new AppError("Application not found", 404);
  }

  // Authorization check
  if (requesterRole === "candidate" && application.candidate_id !== requesterId) {
    throw new AppError("You can only view your own applications", 403);
  }

  if (requesterRole === "recruiter") {
    // Check if recruiter owns the job
    const job = await queryOne<{ recruiter_id: string }>(
      `SELECT recruiter_id FROM jobs WHERE id = $1`,
      [application.job_id]
    );

    if (!job || job.recruiter_id !== requesterId) {
      throw new AppError("You can only view applications for your own jobs", 403);
    }
  }

  // Get candidate skills
  const candidateSkills = await queryMany(
    `SELECT skill_name, years_of_experience, proficiency_level
     FROM candidate_skills
     WHERE user_id = $1
     ORDER BY years_of_experience DESC`,
    [application.candidate_id]
  );

  // Get job skills
  const jobSkills = await queryMany(
    `SELECT skill_name, min_years, is_required
     FROM job_skills
     WHERE job_id = $1
     ORDER BY is_required DESC, skill_name`,
    [application.job_id]
  );

  return {
    ...application,
    candidate_skills: candidateSkills,
    job_skills: jobSkills,
  };
};


export const updateApplicationStatus = async (
  applicationId: string,
  recruiterId: string,
  newStatus: ApplicationStatus
): Promise<any> => {
  // 1. Get application with job info
  const application = await queryOne<{
    id: string;
    job_id: string;
    candidate_id: string;
    status: string;
  }>(
    `SELECT a.id, a.job_id, a.candidate_id, a.status
     FROM applications a
     WHERE a.id = $1`,
    [applicationId]
  );

  if (!application) {
    throw new AppError("Application not found", 404);
  }

  // 2. Verify recruiter owns the job
  const job = await queryOne<{ recruiter_id: string; title: string }>(
    `SELECT recruiter_id, title FROM jobs WHERE id = $1`,
    [application.job_id]
  );

  if (!job || job.recruiter_id !== recruiterId) {
    throw new AppError("You can only update applications for your own jobs", 403);
  }

  // 3. Validate status transition
  const validTransitions: Record<string, string[]> = {
    pending: ["under_review", "rejected"],
    under_review: ["shortlisted", "rejected"],
    shortlisted: ["interview", "rejected"],
    interview: ["offered", "rejected"],
    offered: ["hired", "rejected"],
    hired: [],           // Final state
    rejected: [],        // Final state
    withdrawn: [],       // Final state
  };

  const currentStatus = application.status;
  const allowedNext = validTransitions[currentStatus] || [];

  if (!allowedNext.includes(newStatus)) {
    throw new AppError(
      `Cannot transition from "${currentStatus}" to "${newStatus}". Allowed: ${allowedNext.join(", ") || "none (final state)"}`,
      400
    );
  }

  // 4. Update status
  const updated = await transaction(async (client) => {
    const result = await client.query(ApplicationQueries.updateStatus, [
      applicationId,
      newStatus,
    ]);

    // Log activity
    await client.query(
      `INSERT INTO activity_log (user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        recruiterId,
        `application_${newStatus}`,
        "application",
        applicationId,
        JSON.stringify({
          previous_status: currentStatus,
          new_status: newStatus,
          job_id: application.job_id,
          candidate_id: application.candidate_id,
        }),
      ]
    );

    return result.rows[0];
  });

  // 5. Invalidate caches
  await invalidateApplicationCaches(application.job_id, application.candidate_id);
  await invalidateAdminCaches();

  logger.info(
    `Application ${applicationId} status: ${currentStatus} → ${newStatus}`
  );

  return updated;
};


export const bulkUpdateStatus = async (
  recruiterId: string,
  applicationIds: string[],
  newStatus: ApplicationStatus
): Promise<{ updated: number; failed: number; errors: string[] }> => {
  let updated = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const appId of applicationIds) {
    try {
      await updateApplicationStatus(appId, recruiterId, newStatus);
      updated++;
    } catch (error: any) {
      failed++;
      errors.push(`${appId}: ${error.message}`);
    }
  }

  logger.info(
    `Bulk status update: ${updated} updated, ${failed} failed`
  );

  return { updated, failed, errors };
};


export const addRecruiterNotes = async (
  applicationId: string,
  recruiterId: string,
  notes: string
): Promise<any> => {
  // Verify ownership
  const application = await queryOne<{ job_id: string }>(
    `SELECT a.job_id FROM applications a WHERE a.id = $1`,
    [applicationId]
  );

  if (!application) {
    throw new AppError("Application not found", 404);
  }

  const job = await queryOne<{ recruiter_id: string }>(
    `SELECT recruiter_id FROM jobs WHERE id = $1`,
    [application.job_id]
  );

  if (!job || job.recruiter_id !== recruiterId) {
    throw new AppError("You can only add notes to your own job applications", 403);
  }

  const updated = await queryOne(ApplicationQueries.addRecruiterNotes, [
    applicationId,
    notes,
  ]);

  logger.debug(`Recruiter notes added to application: ${applicationId}`);

  return updated;
};


export const withdrawApplication = async (
  applicationId: string,
  candidateId: string,
  reason?: string | null
): Promise<any> => {
  // 1. Get application
  const application = await queryOne<{
    id: string;
    candidate_id: string;
    job_id: string;
    status: string;
  }>(
    `SELECT id, candidate_id, job_id, status FROM applications WHERE id = $1`,
    [applicationId]
  );

  if (!application) {
    throw new AppError("Application not found", 404);
  }

  // 2. Verify ownership
  if (application.candidate_id !== candidateId) {
    throw new AppError("You can only withdraw your own applications", 403);
  }

  // 3. Check if withdrawable
  const nonWithdrawable = ["hired", "rejected", "withdrawn"];
  if (nonWithdrawable.includes(application.status)) {
    throw new AppError(
      `Cannot withdraw application with status "${application.status}"`,
      400
    );
  }

  // 4. Update status to withdrawn
  const updated = await transaction(async (client) => {
    const result = await client.query(
      `UPDATE applications 
       SET status = 'withdrawn', 
           recruiter_notes = CASE 
             WHEN recruiter_notes IS NOT NULL 
             THEN recruiter_notes || E'\n[Candidate withdrew: ' || COALESCE($2, 'No reason given') || ']'
             ELSE '[Candidate withdrew: ' || COALESCE($2, 'No reason given') || ']'
           END,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [applicationId, reason || "No reason given"]
    );

    // Decrement job applications count
    await client.query(
      `UPDATE jobs SET applications_count = GREATEST(0, applications_count - 1) WHERE id = $1`,
      [application.job_id]
    );

    // Log activity
    await client.query(
      `INSERT INTO activity_log (user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        candidateId,
        "application_withdrawn",
        "application",
        applicationId,
        JSON.stringify({
          job_id: application.job_id,
          reason: reason || null,
        }),
      ]
    );

    return result.rows[0];
  });

  // 5. Invalidate caches
  await invalidateApplicationCaches(application.job_id, candidateId);
  await invalidateJobCaches(application.job_id);

  logger.info(`Application withdrawn: ${applicationId} by ${candidateId}`);

  return updated;
};


export const getCandidateStats = async (
  candidateId: string
): Promise<any> => {
  const cacheKey = CacheKeys.candidateStats(candidateId);

  return cachedFetch(
    cacheKey,
    async () => {
      const stats = await queryOne(ApplicationQueries.getCandidateStats, [
        candidateId,
      ]);

      // Get profile views (from jobs table views_count is for jobs)
      const profileViews = await queryOne<{ total: string }>(
        `SELECT COUNT(*) as total FROM activity_log 
         WHERE action = 'profile_viewed' AND metadata->>'candidate_id' = $1`,
        [candidateId]
      );

      return {
        ...stats,
        profile_views: parseInt(profileViews?.total || "0", 10),
      };
    },
    CacheDuration.SHORT
  );
};

export const getRecruiterStats = async (
  recruiterId: string
): Promise<any> => {
  const cacheKey = CacheKeys.recruiterStats(recruiterId);

  return cachedFetch(
    cacheKey,
    async () => {
      const stats = await queryOne(ApplicationQueries.getRecruiterStats, [
        recruiterId,
      ]);

      // Get recent applications count
      const recentApps = await queryOne<{ count: string }>(
        `SELECT COUNT(*) as count 
         FROM applications a
         JOIN jobs j ON a.job_id = j.id
         WHERE j.recruiter_id = $1 AND a.applied_at > NOW() - INTERVAL '24 hours'`,
        [recruiterId]
      );

      return {
        ...stats,
        applications_today: parseInt(recentApps?.count || "0", 10),
      };
    },
    CacheDuration.SHORT
  );
};


export const getRecentApplicationsForRecruiter = async (
  recruiterId: string,
  limit: number = 10
): Promise<any[]> => {
  const applications = await queryMany(
    `SELECT a.id, a.status, a.ai_match_score, a.applied_at,
            j.title as job_title, j.company as job_company,
            u.full_name as candidate_name, u.email as candidate_email,
            u.avatar_url as candidate_avatar
     FROM applications a
     JOIN jobs j ON a.job_id = j.id
     JOIN users u ON a.candidate_id = u.id
     WHERE j.recruiter_id = $1
     ORDER BY a.applied_at DESC
     LIMIT $2`,
    [recruiterId, limit]
  );

  return applications;
};


export const getApplicationStats = async (): Promise<any> => {
  return cachedFetch(
    "admin:app:stats",
    async () => {
      const stats = await queryOne(ApplicationQueries.getApplicationStats);
      return stats;
    },
    CacheDuration.LONG
  );
};


export const hasApplied = async (
  candidateId: string,
  jobId: string
): Promise<boolean> => {
  const existing = await queryOne(ApplicationQueries.checkExisting, [
    jobId,
    candidateId,
  ]);
  return !!existing;
};