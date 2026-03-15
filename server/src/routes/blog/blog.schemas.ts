import { z } from "zod";

// ── Blog Categories ───────────────────────────────────────
export const createBlogCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  sortOrder: z.number().int().min(0).default(0),
});
export const updateBlogCategorySchema = createBlogCategorySchema.partial();

// ── Blog Posts ────────────────────────────────────────────
export const createBlogPostSchema = z.object({
  categoryId: z.string().uuid().nullable().optional(),
  slug: z.string().min(1).max(300).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(500),
  excerpt: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  coverImageUrl: z.string().url().nullable().optional(),
  authorName: z.string().max(255).nullable().optional(),
  authorAvatar: z.string().url().nullable().optional(),
  readTime: z.string().max(20).nullable().optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  isFeatured: z.boolean().default(false),
  publishedAt: z.string().datetime().nullable().optional(),
});
export const updateBlogPostSchema = createBlogPostSchema.partial();

export const reorderSchema = z.object({
  ids: z.array(z.string().uuid()),
});

export type CreateBlogCategoryInput = z.infer<typeof createBlogCategorySchema>;
export type UpdateBlogCategoryInput = z.infer<typeof updateBlogCategorySchema>;
export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;
export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>;
