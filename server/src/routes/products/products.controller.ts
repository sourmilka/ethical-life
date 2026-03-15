import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database.js";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import { NotFoundError } from "../../utils/errors.js";
import { param } from "../../utils/params.js";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateProductInput,
  UpdateProductInput,
} from "./products.schemas.js";

// ── Categories ────────────────────────────────────────────

export async function listCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthenticatedRequest).user;
    const items = await prisma.productCategory.findMany({
      where: { tenantId },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: true } } },
    });
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
}

export async function createCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthenticatedRequest).user;
    const data = req.body as CreateCategoryInput;
    const item = await prisma.productCategory.create({ data: { ...data, tenantId } });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

export async function updateCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthenticatedRequest).user;
    const id = param(req, "id");
    const data = req.body as UpdateCategoryInput;

    const existing = await prisma.productCategory.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundError("Category not found");

    const item = await prisma.productCategory.update({ where: { id }, data });
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

export async function deleteCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthenticatedRequest).user;
    const id = param(req, "id");

    const existing = await prisma.productCategory.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundError("Category not found");

    await prisma.productCategory.delete({ where: { id } });
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    next(err);
  }
}

// ── Products ──────────────────────────────────────────────

export async function listProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthenticatedRequest).user;
    const categoryId = req.query.categoryId as string | undefined;

    const items = await prisma.product.findMany({
      where: { tenantId, ...(categoryId ? { categoryId } : {}) },
      orderBy: { sortOrder: "asc" },
      include: { category: { select: { id: true, name: true } } },
    });
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
}

export async function getProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthenticatedRequest).user;
    const id = param(req, "id");

    const item = await prisma.product.findFirst({
      where: { id, tenantId },
      include: { category: { select: { id: true, name: true } } },
    });
    if (!item) throw new NotFoundError("Product not found");

    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

export async function createProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthenticatedRequest).user;
    const data = req.body as CreateProductInput;
    const item = await prisma.product.create({ data: { ...data, tenantId } });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthenticatedRequest).user;
    const id = param(req, "id");
    const data = req.body as UpdateProductInput;

    const existing = await prisma.product.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundError("Product not found");

    const item = await prisma.product.update({ where: { id }, data });
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

export async function deleteProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthenticatedRequest).user;
    const id = param(req, "id");

    const existing = await prisma.product.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundError("Product not found");

    await prisma.product.delete({ where: { id } });
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    next(err);
  }
}

export async function reorderProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = (req as AuthenticatedRequest).user;
    const { ids } = req.body as { ids: string[] };

    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.product.updateMany({
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
