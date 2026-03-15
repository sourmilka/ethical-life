import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validate } from "../../middleware/validate.js";
import {
  updateBrandingSchema,
  updateColorsSchema,
  updateContactSchema,
  updateSeoSchema,
  updatePromoSchema,
  updateAppLinksSchema,
  updateFooterSchema,
  updateLegalSchema,
  updateTenantSchema,
} from "./settings.schemas.js";
import {
  getSettings,
  updateBranding,
  updateColors,
  updateContact,
  updateSeo,
  updatePromo,
  updateAppLinks,
  updateFooter,
  updateLegal,
  getTenant,
  updateTenant,
} from "./settings.controller.js";

const router = Router();

// All settings routes require authentication
router.use(authenticate);

// Site settings
router.get("/", getSettings);
router.patch("/branding", requireRole("owner", "admin"), validate(updateBrandingSchema), updateBranding);
router.patch("/colors", requireRole("owner", "admin"), validate(updateColorsSchema), updateColors);
router.patch("/contact", requireRole("owner", "admin"), validate(updateContactSchema), updateContact);
router.patch("/seo", requireRole("owner", "admin"), validate(updateSeoSchema), updateSeo);
router.patch("/promo", requireRole("owner", "admin"), validate(updatePromoSchema), updatePromo);
router.patch("/app-links", requireRole("owner", "admin"), validate(updateAppLinksSchema), updateAppLinks);
router.patch("/footer", requireRole("owner", "admin"), validate(updateFooterSchema), updateFooter);
router.patch("/legal", requireRole("owner", "admin"), validate(updateLegalSchema), updateLegal);

// Tenant management (owner only)
router.get("/tenant", getTenant);
router.patch("/tenant", requireRole("owner"), validate(updateTenantSchema), updateTenant);

export default router;
