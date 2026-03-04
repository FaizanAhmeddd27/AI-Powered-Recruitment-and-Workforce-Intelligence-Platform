import {
  getCache,
  setCache,
  deleteCache,
  deleteCachePattern,
} from "../config/redis";
import logger from "../utils/logger.utils";


export const CacheKeys = {
  // Jobs
  jobDetail: (jobId: string) => `job:${jobId}`,
  jobSkills: (jobId: string) => `job:skills:${jobId}`,
  jobsList: (filtersHash: string) => `jobs:list:${filtersHash}`,
  jobsCount: (filtersHash: string) => `jobs:count:${filtersHash}`,
  recruiterJobs: (recruiterId: string, page: number) =>
    `recruiter:jobs:${recruiterId}:${page}`,

  // Users/Profiles
  userProfile: (userId: string) => `profile:${userId}`,
  candidateStats: (userId: string) => `stats:candidate:${userId}`,
  recruiterStats: (userId: string) => `stats:recruiter:${userId}`,

  // Applications
  candidateApps: (userId: string, page: number) =>
    `apps:candidate:${userId}:${page}`,
  jobApplications: (jobId: string, page: number) =>
    `apps:job:${jobId}:${page}`,

  // AI
  matchScore: (userId: string, jobId: string) =>
    `match:${userId}:${jobId}`,
  jobMatches: (jobId: string) => `matches:${jobId}`,
  recommendations: (userId: string) => `recommendations:${userId}`,
  parsedResume: (userId: string) => `parsed:${userId}`,

  // Sessions
  session: (userId: string) => `session:${userId}`,

  // Admin
  adminStats: () => `admin:stats`,
  adminAnalytics: () => `admin:analytics:v5`,

  // Rate limiting
  rateLimit: (identifier: string, endpoint: string) =>
    `ratelimit:${identifier}:${endpoint}`,
};


export const CacheDuration = {
  SHORT: 5 * 60,           // 5 minutes
  MEDIUM: 30 * 60,         // 30 minutes
  LONG: 60 * 60,           // 1 hour
  VERY_LONG: 24 * 60 * 60, // 24 hours
  SESSION: 7 * 24 * 60 * 60, // 7 days
};


export const generateFiltersHash = (filters: Record<string, any>): string => {
  const sorted = Object.keys(filters)
    .sort()
    .reduce((acc: Record<string, any>, key) => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== "") {
        acc[key] = filters[key];
      }
      return acc;
    }, {});

  return Buffer.from(JSON.stringify(sorted)).toString("base64").substring(0, 64);
};


export const invalidateJobCaches = async (jobId?: string): Promise<void> => {
  try {
    // Delete specific job cache
    if (jobId) {
      await deleteCache(CacheKeys.jobDetail(jobId));
      await deleteCache(CacheKeys.jobSkills(jobId));
    }

    // Delete all job list caches
    await deleteCachePattern("jobs:list:*");
    await deleteCachePattern("jobs:count:*");

    logger.debug("Job caches invalidated");
  } catch (error: any) {
    logger.error(`❌ Job cache invalidation failed: ${error.message}`);
  }
};

/**
 * Invalidate recruiter-specific caches
 */
export const invalidateRecruiterCaches = async (
  recruiterId: string
): Promise<void> => {
  try {
    await deleteCachePattern(`recruiter:jobs:${recruiterId}:*`);
    await deleteCache(CacheKeys.recruiterStats(recruiterId));
    await deleteCache(`recruiter:dashboard:v2:${recruiterId}`);
    logger.debug(`Recruiter caches invalidated: ${recruiterId}`);
  } catch (error: any) {
    logger.error(`❌ Recruiter cache invalidation failed: ${error.message}`);
  }
};


export const invalidateCandidateCaches = async (
  candidateId: string
): Promise<void> => {
  try {
    await deleteCachePattern(`apps:candidate:${candidateId}:*`);
    await deleteCache(CacheKeys.candidateStats(candidateId));
    await deleteCache(CacheKeys.recommendations(candidateId));
    await deleteCache(CacheKeys.userProfile(candidateId));
    logger.debug(`🗑️ Candidate caches invalidated: ${candidateId}`);
  } catch (error: any) {
    logger.error(`❌ Candidate cache invalidation failed: ${error.message}`);
  }
};


export const invalidateApplicationCaches = async (
  jobId: string,
  candidateId: string
): Promise<void> => {
  try {
    await deleteCachePattern(`apps:job:${jobId}:*`);
    await deleteCachePattern(`apps:candidate:${candidateId}:*`);
    await deleteCache(CacheKeys.jobMatches(jobId));
    await deleteCache(CacheKeys.candidateStats(candidateId));
    await deleteCache(CacheKeys.matchScore(candidateId, jobId));
    logger.debug(`Application caches invalidated: job=${jobId}, candidate=${candidateId}`);
  } catch (error: any) {
    logger.error(`❌ Application cache invalidation failed: ${error.message}`);
  }
};


export const invalidateAdminCaches = async (): Promise<void> => {
  try {
    await deleteCache(CacheKeys.adminStats());
    await deleteCache(CacheKeys.adminAnalytics());
    logger.debug("Admin caches invalidated");
  } catch (error: any) {
    logger.error(`❌ Admin cache invalidation failed: ${error.message}`);
  }
};


export const cachedFetch = async <T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  duration: number = CacheDuration.MEDIUM
): Promise<T> => {
  // Try cache first
  const cached = await getCache<T>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  // Fetch from DB
  const data = await fetcher();

  // Store in cache
  if (data !== null && data !== undefined) {
    await setCache(cacheKey, data, duration);
  }

  return data;
};