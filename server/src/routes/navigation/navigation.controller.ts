import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database.js";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { NotFoundError } from "../../utils/errors.js";
import { param } from "../../utils/params.js";
import type { CreateNavItemInput, UpdateNavItemInput, ReorderInput } from "./navigation.schemas.js";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthenticatedRequest).user;
    const location = req.query.location as string | undefined;

    const items = await prisma.navigationItem.findMany({
      where: { tenantId, ...(location ? { location } : {}) },
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
    const data = req.body as CreateNavItemInput;

    const item = await prisma.navigationItem.create({
      data: { ...data, tenantId },
    });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthenticatedRequest).user;
    const id = param(req, "id");
    const data = req.body as UpdateNavItemInput;

    const existing = await prisma.navigationItem.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundError("Navigation item not found");

    const item = await prisma.navigationItem.update({
      where: { id },
      data,
    });
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthenticatedRequest).user;
    const id = param(req, "id");

    const existing = await prisma.navigationItem.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundError("Navigation item not found");

    await prisma.navigationItem.delete({ where: { id } });
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    next(err);
  }
}

export async function reorder(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthenticatedRequest).user;
    const { ids } = req.body as ReorderInput;

    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.navigationItem.updateMany({
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
