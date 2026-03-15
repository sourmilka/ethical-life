import { z } from "zod";

export const updateMediaSchema = z.object({
  altText: z.string().max(500).nullable().optional(),
  folder: z.string().max(255).optional(),
});

export type UpdateMediaInput = z.infer<typeof updateMediaSchema>;
