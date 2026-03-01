import logger from "./logger.utils";

// Use require for pdf-parse due to CommonJS module compatibility
const pdfParse = require("pdf-parse");

export const extractTextFromPDF = async (
  pdfBuffer: Buffer
): Promise<{
  text: string;
  numPages: number;
  info: any;
}> => {
  try {
    const startTime = Date.now();

    const data = await pdfParse(pdfBuffer, {
      max: 10, // Maximum pages to parse
    });

    const duration = Date.now() - startTime;

    // Clean extracted text
    let cleanedText = data.text
      .replace(/\r\n/g, "\n")            // Normalize line endings
      .replace(/\n{3,}/g, "\n\n")        // Remove excessive blank lines
      .replace(/\t+/g, " ")              // Replace tabs with spaces
      .replace(/ {2,}/g, " ")            // Remove multiple spaces
      .trim();

    logger.info(
      `PDF parsed in ${duration}ms | Pages: ${data.numpages} | Characters: ${cleanedText.length}`
    );

    // Check if text was actually extracted
    if (cleanedText.length < 50) {
      logger.warn("Very little text extracted from PDF - might be image-based");
    }

    return {
      text: cleanedText,
      numPages: data.numpages,
      info: {
        title: data.info?.Title || null,
        author: data.info?.Author || null,
        creator: data.info?.Creator || null,
      },
    };
  } catch (error: any) {
    logger.error(`❌ PDF parsing failed: ${error.message}`);
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
};


export const validatePDFContent = (text: string): {
  isValid: boolean;
  message: string;
} => {
  if (!text || text.length === 0) {
    return {
      isValid: false,
      message: "Could not extract any text from the PDF. It might be image-based or corrupted.",
    };
  }

  if (text.length < 100) {
    return {
      isValid: false,
      message: "Too little text extracted. Please upload a text-based PDF resume.",
    };
  }

  if (text.length > 50000) {
    return {
      isValid: false,
      message: "Resume is too long. Please upload a concise resume (max 10 pages).",
    };
  }

  return {
    isValid: true,
    message: "PDF content is valid",
  };
};