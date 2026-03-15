import { z } from "zod";

// ── Testimonials ──────────────────────────────────────────
export const createTestimonialSchema = z.object({
  authorName: z.string().min(1).max(255),
  authorAvatar: z.string().url().nullable().optional(),
  rating: z.number().int().min(1).max(5).default(5),
  reviewText: z.string().min(1),
  reviewDate: z.string().datetime().nullable().optional(),
  source: z.string().max(50).nullable().optional(),
  isVisible: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});
export const updateTestimonialSchema = createTestimonialSchema.partial();

// ── FAQ Categories ────────────────────────────────────────
export const createFaqCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  sortOrder: z.number().int().min(0).default(0),
});
export const updateFaqCategorySchema = createFaqCategorySchema.partial();

// ── FAQ Items ─────────────────────────────────────────────
export const createFaqItemSchema = z.object({
  categoryId: z.string().uuid().nullable().optional(),
  question: z.string().min(1),
  answer: z.string().min(1),
  pageLocation: z.string().max(50).default("faq_page"),
  sortOrder: z.number().int().min(0).default(0),
  isVisible: z.boolean().default(true),
});
export const updateFaqItemSchema = createFaqItemSchema.partial();

// ── Team Members ──────────────────────────────────────────
export const createTeamMemberSchema = z.object({
  fullName: z.string().min(1).max(255),
  jobTitle: z.string().max(255).nullable().optional(),
  bio: z.string().nullable().optional(),
  photoUrl: z.string().url().nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isVisible: z.boolean().default(true),
});
export const updateTeamMemberSchema = createTeamMemberSchema.partial();

// ── Job Listings ──────────────────────────────────────────
export const createJobListingSchema = z.object({
  title: z.string().min(1).max(255),
  department: z.string().max(100).nullable().optional(),
  location: z.string().max(255).nullable().optional(),
  type: z.string().max(50).nullable().optional(),
  description: z.string().nullable().optional(),
  responsibilities: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  salaryRange: z.string().max(100).nullable().optional(),
  applyUrl: z.string().url().nullable().optional(),
  status: z.enum(["active", "closed", "draft"]).default("active"),
});
export const updateJobListingSchema = createJobListingSchema.partial();

// ── Videos ────────────────────────────────────────────────
export const createVideoSchema = z.object({
  title: z.string().max(255).nullable().optional(),
  youtubeId: z.string().max(20).nullable().optional(),
  videoUrl: z.string().url().nullable().optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isVisible: z.boolean().default(true),
});
export const updateVideoSchema = createVideoSchema.partial();

export const reorderSchema = z.object({
  ids: z.array(z.string().uuid()),
});
