import { query, queryOne, queryMany } from "../config/db";
import { deleteCache } from "../config/redis";
import { UserQueries } from "../db/queries/user.queries";
import { AppError } from "../middleware/error.middleware";
import {
  CacheKeys,
  CacheDuration,
  invalidateCandidateCaches,
  cachedFetch,
} from "./cache.service";
import logger from "../utils/logger.utils";


export const getFullProfile = async (userId: string): Promise<any> => {
  const cacheKey = CacheKeys.userProfile(userId);

  return cachedFetch(
    cacheKey,
    async () => {
      // Get user basic info
      const user = await queryOne(UserQueries.findById, [userId]);
      if (!user) throw new AppError("User not found", 404);

      // Get candidate profile
      const candidateProfile = await queryOne(
        `SELECT * FROM candidate_profiles WHERE user_id = $1`,
        [userId]
      );

      // Get skills
      const skills = await queryMany(
        `SELECT id, skill_name, years_of_experience, proficiency_level, is_ai_extracted
         FROM candidate_skills
         WHERE user_id = $1
         ORDER BY years_of_experience DESC`,
        [userId]
      );

      // Get experience
      const experience = await queryMany(
        `SELECT id, title, company, location, start_date, end_date, is_current, description
         FROM candidate_experience
         WHERE user_id = $1
         ORDER BY CASE WHEN is_current THEN 0 ELSE 1 END, start_date DESC`,
        [userId]
      );

      // Get education
      const education = await queryMany(
        `SELECT id, degree, institution, location, field_of_study, start_year, end_year, grade
         FROM candidate_education
         WHERE user_id = $1
         ORDER BY end_year DESC NULLS FIRST`,
        [userId]
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          avatar_url: user.avatar_url,
          phone: user.phone,
          location: user.location,
          linkedin_url: user.linkedin_url,
          github_url: user.github_url,
          portfolio_url: user.portfolio_url,
          bio: user.bio,
          profile_completion: user.profile_completion,
          resume_mongo_id: user.resume_mongo_id,
          parsed_resume_mongo_id: user.parsed_resume_mongo_id,
          created_at: user.created_at,
        },
        candidateProfile: candidateProfile || null,
        skills,
        experience,
        education,
      };
    },
    CacheDuration.MEDIUM
  );
};


export const updateBasicProfile = async (
  userId: string,
  data: {
    full_name?: string;
    phone?: string | null;
    location?: string | null;
    linkedin_url?: string | null;
    github_url?: string | null;
    portfolio_url?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
  }
): Promise<any> => {
  // Convert empty strings to null for proper handling
  const normalizeValue = (val: string | null | undefined) => {
    if (val === undefined) return null;
    if (typeof val === 'string' && val.trim() === '') return null;
    return val;
  };

  const updated = await queryOne(UserQueries.updateProfile, [
    userId,
    data.full_name || null,
    normalizeValue(data.phone),
    normalizeValue(data.location),
    normalizeValue(data.linkedin_url),
    normalizeValue(data.github_url),
    normalizeValue(data.portfolio_url),
    normalizeValue(data.bio),
    data.avatar_url || null,
  ]);

  if (!updated) throw new AppError("Failed to update profile", 500);

  // Recalculate profile completion
  await recalculateProfileCompletion(userId);

  // Invalidate cache
  await invalidateCandidateCaches(userId);

  logger.info(`Profile updated for user: ${userId}`);
  return updated;
};


