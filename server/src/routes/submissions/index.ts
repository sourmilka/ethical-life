import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validate } from "../../middleware/validate.js";
import { submitFormSchema, updateSubmissionSchema } from "./submissions.schemas.js";
import {
  publicSubmit,
  getStats,
  listSubmissions, getSubmission, updateSubmission, deleteSubmission,
} from "./submissions.controller.js";

const router = Router();

// Public submission endpoint (tenant resolved via tenantResolver middleware)
router.post("/public", validate(submitFormSchema), publicSubmit);

// Dashboard endpoints (auth required)
const edit = requireRole("owner", "admin");
router.get("/stats", authenticate, getStats);
router.get("/", authenticate, listSubmissions);
router.get("/:id", authenticate, getSubmission);
router.patch("/:id", authenticate, edit, validate(updateSubmissionSchema), updateSubmission);
router.delete("/:id", authenticate, edit, deleteSubmission);

export default router;
