import { Router } from "express";
import * as candidateController from "../controllers/candidate.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  updateProfileSchema,
  updateCandidateProfileSchema,
  addSkillSchema,
  addExperienceSchema,
  updateExperienceSchema,
  addEducationSchema,
  updateEducationSchema,
} from "../validators/profile.validator";

const router = Router();

// All routes require auth + candidate role
router.use(authenticate, authorize("candidate"));


router.get("/profile", candidateController.getProfile);
router.put(
  "/profile",
  validate(updateProfileSchema),
  candidateController.updateProfile
);
router.put(
  "/details",
  validate(updateCandidateProfileSchema),
  candidateController.updateCandidateDetails
);


router.get("/skills", candidateController.getSkills);
router.post(
  "/skills",
  validate(addSkillSchema),
  candidateController.addSkill
);
router.put("/skills/:skillId", candidateController.updateSkill);
router.delete("/skills/:skillId", candidateController.deleteSkill);

router.post(
  "/experience",
  validate(addExperienceSchema),
  candidateController.addExperience
);
router.put(
  "/experience/:expId",
  validate(updateExperienceSchema),
  candidateController.updateExperience
);
router.delete("/experience/:expId", candidateController.deleteExperience);


router.post(
  "/education",
  validate(addEducationSchema),
  candidateController.addEducation
);
router.put(
  "/education/:eduId",
  validate(updateEducationSchema),
  candidateController.updateEducation
);
router.delete("/education/:eduId", candidateController.deleteEducation);

export default router;