import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database.js";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { NotFoundError } from "../../utils/errors.js";
import { param } from "../../utils/params.js";
import type {
  CreateBlogCategoryInput,
  UpdateBlogCategoryInput,
  CreateBlogPostInput,
  UpdateBlogPostInput,
} from "./blog.schemas.js";

// ── Categories ────────────────────────────────────────────

export async function listCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthenticatedRequest).user;
    const items = await prisma.blogCategory.findMany({
      where: { tenantId },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { posts: true } } },
    });
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
}

export async function createCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthenticatedRequest).user;
    const data = req.body as CreateBlogCategoryInput;
    const item = await prisma.blogCategory.create({ data: { ...data, tenantId } });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

export async function updateCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthenticatedRequest).user;
    const id = param(req, "id");
    const data = req.body as UpdateBlogCategoryInput;

    const existing = await prisma.blogCategory.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundError("Category not found");

    const item = await prisma.blogCategory.update({ where: { id }, data });
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

export async function deleteCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthenticatedRequest).user;
    const id = param(req, "id");

    const existing = await prisma.blogCategory.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundError("Category not found");

    await prisma.blogCategory.delete({ where: { id } });
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    next(err);
  }
}

// ── Posts ──────────────────────────────────────────────────

export async function listPosts(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthenticatedRequest).user;
    const { categoryId, status } = req.query as { categoryId?: string; status?: string };

    const items = await prisma.blogPost.findMany({
      where: {
        tenantId,
        ...(categoryId ? { categoryId } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { category: { select: { id: true, name: true } } },
    });
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
}

export async function getPost(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthenticatedRequest).user;
    const id = param(req, "id");

    const item = await prisma.blogPost.findFirst({
      where: { id, tenantId },
      include: { category: { select: { id: true, name: true } } },
    });
    if (!item) throw new NotFoundError("Blog post not found");

    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

export async function createPost(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthenticatedRequest).user;
    const data = req.body as CreateBlogPostInput;
    const item = await prisma.blogPost.create({
      data: {
        ...data,
        tenantId,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
      },
    });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

export async function updatePost(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthenticatedRequest).user;
    const id = param(req, "id");
    const data = req.body as UpdateBlogPostInput;

    const existing = await prisma.blogPost.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundError("Blog post not found");

    const item = await prisma.blogPost.update({
      where: { id },
      data: {
        ...data,
        ...(data.publishedAt !== undefined
          ? { publishedAt: data.publishedAt ? new Date(data.publishedAt) : null }
          : {}),
      },
    });
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

export async function deletePost(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthenticatedRequest).user;
    const id = param(req, "id");

    const existing = await prisma.blogPost.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundError("Blog post not found");

    await prisma.blogPost.delete({ where: { id } });
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    next(err);
  }
}
