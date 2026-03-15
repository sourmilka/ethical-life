import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database.js";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { NotFoundError } from "../../utils/errors.js";
import { param } from "../../utils/params.js";
import type { CreateSocialLinkInput, UpdateSocialLinkInput } from "./social-links.schemas.js";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthenticatedRequest).user;
    const items = await prisma.socialLink.findMany({
      where: { tenantId },
      orderBy: { sortOrder: "asc" },
    });
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthenticatedRequest).user;
    const data = req.body as CreateSocialLinkInput;
    const item = await prisma.socialLink.create({ data: { ...data, tenantId } });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthenticatedRequest).user;
    const id = param(req, "id");
    const data = req.body as UpdateSocialLinkInput;

    const existing = await prisma.socialLink.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundError("Social link not found");

    const item = await prisma.socialLink.update({ where: { id }, data });
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthenticatedRequest).user;
    const id = param(req, "id");

    const existing = await prisma.socialLink.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundError("Social link not found");

    await prisma.socialLink.delete({ where: { id } });
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    next(err);
  }
}

export async function reorder(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthenticatedRequest).user;
    const { ids } = req.body as { ids: string[] };

    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.socialLink.updateMany({
          where: { id, tenantId },
          data: { sortOrder: index },
        }),
      ),
    );
    res.json({ success: true, message: "Reordered" });
  } catch (err) {
    next(err);
  }
}
