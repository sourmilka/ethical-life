import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validate } from "../../middleware/validate.js";
import { createNavItemSchema, updateNavItemSchema, reorderSchema } from "./navigation.schemas.js";
import { list, create, update, remove, reorder } from "./navigation.controller.js";

const router = Router();
router.use(authenticate);

router.get("/", list);
router.post("/", requireRole("owner", "admin"), validate(createNavItemSchema), create);
router.patch("/:id", requireRole("owner", "admin"), validate(updateNavItemSchema), update);
router.delete("/:id", requireRole("owner", "admin"), remove);
router.post("/reorder", requireRole("owner", "admin"), validate(reorderSchema), reorder);

export default router;
