import { Router } from "express";
import multer from "multer";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/requireRole.js";
import { validate } from "../../middleware/validate.js";
import { updateMediaSchema } from "./media.schemas.js";
import { listMedia, uploadMedia, updateMedia, deleteMedia } from "./media.controller.js";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "video/mp4",
  "video/webm",
];

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

// Use memory storage — files are uploaded to S3/Supabase Storage in the controller
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type '${file.mimetype}' not allowed`));
    }
  },
});

const router = Router();
router.use(authenticate);

const edit = requireRole("owner", "admin");

router.get("/", listMedia);
router.post("/", edit, upload.single("file"), uploadMedia);
router.patch("/:id", edit, validate(updateMediaSchema), updateMedia);
router.delete("/:id", edit, deleteMedia);

export default router;
