import { z } from "zod";


export const createApplicationSchema = z.object({
  cover_letter: z
    .string()
    .max(2000, "Cover letter must be under 2000 characters")
    .optional()
    .nullable(),

  expected_salary: z
    .number()
    .min(0, "Salary cannot be negative")
    .max(100000000, "Salary too high")
    .optional()
    .nullable(),

  notice_period_days: z
    .number()
    .min(0, "Notice period cannot be negative")
    .max(365, "Notice period too long")
    .optional()
    .nullable(),

  resume_mongo_id: z
    .string()
    .max(50, "Invalid resume ID")
    .optional()
    .nullable(),
});


export const updateStatusSchema = z.object({
  status: z.enum(
    [
      "pending",
      "under_review",
      "shortlisted",
      "interview",
      "offered",
      "hired",
      "rejected",
    ],
    {
      message: "Invalid status value",
    }
  ),
});


export const recruiterNotesSchema = z.object({
  notes: z
    .string({ message: "Notes are required" })
    .min(1, "Notes are required")
    .max(5000, "Notes too long"),
});


export const withdrawApplicationSchema = z.object({
  reason: z
    .string()
    .max(500, "Reason too long")
    .optional()
    .nullable(),
});


export const getApplicationsQuerySchema = z.object({
  status: z
    .enum([
      "pending",
      "under_review",
      "shortlisted",
      "interview",
      "offered",
      "hired",
      "rejected",
      "withdrawn",
    ])
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
    .enum(["applied_at", "ai_match_score", "status", "updated_at"])
    .default("applied_at"),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
});


export const bulkStatusUpdateSchema = z.object({
  application_ids: z
    .array(z.string().uuid("Invalid application ID"))
    .min(1, "At least one application ID required")
    .max(50, "Maximum 50 applications at once"),
  status: z.enum([
    "under_review",
    "shortlisted",
    "interview",
    "offered",
    "hired",
    "rejected",
  ]),
});


export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type RecruiterNotesInput = z.infer<typeof recruiterNotesSchema>;
export type WithdrawApplicationInput = z.infer<typeof withdrawApplicationSchema>;
export type GetApplicationsQuery = z.infer<typeof getApplicationsQuerySchema>;
export type BulkStatusUpdateInput = z.infer<typeof bulkStatusUpdateSchema>;