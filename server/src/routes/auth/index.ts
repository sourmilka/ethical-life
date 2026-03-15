import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { authenticate } from "../../middleware/auth.js";
import { rateLimiter } from "../../middleware/rateLimiter.js";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  updateProfileSchema,
  changePasswordSchema,
} from "./auth.schemas.js";
import {
  register,
  login,
  refresh,
  logout,
  me,
  updateMe,
  changePassword,
} from "./auth.controller.js";

const router = Router();

// Rate limit auth endpoints more aggressively
const authRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  keyPrefix: "rl:auth",
});

// Public routes
router.post("/register", authRateLimit, validate(registerSchema), register);
router.post("/login", authRateLimit, validate(loginSchema), login);
router.post("/refresh", validate(refreshSchema), refresh);
router.post("/logout", logout);

// Protected routes
router.get("/me", authenticate, me);
router.patch("/me", authenticate, validate(updateProfileSchema), updateMe);
router.post(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  changePassword,
);

export default router;
