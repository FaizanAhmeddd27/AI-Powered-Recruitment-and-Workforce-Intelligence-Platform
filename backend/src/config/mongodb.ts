import mongoose from "mongoose";
import env from "./env";
import logger from "../utils/logger.utils";

const mongoOptions: mongoose.ConnectOptions = {
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  w: "majority",
};


export const connectMongoDB = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGODB_URI, mongoOptions);
    logger.info("MongoDB Atlas connected successfully");

    // Get connection details
    const db = mongoose.connection.db;
    if (db) {
      const adminDb = db.admin();
      const serverInfo = await adminDb.serverStatus();
      logger.info(
        `📦 MongoDB version: ${serverInfo.version} | Host: ${serverInfo.host}`
      );
    }
  } catch (error: any) {
    logger.error(`❌ MongoDB connection failed: ${error.message}`);
    throw error;
  }
};


mongoose.connection.on("connected", () => {
  logger.debug("Mongoose connected to MongoDB Atlas");
});

mongoose.connection.on("error", (err: Error) => {
  logger.error(`❌ Mongoose connection error: ${err.message}`);
});

mongoose.connection.on("disconnected", () => {
  logger.warn("Mongoose disconnected from MongoDB Atlas");
});


export const closeMongoDB = async (): Promise<void> => {
  await mongoose.connection.close();
  logger.info("MongoDB connection closed");
};


export const getGridFSBucket = (): mongoose.mongo.GridFSBucket => {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("MongoDB not connected - cannot create GridFS bucket");
  }
  return new mongoose.mongo.GridFSBucket(db, {
    bucketName: "resumes",
  });
};

export default mongoose;