import { z } from "zod";

// ── Product Categories ────────────────────────────────────
export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  sortOrder: z.number().int().min(0).default(0),
});
export const updateCategorySchema = createCategorySchema.partial();

// ── Products ──────────────────────────────────────────────
export const createProductSchema = z.object({
  categoryId: z.string().uuid().nullable().optional(),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(255),
  tagline: z.string().max(500).nullable().optional(),
  description: z.string().nullable().optional(),
  priceText: z.string().max(100).nullable().optional(),
  priceAmount: z.number().min(0).nullable().optional(),
  currency: z.string().length(3).default("GBP"),
  imageUrl: z.string().url().nullable().optional(),
  tag: z.string().max(50).nullable().optional(),
  features: z.array(z.string()).default([]),
  howItWorks: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
});
export const updateProductSchema = createProductSchema.partial();

export const reorderSchema = z.object({
  ids: z.array(z.string().uuid()),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
