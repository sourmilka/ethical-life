import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { rateLimiter } from "./middleware/rateLimiter.js";
import { NotFoundError } from "./utils/errors.js";
import authRouter from "./routes/auth/index.js";
import settingsRouter from "./routes/settings/index.js";
import navigationRouter from "./routes/navigation/index.js";
import socialLinksRouter from "./routes/social-links/index.js";
import productsRouter from "./routes/products/index.js";
import blogRouter from "./routes/blog/index.js";
import contentRouter from "./routes/content/index.js";
import pagesRouter from "./routes/pages/index.js";
import mediaRouter from "./routes/media/index.js";
import formsRouter from "./routes/forms/index.js";
import submissionsRouter from "./routes/submissions/index.js";
import publicRouter from "./routes/public/index.js";
import barterpayRouter from "./routes/barterpay/index.js";
import renderRouter from "./routes/render/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  // ── EJS Template Engine ─────────────────────────────────
  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "..", "templates"));

  // ── Static assets from templates ────────────────────────
  app.use("/assets", express.static(path.join(__dirname, "..", "templates", "healthcare-pro", "assets")));

  // ── Security ────────────────────────────────────────────
  const corsOrigins = env.CORS_ORIGIN.split(",").map(o => o.trim());
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    frameguard: false,
  }));
  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
    }),
  );

  // ── Body parsing ────────────────────────────────────────
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true, limit: "2mb" }));
  app.use(cookieParser());

  // ── Global API rate limiter ─────────────────────────────
  app.use(
    "/api",
    rateLimiter({ windowMs: 60 * 1000, max: 100, keyPrefix: "rl:api" }),
  );

  // ── Request logging ─────────────────────────────────────
  app.use((req, _res, next) => {
    logger.debug({ method: req.method, url: req.url }, "incoming request");
    next();
  });

  // ── Serve uploaded files (dev fallback — production uses S3) ──
  app.use("/uploads", express.static("uploads"));

  // ── Health check ────────────────────────────────────────
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ── API routes ───────────────────────────────────────────
  app.use("/api/auth", authRouter);
  app.use("/api/settings", settingsRouter);
  app.use("/api/navigation", navigationRouter);
  app.use("/api/social-links", socialLinksRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/blog", blogRouter);
  app.use("/api/content", contentRouter);
  app.use("/api/pages", pagesRouter);
  app.use("/api/media", mediaRouter);
  app.use("/api/forms", formsRouter);
  app.use("/api/submissions", submissionsRouter);
  app.use("/api/public", publicRouter);
  app.use("/api/barterpay", barterpayRouter);

  // ── 404 handler (API) ───────────────────────────────────
  app.all("/api/{*path}", (_req, _res, next) => {
    next(new NotFoundError("API endpoint not found"));
  });

  // ── Server-side rendered pages ──────────────────────────
  app.use(renderRouter);

  // ── Global error handler ────────────────────────────────
  app.use(errorHandler);

  return app;
}
