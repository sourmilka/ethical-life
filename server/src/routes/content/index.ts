import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validate } from "../../middleware/validate.js";
import {
  createTestimonialSchema, updateTestimonialSchema,
  createFaqCategorySchema, updateFaqCategorySchema,
  createFaqItemSchema, updateFaqItemSchema,
  createTeamMemberSchema, updateTeamMemberSchema,
  createJobListingSchema, updateJobListingSchema,
  createVideoSchema, updateVideoSchema,
  reorderSchema,
} from "./content.schemas.js";
import {
  listTestimonials, createTestimonial, updateTestimonial, deleteTestimonial,
  listFaqCategories, createFaqCategory, updateFaqCategory, deleteFaqCategory,
  listFaqItems, createFaqItem, updateFaqItem, deleteFaqItem,
  listTeamMembers, createTeamMember, updateTeamMember, deleteTeamMember,
  listJobListings, getJobListing, createJobListing, updateJobListing, deleteJobListing,
  listVideos, createVideo, updateVideo, deleteVideo, reorderVideos,
} from "./content.controller.js";

const router = Router();
router.use(authenticate);

const edit = requireRole("owner", "admin");

// Testimonials
router.get("/testimonials", listTestimonials);
router.post("/testimonials", edit, validate(createTestimonialSchema), createTestimonial);
router.patch("/testimonials/:id", edit, validate(updateTestimonialSchema), updateTestimonial);
router.delete("/testimonials/:id", edit, deleteTestimonial);

// FAQ Categories
router.get("/faq-categories", listFaqCategories);
router.post("/faq-categories", edit, validate(createFaqCategorySchema), createFaqCategory);
router.patch("/faq-categories/:id", edit, validate(updateFaqCategorySchema), updateFaqCategory);
router.delete("/faq-categories/:id", edit, deleteFaqCategory);

// FAQ Items
router.get("/faqs", listFaqItems);
router.post("/faqs", edit, validate(createFaqItemSchema), createFaqItem);
router.patch("/faqs/:id", edit, validate(updateFaqItemSchema), updateFaqItem);
router.delete("/faqs/:id", edit, deleteFaqItem);

// Team Members
router.get("/team", listTeamMembers);
router.post("/team", edit, validate(createTeamMemberSchema), createTeamMember);
router.patch("/team/:id", edit, validate(updateTeamMemberSchema), updateTeamMember);
router.delete("/team/:id", edit, deleteTeamMember);

// Job Listings
router.get("/jobs", listJobListings);
router.get("/jobs/:id", getJobListing);
router.post("/jobs", edit, validate(createJobListingSchema), createJobListing);
router.patch("/jobs/:id", edit, validate(updateJobListingSchema), updateJobListing);
router.delete("/jobs/:id", edit, deleteJobListing);

// Videos
router.get("/videos", listVideos);
router.post("/videos", edit, validate(createVideoSchema), createVideo);
router.patch("/videos/:id", edit, validate(updateVideoSchema), updateVideo);
router.delete("/videos/:id", edit, deleteVideo);
router.post("/videos/reorder", edit, validate(reorderSchema), reorderVideos);

export default router;
