import mongoose, { Schema, Document } from "mongoose";


export interface IParsedResumeDocument extends Document {
  userId: string;
  resumeFileId: mongoose.Types.ObjectId;
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
    location: string | null;
    startYear: number | null;
    endYear: number | null;
    grade: string | null;
    fieldOfStudy: string | null;
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
  rawText: string;
  parsedAt: Date;
}

const ParsedResumeSchema = new Schema<IParsedResumeDocument>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    resumeFileId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Resume",
    },
    personalInfo: {
      name: { type: String, required: true },
      email: { type: String, default: null },
      phone: { type: String, default: null },
      location: { type: String, default: null },
      linkedin: { type: String, default: null },
      github: { type: String, default: null },
      portfolio: { type: String, default: null },
    },
    experience: [
      {
        title: { type: String, required: true },
        company: { type: String, required: true },
        location: { type: String, default: null },
        startDate: { type: String, required: true },
        endDate: { type: String, default: null },
        description: { type: String, default: "" },
        isCurrent: { type: Boolean, default: false },
      },
    ],
    skills: [
      {
        name: { type: String, required: true },
        years: { type: Number, default: 0 },
        confidence: { type: Number, default: 0, min: 0, max: 100 },
      },
    ],
    education: [
      {
        degree: { type: String, required: true },
        institution: { type: String, required: true },
        location: { type: String, default: null },
        startYear: { type: Number, default: null },
        endYear: { type: Number, default: null },
        grade: { type: String, default: null },
        fieldOfStudy: { type: String, default: null },
      },
    ],
    certifications: [{ type: String }],
    summary: { type: String, default: null },
    totalExperienceYears: { type: Number, default: 0 },
    confidence: {
      overall: { type: Number, default: 0 },
      skills: { type: Number, default: 0 },
      experience: { type: Number, default: 0 },
      education: { type: Number, default: 0 },
    },
    rawText: { type: String, required: true },
    parsedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: "parsed_resumes",
  }
);

// Indexes
ParsedResumeSchema.index({ userId: 1 });
ParsedResumeSchema.index({ "skills.name": 1 });
ParsedResumeSchema.index({ totalExperienceYears: 1 });

export const ParsedResumeModel = mongoose.model<IParsedResumeDocument>(
  "ParsedResume",
  ParsedResumeSchema
);