import mongoose from "mongoose";
import { Readable } from "stream";
import { query, queryOne } from "../config/db";
import { setCache, getCache, deleteCache, pushToQueue } from "../config/redis";
import { getGridFSBucket } from "../config/mongodb";
import { ResumeModel, IResumeDocument } from "../models/mongo/Resume.model";
import { ParsedResumeModel, IParsedResumeDocument } from "../models/mongo/ParsedResumeModel";
import { UserQueries } from "../db/queries/user.queries";
import { extractTextFromPDF, validatePDFContent } from "../utils/pdfParser.utils";
import { parseResumeWithAI } from "./ai.service";
import { AppError } from "../middleware/error.middleware";
import { CacheKeys, CacheDuration, invalidateCandidateCaches } from "./cache.service";
import logger from "../utils/logger.utils";


export const uploadResume = async (
  userId: string,
  file: Express.Multer.File
): Promise<{
  resumeId: string;
  filename: string;
  size: number;
  status: string;
}> => {
  try {
    // 1. Check if user exists and is candidate
    const user = await queryOne<{ id: string; role: string }>(
      `SELECT id, role FROM users WHERE id = $1`,
      [userId]
    );

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user.role !== "candidate") {
      throw new AppError("Only candidates can upload resumes", 403);
    }

    // 2. Delete previous resume if exists
    const previousResume = await ResumeModel.findOne({ userId }).sort({
      uploadedAt: -1,
    });

    if (previousResume) {
      try {
        const bucket = getGridFSBucket();
        await bucket.delete(previousResume.gridFsFileId);
        logger.debug(`Previous GridFS file deleted: ${previousResume.gridFsFileId}`);
      } catch (err) {
        logger.warn(`Could not delete previous GridFS file: ${err}`);
      }
      await ResumeModel.deleteMany({ userId });
      logger.debug(`Previous resume records deleted for user: ${userId}`);
    }

    // 3. Upload to GridFS
    const bucket = getGridFSBucket();
    const filename = `resume_${userId}_${Date.now()}.pdf`;

    const uploadStream = bucket.openUploadStream(filename, {
      metadata: {
        userId,
        originalName: file.originalname,
        uploadedAt: new Date().toISOString(),
      },
    });

    // Create readable stream from buffer
    const readableStream = new Readable();
    readableStream.push(file.buffer);
    readableStream.push(null);

    // Pipe to GridFS
    await new Promise<void>((resolve, reject) => {
      readableStream
        .pipe(uploadStream)
        .on("finish", () => resolve())
        .on("error", (err) => reject(err));
    });

    const gridFsFileId = uploadStream.id;

    // 4. Save resume metadata in MongoDB
    const resume = await ResumeModel.create({
      userId,
      filename,
      originalName: file.originalname,
      contentType: "application/pdf",
      size: file.size,
      gridFsFileId,
      status: "uploaded",
    });

    // 5. Update user's resume reference in PostgreSQL
    await query(
      `UPDATE users SET resume_mongo_id = $1 WHERE id = $2`,
      [resume._id.toString(), userId]
    );

    logger.info(
      `Resume uploaded: user=${userId}, file=${file.originalname}, size=${(file.size / 1024).toFixed(1)}KB`
    );

    return {
      resumeId: resume._id.toString(),
      filename: file.originalname,
      size: file.size,
      status: "uploaded",
    };
  } catch (error: any) {
    logger.error(`❌ Resume upload failed: ${error.message}`);
    throw error;
  }
};


