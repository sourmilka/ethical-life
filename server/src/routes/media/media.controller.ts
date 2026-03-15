import type { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";
import path from "node:path";
import { prisma } from "../../config/database.js";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { NotFoundError } from "../../utils/errors.js";
import { param } from "../../utils/params.js";
import { uploadFile, deleteFile, urlToKey } from "../../services/storage.service.js";
import type { UpdateMediaInput } from "./media.schemas.js";

function tid(req: Request): string {
  return (req as AuthenticatedRequest).user.tenantId;
}

export async function listMedia(req: Request, res: Response, next: NextFunction) {
  try {
    const folder = req.query.folder as string | undefined;
    const items = await prisma.mediaAsset.findMany({
      where: { tenantId: tid(req), ...(folder ? { folder } : {}) },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
}

export async function uploadMedia(req: Request, res: Response, next: NextFunction) {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, error: { message: "No file uploaded" } });
      return;
    }

    const tenantId = tid(req);
    const folder = (req.body.folder as string) || "general";
    const ext = path.extname(file.originalname);
    const filename = `${crypto.randomUUID()}${ext}`;
    const storageKey = `${tenantId}/${filename}`;

    // Upload to S3/Supabase Storage (or local disk in dev)
    const url = await uploadFile(storageKey, file.buffer, file.mimetype);

    const item = await prisma.mediaAsset.create({
      data: {
        tenantId,
        filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        fileSize: BigInt(file.size),
        url,
        folder,
      },
    });

    res.status(201).json({
      success: true,
      data: { ...item, fileSize: item.fileSize.toString() },
    });
  } catch (err) { next(err); }
}

export async function updateMedia(req: Request, res: Response, next: NextFunction) {
  try {
    const id = param(req, "id");
    const tenantId = tid(req);
    const data = req.body as UpdateMediaInput;

    const existing = await prisma.mediaAsset.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundError("Media asset not found");

    const item = await prisma.mediaAsset.update({ where: { id }, data });
    res.json({ success: true, data: { ...item, fileSize: item.fileSize.toString() } });
  } catch (err) { next(err); }
}

export async function deleteMedia(req: Request, res: Response, next: NextFunction) {
  try {
    const id = param(req, "id");
    const tenantId = tid(req);

    const existing = await prisma.mediaAsset.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundError("Media asset not found");

    // Delete from storage (S3 or local disk)
    await deleteFile(urlToKey(existing.url));
    await prisma.mediaAsset.delete({ where: { id } });
    res.json({ success: true, message: "Deleted" });
  } catch (err) { next(err); }
}
