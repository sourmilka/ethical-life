import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database.js";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { NotFoundError } from "../../utils/errors.js";
import { param } from "../../utils/params.js";

// ── Helper: get tenantId ──────────────────────────────────
function tid(req: Request): string {
  return (req as AuthenticatedRequest).user.tenantId;
}

// ═══════════════════════════════════════════════════════════
// TESTIMONIALS
// ═══════════════════════════════════════════════════════════

export async function listTestimonials(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await prisma.testimonial.findMany({
      where: { tenantId: tid(req) },
      orderBy: { sortOrder: "asc" },
    });
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
}

export async function createTestimonial(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body;
    const item = await prisma.testimonial.create({
      data: {
        ...data,
        tenantId: tid(req),
        reviewDate: data.reviewDate ? new Date(data.reviewDate) : null,
      },
    });
    res.status(201).json({ success: true, data: item });
  } catch (err) { next(err); }
}

export async function updateTestimonial(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = tid(req);
    const id = param(req, "id");
    const data = req.body;

    const existing = await prisma.testimonial.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundError("Testimonial not found");

    const item = await prisma.testimonial.update({
      where: { id },
      data: {
        ...data,
        ...(data.reviewDate !== undefined
          ? { reviewDate: data.reviewDate ? new Date(data.reviewDate) : null }
          : {}),
      },
    });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
}

export async function deleteTestimonial(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = tid(req);
    const id = param(req, "id");
    const existing = await prisma.testimonial.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundError("Testimonial not found");
    await prisma.testimonial.delete({ where: { id } });
    res.json({ success: true, message: "Deleted" });
  } catch (err) { next(err); }
}

// ═══════════════════════════════════════════════════════════
// FAQ CATEGORIES
// ═══════════════════════════════════════════════════════════

export async function listFaqCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await prisma.faqCategory.findMany({
      where: { tenantId: tid(req) },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { items: true } } },
    });
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
}

export async function createFaqCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await prisma.faqCategory.create({ data: { ...req.body, tenantId: tid(req) } });
    res.status(201).json({ success: true, data: item });
  } catch (err) { next(err); }
}

export async function updateFaqCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = tid(req);
    const id = param(req, "id");
    const existing = await prisma.faqCategory.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundError("FAQ category not found");
    const item = await prisma.faqCategory.update({ where: { id }, data: req.body });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
}

export async function deleteFaqCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = tid(req);
    const id = param(req, "id");
    const existing = await prisma.faqCategory.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundError("FAQ category not found");
    await prisma.faqCategory.delete({ where: { id } });
    res.json({ success: true, message: "Deleted" });
  } catch (err) { next(err); }
}

// ═══════════════════════════════════════════════════════════
// FAQ ITEMS
// ═══════════════════════════════════════════════════════════

export async function listFaqItems(req: Request, res: Response, next: NextFunction) {
  try {
    const categoryId = req.query.categoryId as string | undefined;
    const items = await prisma.faqItem.findMany({
      where: { tenantId: tid(req), ...(categoryId ? { categoryId } : {}) },
      orderBy: { sortOrder: "asc" },
      include: { category: { select: { id: true, name: true } } },
    });
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
}

export async function createFaqItem(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await prisma.faqItem.create({ data: { ...req.body, tenantId: tid(req) } });
    res.status(201).json({ success: true, data: item });
  } catch (err) { next(err); }
}

export async function updateFaqItem(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = tid(req);
    const id = param(req, "id");
    const existing = await prisma.faqItem.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundError("FAQ item not found");
    const item = await prisma.faqItem.update({ where: { id }, data: req.body });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
}

export async function deleteFaqItem(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = tid(req);
    const id = param(req, "id");
    const existing = await prisma.faqItem.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundError("FAQ item not found");
    await prisma.faqItem.delete({ where: { id } });
    res.json({ success: true, message: "Deleted" });
  } catch (err) { next(err); }
}

// ═══════════════════════════════════════════════════════════
// TEAM MEMBERS
// ═══════════════════════════════════════════════════════════

export async function listTeamMembers(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await prisma.teamMember.findMany({
      where: { tenantId: tid(req) },
      orderBy: { sortOrder: "asc" },
    });
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
}

export async function createTeamMember(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await prisma.teamMember.create({ data: { ...req.body, tenantId: tid(req) } });
    res.status(201).json({ success: true, data: item });
  } catch (err) { next(err); }
}

export async function updateTeamMember(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = tid(req);
    const id = param(req, "id");
    const existing = await prisma.teamMember.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundError("Team member not found");
    const item = await prisma.teamMember.update({ where: { id }, data: req.body });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
}

export async function deleteTeamMember(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = tid(req);
    const id = param(req, "id");
    const existing = await prisma.teamMember.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundError("Team member not found");
    await prisma.teamMember.delete({ where: { id } });
    res.json({ success: true, message: "Deleted" });
  } catch (err) { next(err); }
}

// ═══════════════════════════════════════════════════════════
// JOB LISTINGS
// ═══════════════════════════════════════════════════════════

export async function listJobListings(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.query.status as string | undefined;
    const items = await prisma.jobListing.findMany({
      where: { tenantId: tid(req), ...(status ? { status } : {}) },
      orderBy: { postedAt: "desc" },
    });
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
}

export async function getJobListing(req: Request, res: Response, next: NextFunction) {
  try {
    const id = param(req, "id");
    const item = await prisma.jobListing.findFirst({ where: { id, tenantId: tid(req) } });
    if (!item) throw new NotFoundError("Job listing not found");
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
}

export async function createJobListing(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await prisma.jobListing.create({ data: { ...req.body, tenantId: tid(req) } });
    res.status(201).json({ success: true, data: item });
  } catch (err) { next(err); }
}

export async function updateJobListing(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = tid(req);
    const id = param(req, "id");
    const existing = await prisma.jobListing.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundError("Job listing not found");
    const item = await prisma.jobListing.update({ where: { id }, data: req.body });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
}

export async function deleteJobListing(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = tid(req);
    const id = param(req, "id");
    const existing = await prisma.jobListing.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundError("Job listing not found");
    await prisma.jobListing.delete({ where: { id } });
    res.json({ success: true, message: "Deleted" });
  } catch (err) { next(err); }
}

// ═══════════════════════════════════════════════════════════
// VIDEOS
// ═══════════════════════════════════════════════════════════

export async function listVideos(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await prisma.video.findMany({
      where: { tenantId: tid(req) },
      orderBy: { sortOrder: "asc" },
    });
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
}

export async function createVideo(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await prisma.video.create({ data: { ...req.body, tenantId: tid(req) } });
    res.status(201).json({ success: true, data: item });
  } catch (err) { next(err); }
}

export async function updateVideo(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = tid(req);
    const id = param(req, "id");
    const existing = await prisma.video.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundError("Video not found");
    const item = await prisma.video.update({ where: { id }, data: req.body });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
}

export async function deleteVideo(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = tid(req);
    const id = param(req, "id");
    const existing = await prisma.video.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundError("Video not found");
    await prisma.video.delete({ where: { id } });
    res.json({ success: true, message: "Deleted" });
  } catch (err) { next(err); }
}

export async function reorderVideos(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = tid(req);
    const { ids } = req.body as { ids: string[] };
    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.video.updateMany({ where: { id, tenantId }, data: { sortOrder: index } }),
      ),
    );
    res.json({ success: true, message: "Reordered" });
  } catch (err) { next(err); }
}
