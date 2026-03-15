import { z } from "zod";

export const submitFormSchema = z.object({
  formSlug: z.string().min(1),
  productId: z.string().uuid().nullable().optional(),
  source: z.string().max(255).optional(),
  fields: z.array(
    z.object({
      fieldKey: z.string().min(1).max(100),
      fieldLabel: z.string().max(255).optional(),
      value: z.string().nullable().optional(),
    }),
  ),
});

export const updateSubmissionSchema = z.object({
  status: z.string().max(30).optional(),
  paymentStatus: z.string().max(30).optional(),
  notes: z.string().nullable().optional(),
});
