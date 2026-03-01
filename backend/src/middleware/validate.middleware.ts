import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError, ZodIssue } from "zod";
import { sendError } from "../utils/response.utils";


export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.body);
      req.body = parsed; 
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((err: ZodIssue) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        sendError(
          res,
          400,
          "Validation failed",
          JSON.stringify(formattedErrors)
        );
        return;
      }

      sendError(res, 400, "Invalid request data");
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.query);
      req.query = parsed as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((err: ZodIssue) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        sendError(
          res,
          400,
          "Invalid query parameters",
          JSON.stringify(formattedErrors)
        );
        return;
      }

      sendError(res, 400, "Invalid query parameters");
    }
  };
};


export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.params);
      req.params = parsed as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((err: ZodIssue) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        sendError(
          res,
          400,
          "Invalid URL parameters",
          JSON.stringify(formattedErrors)
        );
        return;
      }

      sendError(res, 400, "Invalid URL parameters");
    }
  };
};