export const updateCandidateProfile = async (
  userId: string,
  data: {
    headline?: string | null;
    total_experience_years?: number;
    current_company?: string | null;
    current_title?: string | null;
    expected_salary_min?: number | null;
    expected_salary_max?: number | null;
    salary_currency?: string;
    notice_period_days?: number;
    is_open_to_work?: boolean;
    preferred_job_types?: string[];
    preferred_locations?: string[];
  }
): Promise<any> => {
  // Check if profile exists
  const existing = await queryOne(
    `SELECT id FROM candidate_profiles WHERE user_id = $1`,
    [userId]
  );

  let result;

  if (existing) {
    result = await queryOne(
      `UPDATE candidate_profiles
       SET headline = COALESCE($2, headline),
           total_experience_years = COALESCE($3, total_experience_years),
           current_company = COALESCE($4, current_company),
           current_title = COALESCE($5, current_title),
           expected_salary_min = COALESCE($6, expected_salary_min),
           expected_salary_max = COALESCE($7, expected_salary_max),
           salary_currency = COALESCE($8, salary_currency),
           notice_period_days = COALESCE($9, notice_period_days),
           is_open_to_work = COALESCE($10, is_open_to_work),
           preferred_job_types = COALESCE($11, preferred_job_types),
           preferred_locations = COALESCE($12, preferred_locations)
       WHERE user_id = $1
       RETURNING *`,
      [
        userId,
        data.headline,
        data.total_experience_years,
        data.current_company,
        data.current_title,
        data.expected_salary_min,
        data.expected_salary_max,
        data.salary_currency || "PKR",
        data.notice_period_days,
        data.is_open_to_work,
        data.preferred_job_types || null,
        data.preferred_locations || null,
      ]
    );
  } else {
    result = await queryOne(
      `INSERT INTO candidate_profiles 
       (user_id, headline, total_experience_years, current_company, current_title,
        expected_salary_min, expected_salary_max, salary_currency, notice_period_days,
        is_open_to_work, preferred_job_types, preferred_locations)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        userId,
        data.headline || null,
        data.total_experience_years || 0,
        data.current_company || null,
        data.current_title || null,
        data.expected_salary_min || null,
        data.expected_salary_max || null,
        data.salary_currency || "PKR",
        data.notice_period_days || 0,
        data.is_open_to_work !== undefined ? data.is_open_to_work : true,
        data.preferred_job_types || [],
        data.preferred_locations || [],
      ]
    );
  }

  await recalculateProfileCompletion(userId);
  await invalidateCandidateCaches(userId);

  logger.info(`Candidate profile updated for user: ${userId}`);
  return result;
};


export const addSkill = async (
  userId: string,
  data: {
    skill_name: string;
    years_of_experience: number;
    proficiency_level: string;
  }
): Promise<any> => {
  const existing = await queryOne(
    `SELECT id FROM candidate_skills WHERE user_id = $1 AND skill_name = $2`,
    [userId, data.skill_name]
  );

  if (existing) {
    throw new AppError(`Skill "${data.skill_name}" already exists`, 409);
  }

  const skill = await queryOne(
    `INSERT INTO candidate_skills (user_id, skill_name, years_of_experience, proficiency_level)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, data.skill_name, data.years_of_experience, data.proficiency_level]
  );

  await recalculateProfileCompletion(userId);
  await invalidateCandidateCaches(userId);

  return skill;
};

export const updateSkill = async (
  userId: string,
  skillId: string,
  data: {
    years_of_experience?: number;
    proficiency_level?: string;
  }
): Promise<any> => {
  const skill = await queryOne(
    `UPDATE candidate_skills
     SET years_of_experience = COALESCE($3, years_of_experience),
         proficiency_level = COALESCE($4, proficiency_level)
     WHERE id = $2 AND user_id = $1
     RETURNING *`,
    [userId, skillId, data.years_of_experience, data.proficiency_level]
  );

  if (!skill) throw new AppError("Skill not found", 404);

  await invalidateCandidateCaches(userId);
  return skill;
};

export const deleteSkill = async (
  userId: string,
  skillId: string
): Promise<void> => {
  const result = await query(
    `DELETE FROM candidate_skills WHERE id = $1 AND user_id = $2`,
    [skillId, userId]
  );

  if (result.rowCount === 0) throw new AppError("Skill not found", 404);

  await recalculateProfileCompletion(userId);
  await invalidateCandidateCaches(userId);
};

export const getSkills = async (userId: string): Promise<any[]> => {
  return queryMany(
    `SELECT id, skill_name, years_of_experience, proficiency_level, is_ai_extracted, created_at
     FROM candidate_skills
     WHERE user_id = $1
     ORDER BY years_of_experience DESC`,
    [userId]
  );
};

