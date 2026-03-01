import { Request, Response, NextFunction } from "express";
import * as aiService from "../services/ai.service";
import { queryMany, queryOne } from "../config/db";
import { getCache, setCache } from "../config/redis";
import { sendSuccess } from "../utils/response.utils";
import { AppError } from "../middleware/error.middleware";
import { CacheKeys, CacheDuration, cachedFetch } from "../services/cache.service";
import logger from "../utils/logger.utils";

export const getMatchScore = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const { jobId } = req.params as { jobId: string };
    const userId = req.user.userId;

    const cacheKey = CacheKeys.matchScore(userId, jobId);
    const cached = await getCache(cacheKey);
    if (cached) {
      sendSuccess(res, 200, "Match score fetched (cached)", cached);
      return;
    }

    const candidateSkills = await queryMany(
      `SELECT skill_name as name, years_of_experience as years
       FROM candidate_skills WHERE user_id = $1`,
      [userId]
    );

    if (candidateSkills.length === 0) {
      throw new AppError(
        "No skills found in your profile. Please upload your resume first.",
        400
      );
    }

    // Get candidate experience
    const profile = await queryOne<{ total_experience_years: number }>(
      `SELECT total_experience_years FROM candidate_profiles WHERE user_id = $1`,
      [userId]
    );

    const jobSkills = await queryMany(
      `SELECT skill_name, min_years, is_required FROM job_skills WHERE job_id = $1`,
      [jobId]
    );

    // Get job details
    const job = await queryOne<{
      min_experience_years: number;
      max_experience_years: number;
      title: string;
      description: string;
    }>(
      `SELECT min_experience_years, max_experience_years, title, description FROM jobs WHERE id = $1`,
      [jobId]
    );

    if (!job) {
      throw new AppError("Job not found", 404);
    }

    const result = await aiService.calculateMatchScore(
      candidateSkills.map((s: any) => ({
        name: s.name,
        years: parseFloat(s.years) || 0,
      })),
      jobSkills,
      parseFloat(String(profile?.total_experience_years)) || 0,
      job.min_experience_years,
      job.max_experience_years
    );

    await setCache(cacheKey, result, CacheDuration.LONG);

    sendSuccess(res, 200, "Match score calculated", result);
  } catch (error) {
    next(error);
  }
};

export const getDetailedMatchScore = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const { jobId } = req.params;
    const userId = req.user.userId;

    // Get candidate data
    const candidateSkills = await queryMany(
      `SELECT skill_name as name, years_of_experience as years
       FROM candidate_skills WHERE user_id = $1`,
      [userId]
    );

    const candidateExperience = await queryMany(
      `SELECT title, company, description 
       FROM candidate_experience WHERE user_id = $1 
       ORDER BY start_date DESC LIMIT 3`,
      [userId]
    );

    const profile = await queryOne<{ total_experience_years: number }>(
      `SELECT total_experience_years FROM candidate_profiles WHERE user_id = $1`,
      [userId]
    );

    const job = await queryOne(
      `SELECT title, description, min_experience_years, max_experience_years 
       FROM jobs WHERE id = $1`,
      [jobId]
    );

    if (!job) throw new AppError("Job not found", 404);

    const jobSkills = await queryMany(
      `SELECT skill_name, min_years, is_required FROM job_skills WHERE job_id = $1`,
      [jobId]
    );

    const result = await aiService.aiMatchScore(
      {
        skills: candidateSkills.map((s: any) => ({
          name: s.name,
          years: parseFloat(s.years) || 0,
        })),
        experience: candidateExperience,
        totalYears: parseFloat(String(profile?.total_experience_years)) || 0,
      },
      {
        title: job.title,
        description: job.description,
        skills: jobSkills,
        minExperience: job.min_experience_years,
        maxExperience: job.max_experience_years,
      }
    );

    sendSuccess(res, 200, "Detailed match analysis complete", result);
  } catch (error) {
    next(error);
  }
};

export const getJobRecommendations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const userId = req.user.userId;
    const limit = Math.min(
      parseInt((req.query.limit as string) || "10", 10),
      20
    );

    const cacheKey = CacheKeys.recommendations(userId);
    const cached = await getCache(cacheKey);
    if (cached) {
      sendSuccess(res, 200, "Job recommendations fetched (cached)", cached);
      return;
    }

    const candidateSkills = await queryMany(
      `SELECT skill_name as name, years_of_experience as years
       FROM candidate_skills WHERE user_id = $1`,
      [userId]
    );

    if (candidateSkills.length === 0) {
      sendSuccess(res, 200, "Upload your resume to get job recommendations", {
        recommendations: [],
      });
      return;
    }

    const profile = await queryOne<{
      total_experience_years: number;
    }>(
      `SELECT total_experience_years FROM candidate_profiles WHERE user_id = $1`,
      [userId]
    );

    const user = await queryOne<{ location: string | null }>(
      `SELECT location FROM users WHERE id = $1`,
      [userId]
    );

    const jobs = await queryMany(
      `SELECT j.id, j.title, j.company, j.location,
              j.min_experience_years, j.max_experience_years,
              j.salary_min, j.salary_max, j.job_type, j.workplace_type
       FROM jobs j
       WHERE j.status = 'active'
         AND j.id NOT IN (
           SELECT job_id FROM applications WHERE candidate_id = $1
         )
       ORDER BY j.created_at DESC
       LIMIT 50`,
      [userId]
    );

    const jobsWithSkills = await Promise.all(
      jobs.map(async (job: any) => {
        const skills = await queryMany(
          `SELECT skill_name, min_years, is_required 
           FROM job_skills WHERE job_id = $1`,
          [job.id]
        );
        return { ...job, skills };
      })
    );

    const recommendations = await aiService.getJobRecommendations(
      candidateSkills.map((s: any) => ({
        name: s.name,
        years: parseFloat(s.years) || 0,
      })),
      parseFloat(String(profile?.total_experience_years)) || 0,
      user?.location || null,
      jobsWithSkills
    );

    const enriched = recommendations.slice(0, limit).map((rec) => {
      const job = jobsWithSkills.find((j: any) => j.id === rec.jobId);
      return {
        ...rec,
        job: job
          ? {
              id: job.id,
              title: job.title,
              company: job.company,
              location: job.location,
              salary_min: job.salary_min,
              salary_max: job.salary_max,
              job_type: job.job_type,
              workplace_type: job.workplace_type,
            }
          : null,
      };
    });

    await setCache(cacheKey, enriched, CacheDuration.LONG);

    sendSuccess(res, 200, "Job recommendations generated", enriched);
  } catch (error) {
    next(error);
  }
};

