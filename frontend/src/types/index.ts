// USER TYPES
export type UserRole = "candidate" | "recruiter" | "admin";
export type AuthProvider = "local" | "google" | "github";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  auth_provider: AuthProvider;
  avatar_url: string | null;
  phone: string | null;
  location: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  bio: string | null;
  profile_completion: number;
  resume_mongo_id: string | null;
  parsed_resume_mongo_id: string | null;
  created_at: string;
}

// AUTH TYPES
export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
  role: UserRole;
}

// JOB TYPES
export type JobType = "full-time" | "part-time" | "contract" | "internship";
export type WorkplaceType = "on-site" | "remote" | "hybrid";
export type ExperienceLevel = "entry" | "mid" | "senior" | "lead" | "executive";
export type JobStatus = "active" | "closed" | "draft" | "paused";

export interface JobSkill {
  id?: string;
  skill_name: string;
  min_years: number;
  is_required: boolean;
}

export interface Job {
  id: string;
  recruiter_id: string;
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
  created_at: string;
  updated_at: string;
  recruiter_name?: string;
  recruiter_avatar?: string;
  skills?: JobSkill[];
}

// APPLICATION TYPES
export type ApplicationStatus =
  | "pending"
  | "under_review"
  | "shortlisted"
  | "interview"
  | "offered"
  | "hired"
  | "rejected"
  | "withdrawn";

export interface Application {
  id: string;
  job_id: string;
  candidate_id: string;
  status: ApplicationStatus;
  ai_match_score: number | null;
  ai_analysis: any;
  cover_letter: string | null;
  expected_salary: number | null;
  notice_period_days: number | null;
  recruiter_notes: string | null;
  resume_mongo_id: string | null;
  applied_at: string;
  reviewed_at: string | null;
  updated_at: string;
  job_title?: string;
  job_company?: string;
  job_location?: string;
  candidate_name?: string;
  candidate_email?: string;
  candidate_avatar?: string;
  candidate_skills?: CandidateSkill[];
}

// CANDIDATE TYPES
export interface CandidateProfile {
  headline: string | null;
  total_experience_years: number;
  current_company: string | null;
  current_title: string | null;
  expected_salary_min: number | null;
  expected_salary_max: number | null;
  salary_currency: string;
  notice_period_days: number;
  is_open_to_work: boolean;
  preferred_job_types: string[];
  preferred_locations: string[];
}

export interface CandidateSkill {
  id: string;
  skill_name: string;
  years_of_experience: number;
  proficiency_level: string;
  is_ai_extracted: boolean;
}

export interface CandidateExperience {
  id: string;
  title: string;
  company: string;
  location: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
}

export interface CandidateEducation {
  id: string;
  degree: string;
  institution: string;
  location: string | null;
  field_of_study: string | null;
  start_year: number | null;
  end_year: number | null;
  grade: string | null;
}

export interface FullCandidateProfile {
  user: User;
  candidateProfile: CandidateProfile | null;
  skills: CandidateSkill[];
  experience: CandidateExperience[];
  education: CandidateEducation[];
}

// RESUME TYPES
export interface ParsedResume {
  personalInfo: {
    name: string;
    email: string | null;
    phone: string | null;
    location: string | null;
    linkedin: string | null;
    github: string | null;
    portfolio: string | null;
  };
  experience: Array<{
    title: string;
    company: string;
    location: string | null;
    startDate: string;
    endDate: string | null;
    description: string;
    isCurrent: boolean;
  }>;
  skills: Array<{
    name: string;
    years: number;
    confidence: number;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    fieldOfStudy: string | null;
    startYear: number | null;
    endYear: number | null;
    grade: string | null;
  }>;
  certifications: string[];
  summary: string | null;
  totalExperienceYears: number;
  confidence: {
    overall: number;
    skills: number;
    experience: number;
    education: number;
  };
}

// AI TYPES
export interface MatchScore {
  overallScore: number;
  skillsScore: number;
  experienceScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  analysis: string;
}

export interface JobRecommendation {
  jobId: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  job: Job;
}

// API RESPONSE TYPES
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// ADMIN TYPES
export interface PlatformStats {
  users: {
    total_users: number;
    candidates: number;
    recruiters: number;
    admins: number;
    new_this_week: number;
    new_this_month: number;
    active_users: number;
  };
  jobs: {
    total_jobs: number;
    active_jobs: number;
    closed_jobs: number;
    posted_this_week: number;
    posted_this_month: number;
  };
  applications: {
    total_applications: number;
    pending: number;
    shortlisted: number;
    hired: number;
    rejected: number;
    apps_this_week: number;
    apps_this_month: number;
    avg_match_score: number;
  };
  resumes: {
    total_uploaded: number;
    total_parsed: number;
  };
}