const express = require("express");
const router = express.Router();
const multer = require("multer");
const { isAuthenticated } = require("../middleware/authMiddleware");
const { createRequest, getMyRequests, getAcceptedOffers } = require("../controllers/studentController");
const { getMyCourses, getMyBootcamps, getMyUploadedVideos } = require("../controllers/studentVideosController");

const upload = multer({ storage: multer.memoryStorage() });

// Student creates a new request
router.post("/request", isAuthenticated, upload.single("file"), createRequest);

// Student gets their own requests
router.get("/requests", isAuthenticated, getMyRequests);

// Student gets their accepted offers (courses/bootcamps)
router.get("/accepted-offers", isAuthenticated, getAcceptedOffers);

// Student gets their enrolled courses (with progress + syllabus)
router.get("/videos/courses", isAuthenticated, getMyCourses);

// Student gets their enrolled bootcamps (with progress + syllabus)
router.get("/videos/bootcamps", isAuthenticated, getMyBootcamps);

// Student gets videos a teacher uploaded specifically for them
router.get("/videos/uploaded", isAuthenticated, getMyUploadedVideos);

module.exports = router;