export const parseResume = async (
  userId: string,
  resumeId: string
): Promise<{
  parsedData: any;
  confidence: any;
}> => {
  try {
    // 1. Get resume metadata
    const resume = await ResumeModel.findById(resumeId);

    if (!resume) {
      throw new AppError("Resume not found", 404);
    }

    if (resume.userId !== userId) {
      throw new AppError("You can only parse your own resume", 403);
    }

    // 2. Update status to processing
    resume.status = "processing";
    await resume.save();

    // 3. Download file from GridFS
    const bucket = getGridFSBucket();
    const downloadStream = bucket.openDownloadStream(resume.gridFsFileId);

    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      downloadStream
        .on("data", (chunk: Buffer) => chunks.push(chunk))
        .on("end", () => resolve())
        .on("error", (err) => reject(err));
    });

    const pdfBuffer = Buffer.concat(chunks);

    // 4. Extract text from PDF
    const { text, numPages } = await extractTextFromPDF(pdfBuffer);

    // 5. Validate extracted text
    const validation = validatePDFContent(text);
    if (!validation.isValid) {
      resume.status = "failed";
      await resume.save();
      throw new AppError(validation.message, 400);
    }

    // 6. Parse with AI (GROQ)
    logger.info(`Starting AI parsing for user: ${userId}`);
    const aiParsedData = await parseResumeWithAI(text);

    const normalizedPersonalInfo = {
      name: aiParsedData?.personalInfo?.name || "Unknown Candidate",
      email: aiParsedData?.personalInfo?.email || null,
      phone: aiParsedData?.personalInfo?.phone || null,
      location: aiParsedData?.personalInfo?.location || null,
      linkedin: aiParsedData?.personalInfo?.linkedin || null,
      github: aiParsedData?.personalInfo?.github || null,
      portfolio: aiParsedData?.personalInfo?.portfolio || null,
    };

    const normalizedExperience = (Array.isArray(aiParsedData?.experience)
      ? aiParsedData.experience
      : []
    )
      .map((item: any) => ({
        title: item?.title || "Not specified",
        company: item?.company || "Not specified",
        location: item?.location || null,
        startDate: item?.startDate || item?.endDate || "Unknown",
        endDate: item?.endDate || null,
        description: item?.description || "",
        isCurrent: Boolean(item?.isCurrent),
      }))
      .filter((item: any) => item.title || item.company || item.description);

    const normalizedSkills = (Array.isArray(aiParsedData?.skills)
      ? aiParsedData.skills
      : []
    )
      .map((skill: any) => ({
        name: skill?.name || "Unknown Skill",
        years: Number(skill?.years) || 0,
        confidence: Math.max(0, Math.min(100, Number(skill?.confidence) || 0)),
      }))
      .filter((skill: any) => skill.name && skill.name.trim().length > 0);

    const normalizedEducation = (Array.isArray(aiParsedData?.education)
      ? aiParsedData.education
      : []
    )
      .map((edu: any) => ({
        degree: edu?.degree || "Not specified",
        institution: edu?.institution || "Not specified",
        location: edu?.location || null,
        startYear: Number.isFinite(Number(edu?.startYear)) ? Number(edu.startYear) : null,
        endYear: Number.isFinite(Number(edu?.endYear)) ? Number(edu.endYear) : null,
        grade: edu?.grade || null,
        fieldOfStudy: edu?.fieldOfStudy || null,
      }))
      .filter((edu: any) => edu.degree || edu.institution);

    const normalizedConfidence = {
      overall: Number(aiParsedData?.confidence?.overall) || 0,
      skills: Number(aiParsedData?.confidence?.skills) || 0,
      experience: Number(aiParsedData?.confidence?.experience) || 0,
      education: Number(aiParsedData?.confidence?.education) || 0,
    };

    // 7. Save parsed data to MongoDB
    const parsedResume = await ParsedResumeModel.findOneAndUpdate(
      { userId },
      {
        userId,
        resumeFileId: resume._id,
        personalInfo: normalizedPersonalInfo,
        experience: normalizedExperience,
        skills: normalizedSkills,
        education: normalizedEducation,
        certifications: aiParsedData.certifications || [],
        summary: aiParsedData.summary || null,
        totalExperienceYears: aiParsedData.totalExperienceYears || 0,
        confidence: normalizedConfidence,
        rawText: text,
        parsedAt: new Date(),
      },
      {
        upsert: true, // Create if not exists, update if exists
        returnDocument: "after",
        runValidators: true,
      }
    );

    // 8. Update resume status
    resume.status = "completed";
    await resume.save();

    // 9. Update PostgreSQL user record
    await query(UserQueries.updateResumeIds, [
      userId,
      resume._id.toString(),
      parsedResume!._id.toString(),
    ]);

    // 10. Sync extracted skills to PostgreSQL candidate_skills table
    if (normalizedSkills.length > 0) {
      for (const skill of normalizedSkills) {
        await query(
          `INSERT INTO candidate_skills (user_id, skill_name, years_of_experience, proficiency_level, is_ai_extracted)
           VALUES ($1, $2, $3, $4, TRUE)
           ON CONFLICT (user_id, skill_name) 
           DO UPDATE SET years_of_experience = $3, is_ai_extracted = TRUE`,
          [
            userId,
            skill.name,
            skill.years || 0,
            skill.confidence >= 80
              ? "expert"
              : skill.confidence >= 60
              ? "advanced"
              : skill.confidence >= 40
              ? "intermediate"
              : "beginner",
          ]
        );
      }
      logger.info(
        `${normalizedSkills.length} skills synced to PostgreSQL for user: ${userId}`
      );
    }

    // 11. Update candidate profile with experience
    if (aiParsedData.totalExperienceYears) {
      await query(
        `UPDATE candidate_profiles 
         SET total_experience_years = $1,
             headline = COALESCE(headline, $2),
             current_company = COALESCE(current_company, $3),
             current_title = COALESCE(current_title, $4)
         WHERE user_id = $5`,
        [
          aiParsedData.totalExperienceYears,
          normalizedExperience?.[0]
            ? `${normalizedExperience[0].title} at ${normalizedExperience[0].company}`
            : null,
          normalizedExperience?.[0]?.company || null,
          normalizedExperience?.[0]?.title || null,
          userId,
        ]
      );
    }

    // 12. Update profile completion
    const completionScore = calculateProfileCompletion(aiParsedData);
    await query(UserQueries.updateProfileCompletion, [userId, completionScore]);

    // 13. Cache parsed data
    await setCache(
      CacheKeys.parsedResume(userId),
      {
        personalInfo: normalizedPersonalInfo,
        experience: normalizedExperience,
        skills: normalizedSkills,
        education: normalizedEducation,
        certifications: aiParsedData.certifications,
        summary: aiParsedData.summary,
        totalExperienceYears: aiParsedData.totalExperienceYears,
        confidence: normalizedConfidence,
      },
      CacheDuration.LONG
    );

    // 14. Invalidate old caches
    await invalidateCandidateCaches(userId);

    logger.info(
      `Resume fully parsed and saved for user: ${userId} | Confidence: ${aiParsedData.confidence?.overall || 0}%`
    );

    return {
      parsedData: {
        personalInfo: normalizedPersonalInfo,
        experience: normalizedExperience,
        skills: normalizedSkills,
        education: normalizedEducation,
        certifications: aiParsedData.certifications,
        summary: aiParsedData.summary,
        totalExperienceYears: aiParsedData.totalExperienceYears,
      },
      confidence: normalizedConfidence,
    };
  } catch (error: any) {
    // Update status to failed
    try {
      await ResumeModel.findByIdAndUpdate(resumeId, { status: "failed" });
    } catch {}

    logger.error(`❌ Resume parsing failed: ${error.message}`);
    throw error;
  }
};

