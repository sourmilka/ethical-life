import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import fs from "node:fs/promises";
import path from "node:path";

const BUCKET = "media";
const useSupabase = !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY);

if (useSupabase) {
  logger.info("Supabase Storage configured");
}

/**
 * Upload a file to Supabase Storage (production) or local disk (dev fallback).
 * Returns the public URL of the uploaded file.
 */
export async function uploadFile(
  key: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  if (useSupabase) {
    const res = await fetch(
      `${env.SUPABASE_URL}/storage/v1/object/${BUCKET}/${key}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
          "Content-Type": contentType,
          "x-upsert": "true",
        },
        body: buffer,
      },
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Supabase upload failed (${res.status}): ${text}`);
    }
    return `${env.SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${key}`;
  }

  // Local disk fallback for development
  const filePath = path.join("uploads", key);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, buffer);
  return `/uploads/${key}`;
}

/**
 * Delete a file from Supabase Storage or local disk.
 */
export async function deleteFile(key: string): Promise<void> {
  if (useSupabase) {
    try {
      await fetch(
        `${env.SUPABASE_URL}/storage/v1/object/${BUCKET}/${key}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
          },
        },
      );
    } catch (err) {
      logger.warn({ err, key }, "Failed to delete file from Supabase Storage");
    }
    return;
  }

  // Local fallback
  try {
    await fs.unlink(path.join("uploads", key));
  } catch {
    // File may not exist
  }
}

const PUBLIC_PREFIX = "/storage/v1/object/public/media/";

/**
 * Extract the storage key from a URL (reverse of uploadFile).
 */
export function urlToKey(url: string): string {
  const idx = url.indexOf(PUBLIC_PREFIX);
  if (idx !== -1) {
    return url.slice(idx + PUBLIC_PREFIX.length);
  }
  if (url.startsWith("/uploads/")) {
    return url.slice("/uploads/".length);
  }
  return url;
}
