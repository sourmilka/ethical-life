import { z } from "zod";

export const createSocialLinkSchema = z.object({
  platform: z.string().min(1).max(50),
  url: z.string().url(),
  iconUrl: z.string().url().nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isVisible: z.boolean().default(true),
});

export const updateSocialLinkSchema = createSocialLinkSchema.partial();

export const reorderSocialSchema = z.object({
  ids: z.array(z.string().uuid()),
});

export type CreateSocialLinkInput = z.infer<typeof createSocialLinkSchema>;
export type UpdateSocialLinkInput = z.infer<typeof updateSocialLinkSchema>;
