export type JobType = "full-time" | "part-time" | "contract" | "internship";
export type WorkplaceType = "on-site" | "remote" | "hybrid";
export type JobStatus = "active" | "closed" | "draft" | "paused";
export type ExperienceLevel = "entry" | "mid" | "senior" | "lead" | "executive";

export interface IJobSkill {
  skill_name: string;
  min_years: number;
  is_required: boolean;    // must-have vs nice-to-have
}

export interface IJob {
  id: string;                     // UUID
  recruiter_id: string;           // FK to users
  title: string;
  company: string;
  department: string | null;
  description: string;
  location: string;
  job_type: JobType;
  workplace_type: WorkplaceType;
  experience_level: ExperienceLevel;
  min_experience_years: number;
  max_experience_years: number;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  benefits: string[];
  status: JobStatus;
  applications_count: number;
  views_count: number;
  created_at: Date;
  updated_at: Date;
  expires_at: Date | null;
}

export interface IJobCreate {
  recruiter_id: string;
  title: string;
  company: string;
  department?: string;
  description: string;
  location: string;
  job_type: JobType;
  workplace_type: WorkplaceType;
  experience_level: ExperienceLevel;
  min_experience_years: number;
  max_experience_years: number;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  benefits?: string[];
  skills: IJobSkill[];
  expires_at?: Date;
}