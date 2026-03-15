import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validate } from "../../middleware/validate.js";
import {
  createPageSchema, updatePageSchema,
  createSectionSchema, updateSectionSchema,
  reorderSectionsSchema,
} from "./pages.schemas.js";
import {
  listPages, getPage, createPage, updatePage, deletePage,
  createSection, updateSection, deleteSection, reorderSections,
} from "./pages.controller.js";

const router = Router();
router.use(authenticate);

const edit = requireRole("owner", "admin");

// Pages
router.get("/", listPages);
router.get("/:id", getPage);
router.post("/", edit, validate(createPageSchema), createPage);
router.patch("/:id", edit, validate(updatePageSchema), updatePage);
router.delete("/:id", edit, deletePage);

// Sections
router.post("/sections", edit, validate(createSectionSchema), createSection);
router.patch("/sections/:id", edit, validate(updateSectionSchema), updateSection);
router.delete("/sections/:id", edit, deleteSection);
router.post("/sections/reorder", edit, validate(reorderSectionsSchema), reorderSections);

export default router;
