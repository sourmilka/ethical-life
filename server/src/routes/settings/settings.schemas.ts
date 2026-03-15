import { z } from "zod";

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color");

export const updateBrandingSchema = z.object({
  companyName: z.string().min(2).max(255).optional(),
  logoUrl: z.string().url().nullable().optional(),
  faviconUrl: z.string().url().nullable().optional(),
  tagline: z.string().max(500).nullable().optional(),
});

export const updateColorsSchema = z.object({
  colorPrimary: hexColor.optional(),
  colorAccent: hexColor.optional(),
  colorSecondary: hexColor.optional(),
  colorBackground: hexColor.optional(),
  colorBorder: hexColor.optional(),
  colorBorderLight: hexColor.optional(),
  colorWhite: hexColor.optional(),
});

export const updateContactSchema = z.object({
  contactEmail: z.string().email().max(255).nullable().optional(),
  contactPhone: z.string().max(50).nullable().optional(),
  contactAddress: z.string().nullable().optional(),
  businessHours: z.string().max(255).nullable().optional(),
});

export const updateSeoSchema = z.object({
  metaTitle: z.string().max(255).nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  ogImageUrl: z.string().url().nullable().optional(),
  googleAnalyticsId: z.string().max(50).nullable().optional(),
});

export const updatePromoSchema = z.object({
  promoBannerText: z.string().max(500).nullable().optional(),
  promoBannerActive: z.boolean().optional(),
});

export const updateAppLinksSchema = z.object({
  appStoreUrl: z.string().url().nullable().optional(),
  playStoreUrl: z.string().url().nullable().optional(),
});

export const updateFooterSchema = z.object({
  footerTagline: z.string().nullable().optional(),
});

export const updateLegalSchema = z.object({
  termsContent: z.string().nullable().optional(),
  privacyContent: z.string().nullable().optional(),
});

export const updateTenantSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  barterpayMerchantId: z.string().max(255).nullable().optional(),
  barterpayApiKey: z.string().nullable().optional(),
});

export type UpdateBrandingInput = z.infer<typeof updateBrandingSchema>;
export type UpdateColorsInput = z.infer<typeof updateColorsSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type UpdateSeoInput = z.infer<typeof updateSeoSchema>;
export type UpdatePromoInput = z.infer<typeof updatePromoSchema>;
export type UpdateAppLinksInput = z.infer<typeof updateAppLinksSchema>;
export type UpdateFooterInput = z.infer<typeof updateFooterSchema>;
export type UpdateLegalInput = z.infer<typeof updateLegalSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