export const queueResumeForParsing = async (
  userId: string,
  resumeId: string
): Promise<void> => {
  await pushToQueue("resume_queue", {
    userId,
    resumeId,
    queuedAt: new Date().toISOString(),
  });

  // Set processing status in Redis
  await setCache(`resume_status:${resumeId}`, "queued", CacheDuration.LONG);

  logger.info(`Resume queued for parsing: ${resumeId}`);
};


export const getResumeStatus = async (
  resumeId: string
): Promise<string> => {
  // Check Redis first
  const cachedStatus = await getCache<string>(`resume_status:${resumeId}`);
  if (cachedStatus) return cachedStatus;

  // Check MongoDB
  const resume = await ResumeModel.findById(resumeId);
  if (!resume) return "not_found";

  return resume.status;
};


export const getParsedResume = async (
  userId: string
): Promise<any | null> => {
  // Check cache
  const cached = await getCache(CacheKeys.parsedResume(userId));
  if (cached) return cached;

  // Check MongoDB
  const parsed = await ParsedResumeModel.findOne({ userId })
    .sort({ parsedAt: -1 })
    .lean();

  if (!parsed) return null;

  // Cache
  await setCache(CacheKeys.parsedResume(userId), parsed, CacheDuration.LONG);

  return parsed;
};


