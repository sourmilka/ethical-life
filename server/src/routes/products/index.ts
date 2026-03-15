import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validate } from "../../middleware/validate.js";
import {
  createCategorySchema,
  updateCategorySchema,
  createProductSchema,
  updateProductSchema,
  reorderSchema,
} from "./products.schemas.js";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  reorderProducts,
} from "./products.controller.js";

const router = Router();
router.use(authenticate);

// Categories
router.get("/categories", listCategories);
router.post("/categories", requireRole("owner", "admin"), validate(createCategorySchema), createCategory);
router.patch("/categories/:id", requireRole("owner", "admin"), validate(updateCategorySchema), updateCategory);
router.delete("/categories/:id", requireRole("owner", "admin"), deleteCategory);

// Products
router.get("/", listProducts);
router.get("/:id", getProduct);
router.post("/", requireRole("owner", "admin"), validate(createProductSchema), createProduct);
router.patch("/:id", requireRole("owner", "admin"), validate(updateProductSchema), updateProduct);
router.delete("/:id", requireRole("owner", "admin"), deleteProduct);
router.post("/reorder", requireRole("owner", "admin"), validate(reorderSchema), reorderProducts);

export default router;
