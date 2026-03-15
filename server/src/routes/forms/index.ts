import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validate } from "../../middleware/validate.js";
import {
  createFormSchema, updateFormSchema,
  createFieldSchema, updateFieldSchema,
  reorderFieldsSchema,
} from "./forms.schemas.js";
import {
  listForms, getForm, createForm, updateForm, deleteForm, duplicateForm,
  createField, updateField, deleteField, reorderFields,
} from "./forms.controller.js";

const router = Router();
router.use(authenticate);

const edit = requireRole("owner", "admin");

// Form definitions
router.get("/", listForms);
router.get("/:id", getForm);
router.post("/", edit, validate(createFormSchema), createForm);
router.patch("/:id", edit, validate(updateFormSchema), updateForm);
router.delete("/:id", edit, deleteForm);
router.post("/:id/duplicate", edit, duplicateForm);

// Fields
router.post("/fields", edit, validate(createFieldSchema), createField);
router.patch("/fields/:id", edit, validate(updateFieldSchema), updateField);
router.delete("/fields/:id", edit, deleteField);
router.post("/fields/reorder", edit, validate(reorderFieldsSchema), reorderFields);

export default router;
