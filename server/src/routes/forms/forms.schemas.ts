import { z } from "zod";

// ── Form Definitions ──────────────────────────────────────
export const createFormSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  description: z.string().nullable().optional(),
  type: z.string().max(50).default("intake"),
  isMultiStep: z.boolean().default(true),
  submitButtonText: z.string().max(100).default("Submit"),
  successMessage: z.string().default("Thank you for your submission."),
  redirectUrl: z.string().url().nullable().optional(),
  requiresPayment: z.boolean().default(false),
  paymentAmount: z.number().min(0).nullable().optional(),
  notificationEmails: z.array(z.string().email()).default([]),
  status: z.enum(["active", "inactive", "archived"]).default("active"),
});
export const updateFormSchema = createFormSchema.partial();

// ── Form Fields ───────────────────────────────────────────
export const createFieldSchema = z.object({
  formDefinitionId: z.string().uuid(),
  fieldKey: z.string().min(1).max(100),
  fieldType: z.string().min(1).max(50),
  label: z.string().min(1).max(255),
  placeholder: z.string().max(255).nullable().optional(),
  helpText: z.string().nullable().optional(),
  stepNumber: z.number().int().min(0).default(0),
  stepTitle: z.string().max(255).nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isRequired: z.boolean().default(false),
  validationRules: z.record(z.string(), z.unknown()).default({}),
  options: z.array(z.unknown()).default([]),
  conditionalOn: z.record(z.string(), z.unknown()).nullable().optional(),
  defaultValue: z.string().nullable().optional(),
});
export const updateFieldSchema = createFieldSchema.omit({ formDefinitionId: true }).partial();

export const reorderFieldsSchema = z.object({
  ids: z.array(z.string().uuid()),
});
