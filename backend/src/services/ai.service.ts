import groqClient, { AI_CONFIG } from "../config/groq";
import { getCache, setCache } from "../config/redis";
import { CacheKeys, CacheDuration } from "./cache.service";
import logger from "../utils/logger.utils";


export const parseResumeWithAI = async (
  resumeText: string
): Promise<any> => {
  try {
    const startTime = Date.now();

    const prompt = `You are an expert resume parser. Analyze the following resume text and extract structured information.

IMPORTANT: Return ONLY valid JSON, no additional text, no markdown, no code blocks.

Resume Text:
---
${resumeText.substring(0, 6000)}
---

Extract and return this exact JSON structure:
{
  "personalInfo": {
    "name": "Full Name",
    "email": "email@example.com or null",
    "phone": "phone number or null",
    "location": "City, Country or null",
    "linkedin": "LinkedIn URL or null",
    "github": "GitHub URL or null",
    "portfolio": "Portfolio URL or null"
  },
  "summary": "A 2-3 sentence professional summary based on the resume",
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "location": "City or null",
      "startDate": "YYYY-MM or approximate",
      "endDate": "YYYY-MM or present or null",
      "description": "Key responsibilities and achievements",
      "isCurrent": true/false
    }
  ],
  "skills": [
    {
      "name": "Skill Name",
      "years": estimated_years_as_number,
      "confidence": confidence_score_0_to_100
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "University/School Name",
      "location": "City or null",
      "startYear": year_or_null,
      "endYear": year_or_null,
      "grade": "GPA/Grade or null",
      "fieldOfStudy": "Field or null"
    }
  ],
  "certifications": ["Certification 1", "Certification 2"],
  "totalExperienceYears": total_years_as_number,
  "confidence": {
    "overall": overall_parsing_confidence_0_to_100,
    "skills": skills_extraction_confidence_0_to_100,
    "experience": experience_extraction_confidence_0_to_100,
    "education": education_extraction_confidence_0_to_100
  }
}

Rules:
1. If information is not found, use null for strings, 0 for numbers, empty array for lists
2. Estimate skill years based on work experience timeline
3. Confidence scores reflect how certain you are about the extraction
4. Sort skills by confidence (highest first)
5. Sort experience by date (most recent first)
6. Return ONLY the JSON object, nothing else`;

    const response = await groqClient.chat.completions.create({
      model: AI_CONFIG.balancedModel,
      messages: [
        {
          role: "system",
          content:
            "You are a precise JSON-only resume parser. Output ONLY valid JSON. No explanations, no markdown, no code blocks.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: AI_CONFIG.maxTokens,
      temperature: 0.1, // Very low for consistent structured output
      top_p: 0.9,
    });

    const aiResponse = response.choices[0]?.message?.content?.trim();

    if (!aiResponse) {
      throw new Error("Empty response from AI");
    }

    const duration = Date.now() - startTime;
    logger.info(`Resume parsed by AI in ${duration}ms`);

    // Parse JSON response
    let parsedData: any;
    try {
      // Try direct parse
      parsedData = JSON.parse(aiResponse);
    } catch {
      // Try to extract JSON from response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("AI response is not valid JSON");
      }
    }

    // Validate structure
    if (!parsedData.personalInfo || !parsedData.skills) {
      throw new Error("AI response missing required fields");
    }

    return parsedData;
  } catch (error: any) {
    logger.error(`❌ AI resume parsing failed: ${error.message}`);
    throw error;
  }
};


export const calculateMatchScore = async (
  candidateSkills: Array<{ name: string; years: number }>,
  jobSkills: Array<{ skill_name: string; min_years: number; is_required: boolean }>,
  candidateExperienceYears: number,
  jobMinExperience: number,
  jobMaxExperience: number
): Promise<{
  overallScore: number;
  skillsScore: number;
  experienceScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  analysis: string;
}> => {
  try {
    // ---- Skill Matching ----
    const candidateSkillMap = new Map<string, number>();
    for (const skill of candidateSkills) {
      candidateSkillMap.set(skill.name.toLowerCase(), skill.years);
    }

    let totalSkillWeight = 0;
    let matchedWeight = 0;
    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];

    for (const jobSkill of jobSkills) {
      const weight = jobSkill.is_required ? 2 : 1; // Required skills weight more
      totalSkillWeight += weight;

      const candidateYears = candidateSkillMap.get(
        jobSkill.skill_name.toLowerCase()
      );

      if (candidateYears !== undefined) {
        // Skill exists
        matchedSkills.push(jobSkill.skill_name);

        if (candidateYears >= jobSkill.min_years) {
          matchedWeight += weight; // Full match
        } else {
          // Partial match (has skill but less years)
          const ratio = candidateYears / Math.max(jobSkill.min_years, 1);
          matchedWeight += weight * Math.min(ratio, 1);
        }
      } else {
        missingSkills.push(jobSkill.skill_name);
      }
    }

    const skillsScore =
      totalSkillWeight > 0
        ? Math.round((matchedWeight / totalSkillWeight) * 100)
        : 0;

    // ---- Experience Matching ----
    let experienceScore = 0;

    if (candidateExperienceYears >= jobMinExperience) {
      if (candidateExperienceYears <= jobMaxExperience) {
        experienceScore = 100; // Perfect fit
      } else {
        // Overqualified - slight penalty
        const overBy = candidateExperienceYears - jobMaxExperience;
        experienceScore = Math.max(70, 100 - overBy * 5);
      }
    } else {
      // Underqualified
      const ratio = candidateExperienceYears / Math.max(jobMinExperience, 1);
      experienceScore = Math.round(ratio * 100);
    }

    // ---- Overall Score ----
    // Skills: 70% weight, Experience: 30% weight
    const overallScore = Math.round(skillsScore * 0.7 + experienceScore * 0.3);

    // ---- Analysis Text ----
    let analysis = "";
    if (overallScore >= 90) {
      analysis = "Excellent match! Candidate has most required skills and appropriate experience.";
    } else if (overallScore >= 75) {
      analysis = "Good match. Candidate has many required skills with relevant experience.";
    } else if (overallScore >= 60) {
      analysis = "Moderate match. Some key skills present but gaps exist.";
    } else if (overallScore >= 40) {
      analysis = "Partial match. Several required skills missing.";
    } else {
      analysis = "Low match. Candidate's profile doesn't align well with job requirements.";
    }

    return {
      overallScore,
      skillsScore,
      experienceScore,
      matchedSkills,
      missingSkills,
      analysis,
    };
  } catch (error: any) {
    logger.error(`❌ Match score calculation failed: ${error.message}`);
    throw error;
  }
};


