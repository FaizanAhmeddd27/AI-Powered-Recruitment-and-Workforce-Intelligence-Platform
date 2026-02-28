import Groq from "groq-sdk";
import env from "./env";
import logger from "../utils/logger.utils";

const groqClient = new Groq({
  apiKey: env.GROQ_API_KEY,
});

export const AI_CONFIG = {
  // Fast model for simple tasks
  fastModel: "llama-3.1-8b-instant" as const,
  // Balanced model for complex tasks (replaces 70b-versatile)
  balancedModel: "llama-3.3-70b-versatile" as const,
  // Alternative model
  alternativeModel: "mixtral-8x7b-32768" as const,
  // Default settings
  temperature: 0.3,
  maxTokens: 4096,
  topP: 0.9,
};

// Test connection with fast model
export const testGroqConnection = async (): Promise<boolean> => {
  try {
    const response = await groqClient.chat.completions.create({
      model: AI_CONFIG.fastModel,  // Using fast model for test
      messages: [
        {
          role: "user",
          content: "Reply with exactly: GROQ_CONNECTED",
        },
      ],
      max_tokens: 20,
      temperature: 0,
    });

    const reply = response.choices[0]?.message?.content?.trim();
    if (reply) {
      logger.info(`GROQ AI connected successfully | Fast model ready`);
      logger.info(`   Available models: ${AI_CONFIG.fastModel}, ${AI_CONFIG.balancedModel}, ${AI_CONFIG.alternativeModel}`);
      return true;
    }

    return false;
  } catch (error: any) {
    logger.error(`❌ GROQ AI connection failed: ${error.message}`);
    logger.warn("Server will continue without AI - AI features will fail");
    
    // Optional: Try fallback model if first fails
    try {
      logger.info("Attempting fallback with alternative model...");
      const fallbackResponse = await groqClient.chat.completions.create({
        model: AI_CONFIG.alternativeModel,
        messages: [{ role: "user", content: "test" }],
        max_tokens: 5,
      });
      logger.info(`Alternative model ${AI_CONFIG.alternativeModel} works!`);
      return true;
    } catch (fallbackError: any) {
      logger.error(`❌ Alternative also failed: ${fallbackError.message}`);
    }

    return false;
  }
};

export const getModelForTask = (taskType: 'simple' | 'complex' | 'balanced'): string => {
  switch(taskType) {
    case 'simple':
      return AI_CONFIG.fastModel;      // Fastest
    case 'complex':
      return AI_CONFIG.balancedModel;  // Most capable
    case 'balanced':
      return AI_CONFIG.alternativeModel; // Good balance
    default:
      return AI_CONFIG.fastModel;
  }
};

export default groqClient;