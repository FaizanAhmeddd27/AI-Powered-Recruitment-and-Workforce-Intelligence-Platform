import { query, queryOne, queryMany, transaction } from "../config/db";
import { getCache, setCache } from "../config/redis";
import { JobQueries } from "../db/queries/jobs.queries";
import { AppError } from "../middleware/error.middleware";
import { IJob, IJobCreate, IJobSkill } from "../models/types/job.types";
import {
  CacheKeys,
  CacheDuration,
  generateFiltersHash,
  invalidateJobCaches,
  invalidateRecruiterCaches,
  invalidateAdminCaches,
  cachedFetch,
} from "./cache.service";
import logger from "../utils/logger.utils";


export const createJob = async (
  recruiterId: string,
  data: IJobCreate
): Promise<{ job: any; skills: any[] }> => {
  const result = await transaction(async (client) => {
    // 1. Insert job
    const jobResult = await client.query(JobQueries.createJob, [
      recruiterId,
      data.title,
      data.company,
      data.department || null,
      data.description,
      data.location,
      data.job_type,
      data.workplace_type,
      data.experience_level,
      data.min_experience_years,
      data.max_experience_years,
      data.salary_min || null,
      data.salary_max || null,
      data.salary_currency || "PKR",
      data.benefits || [],
      data.expires_at || null,
    ]);

    const job = jobResult.rows[0];

    // 2. Insert skills
    const skills: any[] = [];
    for (const skill of data.skills) {
      const skillResult = await client.query(JobQueries.addJobSkill, [
        job.id,
        skill.skill_name,
        skill.min_years,
        skill.is_required,
      ]);
      if (skillResult.rows[0]) {
        skills.push(skillResult.rows[0]);
      }
    }

    // 3. Log activity
    await client.query(
      `INSERT INTO activity_log (user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        recruiterId,
        "job_posted",
        "job",
        job.id,
        JSON.stringify({ title: data.title, company: data.company }),
      ]
    );

    return { job, skills };
  });

  // 4. Invalidate caches
  await invalidateJobCaches();
  await invalidateRecruiterCaches(recruiterId);
  await invalidateAdminCaches();

  logger.info(`Job posted: "${data.title}" at ${data.company} by ${recruiterId}`);

  return result;
};


export const getJobById = async (
  jobId: string,
  incrementViews: boolean = true
): Promise<{ job: any; skills: any[] } | null> => {
  // Try cache
  const cacheKey = CacheKeys.jobDetail(jobId);
  const cached = await getCache<{ job: any; skills: any[] }>(cacheKey);

  if (cached) {
    // Increment view count in background (don't await)
    if (incrementViews) {
      query(JobQueries.incrementViewCount, [jobId]).catch(() => {});
    }
    return cached;
  }

  // Query PostgreSQL
  const job = await queryOne(JobQueries.findById, [jobId]);

  if (!job) return null;

  // Get skills
  const skills = await queryMany(JobQueries.getJobSkills, [jobId]);

  const result = { job, skills };

  // Cache for 30 minutes
  await setCache(cacheKey, result, CacheDuration.MEDIUM);

  // Increment view count
  if (incrementViews) {
    query(JobQueries.incrementViewCount, [jobId]).catch(() => {});
  }

  return result;
};


export const searchJobs = async (filters: {
  search?: string;
  location?: string;
  job_type?: string;
  workplace_type?: string;
  experience_level?: string;
  salary_min?: number;
  salary_max?: number;
  page: number;
  limit: number;
  sort_by: string;
  sort_order: string;
}): Promise<{
  jobs: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const { page, limit, sort_by, sort_order } = filters;
  const offset = (page - 1) * limit;

  // Generate cache key from filters
  const filtersHash = generateFiltersHash(filters);
  const listCacheKey = CacheKeys.jobsList(filtersHash);
  const countCacheKey = CacheKeys.jobsCount(filtersHash);

  // Try cache for both list and count
  const cachedList = await getCache<any[]>(listCacheKey);
  const cachedCount = await getCache<number>(countCacheKey);

  if (cachedList && cachedCount !== null) {
    return {
      jobs: cachedList,
      total: cachedCount,
      page,
      limit,
      totalPages: Math.ceil(cachedCount / limit),
    };
  }

  // Build dynamic SQL query
  const queryParams: any[] = [];
  let paramIndex = 1;
  let whereClause = "WHERE j.status = 'active'";

  // Location filter
  if (filters.location) {
    whereClause += ` AND j.location ILIKE $${paramIndex}`;
    queryParams.push(`%${filters.location}%`);
    paramIndex++;
  }

  // Job type filter
  if (filters.job_type) {
    whereClause += ` AND j.job_type = $${paramIndex}`;
    queryParams.push(filters.job_type);
    paramIndex++;
  }

  // Workplace type filter
  if (filters.workplace_type) {
    whereClause += ` AND j.workplace_type = $${paramIndex}`;
    queryParams.push(filters.workplace_type);
    paramIndex++;
  }

  // Experience level filter
  if (filters.experience_level) {
    whereClause += ` AND j.experience_level = $${paramIndex}`;
    queryParams.push(filters.experience_level);
    paramIndex++;
  }

  // Salary min filter
  if (filters.salary_min) {
    whereClause += ` AND j.salary_max >= $${paramIndex}`;
    queryParams.push(filters.salary_min);
    paramIndex++;
  }

  // Salary max filter
  if (filters.salary_max) {
    whereClause += ` AND j.salary_min <= $${paramIndex}`;
    queryParams.push(filters.salary_max);
    paramIndex++;
  }

  // Search filter (title or company)
  if (filters.search) {
    whereClause += ` AND (j.title ILIKE $${paramIndex} OR j.company ILIKE $${paramIndex})`;
    queryParams.push(`%${filters.search}%`);
    paramIndex++;
  }

  // Validate sort column to prevent SQL injection
  const allowedSortColumns: Record<string, string> = {
    created_at: "j.created_at",
    salary_min: "j.salary_min",
    salary_max: "j.salary_max",
    applications_count: "j.applications_count",
  };

  const sortColumn = allowedSortColumns[sort_by] || "j.created_at";
  const sortDir = sort_order === "asc" ? "ASC" : "DESC";

  // Count query
  const countSql = `
    SELECT COUNT(*) as total
    FROM jobs j
    ${whereClause}
  `;

  const countResult = await queryOne<{ total: string }>(countSql, queryParams);
  const total = parseInt(countResult?.total || "0", 10);

  // List query with pagination
  const listSql = `
    SELECT j.*, u.full_name as recruiter_name, u.avatar_url as recruiter_avatar
    FROM jobs j
    JOIN users u ON j.recruiter_id = u.id
    ${whereClause}
    ORDER BY ${sortColumn} ${sortDir}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  const listParams = [...queryParams, limit, offset];
  const jobs = await queryMany(listSql, listParams);

  // Cache results
  await setCache(listCacheKey, jobs, CacheDuration.SHORT); // 5 min
  await setCache(countCacheKey, total, CacheDuration.SHORT);

  return {
    jobs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};


export const getRecruiterJobs = async (
  recruiterId: string,
  page: number = 1,
  limit: number = 10
): Promise<{
  jobs: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const cacheKey = CacheKeys.recruiterJobs(recruiterId, page);

  return cachedFetch(
    cacheKey,
    async () => {
      const offset = (page - 1) * limit;

      const countResult = await queryOne<{ total: string }>(
        JobQueries.getRecruiterJobsCount,
        [recruiterId]
      );
      const total = parseInt(countResult?.total || "0", 10);

      const jobs = await queryMany(JobQueries.getRecruiterJobs, [
        recruiterId,
        limit,
        offset,
      ]);

      // For each job, get skills
      const jobsWithSkills = await Promise.all(
        jobs.map(async (job: any) => {
          const skills = await queryMany(JobQueries.getJobSkills, [job.id]);
          return { ...job, skills };
        })
      );

      return {
        jobs: jobsWithSkills,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    },
    CacheDuration.MEDIUM
  );
};

export const updateJob = async (
  jobId: string,
  recruiterId: string,
  data: Partial<IJob & { skills: IJobSkill[] }>
): Promise<any> => {
  // 1. Check if job exists and belongs to recruiter
  const existingJob = await queryOne(
    `SELECT id, recruiter_id FROM jobs WHERE id = $1`,
    [jobId]
  );

  if (!existingJob) {
    throw new AppError("Job not found", 404);
  }

  if (existingJob.recruiter_id !== recruiterId) {
    throw new AppError("You can only update your own jobs", 403);
  }

  const result = await transaction(async (client) => {
    // 2. Update job core fields
    const updatedJobResult = await client.query(JobQueries.updateJob, [
      jobId,
      data.title || null,
      data.company || null,
      data.department || null,
      data.description || null,
      data.location || null,
      data.job_type || null,
      data.workplace_type || null,
      data.experience_level || null,
      data.min_experience_years ?? null,
      data.max_experience_years ?? null,
      data.salary_min ?? null,
      data.salary_max ?? null,
      data.salary_currency || null,
      data.benefits ?? null,
      data.status || null,
      recruiterId,
    ]);

    const updatedJob = updatedJobResult.rows[0];

    if (!updatedJob) {
      throw new AppError("Failed to update job", 500);
    }

    // 3. Replace skills if provided
    if (Array.isArray(data.skills)) {
      await client.query(`DELETE FROM job_skills WHERE job_id = $1`, [jobId]);

      for (const skill of data.skills) {
        await client.query(JobQueries.addJobSkill, [
          jobId,
          skill.skill_name,
          skill.min_years,
          skill.is_required,
        ]);
      }
    }

    return updatedJob;
  });

  // 4. Invalidate caches
  await invalidateJobCaches(jobId);
  await invalidateRecruiterCaches(recruiterId);

  logger.info(`Job updated: ${jobId}`);

  return result;
};


export const closeJob = async (
  jobId: string,
  recruiterId: string
): Promise<any> => {
  const result = await queryOne(JobQueries.closeJob, [jobId, recruiterId]);

  if (!result) {
    throw new AppError("Job not found or you don't have permission", 404);
  }

  // Invalidate caches
  await invalidateJobCaches(jobId);
  await invalidateRecruiterCaches(recruiterId);
  await invalidateAdminCaches();

  logger.info(`Job closed: ${jobId}`);

  return result;
};


export const deleteJob = async (
  jobId: string,
  recruiterId: string,
  isAdmin: boolean = false
): Promise<void> => {
  // Check ownership
  const job = await queryOne<{ recruiter_id: string }>(
    `SELECT recruiter_id FROM jobs WHERE id = $1`,
    [jobId]
  );

  if (!job) {
    throw new AppError("Job not found", 404);
  }

  if (!isAdmin && job.recruiter_id !== recruiterId) {
    throw new AppError("You can only delete your own jobs", 403);
  }

  // Soft delete by setting status to closed
  await query(`UPDATE jobs SET status = 'closed' WHERE id = $1`, [jobId]);

  // Invalidate caches
  await invalidateJobCaches(jobId);
  await invalidateRecruiterCaches(recruiterId);
  await invalidateAdminCaches();

  logger.info(`Job deleted (soft): ${jobId}`);
};


export const getJobStats = async (): Promise<any> => {
  return cachedFetch(
    "admin:job:stats",
    async () => {
      const stats = await queryOne(JobQueries.getJobStats);
      return stats;
    },
    CacheDuration.LONG
  );
};


export const saveJob = async (
  userId: string,
  jobId: string
): Promise<void> => {
  // Check if job exists
  const job = await queryOne(`SELECT id FROM jobs WHERE id = $1 AND status = 'active'`, [
    jobId,
  ]);

  if (!job) {
    throw new AppError("Job not found or no longer active", 404);
  }

  // Check if already saved
  const existing = await queryOne(
    `SELECT id FROM saved_jobs WHERE user_id = $1 AND job_id = $2`,
    [userId, jobId]
  );

  if (existing) {
    throw new AppError("Job already saved", 409);
  }

  await query(
    `INSERT INTO saved_jobs (user_id, job_id) VALUES ($1, $2)`,
    [userId, jobId]
  );

  logger.debug(`Job saved: user=${userId}, job=${jobId}`);
};

export const unsaveJob = async (
  userId: string,
  jobId: string
): Promise<void> => {
  const result = await query(
    `DELETE FROM saved_jobs WHERE user_id = $1 AND job_id = $2`,
    [userId, jobId]
  );

  if (result.rowCount === 0) {
    throw new AppError("Saved job not found", 404);
  }

  logger.debug(`Job unsaved: user=${userId}, job=${jobId}`);
};

export const getSavedJobs = async (
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<{
  jobs: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const offset = (page - 1) * limit;

  const countResult = await queryOne<{ total: string }>(
    `SELECT COUNT(*) as total FROM saved_jobs WHERE user_id = $1`,
    [userId]
  );
  const total = parseInt(countResult?.total || "0", 10);

  const jobs = await queryMany(
    `SELECT j.*, sj.saved_at, u.full_name as recruiter_name
     FROM saved_jobs sj
     JOIN jobs j ON sj.job_id = j.id
     JOIN users u ON j.recruiter_id = u.id
     WHERE sj.user_id = $1
     ORDER BY sj.saved_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  return {
    jobs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};