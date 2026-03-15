import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database.js";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { NotFoundError, BadRequestError } from "../../utils/errors.js";
import { param } from "../../utils/params.js";

function tid(req: Request): string {
  return (req as AuthenticatedRequest).user.tenantId;
}

// ═══════════════════════════════════════════════════════════
// PUBLIC — create submission (no auth)
// ═══════════════════════════════════════════════════════════

export async function publicSubmit(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) throw new BadRequestError("Tenant could not be resolved");

    const { formSlug, productId, source, fields } = req.body as {
      formSlug: string;
      productId?: string | null;
      source?: string;
      fields: { fieldKey: string; fieldLabel?: string; value?: string | null }[];
    };

    const form = await prisma.formDefinition.findFirst({
      where: { slug: formSlug, tenantId, status: "active" },
    });
    if (!form) throw new NotFoundError("Form not found or inactive");

    const submission = await prisma.formSubmission.create({
      data: {
        tenantId,
        formDefinitionId: form.id,
        productId: productId ?? null,
        source: source ?? null,
        ipAddress: (req.ip ?? req.socket.remoteAddress ?? "").slice(0, 45),
        userAgent: (req.headers["user-agent"] ?? "").slice(0, 2000),
        data: {
          create: fields.map((f) => ({
            fieldKey: f.fieldKey,
            fieldLabel: f.fieldLabel ?? null,
            value: f.value ?? null,
          })),
        },
      },
      include: { data: true },
    });

    res.status(201).json({ success: true, data: { id: submission.id } });
  } catch (err) { next(err); }
}

// ═══════════════════════════════════════════════════════════
// DASHBOARD — stats
// ═══════════════════════════════════════════════════════════

export async function getStats(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = tid(req);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalSubmissions, newToday, totalProducts, totalBlogPosts, recentSubmissions] = await Promise.all([
      prisma.formSubmission.count({ where: { tenantId } }),
      prisma.formSubmission.count({ where: { tenantId, status: "new", createdAt: { gte: todayStart } } }),
      prisma.product.count({ where: { tenantId } }),
      prisma.blogPost.count({ where: { tenantId, status: "published" } }),
      prisma.formSubmission.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          formDefinition: { select: { name: true } },
          data: { select: { fieldKey: true, value: true }, take: 3 },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalSubmissions,
        newToday,
        totalProducts,
        totalBlogPosts,
        recentSubmissions,
      },
    });
  } catch (err) { next(err); }
}

// ═══════════════════════════════════════════════════════════
// DASHBOARD — list / detail / update / delete
// ═══════════════════════════════════════════════════════════

export async function listSubmissions(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = tid(req);
    const { formId, status, page = "1", limit = "25" } = req.query as Record<string, string>;
    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

    const where: Record<string, unknown> = { tenantId };
    if (formId) where.formDefinitionId = formId;
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.formSubmission.findMany({
        where, orderBy: { createdAt: "desc" },
        skip, take: Number(limit),
        include: { formDefinition: { select: { name: true, slug: true } }, product: { select: { id: true, title: true } } },
      }),
      prisma.formSubmission.count({ where }),
    ]);

    res.json({ success: true, data: items, meta: { total, page: Number(page), limit: Number(limit) } });
  } catch (err) { next(err); }
}

export async function getSubmission(req: Request, res: Response, next: NextFunction) {
  try {
    const id = param(req, "id");
    const item = await prisma.formSubmission.findFirst({
      where: { id, tenantId: tid(req) },
      include: {
        data: true,
        formDefinition: { select: { name: true, slug: true } },
        product: { select: { id: true, title: true } },
      },
    });
    if (!item) throw new NotFoundError("Submission not found");
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
}

export async function updateSubmission(req: Request, res: Response, next: NextFunction) {
  try {
    const id = param(req, "id");
    const tenantId = tid(req);
    const existing = await prisma.formSubmission.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundError("Submission not found");
    const item = await prisma.formSubmission.update({ where: { id }, data: req.body });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
}

export async function deleteSubmission(req: Request, res: Response, next: NextFunction) {
  try {
    const id = param(req, "id");
    const tenantId = tid(req);
    const existing = await prisma.formSubmission.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundError("Submission not found");
    await prisma.formSubmission.delete({ where: { id } });
    res.json({ success: true, message: "Deleted" });
  } catch (err) { next(err); }
}
