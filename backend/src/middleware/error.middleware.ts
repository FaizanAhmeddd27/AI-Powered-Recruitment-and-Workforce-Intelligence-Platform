import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger.utils";
import { sendError } from "../utils/response.utils";

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error(`💥 Error: ${err.message}`);

  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.message);
    return;
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    sendError(res, 400, "Validation Error", err.message);
    return;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    sendError(res, 401, "Invalid token");
    return;
  }

  if (err.name === "TokenExpiredError") {
    sendError(res, 401, "Token expired");
    return;
  }

  // PostgreSQL unique violation
  if ((err as any).code === "23505") {
    sendError(res, 409, "Duplicate entry - resource already exists");
    return;
  }

  // Default server error
  sendError(
    res,
    500,
    "Internal Server Error",
    process.env.NODE_ENV === "development" ? err.message : undefined
  );
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
};