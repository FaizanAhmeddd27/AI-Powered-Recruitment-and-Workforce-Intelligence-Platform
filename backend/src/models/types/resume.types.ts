export interface IParsedSkill {
  name: string;
  years: number;
  confidence: number;      // 0-100
}

export interface IParsedExperience {
  title: string;
  company: string;
  location: string | null;
  start_date: string;
  end_date: string | null;  // null = "present"
  description: string;
  is_current: boolean;
}

export interface IParsedEducation {
  degree: string;
  institution: string;
  location: string | null;
  start_year: number | null;
  end_year: number | null;
  grade: string | null;
  field_of_study: string | null;
}

export interface IParsedPersonalInfo {
  name: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  linkedin: string | null;
  github: string | null;
  portfolio: string | null;
}

export interface IParsedResume {
  userId: string;
  resumeFileId: string;           // MongoDB GridFS file ID
  personalInfo: IParsedPersonalInfo;
  experience: IParsedExperience[];
  skills: IParsedSkill[];
  education: IParsedEducation[];
  certifications: string[];
  summary: string | null;
  totalExperienceYears: number;
  confidence: {
    overall: number;
    skills: number;
    experience: number;
    education: number;
  };
  rawText: string;                // original extracted text
  parsedAt: Date;
}