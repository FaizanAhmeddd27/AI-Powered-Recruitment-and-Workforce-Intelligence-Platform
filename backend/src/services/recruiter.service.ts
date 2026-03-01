import { queryOne, queryMany } from "../config/db";
import { AppError } from "../middleware/error.middleware";
import { CacheKeys, CacheDuration, cachedFetch } from "./cache.service";
import logger from "../utils/logger.utils";


export const getDashboardData = async (
  recruiterId: string
): Promise<any> => {
  const cacheKey = `recruiter:dashboard:${recruiterId}`;

  return cachedFetch(
    cacheKey,
    async () => {
      // Stats
      const stats = await queryOne(
        `SELECT
           COUNT(DISTINCT j.id) as total_jobs,
           COUNT(DISTINCT j.id) FILTER (WHERE j.status = 'active') as active_jobs,
           COUNT(DISTINCT j.id) FILTER (WHERE j.status = 'closed') as closed_jobs,
           COUNT(a.id) as total_applications,
           COUNT(a.id) FILTER (WHERE a.status = 'pending') as pending_applications,
           COUNT(a.id) FILTER (WHERE a.status = 'shortlisted') as shortlisted,
           COUNT(a.id) FILTER (WHERE a.status = 'interview') as in_interview,
           COUNT(a.id) FILTER (WHERE a.status = 'hired') as hired,
           COUNT(a.id) FILTER (WHERE a.status = 'rejected') as rejected,
           ROUND(AVG(a.ai_match_score)::numeric, 1) as avg_match_score
         FROM jobs j
         LEFT JOIN applications a ON j.id = a.job_id
         WHERE j.recruiter_id = $1`,
        [recruiterId]
      );

      // Active jobs with app counts
      const activeJobs = await queryMany(
        `SELECT j.id, j.title, j.company, j.location, j.status,
                j.applications_count, j.views_count, j.created_at,
                ROUND(AVG(a.ai_match_score)::numeric, 1) as avg_ai_score,
                COUNT(a.id) FILTER (WHERE a.status = 'pending') as pending_count,
                COUNT(a.id) FILTER (WHERE a.status = 'shortlisted') as shortlisted_count
         FROM jobs j
         LEFT JOIN applications a ON j.id = a.job_id
         WHERE j.recruiter_id = $1 AND j.status = 'active'
         GROUP BY j.id
         ORDER BY j.created_at DESC
         LIMIT 10`,
        [recruiterId]
      );

      // Recent applications
      const recentApps = await queryMany(
        `SELECT a.id, a.status, a.ai_match_score, a.applied_at,
                j.title as job_title, j.company as job_company,
                u.full_name as candidate_name, u.email as candidate_email,
                u.avatar_url as candidate_avatar,
                cp.headline as candidate_headline
         FROM applications a
         JOIN jobs j ON a.job_id = j.id
         JOIN users u ON a.candidate_id = u.id
         LEFT JOIN candidate_profiles cp ON u.id = cp.user_id
         WHERE j.recruiter_id = $1
         ORDER BY a.applied_at DESC
         LIMIT 10`,
        [recruiterId]
      );

      // Application trend (last 7 days)
      const trend = await queryMany(
        `SELECT DATE(a.applied_at) as date, COUNT(*) as count
         FROM applications a
         JOIN jobs j ON a.job_id = j.id
         WHERE j.recruiter_id = $1 AND a.applied_at > NOW() - INTERVAL '7 days'
         GROUP BY DATE(a.applied_at)
         ORDER BY date`,
        [recruiterId]
      );

      return {
        stats,
        activeJobs,
        recentApplications: recentApps,
        applicationTrend: trend,
      };
    },
    CacheDuration.SHORT
  );
};


export const getRecruiterProfile = async (
  recruiterId: string
): Promise<any> => {
  const user = await queryOne(
    `SELECT id, email, full_name, role, avatar_url, phone, location,
            linkedin_url, bio, created_at
     FROM users WHERE id = $1`,
    [recruiterId]
  );

  if (!user) throw new AppError("Recruiter not found", 404);

  const jobCount = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM jobs WHERE recruiter_id = $1`,
    [recruiterId]
  );

  return {
    ...user,
    total_jobs_posted: parseInt(jobCount?.count || "0", 10),
  };
};


export const getApplicationPipeline = async (
  recruiterId: string,
  jobId: string
): Promise<any> => {
  // Verify ownership
  const job = await queryOne(
    `SELECT id, title, recruiter_id FROM jobs WHERE id = $1`,
    [jobId]
  );

  if (!job) throw new AppError("Job not found", 404);
  if (job.recruiter_id !== recruiterId) {
    throw new AppError("You can only view pipeline for your own jobs", 403);
  }

  const pipeline = await queryOne(
    `SELECT
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE status = 'pending') as pending,
       COUNT(*) FILTER (WHERE status = 'under_review') as under_review,
       COUNT(*) FILTER (WHERE status = 'shortlisted') as shortlisted,
       COUNT(*) FILTER (WHERE status = 'interview') as interview,
       COUNT(*) FILTER (WHERE status = 'offered') as offered,
       COUNT(*) FILTER (WHERE status = 'hired') as hired,
       COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
       COUNT(*) FILTER (WHERE status = 'withdrawn') as withdrawn,
       ROUND(AVG(ai_match_score)::numeric, 1) as avg_match_score
     FROM applications WHERE job_id = $1`,
    [jobId]
  );

  return {
    jobTitle: job.title,
    jobId: job.id,
    pipeline,
  };
};