const express = require("express");
const router = express.Router();
const multer = require("multer");
const { isAuthenticated } = require("../middleware/authMiddleware");
const {
  uploadResource,
  listResources,
  getResourceById,
  downloadResource,
  listSubjectsPublic,
} = require("../controllers/communityController");

// Files stored in memory — buffer passed to Supabase Storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max
});

// ─────────────────────────────────────────────────────────
// PUBLIC ROUTES (no auth required — accessible by anyone)
// ─────────────────────────────────────────────────────────

// GET /api/community             → browse/search resources with pagination
router.get("/", listResources);

// GET /api/community/subjects    → list all subjects for filters & upload form
router.get("/subjects", listSubjectsPublic);

// GET /api/community/:id         → get full detail for one resource
router.get("/:id", getResourceById);

// GET /api/community/:id/download → increment count + return file URL
router.get("/:id/download", downloadResource);

// ─────────────────────────────────────────────────────────
// PROTECTED ROUTES (requires valid JWT / logged-in user)
// ─────────────────────────────────────────────────────────

// POST /api/community/upload → any authenticated user (student or teacher) can upload
router.post(
  "/upload",
  isAuthenticated,
  upload.single("file"),
  uploadResource
);

module.exports = router;