export const addExperience = async (
  userId: string,
  data: {
    title: string;
    company: string;
    location?: string | null;
    start_date: string;
    end_date?: string | null;
    is_current: boolean;
    description?: string | null;
  }
): Promise<any> => {
  // If current, unset other current entries
  if (data.is_current) {
    await query(
      `UPDATE candidate_experience SET is_current = FALSE WHERE user_id = $1 AND is_current = TRUE`,
      [userId]
    );
  }

  const experience = await queryOne(
    `INSERT INTO candidate_experience (user_id, title, company, location, start_date, end_date, is_current, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      userId,
      data.title,
      data.company,
      data.location || null,
      data.start_date,
      data.is_current ? null : data.end_date || null,
      data.is_current,
      data.description || null,
    ]
  );

  await recalculateProfileCompletion(userId);
  await invalidateCandidateCaches(userId);

  return experience;
};

export const updateExperience = async (
  userId: string,
  experienceId: string,
  data: {
    title?: string;
    company?: string;
    location?: string | null;
    start_date?: string;
    end_date?: string | null;
    is_current?: boolean;
    description?: string | null;
  }
): Promise<any> => {
  if (data.is_current) {
    await query(
      `UPDATE candidate_experience SET is_current = FALSE WHERE user_id = $1 AND is_current = TRUE AND id != $2`,
      [userId, experienceId]
    );
  }

  const experience = await queryOne(
    `UPDATE candidate_experience
     SET title = COALESCE($3, title),
         company = COALESCE($4, company),
         location = COALESCE($5, location),
         start_date = COALESCE($6, start_date),
         end_date = CASE WHEN $8 = TRUE THEN NULL ELSE COALESCE($7, end_date) END,
         is_current = COALESCE($8, is_current),
         description = COALESCE($9, description)
     WHERE id = $2 AND user_id = $1
     RETURNING *`,
    [
      userId,
      experienceId,
      data.title,
      data.company,
      data.location,
      data.start_date,
      data.end_date,
      data.is_current,
      data.description,
    ]
  );

  if (!experience) throw new AppError("Experience not found", 404);

  await invalidateCandidateCaches(userId);
  return experience;
};

export const deleteExperience = async (
  userId: string,
  experienceId: string
): Promise<void> => {
  const result = await query(
    `DELETE FROM candidate_experience WHERE id = $1 AND user_id = $2`,
    [experienceId, userId]
  );

  if (result.rowCount === 0) throw new AppError("Experience not found", 404);

  await recalculateProfileCompletion(userId);
  await invalidateCandidateCaches(userId);
};


export const addEducation = async (
  userId: string,
  data: {
    degree: string;
    institution: string;
    location?: string | null;
    field_of_study?: string | null;
    start_year?: number | null;
    end_year?: number | null;
    grade?: string | null;
  }
): Promise<any> => {
  const education = await queryOne(
    `INSERT INTO candidate_education (user_id, degree, institution, location, field_of_study, start_year, end_year, grade)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      userId,
      data.degree,
      data.institution,
      data.location || null,
      data.field_of_study || null,
      data.start_year || null,
      data.end_year || null,
      data.grade || null,
    ]
  );

  await recalculateProfileCompletion(userId);
  await invalidateCandidateCaches(userId);

  return education;
};

export const updateEducation = async (
  userId: string,
  educationId: string,
  data: {
    degree?: string;
    institution?: string;
    location?: string | null;
    field_of_study?: string | null;
    start_year?: number | null;
    end_year?: number | null;
    grade?: string | null;
  }
): Promise<any> => {
  const education = await queryOne(
    `UPDATE candidate_education
     SET degree = COALESCE($3, degree),
         institution = COALESCE($4, institution),
         location = COALESCE($5, location),
         field_of_study = COALESCE($6, field_of_study),
         start_year = COALESCE($7, start_year),
         end_year = COALESCE($8, end_year),
         grade = COALESCE($9, grade)
     WHERE id = $2 AND user_id = $1
     RETURNING *`,
    [
      userId,
      educationId,
      data.degree,
      data.institution,
      data.location,
      data.field_of_study,
      data.start_year,
      data.end_year,
      data.grade,
    ]
  );

  if (!education) throw new AppError("Education not found", 404);

  await invalidateCandidateCaches(userId);
  return education;
};

export const deleteEducation = async (
  userId: string,
  educationId: string
): Promise<void> => {
  const result = await query(
    `DELETE FROM candidate_education WHERE id = $1 AND user_id = $2`,
    [educationId, userId]
  );

  if (result.rowCount === 0) throw new AppError("Education not found", 404);

  await recalculateProfileCompletion(userId);
  await invalidateCandidateCaches(userId);
};


const recalculateProfileCompletion = async (userId: string): Promise<void> => {
  let score = 0;

  const user = await queryOne(
    `SELECT full_name, phone, location, linkedin_url, bio, avatar_url, resume_mongo_id
     FROM users WHERE id = $1`,
    [userId]
  );

  if (!user) return;

  if (user.full_name) score += 10;
  if (user.phone) score += 5;
  if (user.location) score += 5;
  if (user.linkedin_url) score += 5;
  if (user.bio) score += 5;
  if (user.avatar_url) score += 5;
  if (user.resume_mongo_id) score += 15;

  const profile = await queryOne(
    `SELECT headline, current_company FROM candidate_profiles WHERE user_id = $1`,
    [userId]
  );

  if (profile?.headline) score += 5;
  if (profile?.current_company) score += 5;

  const skillsCount = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM candidate_skills WHERE user_id = $1`,
    [userId]
  );
  if (parseInt(skillsCount?.count || "0") > 0) score += 15;
  if (parseInt(skillsCount?.count || "0") >= 5) score += 5;

  const expCount = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM candidate_experience WHERE user_id = $1`,
    [userId]
  );
  if (parseInt(expCount?.count || "0") > 0) score += 15;

  const eduCount = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM candidate_education WHERE user_id = $1`,
    [userId]
  );
  if (parseInt(eduCount?.count || "0") > 0) score += 5;

  score = Math.min(score, 100);

  await query(UserQueries.updateProfileCompletion, [userId, score]);
  logger.debug(`Profile completion recalculated: ${userId} = ${score}%`);
};