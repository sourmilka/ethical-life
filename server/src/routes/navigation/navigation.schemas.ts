import { z } from "zod";

export const createNavItemSchema = z.object({
  location: z.enum(["navbar", "sidebar", "footer_col1", "footer_col2"]),
  label: z.string().min(1).max(100),
  url: z.string().min(1).max(500),
  sortOrder: z.number().int().min(0).default(0),
  isVisible: z.boolean().default(true),
  openInNewTab: z.boolean().default(false),
});

export const updateNavItemSchema = createNavItemSchema.partial();

export const reorderSchema = z.object({
  ids: z.array(z.string().uuid()),
});

export type CreateNavItemInput = z.infer<typeof createNavItemSchema>;
export type UpdateNavItemInput = z.infer<typeof updateNavItemSchema>;
export type ReorderInput = z.infer<typeof reorderSchema>;
