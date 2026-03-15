import { redis } from "../config/redis.js";
import { logger } from "../config/logger.js";

const DEFAULT_TTL = 300; // 5 minutes

/** Pre-defined TTL constants (seconds) */
export const CacheTTL = {
  SHORT: 60,       // 1 min — volatile data (stats, submissions)
  DEFAULT: 300,    // 5 min — general content
  LONG: 900,       // 15 min — rarely-changing content (pages, navigation)
  SETTINGS: 600,   // 10 min — site settings / branding
} as const;

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (redis.status !== "ready") return null;

  try {
    const data = await redis.get(key);
    return data ? (JSON.parse(data) as T) : null;
  } catch (err) {
    logger.warn({ err, key }, "Cache get error");
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttl = DEFAULT_TTL,
): Promise<void> {
  if (redis.status !== "ready") return;

  try {
    await redis.set(key, JSON.stringify(value), "EX", ttl);
  } catch (err) {
    logger.warn({ err, key }, "Cache set error");
  }
}

export async function cacheDel(...keys: string[]): Promise<void> {
  if (redis.status !== "ready") return;

  try {
    await redis.del(...keys);
  } catch (err) {
    logger.warn({ err, keys }, "Cache del error");
  }
}

export function settingsKey(tenantId: string): string {
  return `settings:${tenantId}`;
}
