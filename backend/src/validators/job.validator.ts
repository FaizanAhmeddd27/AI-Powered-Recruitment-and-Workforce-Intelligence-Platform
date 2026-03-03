import { z } from "zod";


export const createJobSchema = z.object({
  title: z
    .string({ message: "Job title is required" })
    .min(1, "Job title is required")
    .min(3, "Title must be at least 3 characters")
    .max(255, "Title too long")
    .trim(),

  company: z
    .string({ message: "Company name is required" })
    .min(1, "Company name is required")
    .min(2, "Company name must be at least 2 characters")
    .max(255, "Company name too long")
    .trim(),

  department: z
    .string()
    .max(255, "Department too long")
    .trim()
    .optional()
    .nullable(),

  description: z
    .string({ message: "Job description is required" })
    .min(1, "Job description is required")
    .min(50, "Description must be at least 50 characters")
    .max(10000, "Description too long"),

  location: z
    .string({ message: "Location is required" })
    .min(1, "Location is required")
    .min(2, "Location must be at least 2 characters")
    .max(255, "Location too long")
    .trim(),

  job_type: z.enum(["full-time", "part-time", "contract", "internship"], {
    message: "Job type must be full-time, part-time, contract, or internship",
  }),

  workplace_type: z
    .enum(["on-site", "remote", "hybrid"], {
      message: "Workplace type must be on-site, remote, or hybrid",
    })
    .default("on-site"),

  experience_level: z.enum(["entry", "mid", "senior", "lead", "executive"], {
    message: "Experience level must be entry, mid, senior, lead, or executive",
  }),

  min_experience_years: z
    .number({ message: "Minimum experience must be a number" })
    .min(0, "Cannot be negative")
    .max(50, "Too high"),

  max_experience_years: z
    .number({ message: "Maximum experience must be a number" })
    .min(0, "Cannot be negative")
    .max(50, "Too high"),

  salary_min: z
    .number()
    .min(0, "Salary cannot be negative")
    .optional()
    .nullable(),

  salary_max: z
    .number()
    .min(0, "Salary cannot be negative")
    .optional()
    .nullable(),

  salary_currency: z.string().max(10).default("INR"),

  benefits: z
    .array(z.string().max(100))
    .max(20, "Maximum 20 benefits")
    .default([]),

  skills: z
    .array(
      z.object({
        skill_name: z
          .string({ message: "Skill name is required" })
          .min(1, "Skill name required")
          .max(100, "Skill name too long")
          .trim(),
        min_years: z.number().min(0).max(30).default(0),
        is_required: z.boolean().default(true),
      })
    )
    .min(1, "At least one skill is required")
    .max(20, "Maximum 20 skills"),

  expires_at: z.string().datetime().optional().nullable(),
});


export const updateJobSchema = z.object({
  title: z.string().min(3).max(255).trim().optional(),
  company: z.string().min(2).max(255).trim().optional(),
  department: z.string().max(255).trim().optional().nullable(),
  description: z.string().min(50).max(10000).optional(),
  location: z.string().min(2).max(255).trim().optional(),
  job_type: z
    .enum(["full-time", "part-time", "contract", "internship"])
    .optional(),
  workplace_type: z.enum(["on-site", "remote", "hybrid"]).optional(),
  experience_level: z
    .enum(["entry", "mid", "senior", "lead", "executive"])
    .optional(),
  min_experience_years: z.number().min(0).max(50).optional(),
  max_experience_years: z.number().min(0).max(50).optional(),
  salary_min: z.number().min(0).optional().nullable(),
  salary_max: z.number().min(0).optional().nullable(),
  salary_currency: z.string().max(10).optional(),
  benefits: z.array(z.string().max(100)).max(20).optional(),
  skills: z
    .array(
      z.object({
        skill_name: z.string().min(1).max(100).trim(),
        min_years: z.number().min(0).max(30).default(0),
        is_required: z.boolean().default(true),
      })
    )
    .max(20)
    .optional(),
  status: z.enum(["active", "closed", "draft", "paused"]).optional(),
});


export const searchJobsSchema = z.object({
  search: z.string().max(255).optional(),
  location: z.string().max(255).optional(),
  job_type: z
    .enum(["full-time", "part-time", "contract", "internship"])
    .optional(),
  workplace_type: z.enum(["on-site", "remote", "hybrid"]).optional(),
  experience_level: z
    .enum(["entry", "mid", "senior", "lead", "executive"])
    .optional(),
  salary_min: z
    .string()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .optional(),
  salary_max: z
    .string()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .optional(),
  page: z
    .string()
    .transform((val) => parseInt(val || "1", 10))
    .pipe(z.number())
    .default(1),
  limit: z
    .string()
    .transform((val) => Math.min(parseInt(val || "10", 10), 50))
    .pipe(z.number())
    .default(10),
  sort_by: z
    .enum(["created_at", "salary_min", "salary_max", "applications_count"])
    .default("created_at"),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
});


export const uuidParamSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
});


export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type SearchJobsInput = z.infer<typeof searchJobsSchema>;