export const aiMatchScore = async (
  candidateData: {
    skills: Array<{ name: string; years: number }>;
    experience: Array<{ title: string; company: string; description: string }>;
    totalYears: number;
  },
  jobData: {
    title: string;
    description: string;
    skills: Array<{ skill_name: string; min_years: number; is_required: boolean }>;
    minExperience: number;
    maxExperience: number;
  }
): Promise<{
  score: number;
  analysis: any;
}> => {
  // Check cache
  const cacheKey = `ai:match:${JSON.stringify(candidateData.skills.map((s) => s.name)).substring(0, 30)}:${jobData.title.substring(0, 20)}`;
  const cached = await getCache<{ score: number; analysis: any }>(cacheKey);
  if (cached) return cached;

  try {
    const prompt = `Analyze this candidate-job match and provide a score from 0-100.

JOB:
Title: ${jobData.title}
Description: ${jobData.description.substring(0, 500)}
Required Skills: ${jobData.skills.map((s) => `${s.skill_name} (${s.min_years}+ years, ${s.is_required ? "required" : "nice-to-have"})`).join(", ")}
Experience Required: ${jobData.minExperience}-${jobData.maxExperience} years

CANDIDATE:
Total Experience: ${candidateData.totalYears} years
Skills: ${candidateData.skills.map((s) => `${s.name} (${s.years} years)`).join(", ")}
Recent Roles: ${candidateData.experience.slice(0, 3).map((e) => `${e.title} at ${e.company}`).join(", ")}

Return ONLY this JSON:
{
  "score": number_0_to_100,
  "skillsMatch": number_0_to_100,
  "experienceMatch": number_0_to_100,
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["skill1"],
  "strengths": ["strength1", "strength2"],
  "concerns": ["concern1"],
  "recommendation": "short recommendation text"
}`;

    const response = await groqClient.chat.completions.create({
      model: AI_CONFIG.balancedModel,
      messages: [
        {
          role: "system",
          content: "You are a recruitment AI. Output ONLY valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 1024,
      temperature: 0.2,
    });

    const aiResponse = response.choices[0]?.message?.content?.trim();
    if (!aiResponse) throw new Error("Empty AI response");

    let analysis: any;
    try {
      analysis = JSON.parse(aiResponse);
    } catch {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Invalid AI JSON");
      }
    }

    const result = {
      score: analysis.score || 0,
      analysis,
    };

    // Cache for 1 hour
    await setCache(cacheKey, result, CacheDuration.LONG);

    return result;
  } catch (error: any) {
    logger.error(`❌ AI match score failed: ${error.message}`);

    // Fallback to algorithmic scoring
    const fallback = await calculateMatchScore(
      candidateData.skills,
      jobData.skills,
      candidateData.totalYears,
      jobData.minExperience,
      jobData.maxExperience
    );

    return {
      score: fallback.overallScore,
      analysis: {
        score: fallback.overallScore,
        skillsMatch: fallback.skillsScore,
        experienceMatch: fallback.experienceScore,
        matchedSkills: fallback.matchedSkills,
        missingSkills: fallback.missingSkills,
        recommendation: fallback.analysis,
      },
    };
  }
};


export const generateJobDescription = async (data: {
  title: string;
  company: string;
  department?: string;
  skills: string[];
  experienceLevel: string;
  location: string;
}): Promise<string> => {
  try {
    const prompt = `Write a professional job description for the following role:

Title: ${data.title}
Company: ${data.company}
Department: ${data.department || "Not specified"}
Key Skills: ${data.skills.join(", ")}
Experience Level: ${data.experienceLevel}
Location: ${data.location}

Write a compelling 3-4 paragraph job description that includes:
1. Brief company/team introduction and what makes this role exciting
2. Key responsibilities (5-7 bullet points)
3. What we're looking for (qualifications)
4. What we offer (briefly)

Keep it professional but engaging. Around 300-400 words.
Return ONLY the job description text, no headers or formatting labels.`;

    const response = await groqClient.chat.completions.create({
      model: AI_CONFIG.balancedModel,
      messages: [
        {
          role: "system",
          content:
            "You are an expert technical recruiter who writes compelling job descriptions.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 2048,
      temperature: 0.7, // Higher for creative writing
    });

    const description = response.choices[0]?.message?.content?.trim();

    if (!description) {
      throw new Error("Empty AI response");
    }

    logger.info(`Job description generated for: ${data.title}`);

    return description;
  } catch (error: any) {
    logger.error(`❌ Job description generation failed: ${error.message}`);
    throw error;
  }
};


export const getJobRecommendations = async (
  candidateSkills: Array<{ name: string; years: number }>,
  candidateExperience: number,
  candidateLocation: string | null,
  availableJobs: Array<{
    id: string;
    title: string;
    company: string;
    skills: Array<{ skill_name: string; min_years: number; is_required: boolean }>;
    min_experience_years: number;
    max_experience_years: number;
    location: string;
  }>
): Promise<
  Array<{
    jobId: string;
    matchScore: number;
    matchedSkills: string[];
    missingSkills: string[];
  }>
> => {
  const recommendations: Array<{
    jobId: string;
    matchScore: number;
    matchedSkills: string[];
    missingSkills: string[];
  }> = [];

  for (const job of availableJobs) {
    const matchResult = await calculateMatchScore(
      candidateSkills,
      job.skills,
      candidateExperience,
      job.min_experience_years,
      job.max_experience_years
    );

    recommendations.push({
      jobId: job.id,
      matchScore: matchResult.overallScore,
      matchedSkills: matchResult.matchedSkills,
      missingSkills: matchResult.missingSkills,
    });
  }

  // Sort by match score (highest first)
  recommendations.sort((a, b) => b.matchScore - a.matchScore);

  return recommendations;
};