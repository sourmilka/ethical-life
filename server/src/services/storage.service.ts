import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import fs from "node:fs/promises";
import path from "node:path";

const useS3 = !!(
  env.S3_BUCKET &&
  env.S3_ENDPOINT &&
  env.S3_ACCESS_KEY &&
  env.S3_SECRET_KEY
);

let s3: S3Client | null = null;

if (useS3) {
  s3 = new S3Client({
    region: env.S3_REGION || "auto",
    endpoint: env.S3_ENDPOINT!,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY!,
      secretAccessKey: env.S3_SECRET_KEY!,
    },
    forcePathStyle: true,
  });
  logger.info("S3 storage configured");
}

/**
 * Upload a file to S3 (production) or local disk (dev fallback).
 * Returns the public URL of the uploaded file.
 */
export async function uploadFile(
  key: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  if (s3 && useS3) {
    await s3.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET!,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
    // Construct public URL — Supabase Storage format
    const publicUrl = env.S3_PUBLIC_URL
      ? `${env.S3_PUBLIC_URL}/${key}`
      : `${env.S3_ENDPOINT}/${env.S3_BUCKET}/${key}`;
    return publicUrl;
  }

  // Local disk fallback for development
  const filePath = path.join("uploads", key);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, buffer);
  return `/uploads/${key}`;
}

/**
 * Delete a file from S3 or local disk.
 */
export async function deleteFile(key: string): Promise<void> {
  if (s3 && useS3) {
    try {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: env.S3_BUCKET!,
          Key: key,
        }),
      );
    } catch (err) {
      logger.warn({ err, key }, "Failed to delete file from S3");
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

/**
 * Extract the storage key from a URL (reverse of uploadFile).
 */
export function urlToKey(url: string): string {
  // If it's an S3 URL, extract the key after the bucket name
  if (env.S3_PUBLIC_URL && url.startsWith(env.S3_PUBLIC_URL)) {
    return url.slice(env.S3_PUBLIC_URL.length + 1);
  }
  // Local URL like /uploads/tenantId/filename.ext
  if (url.startsWith("/uploads/")) {
    return url.slice("/uploads/".length);
  }
  return url;
}
