import type { Request, Response, NextFunction } from "express";
import { redis } from "../config/redis.js";
import { TooManyRequestsError } from "../utils/errors.js";
import { logger } from "../config/logger.js";

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyPrefix?: string;
}

export function rateLimiter(options: RateLimitOptions) {
  const { windowMs, max, keyPrefix = "rl" } = options;
  const windowSec = Math.ceil(windowMs / 1000);

  return async (req: Request, _res: Response, next: NextFunction) => {
    // Skip rate limiting if Redis is not connected
    if (redis.status !== "ready") {
      next();
      return;
    }

    const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
    const key = `${keyPrefix}:${ip}:${req.path}`;

    try {
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, windowSec);
      }
      if (current > max) {
        next(new TooManyRequestsError());
        return;
      }
    } catch (err) {
      logger.warn({ err }, "Rate limiter Redis error — allowing request");
    }

    next();
  };
}
