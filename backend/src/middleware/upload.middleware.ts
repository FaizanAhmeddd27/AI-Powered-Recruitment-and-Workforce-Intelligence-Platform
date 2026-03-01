import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import path from "path";
import { AppError } from "./error.middleware";
import logger from "../utils/logger.utils";


const storage = multer.memoryStorage();


const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  const allowedMimeTypes = ["application/pdf"];
  const allowedExtensions = [".pdf"];

  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype;

  if (allowedMimeTypes.includes(mimeType) && allowedExtensions.includes(ext)) {
    logger.debug(`File accepted: ${file.originalname} (${mimeType})`);
    cb(null, true);
  } else {
    logger.warn(`❌ File rejected: ${file.originalname} (${mimeType})`);
    cb(new AppError("Only PDF files are allowed", 400) as any, false);
  }
};


export const uploadResume = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,   // 5MB max
    files: 1,                     // Only 1 file at a time
  },
});


export const handleMulterError = (
  err: any,
  _req: Request,
  res: any,
  next: any
): void => {
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        return res.status(400).json({
          success: false,
          message: "File too large. Maximum size is 5MB.",
        });
      case "LIMIT_FILE_COUNT":
        return res.status(400).json({
          success: false,
          message: "Too many files. Only 1 file allowed.",
        });
      case "LIMIT_UNEXPECTED_FILE":
        return res.status(400).json({
          success: false,
          message: "Unexpected field name. Use 'resume' as field name.",
        });
      default:
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`,
        });
    }
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  next(err);
};