import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database.js";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { NotFoundError } from "../../utils/errors.js";
import { param } from "../../utils/params.js";

// ── Helper ────────────────────────────────────────────────
function tid(req: Request): string {
  return (req as AuthenticatedRequest).user.tenantId;
}

// ═══════════════════════════════════════════════════════════
// PAGES
// ═══════════════════════════════════════════════════════════

export async function listPages(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await prisma.page.findMany({
      where: { tenantId: tid(req) },
      orderBy: { slug: "asc" },
      include: { _count: { select: { sections: true } } },
    });
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
}

export async function getPage(req: Request, res: Response, next: NextFunction) {
  try {
    const id = param(req, "id");
    const item = await prisma.page.findFirst({
      where: { id, tenantId: tid(req) },
      include: { sections: { orderBy: { sortOrder: "asc" } } },
    });
    if (!item) throw new NotFoundError("Page not found");
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
}

export async function createPage(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await prisma.page.create({ data: { ...req.body, tenantId: tid(req) } });
    res.status(201).json({ success: true, data: item });
  } catch (err) { next(err); }
}

export async function updatePage(req: Request, res: Response, next: NextFunction) {
  try {
    const id = param(req, "id");
    const tenantId = tid(req);
    const existing = await prisma.page.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundError("Page not found");
    const item = await prisma.page.update({ where: { id }, data: req.body });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
}

export async function deletePage(req: Request, res: Response, next: NextFunction) {
  try {
    const id = param(req, "id");
    const tenantId = tid(req);
    const existing = await prisma.page.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundError("Page not found");
    await prisma.page.delete({ where: { id } });
    res.json({ success: true, message: "Deleted" });
  } catch (err) { next(err); }
}

// ═══════════════════════════════════════════════════════════
// PAGE SECTIONS
// ═══════════════════════════════════════════════════════════

export async function createSection(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await prisma.pageSection.create({ data: { ...req.body, tenantId: tid(req) } });
    res.status(201).json({ success: true, data: item });
  } catch (err) { next(err); }
}

export async function updateSection(req: Request, res: Response, next: NextFunction) {
  try {
    const id = param(req, "id");
    const tenantId = tid(req);
    const existing = await prisma.pageSection.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundError("Section not found");
    const item = await prisma.pageSection.update({ where: { id }, data: req.body });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
}

export async function deleteSection(req: Request, res: Response, next: NextFunction) {
  try {
    const id = param(req, "id");
    const tenantId = tid(req);
    const existing = await prisma.pageSection.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundError("Section not found");
    await prisma.pageSection.delete({ where: { id } });
    res.json({ success: true, message: "Deleted" });
  } catch (err) { next(err); }
}

export async function reorderSections(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = tid(req);
    const { ids } = req.body as { ids: string[] };
    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.pageSection.updateMany({ where: { id, tenantId }, data: { sortOrder: index } }),
      ),
    );
    res.json({ success: true, message: "Reordered" });
  } catch (err) { next(err); }
}
