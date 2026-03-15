import { z } from "zod";

export const createPageSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  title: z.string().max(255).nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
});
export const updatePageSchema = createPageSchema.partial();

export const createSectionSchema = z.object({
  pageId: z.string().uuid(),
  sectionKey: z.string().min(1).max(100),
  sortOrder: z.number().int().min(0).default(0),
  isVisible: z.boolean().default(true),
  content: z.record(z.string(), z.unknown()).default({}),
});
export const updateSectionSchema = z.object({
  sortOrder: z.number().int().min(0).optional(),
  isVisible: z.boolean().optional(),
  content: z.record(z.string(), z.unknown()).optional(),
});

export const reorderSectionsSchema = z.object({
  ids: z.array(z.string().uuid()),
});
