export type UserRole = "candidate" | "recruiter" | "admin";
export type AuthProvider = "local" | "google" | "github";

export interface IUser {
  id: string;                    // UUID
  email: string;
  password_hash: string | null;  // null for OAuth users
  full_name: string;
  role: UserRole;
  auth_provider: AuthProvider;
  provider_id: string | null;    // Google/GitHub user ID
  avatar_url: string | null;
  phone: string | null;
  location: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  bio: string | null;
  is_active: boolean;
  is_verified: boolean;
  resume_mongo_id: string | null;      // MongoDB ObjectId reference
  parsed_resume_mongo_id: string | null; // MongoDB ObjectId reference
  profile_completion: number;    // 0-100
  created_at: Date;
  updated_at: Date;
}

export interface IUserCreate {
  email: string;
  password?: string;
  full_name: string;
  role: UserRole;
  auth_provider?: AuthProvider;
  provider_id?: string;
  avatar_url?: string;
}

export interface IUserPublic {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  phone: string | null;
  location: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  bio: string | null;
  profile_completion: number;
  created_at: Date;
}