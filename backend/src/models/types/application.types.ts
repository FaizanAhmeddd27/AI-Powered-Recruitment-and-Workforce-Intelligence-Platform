export type ApplicationStatus =
  | "pending"
  | "under_review"
  | "shortlisted"
  | "interview"
  | "offered"
  | "hired"
  | "rejected"
  | "withdrawn";

export interface IApplication {
  id: string;                     // UUID
  job_id: string;                 // FK to jobs
  candidate_id: string;           // FK to users
  resume_mongo_id: string | null; // MongoDB ObjectId
  cover_letter: string | null;
  expected_salary: number | null;
  notice_period_days: number | null;
  status: ApplicationStatus;
  ai_match_score: number | null;  // 0-100
  ai_analysis: string | null;     // JSON string from AI
  recruiter_notes: string | null;
  applied_at: Date;
  reviewed_at: Date | null;
  updated_at: Date;
}

export interface IApplicationCreate {
  job_id: string;
  candidate_id: string;
  resume_mongo_id?: string;
  cover_letter?: string;
  expected_salary?: number;
  notice_period_days?: number;
}