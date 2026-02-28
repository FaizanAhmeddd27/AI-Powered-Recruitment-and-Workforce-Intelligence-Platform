import bcrypt from "bcryptjs";
import { query, connectPostgreSQL, closePostgreSQL } from "../config/db";
import logger from "../utils/logger.utils";

const seedDatabase = async (): Promise<void> => {
  try {
    logger.info("Starting database seeding...");
    await connectPostgreSQL();

  
    const adminPassword = await bcrypt.hash("admin123", 12);
    await query(
      `INSERT INTO users (email, password_hash, full_name, role, is_verified, profile_completion) 
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO NOTHING`,
      ["admin@recruitment.com", adminPassword, "Platform Admin", "admin", true, 100]
    );
    logger.info("Admin user seeded");

   
    const recruiterPassword = await bcrypt.hash("recruiter123", 12);
    const recruiterResult = await query(
      `INSERT INTO users (email, password_hash, full_name, role, is_verified, location, profile_completion)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      [
        "sarah@google.com",
        recruiterPassword,
        "Sarah Johnson",
        "recruiter",
        true,
        "Bangalore, India",
        85,
      ]
    );
    logger.info("Recruiter user seeded");


    const candidatePassword = await bcrypt.hash("candidate123", 12);
    const candidateResult = await query(
      `INSERT INTO users (email, password_hash, full_name, role, is_verified, location, phone, profile_completion)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      [
        "john@example.com",
        candidatePassword,
        "John Doe",
        "candidate",
        true,
        "Bangalore, India",
        "+91 98765 43210",
        75,
      ]
    );

    if (candidateResult.rows[0]) {
      const candidateId = candidateResult.rows[0].id;

      // Create candidate profile
      await query(
        `INSERT INTO candidate_profiles (user_id, headline, total_experience_years, current_company, current_title, is_open_to_work)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id) DO NOTHING`,
        [
          candidateId,
          "Senior Frontend Developer",
          5,
          "Google",
          "Senior Frontend Dev",
          true,
        ]
      );

      // Add skills
      const skills = [
        { name: "React", years: 4, level: "expert" },
        { name: "TypeScript", years: 4, level: "advanced" },
        { name: "Next.js", years: 3, level: "advanced" },
        { name: "Node.js", years: 3, level: "intermediate" },
        { name: "JavaScript", years: 5, level: "expert" },
      ];

      for (const skill of skills) {
        await query(
          `INSERT INTO candidate_skills (user_id, skill_name, years_of_experience, proficiency_level)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id, skill_name) DO NOTHING`,
          [candidateId, skill.name, skill.years, skill.level]
        );
      }
      logger.info("Candidate with profile and skills seeded");
    }

   
    if (recruiterResult.rows[0]) {
      const recruiterId = recruiterResult.rows[0].id;

      const jobs = [
        {
          title: "Senior Frontend Developer",
          company: "Google",
          department: "Engineering",
          description:
            "We are looking for a Senior Frontend Developer to join our team. You will be responsible for building user-facing features using React and TypeScript.",
          location: "Karachi, Pakistan",
          job_type: "full-time",
          workplace_type: "hybrid",
          experience_level: "senior",
          min_exp: 4,
          max_exp: 7,
          salary_min: 2500000,
          salary_max: 4000000,
          benefits: ["Health Insurance", "401k", "Remote Options", "Stock Options"],
          skills: [
            { name: "React", years: 4, required: true },
            { name: "TypeScript", years: 3, required: true },
            { name: "Next.js", years: 2, required: false },
            { name: "GraphQL", years: 1, required: false },
          ],
        },
        {
          title: "Backend Engineer",
          company: "Microsoft",
          department: "Cloud & AI",
          description:
            "Join our Backend Engineering team to build scalable microservices and APIs that power millions of users.",
          location: "Hyderabad, Pakistan",
          job_type: "full-time",
          workplace_type: "on-site",
          experience_level: "mid",
          min_exp: 3,
          max_exp: 5,
          salary_min: 2000000,
          salary_max: 3000000,
          benefits: ["Health Insurance", "Learning Stipend", "Gym Membership"],
          skills: [
            { name: "Node.js", years: 3, required: true },
            { name: "Python", years: 2, required: true },
            { name: "PostgreSQL", years: 2, required: true },
            { name: "Docker", years: 1, required: false },
          ],
        },
        {
          title: "Full Stack Developer",
          company: "Amazon",
          department: "AWS",
          description:
            "Build end-to-end features for AWS products. Work with React on frontend and Java/Node.js on backend.",
          location: "Islamabad, Pakistan",
          job_type: "full-time",
          workplace_type: "remote",
          experience_level: "mid",
          min_exp: 2,
          max_exp: 5,
          salary_min: 1800000,
          salary_max: 2800000,
          benefits: ["Health Insurance", "Stock Options", "Relocation Bonus"],
          skills: [
            { name: "React", years: 2, required: true },
            { name: "Node.js", years: 2, required: true },
            { name: "AWS", years: 1, required: true },
            { name: "MongoDB", years: 1, required: false },
          ],
        },
      ];

      for (const job of jobs) {
        const jobResult = await query(
          `INSERT INTO jobs (recruiter_id, title, company, department, description, location, job_type, workplace_type, experience_level, min_experience_years, max_experience_years, salary_min, salary_max, benefits)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           RETURNING id`,
          [
            recruiterId,
            job.title,
            job.company,
            job.department,
            job.description,
            job.location,
            job.job_type,
            job.workplace_type,
            job.experience_level,
            job.min_exp,
            job.max_exp,
            job.salary_min,
            job.salary_max,
            job.benefits,
          ]
        );

        if (jobResult.rows[0]) {
          const jobId = jobResult.rows[0].id;
          for (const skill of job.skills) {
            await query(
              `INSERT INTO job_skills (job_id, skill_name, min_years, is_required)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT (job_id, skill_name) DO NOTHING`,
              [jobId, skill.name, skill.years, skill.required]
            );
          }
        }
      }
      logger.info("Sample jobs with skills seeded");
    }

    await closePostgreSQL();
    logger.info("Database seeding completed!");
    process.exit(0);
  } catch (error: any) {
    logger.error(`❌ Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedDatabase();