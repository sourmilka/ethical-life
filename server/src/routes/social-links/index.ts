import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validate } from "../../middleware/validate.js";
import { createSocialLinkSchema, updateSocialLinkSchema, reorderSocialSchema } from "./social-links.schemas.js";
import { list, create, update, remove, reorder } from "./social-links.controller.js";

const router = Router();
router.use(authenticate);

router.get("/", list);
router.post("/", requireRole("owner", "admin"), validate(createSocialLinkSchema), create);
router.patch("/:id", requireRole("owner", "admin"), validate(updateSocialLinkSchema), update);
router.delete("/:id", requireRole("owner", "admin"), remove);
router.post("/reorder", requireRole("owner", "admin"), validate(reorderSocialSchema), reorder);

export default router;