export const generateJobDescription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const { title, company, department, skills, experienceLevel, location } =
      req.body;

    if (!title || !company || !skills || !Array.isArray(skills)) {
      throw new AppError(
        "Title, company, and skills array are required",
        400
      );
    }

    const description = await aiService.generateJobDescription({
      title,
      company,
      department,
      skills,
      experienceLevel: experienceLevel || "mid",
      location: location || "Remote",
    });

    sendSuccess(res, 200, "Job description generated", { description });
  } catch (error) {
    next(error);
  }
};

export const rankCandidates = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const { jobId } = req.params as { jobId: string };

    const job = await queryOne<{
      recruiter_id: string;
      title: string;
      min_experience_years: number;
      max_experience_years: number;
    }>(
      `SELECT recruiter_id, title, min_experience_years, max_experience_years 
       FROM jobs WHERE id = $1`,
      [jobId]
    );

    if (!job) throw new AppError("Job not found", 404);
    if (job.recruiter_id !== req.user.userId) {
      throw new AppError("You can only rank candidates for your own jobs", 403);
    }

    const cacheKey = CacheKeys.jobMatches(jobId);
    const cached = await getCache(cacheKey);
    if (cached) {
      sendSuccess(res, 200, "Ranked candidates fetched (cached)", cached);
      return;
    }

    const jobSkills = await queryMany(
      `SELECT skill_name, min_years, is_required FROM job_skills WHERE job_id = $1`,
      [jobId]
    );

    const applications = await queryMany(
      `SELECT a.id as application_id, a.candidate_id, a.status, a.applied_at,
              u.full_name, u.email, u.avatar_url, u.location,
              cp.total_experience_years, cp.headline, cp.current_company
       FROM applications a
       JOIN users u ON a.candidate_id = u.id
       LEFT JOIN candidate_profiles cp ON u.id = cp.user_id
       WHERE a.job_id = $1 AND a.status != 'withdrawn'
       ORDER BY a.applied_at DESC`,
      [jobId]
    );

    const rankedCandidates = await Promise.all(
      applications.map(async (app: any) => {
        const candidateSkills = await queryMany(
          `SELECT skill_name as name, years_of_experience as years
           FROM candidate_skills WHERE user_id = $1`,
          [app.candidate_id]
        );

        const match = await aiService.calculateMatchScore(
          candidateSkills.map((s: any) => ({
            name: s.name,
            years: parseFloat(s.years) || 0,
          })),
          jobSkills,
          parseFloat(String(app.total_experience_years)) || 0,
          job.min_experience_years,
          job.max_experience_years
        );

        await queryOne(
          `UPDATE applications SET ai_match_score = $1, ai_analysis = $2 WHERE id = $3`,
          [
            match.overallScore,
            JSON.stringify({
              skillsScore: match.skillsScore,
              experienceScore: match.experienceScore,
              matchedSkills: match.matchedSkills,
              missingSkills: match.missingSkills,
              analysis: match.analysis,
            }),
            app.application_id,
          ]
        );

        return {
          applicationId: app.application_id,
          candidateId: app.candidate_id,
          name: app.full_name,
          email: app.email,
          avatar: app.avatar_url,
          location: app.location,
          headline: app.headline,
          currentCompany: app.current_company,
          experience: parseFloat(String(app.total_experience_years)) || 0,
          status: app.status,
          appliedAt: app.applied_at,
          matchScore: match.overallScore,
          skillsScore: match.skillsScore,
          experienceScore: match.experienceScore,
          matchedSkills: match.matchedSkills,
          missingSkills: match.missingSkills,
          analysis: match.analysis,
        };
      })
    );

    rankedCandidates.sort((a, b) => b.matchScore - a.matchScore);

    const ranked = rankedCandidates.map((c, index) => ({
      rank: index + 1,
      ...c,
    }));

    await setCache(cacheKey, ranked, CacheDuration.LONG);

    sendSuccess(res, 200, "Candidates ranked successfully", ranked);
  } catch (error) {
    next(error);
  }
};