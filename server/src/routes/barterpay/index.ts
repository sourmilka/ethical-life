import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validate } from "../../middleware/validate.js";
import { tenantResolver } from "../../middleware/tenantResolver.js";
import { createTransactionSchema, checkStatusSchema, updateConfigSchema } from "./barterpay.schemas.js";
import { createTransaction, checkStatus, getConfig, updateConfig } from "./barterpay.controller.js";

const router = Router();

// Public payment endpoints (tenant from subdomain)
router.post("/create-transaction", tenantResolver, validate(createTransactionSchema), createTransaction);
router.post("/check-status", tenantResolver, validate(checkStatusSchema), checkStatus);

// Dashboard config endpoints (auth required, owner only)
router.get("/config", authenticate, requireRole("owner"), getConfig);
router.patch("/config", authenticate, requireRole("owner"), validate(updateConfigSchema), updateConfig);

export default router;
