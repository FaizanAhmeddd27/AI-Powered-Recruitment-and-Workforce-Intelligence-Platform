import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

interface EnvConfig {
  // Server
  PORT: number;
  NODE_ENV: string;
  CLIENT_URL: string;

  // PostgreSQL
  DATABASE_URL: string;

  // MongoDB
  MONGODB_URI: string;

  // Redis
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
  REDIS_URL: string;

  // JWT
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRY: string;
  JWT_REFRESH_EXPIRY: string;

  // GROQ
  GROQ_API_KEY: string;

  // Google OAuth
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_CALLBACK_URL: string;

  // GitHub OAuth
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  GITHUB_CALLBACK_URL: string;
}

const getEnvVar = (key: string, fallback?: string): string => {
  const value = process.env[key] || fallback;
  if (!value) {
    throw new Error(`❌ Missing environment variable: ${key}`);
  }
  return value;
};

export const env: EnvConfig = {
  PORT: parseInt(getEnvVar("PORT", "5000"), 10),
  NODE_ENV: getEnvVar("NODE_ENV", "development"),
  CLIENT_URL: getEnvVar("CLIENT_URL", "http://localhost:5173"),

  DATABASE_URL: getEnvVar("DATABASE_URL"),
  MONGODB_URI: getEnvVar("MONGODB_URI"),

  UPSTASH_REDIS_REST_URL: getEnvVar("UPSTASH_REDIS_REST_URL"),
  UPSTASH_REDIS_REST_TOKEN: getEnvVar("UPSTASH_REDIS_REST_TOKEN"),
  REDIS_URL: getEnvVar("REDIS_URL"),

  JWT_ACCESS_SECRET: getEnvVar("JWT_ACCESS_SECRET"),
  JWT_REFRESH_SECRET: getEnvVar("JWT_REFRESH_SECRET"),
  JWT_ACCESS_EXPIRY: getEnvVar("JWT_ACCESS_EXPIRY", "15m"),
  JWT_REFRESH_EXPIRY: getEnvVar("JWT_REFRESH_EXPIRY", "7d"),

  GROQ_API_KEY: getEnvVar("GROQ_API_KEY"),

  GOOGLE_CLIENT_ID: getEnvVar("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: getEnvVar("GOOGLE_CLIENT_SECRET"),
  GOOGLE_CALLBACK_URL: getEnvVar(
    "GOOGLE_CALLBACK_URL",
    "http://localhost:5000/api/auth/google/callback"
  ),

  GITHUB_CLIENT_ID: getEnvVar("GITHUB_CLIENT_ID"),
  GITHUB_CLIENT_SECRET: getEnvVar("GITHUB_CLIENT_SECRET"),
  GITHUB_CALLBACK_URL: getEnvVar(
    "GITHUB_CALLBACK_URL",
    "http://localhost:5000/api/auth/github/callback"
  ),
};

export default env;