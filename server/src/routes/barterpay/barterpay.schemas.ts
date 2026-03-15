import { z } from "zod";

export const createTransactionSchema = z.object({
  submissionId: z.string().uuid(),
  amount: z.number().positive(),
});

export const checkStatusSchema = z.object({
  transactionId: z.string().min(1),
  submissionId: z.string().uuid(),
});

export const updateConfigSchema = z.object({
  barterpayMerchantId: z.string().max(255).nullable().optional(),
  barterpayApiKey: z.string().nullable().optional(),
});
