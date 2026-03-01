import { popFromQueue, setCache, getCache } from "../config/redis";
import { parseResume } from "../services/resume.service";
import logger from "../utils/logger.utils";



interface QueueItem {
  userId: string;
  resumeId: string;
  queuedAt: string;
}

const POLL_INTERVAL = 5000; // Check queue every 5 seconds
let isRunning = false;

export const startResumeWorker = (): void => {
  if (isRunning) {
    logger.warn("Resume worker already running");
    return;
  }

  isRunning = true;
  logger.info("Resume processor worker started");

  const processQueue = async (): Promise<void> => {
    while (isRunning) {
      try {
        // Pop from queue
        const item = await popFromQueue<QueueItem>("resume_queue");

        if (item) {
          logger.info(
            `Processing resume: ${item.resumeId} for user: ${item.userId}`
          );

          // Update status
          await setCache(
            `resume_status:${item.resumeId}`,
            "processing",
            3600
          );

          try {
            // Parse resume
            await parseResume(item.userId, item.resumeId);

            // Update status
            await setCache(
              `resume_status:${item.resumeId}`,
              "completed",
              3600
            );

            logger.info(`Resume processed successfully: ${item.resumeId}`);
          } catch (error: any) {
            logger.error(
              `❌ Resume processing failed: ${item.resumeId} - ${error.message}`
            );

            // Update status
            await setCache(
              `resume_status:${item.resumeId}`,
              "failed",
              3600
            );
          }
        }

        // Wait before checking again
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
      } catch (error: any) {
        logger.error(`❌ Worker error: ${error.message}`);
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
      }
    }
  };

  processQueue();
};

export const stopResumeWorker = (): void => {
  isRunning = false;
  logger.info("Resume processor worker stopped");
};