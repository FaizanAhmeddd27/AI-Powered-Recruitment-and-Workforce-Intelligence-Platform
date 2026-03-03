import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import passport from "passport";
import env from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import logger from "./utils/logger.utils";
import "./config/passport";
import routes from "./routes/index";

// Create Express app
const app: Application = express();

app.disable("etag");

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

app.use("/api", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});


app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "AI Recruitment Platform API is running!",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    endpoints: {
      auth: "/api/auth",
      candidate: "/api/candidate",
      recruiter: "/api/recruiter",
      jobs: "/api/jobs",
      resume: "/api/resume",
      applications: "/api/applications",
      ai: "/api/ai",
      admin: "/api/admin",
    },
  });
});


app.use("/api", routes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;