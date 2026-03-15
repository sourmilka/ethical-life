import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validate } from "../../middleware/validate.js";
import {
  createBlogCategorySchema,
  updateBlogCategorySchema,
  createBlogPostSchema,
  updateBlogPostSchema,
} from "./blog.schemas.js";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
} from "./blog.controller.js";

const router = Router();
router.use(authenticate);

// Categories
router.get("/categories", listCategories);
router.post("/categories", requireRole("owner", "admin"), validate(createBlogCategorySchema), createCategory);
router.patch("/categories/:id", requireRole("owner", "admin"), validate(updateBlogCategorySchema), updateCategory);
router.delete("/categories/:id", requireRole("owner", "admin"), deleteCategory);

// Posts
router.get("/", listPosts);
router.get("/:id", getPost);
router.post("/", requireRole("owner", "admin"), validate(createBlogPostSchema), createPost);
router.patch("/:id", requireRole("owner", "admin"), validate(updateBlogPostSchema), updatePost);
router.delete("/:id", requireRole("owner", "admin"), deletePost);

export default router;
