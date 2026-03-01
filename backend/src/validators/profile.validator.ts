import { z } from "zod";


export const updateProfileSchema = z.object({
  full_name: z.string().min(2).max(255).trim().optional(),
  phone: z.string().max(20).trim().optional().nullable(),
  location: z.string().max(255).trim().optional().nullable(),
  linkedin_url: z.string().url("Invalid LinkedIn URL").optional().nullable().or(z.literal("")),
  github_url: z.string().url("Invalid GitHub URL").optional().nullable().or(z.literal("")),
  portfolio_url: z.string().url("Invalid portfolio URL").optional().nullable().or(z.literal("")),
  bio: z.string().max(2000, "Bio too long").optional().nullable(),
  avatar_url: z.string().url("Invalid avatar URL").optional().nullable().or(z.literal("")),
});


export const updateCandidateProfileSchema = z.object({
  headline: z.string().max(255).trim().optional().nullable(),
  total_experience_years: z.number().min(0).max(50).optional(),
  current_company: z.string().max(255).trim().optional().nullable(),
  current_title: z.string().max(255).trim().optional().nullable(),
  expected_salary_min: z.number().min(0).optional().nullable(),
  expected_salary_max: z.number().min(0).optional().nullable(),
  salary_currency: z.string().max(10).default("INR").optional(),
  notice_period_days: z.number().min(0).max(365).optional(),
  is_open_to_work: z.boolean().optional(),
  preferred_job_types: z
    .array(z.enum(["full-time", "part-time", "contract", "internship"]))
    .optional(),
  preferred_locations: z.array(z.string().max(255)).max(10).optional(),
});


export const addSkillSchema = z.object({
  skill_name: z
    .string({ message: "Skill name is required" })
    .min(1, "Skill name required")
    .max(100, "Skill name too long")
    .trim(),
  years_of_experience: z.number().min(0).max(50).default(0),
  proficiency_level: z
    .enum(["beginner", "intermediate", "advanced", "expert"])
    .default("intermediate"),
});


export const addExperienceSchema = z.object({
  title: z
    .string({ message: "Job title is required" })
    .min(2, "Title too short")
    .max(255)
    .trim(),
  company: z
    .string({ message: "Company is required" })
    .min(2, "Company name too short")
    .max(255)
    .trim(),
  location: z.string().max(255).trim().optional().nullable(),
  start_date: z.string({ message: "Start date is required" }),
  end_date: z.string().optional().nullable(),
  is_current: z.boolean().default(false),
  description: z.string().max(3000).optional().nullable(),
});


export const updateExperienceSchema = z.object({
  title: z.string().min(2).max(255).trim().optional(),
  company: z.string().min(2).max(255).trim().optional(),
  location: z.string().max(255).trim().optional().nullable(),
  start_date: z.string().optional(),
  end_date: z.string().optional().nullable(),
  is_current: z.boolean().optional(),
  description: z.string().max(3000).optional().nullable(),
});


export const addEducationSchema = z.object({
  degree: z
    .string({ message: "Degree is required" })
    .min(2)
    .max(255)
    .trim(),
  institution: z
    .string({ message: "Institution is required" })
    .min(2)
    .max(255)
    .trim(),
  location: z.string().max(255).trim().optional().nullable(),
  field_of_study: z.string().max(255).trim().optional().nullable(),
  start_year: z.number().min(1950).max(2030).optional().nullable(),
  end_year: z.number().min(1950).max(2030).optional().nullable(),
  grade: z.string().max(50).trim().optional().nullable(),
});


export const updateEducationSchema = z.object({
  degree: z.string().min(2).max(255).trim().optional(),
  institution: z.string().min(2).max(255).trim().optional(),
  location: z.string().max(255).trim().optional().nullable(),
  field_of_study: z.string().max(255).trim().optional().nullable(),
  start_year: z.number().min(1950).max(2030).optional().nullable(),
  end_year: z.number().min(1950).max(2030).optional().nullable(),
  grade: z.string().max(50).trim().optional().nullable(),
});


export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateCandidateProfileInput = z.infer<typeof updateCandidateProfileSchema>;
export type AddSkillInput = z.infer<typeof addSkillSchema>;
export type AddExperienceInput = z.infer<typeof addExperienceSchema>;
export type UpdateExperienceInput = z.infer<typeof updateExperienceSchema>;
export type AddEducationInput = z.infer<typeof addEducationSchema>;
export type UpdateEducationInput = z.infer<typeof updateEducationSchema>;