export const downloadResumeFile = async (
  resumeId: string,
  requesterId: string,
  requesterRole: string
): Promise<{
  stream: any;
  filename: string;
  contentType: string;
}> => {
  const resume = await ResumeModel.findById(resumeId);

  if (!resume) {
    throw new AppError("Resume not found", 404);
  }

  // Auth check
  if (requesterRole === "candidate" && resume.userId !== requesterId) {
    throw new AppError("You can only download your own resume", 403);
  }

  // Recruiter can download if candidate applied to their job
  if (requesterRole === "recruiter") {
    const hasApplication = await queryOne(
      `SELECT a.id FROM applications a
       JOIN jobs j ON a.job_id = j.id
       WHERE a.candidate_id = $1 AND j.recruiter_id = $2
       LIMIT 1`,
      [resume.userId, requesterId]
    );

    if (!hasApplication) {
      throw new AppError(
        "You can only download resumes of candidates who applied to your jobs",
        403
      );
    }
  }

  const bucket = getGridFSBucket();
  const downloadStream = bucket.openDownloadStream(resume.gridFsFileId);

  return {
    stream: downloadStream,
    filename: resume.originalName,
    contentType: resume.contentType,
  };
};

export const getUserResumes = async (
  userId: string
): Promise<IResumeDocument[]> => {
  const resumes = await ResumeModel.find({ userId })
    .sort({ uploadedAt: -1 })
    .lean();

  return resumes as IResumeDocument[];
};


export const deleteResume = async (
  userId: string,
  resumeId: string
): Promise<void> => {
  const resume = await ResumeModel.findById(resumeId);

  if (!resume) {
    throw new AppError("Resume not found", 404);
  }

  if (resume.userId !== userId) {
    throw new AppError("You can only delete your own resume", 403);
  }

  // Delete from GridFS
  try {
    const bucket = getGridFSBucket();
    await bucket.delete(resume.gridFsFileId);
  } catch (err) {
    logger.warn(`Could not delete GridFS file: ${err}`);
  }

  // Delete metadata from MongoDB
  await ResumeModel.findByIdAndDelete(resumeId);

  // Delete parsed data
  await ParsedResumeModel.deleteOne({ userId });

  // Clear PostgreSQL references
  await query(
    `UPDATE users SET resume_mongo_id = NULL, parsed_resume_mongo_id = NULL WHERE id = $1`,
    [userId]
  );

  // Clear cache
  await deleteCache(CacheKeys.parsedResume(userId));
  await invalidateCandidateCaches(userId);

  logger.info(`Resume deleted: ${resumeId} for user: ${userId}`);
};


const calculateProfileCompletion = (parsedData: any): number => {
  let score = 0;

  if (parsedData.personalInfo?.name) score += 15;
  if (parsedData.personalInfo?.email) score += 10;
  if (parsedData.personalInfo?.phone) score += 10;
  if (parsedData.personalInfo?.location) score += 5;
  if (parsedData.experience?.length > 0) score += 25;
  if (parsedData.skills?.length > 0) score += 20;
  if (parsedData.education?.length > 0) score += 10;
  if (parsedData.summary) score += 5;

  return Math.min(score, 100);
};