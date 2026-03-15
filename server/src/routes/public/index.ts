import { Router } from "express";
import { tenantResolver } from "../../middleware/tenantResolver.js";
import {
  getSiteBundle,
  getPublicPage,
  getPublicProducts, getPublicProduct,
  getPublicBlogPosts, getPublicBlogPost,
  getPublicTestimonials, getPublicFaq, getPublicTeam, getPublicCareers, getPublicVideos,
  getPublicForm,
} from "./public.controller.js";
import { publicSubmit } from "../submissions/submissions.controller.js";
import { validate } from "../../middleware/validate.js";
import { submitFormSchema } from "../submissions/submissions.schemas.js";

const router = Router();

// All public routes need tenant resolution from hostname
router.use(tenantResolver);

// Site bundle
router.get("/site", getSiteBundle);

// Pages
router.get("/page/:slug", getPublicPage);

// Products
router.get("/products", getPublicProducts);
router.get("/products/:slug", getPublicProduct);

// Blog
router.get("/blog", getPublicBlogPosts);
router.get("/blog/:slug", getPublicBlogPost);

// Content types
router.get("/testimonials", getPublicTestimonials);
router.get("/faq", getPublicFaq);
router.get("/team", getPublicTeam);
router.get("/careers", getPublicCareers);
router.get("/videos", getPublicVideos);

// Forms (get definition for rendering, submit)
router.get("/forms/:slug", getPublicForm);
router.post("/forms/:slug/submit", validate(submitFormSchema), publicSubmit);

export default router;
