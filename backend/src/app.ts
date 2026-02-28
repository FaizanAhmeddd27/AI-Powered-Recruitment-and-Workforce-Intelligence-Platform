import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import passport from "passport";

import env from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import logger from "./utils/logger.utils";

const app: Application = express();


app.use(helmet());


app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());


const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms", {
    stream: morganStream,
  })
);


app.use(passport.initialize());


app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "AI Recruitment Platform API is running!",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// ============================================
// API ROUTES (will be added in next steps)
// ============================================
// app.use("/api/auth", authRoutes);
// app.use("/api/candidate", candidateRoutes);
// app.use("/api/recruiter", recruiterRoutes);
// app.use("/api/jobs", jobRoutes);
// app.use("/api/resume", resumeRoutes);
// app.use("/api/applications", applicationRoutes);
// app.use("/api/ai", aiRoutes);
// app.use("/api/admin", adminRoutes);


app.use(notFoundHandler);
app.use(errorHandler);

export default app;