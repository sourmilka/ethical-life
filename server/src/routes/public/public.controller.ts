import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database.js";
import { cacheGet, cacheSet, CacheTTL } from "../../services/cache.service.js";
import { NotFoundError, BadRequestError } from "../../utils/errors.js";
import { param } from "../../utils/params.js";

function tenantId(req: Request): string {
  const id = (req as any).tenantId as string | undefined;
  if (!id) throw new BadRequestError("Tenant could not be resolved");
  return id;
}

// ═══════════════════════════════════════════════════════════
// SITE BUNDLE — everything needed to render the shell
// ═══════════════════════════════════════════════════════════

export async function getSiteBundle(req: Request, res: Response, next: NextFunction) {
  try {
    const tid = tenantId(req);
    const cacheKey = `public:site:${tid}`;
    const cached = await cacheGet<Record<string, unknown>>(cacheKey);
    if (cached) return res.json({ success: true, data: cached });

    const [settings, navigation, socialLinks] = await Promise.all([
      prisma.siteSettings.findUnique({ where: { tenantId: tid } }),
      prisma.navigationItem.findMany({
        where: { tenantId: tid, isVisible: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.socialLink.findMany({
        where: { tenantId: tid, isVisible: true },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    const bundle = { settings, navigation, socialLinks };
// Site bundle (settings + nav) — long cache, rarely changes
    await cacheSet(cacheKey, bundle, CacheTTL.LONG);
    res.json({ success: true, data: bundle });
  } catch (err) { next(err); }
}

// ═══════════════════════════════════════════════════════════
// PAGE WITH SECTIONS
// ═══════════════════════════════════════════════════════════

export async function getPublicPage(req: Request, res: Response, next: NextFunction) {
  try {
    const tid = tenantId(req);
    const slug = param(req, "slug");
    const cacheKey = `public:page:${tid}:${slug}`;
    const cached = await cacheGet<Record<string, unknown>>(cacheKey);
    if (cached) return res.json({ success: true, data: cached });

    const page = await prisma.page.findFirst({
      where: { tenantId: tid, slug, isActive: true },
      include: { sections: { orderBy: { sortOrder: "asc" } } },
    });
    if (!page) throw new NotFoundError("Page not found");

    await cacheSet(cacheKey, page, CacheTTL.LONG);
    res.json({ success: true, data: page });
  } catch (err) { next(err); }
}

// ═══════════════════════════════════════════════════════════
// PRODUCTS
// ═══════════════════════════════════════════════════════════

export async function getPublicProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const tid = tenantId(req);
    const cacheKey = `public:products:${tid}`;
    const cached = await cacheGet<unknown[]>(cacheKey);
    if (cached) return res.json({ success: true, data: cached });

    const items = await prisma.product.findMany({
      where: { tenantId: tid, isActive: true },
      orderBy: { sortOrder: "asc" },
      include: { category: { select: { id: true, name: true, slug: true } } },
    });
    await cacheSet(cacheKey, items, CacheTTL.DEFAULT);
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
}

export async function getPublicProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const tid = tenantId(req);
    const slug = param(req, "slug");
    const item = await prisma.product.findFirst({
      where: { tenantId: tid, slug, isActive: true },
      include: { category: { select: { id: true, name: true, slug: true } } },
    });
    if (!item) throw new NotFoundError("Product not found");
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
}

// ═══════════════════════════════════════════════════════════
// BLOG
// ═══════════════════════════════════════════════════════════

export async function getPublicBlogPosts(req: Request, res: Response, next: NextFunction) {
  try {
    const tid = tenantId(req);
    const cacheKey = `public:blog:${tid}`;
    const cached = await cacheGet<unknown[]>(cacheKey);
    if (cached) return res.json({ success: true, data: cached });

    const items = await prisma.blogPost.findMany({
      where: { tenantId: tid, status: "published", publishedAt: { lte: new Date() } },
      orderBy: { publishedAt: "desc" },
      include: { category: { select: { id: true, name: true, slug: true } } },
    });
    await cacheSet(cacheKey, items, CacheTTL.DEFAULT);
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
}

export async function getPublicBlogPost(req: Request, res: Response, next: NextFunction) {
  try {
    const tid = tenantId(req);
    const slug = param(req, "slug");
    const item = await prisma.blogPost.findFirst({
      where: { tenantId: tid, slug, status: "published", publishedAt: { lte: new Date() } },
      include: { category: { select: { id: true, name: true, slug: true } } },
    });
    if (!item) throw new NotFoundError("Post not found");
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
}

// ═══════════════════════════════════════════════════════════
// CONTENT TYPES (testimonials, faq, team, careers, videos)
// ═══════════════════════════════════════════════════════════

export async function getPublicTestimonials(req: Request, res: Response, next: NextFunction) {
  try {
    const tid = tenantId(req);
    const items = await prisma.testimonial.findMany({
      where: { tenantId: tid, isVisible: true },
      orderBy: { sortOrder: "asc" },
    });
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
}

export async function getPublicFaq(req: Request, res: Response, next: NextFunction) {
  try {
    const tid = tenantId(req);
    const categories = await prisma.faqCategory.findMany({
      where: { tenantId: tid },
      orderBy: { sortOrder: "asc" },
      include: {
        items: {
          where: { isVisible: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
    res.json({ success: true, data: categories });
  } catch (err) { next(err); }
}

export async function getPublicTeam(req: Request, res: Response, next: NextFunction) {
  try {
    const tid = tenantId(req);
    const items = await prisma.teamMember.findMany({
      where: { tenantId: tid, isVisible: true },
      orderBy: { sortOrder: "asc" },
    });
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
}

export async function getPublicCareers(req: Request, res: Response, next: NextFunction) {
  try {
    const tid = tenantId(req);
    const items = await prisma.jobListing.findMany({
      where: { tenantId: tid, status: "active" },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
}

export async function getPublicVideos(req: Request, res: Response, next: NextFunction) {
  try {
    const tid = tenantId(req);
    const items = await prisma.video.findMany({
      where: { tenantId: tid, isVisible: true },
      orderBy: { sortOrder: "asc" },
    });
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
}

// ═══════════════════════════════════════════════════════════
// FORM — public form definition (for rendering)
// ═══════════════════════════════════════════════════════════

export async function getPublicForm(req: Request, res: Response, next: NextFunction) {
  try {
    const tid = tenantId(req);
    const slug = param(req, "slug");
    const form = await prisma.formDefinition.findFirst({
      where: { tenantId: tid, slug, status: "active" },
      include: { fields: { orderBy: [{ stepNumber: "asc" }, { sortOrder: "asc" }] } },
    });
    if (!form) throw new NotFoundError("Form not found");
    res.json({ success: true, data: form });
  } catch (err) { next(err); }
}
