import mongoose, { Schema, Document } from "mongoose";


export interface IResumeDocument extends Document {
  userId: string;
  filename: string;
  originalName: string;
  contentType: string;
  size: number;
  gridFsFileId: mongoose.Types.ObjectId;
  status: "uploaded" | "processing" | "completed" | "failed";
  uploadedAt: Date;
}

const ResumeSchema = new Schema<IResumeDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    contentType: {
      type: String,
      required: true,
      enum: ["application/pdf"],
    },
    size: {
      type: Number,
      required: true,
    },
    gridFsFileId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    status: {
      type: String,
      enum: ["uploaded", "processing", "completed", "failed"],
      default: "uploaded",
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: "resumes",
  }
);

// Indexes for performance
ResumeSchema.index({ userId: 1, uploadedAt: -1 });
ResumeSchema.index({ status: 1 });

export const ResumeModel = mongoose.model<IResumeDocument>(
  "Resume",
  ResumeSchema
);